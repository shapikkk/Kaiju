<?php

namespace App\Http\Controllers\Api;

use App\Events\DirectMessageSent;
use App\Events\NewDirectMessageNotification;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\DirectMessage;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DirectMessageController extends Controller
{
    public function conversations(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $userId = $request->user()->id;

        $conversations = Conversation::where('workspace_id', $workspace->id)
            ->whereHas('participants', fn($q) => $q->where('users.id', $userId))
            ->with([
                'participants:id,name,email,avatar_url',
                'latestMessage.user:id,name,avatar_url',
            ])
            ->orderByDesc('updated_at')
            ->get();

        $unreadCounts = $this->unreadCountsFor($conversations, $userId);

        $data = $conversations->map(function (Conversation $conv) use ($userId, $unreadCounts) {
            $me    = $conv->participants->firstWhere('id', $userId);
            $other = $conv->participants->firstWhere('id', '!=', $userId);

            return [
                'id'                      => $conv->id,
                'other_user'              => $other ? [
                    'id'         => $other->id,
                    'name'       => $other->name,
                    'email'      => $other->email,
                    'avatar_url' => $other->avatar_url ? url($other->avatar_url) : null,
                ] : null,
                'other_user_last_read_at' => $other?->pivot?->last_read_at
                    ? \Carbon\Carbon::parse($other->pivot->last_read_at)->toISOString()
                    : null,
                'last_message'            => $conv->latestMessage
                    ? self::serializeMessage($conv->latestMessage)
                    : null,
                'unread_count'            => (int) $unreadCounts->get($conv->id, 0),
                'local_name'              => $me?->pivot?->local_name,
                'local_note'              => $me?->pivot?->local_note,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function findOrCreate(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id', 'different:' . $request->user()->id],
        ]);

        $targetUserId = (int) $validated['user_id'];

        if (!$workspace->members()->where('users.id', $targetUserId)->exists()
            && $workspace->owner_id !== $targetUserId) {
            abort(403, 'Target user is not a member of this workspace.');
        }

        $conversation = Conversation::findBetween($workspace->id, $request->user()->id, $targetUserId);

        if (!$conversation) {
            $conversation = Conversation::create(['workspace_id' => $workspace->id]);
            $conversation->participants()->attach([$request->user()->id, $targetUserId]);
        }

        $conversation->load(['participants:id,name,email,avatar_url', 'latestMessage.user:id,name,avatar_url']);
        $other = $conversation->participants->firstWhere('id', '!=', $request->user()->id);

        return response()->json([
            'data' => [
                'id'         => $conversation->id,
                'other_user' => $other ? [
                    'id'         => $other->id,
                    'name'       => $other->name,
                    'email'      => $other->email,
                    'avatar_url' => $other->avatar_url ? url($other->avatar_url) : null,
                ] : null,
            ],
        ], 201);
    }

    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $messages = DirectMessage::where('conversation_id', $conversation->id)
            ->with(['user', 'replyTo.user'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        $conversation->participants()->updateExistingPivot($request->user()->id, [
            'last_read_at' => now(),
        ]);

        return response()->json([
            'data' => $messages->map(fn(DirectMessage $m) => self::serializeMessage($m)),
        ]);
    }

    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate([
            'body'        => ['nullable', 'string', 'max:5000'],
            'reply_to_id' => ['nullable', 'integer', 'exists:direct_messages,id'],
            'attachment'  => ['nullable', 'file', 'max:102400',
                'mimes:jpg,jpeg,png,gif,webp,pdf,txt,csv,xlsx,docx,zip,mp4,mov,webm,avi,mkv,mp3,wav,ogg'],
        ]);

        if (empty($validated['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'A message or attachment is required.'], 422);
        }

        $attachmentPath = null;
        $attachmentName = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $ext = strtolower($file->getClientOriginalExtension());
            $attachmentType = match(true) {
                in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) => 'image',
                in_array($ext, ['mp4', 'mov', 'webm', 'avi', 'mkv']) => 'video',
                in_array($ext, ['mp3', 'wav', 'ogg']) => 'audio',
                default => 'file',
            };
            $attachmentPath = $file->store('dm_attachments', 'public');
        }

        $message = DirectMessage::create([
            'conversation_id' => $conversation->id,
            'user_id'         => $request->user()->id,
            'body'            => $validated['body'] ?? '',
            'reply_to_id'     => $validated['reply_to_id'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_type' => $attachmentType,
        ]);

        $message->load(['user', 'replyTo.user']);

        $conversation->touch();

        broadcast(new DirectMessageSent($message));

        // The conversation channel only reaches people currently viewing the
        // thread. Ping the other participants on their own private channel so
        // their sidebar updates too; the event carries no message content.
        $conversation->participants()
            ->where('users.id', '!=', $request->user()->id)
            ->pluck('users.id')
            ->each(fn (int $recipientId) => broadcast(
                new NewDirectMessageNotification($recipientId),
            ));

        return response()->json(['data' => self::serializeMessage($message)], 201);
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $now = now();

        $conversation->participants()->updateExistingPivot($request->user()->id, [
            'last_read_at' => $now,
        ]);

        broadcast(new \App\Events\ConversationRead(
            conversationId: $conversation->id,
            readByUserId:   $request->user()->id,
            readAt:         $now->toISOString(),
        ));

        return response()->json(['ok' => true]);
    }

    public function attachments(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $type = $request->query('type', 'image');

        $query = DirectMessage::where('conversation_id', $conversation->id)
            ->whereNotNull('attachment_path')
            ->with('user:id,name,avatar_url')
            ->orderByDesc('created_at');

        if ($type !== 'all') {
            $query->where('attachment_type', $type);
        }

        $messages = $query->limit(200)->get();

        return response()->json([
            'data' => $messages->map(fn(DirectMessage $m) => [
                'id'         => $m->id,
                'url'        => url(Storage::url($m->attachment_path)),
                'name'       => $m->attachment_name,
                'type'       => $m->attachment_type,
                'created_at' => $m->created_at->toISOString(),
                'user'       => [
                    'id'         => $m->user->id,
                    'name'       => $m->user->name,
                    'avatar_url' => $m->user->avatar_url ? url($m->user->avatar_url) : null,
                ],
            ]),
        ]);
    }

    public function destroy(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $conversation->participants()->detach($request->user()->id);

        if ($conversation->participants()->count() === 0) {
            $conversation->delete();
        }

        return response()->json(null, 204);
    }

    public function updateContactName(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $validated = $request->validate([
            'local_name' => ['nullable', 'string', 'max:100'],
            'local_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $pivotData = [];
        if (array_key_exists('local_name', $validated)) {
            $pivotData['local_name'] = $validated['local_name'];
        }
        if (array_key_exists('local_note', $validated)) {
            $pivotData['local_note'] = $validated['local_note'];
        }

        if (!empty($pivotData)) {
            $conversation->participants()->updateExistingPivot($request->user()->id, $pivotData);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Unread counts for a whole set of conversations in one query.
     *
     * Each conversation carries its own `last_read_at` cutoff, so a plain
     * GROUP BY will not do; the cutoffs are folded into one OR-of-ANDs.
     *
     * @param  \Illuminate\Support\Collection<int, Conversation>  $conversations
     * @return \Illuminate\Support\Collection<int, int>  keyed by conversation id
     */
    private function unreadCountsFor($conversations, int $userId)
    {
        $cutoffs = [];

        foreach ($conversations as $conv) {
            $me = $conv->participants->firstWhere('id', $userId);
            if ($me) {
                $cutoffs[$conv->id] = $me->pivot?->last_read_at;
            }
        }

        if (empty($cutoffs)) {
            return collect();
        }

        return DirectMessage::query()
            ->whereIn('conversation_id', array_keys($cutoffs))
            ->where('user_id', '!=', $userId)
            ->where(function ($query) use ($cutoffs) {
                foreach ($cutoffs as $conversationId => $lastReadAt) {
                    $query->orWhere(function ($inner) use ($conversationId, $lastReadAt) {
                        $inner->where('conversation_id', $conversationId);
                        if ($lastReadAt) {
                            $inner->where('created_at', '>', $lastReadAt);
                        }
                    });
                }
            })
            ->groupBy('conversation_id')
            ->selectRaw('conversation_id, COUNT(*) as aggregate')
            ->pluck('aggregate', 'conversation_id');
    }

    private function authorizeConversation(Request $request, Conversation $conversation): void
    {
        $isMember = $conversation->participants()
            ->where('users.id', $request->user()->id)
            ->exists();

        if (!$isMember) {
            abort(403);
        }
    }

    public static function serializeMessage(DirectMessage $message): array
    {
        $data = [
            'id'              => $message->id,
            'conversation_id' => $message->conversation_id,
            'body'            => $message->body,
            'is_edited'       => (bool) $message->is_edited,
            'reply_to_id'     => $message->reply_to_id,
            'created_at'      => $message->created_at->toISOString(),
            'attachment_url'  => $message->attachment_path
                ? url(Storage::url($message->attachment_path))
                : null,
            'attachment_name' => $message->attachment_name,
            'attachment_type' => $message->attachment_type,
            'user'            => [
                'id'         => $message->user->id,
                'name'       => $message->user->name,
                'email'      => $message->user->email,
                'avatar_url' => $message->user->avatar_url
                    ? url($message->user->avatar_url)
                    : null,
            ],
            'reply_to'        => null,
        ];

        if ($message->reply_to_id && $message->replyTo) {
            $data['reply_to'] = [
                'id'   => $message->replyTo->id,
                'body' => $message->replyTo->body,
                'user' => [
                    'id'   => $message->replyTo->user->id,
                    'name' => $message->replyTo->user->name,
                ],
            ];
        }

        return $data;
    }
}
