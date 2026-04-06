<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\MessageUpdated;
use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Message;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkspaceChatController extends Controller
{
    public function index(Request $request, Channel $channel): JsonResponse
    {
        if (!$channel->workspace->hasAccess($request->user())) {
            abort(403);
        }

        $messages = Message::where('channel_id', $channel->id)
            ->with(['user', 'replyTo.user'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'data' => $messages->map(fn(Message $m) => self::serializeMessage($m)),
        ]);
    }

    public function store(Request $request, Channel $channel): JsonResponse
    {
        if (!$channel->workspace->hasAccess($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'body'        => ['nullable', 'string', 'max:5000'],
            'reply_to_id' => ['nullable', 'integer', 'exists:messages,id'],
            'attachment'  => ['nullable', 'file', 'max:10240',
                'mimes:jpg,jpeg,png,gif,webp,pdf,txt,csv,xlsx,docx,zip'],
        ]);

        if (empty($validated['body']) && !$request->hasFile('attachment')) {
            return response()->json(['message' => 'A message or attachment is required.'], 422);
        }

        $attachmentPath = null;
        $attachmentName = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file           = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $attachmentType = in_array(
                strtolower($file->getClientOriginalExtension()),
                ['jpg', 'jpeg', 'png', 'gif', 'webp']
            ) ? 'image' : 'file';
            $attachmentPath = $file->store('chat_attachments', 'public');
        }

        $message = Message::create([
            'workspace_id'    => $channel->workspace_id,
            'channel_id'      => $channel->id,
            'user_id'         => $request->user()->id,
            'body'            => $validated['body'] ?? '',
            'reply_to_id'     => $validated['reply_to_id'] ?? null,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_type' => $attachmentType,
        ]);

        $message->load(['user', 'replyTo.user']);

        broadcast(new MessageSent($message));

        return response()->json(['data' => self::serializeMessage($message)], 201);
    }

    public function update(Request $request, Channel $channel, Message $message): JsonResponse
    {
        if (!$channel->workspace->hasAccess($request->user())) {
            abort(403);
        }

        if ($message->user_id !== $request->user()->id) {
            abort(403, 'You can only edit your own messages.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message->update([
            'body'      => $validated['body'],
            'is_edited' => true,
        ]);

        $message->load(['user', 'replyTo.user']);

        broadcast(new MessageUpdated($message));

        return response()->json(['data' => self::serializeMessage($message)]);
    }

    public function destroy(Request $request, Channel $channel, Message $message): JsonResponse
    {
        if (!$channel->workspace->hasAccess($request->user())) {
            abort(403);
        }

        if ($message->user_id !== $request->user()->id) {
            abort(403, 'You can only delete your own messages.');
        }

        $messageId = $message->id;
        $channelId = $channel->id;

        if ($message->attachment_path) {
            Storage::disk('public')->delete($message->attachment_path);
        }

        $message->delete();

        broadcast(new MessageDeleted($messageId, $channelId));

        return response()->json(null, 204);
    }

    public function indexForWorkspace(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $channel = $workspace->channels()->firstOrCreate(
            ['name' => 'general'],
            ['description' => 'General discussion for the whole team.']
        );

        return $this->index($request, $channel);
    }

    public function storeForWorkspace(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $channel = $workspace->channels()->firstOrCreate(
            ['name' => 'general'],
            ['description' => 'General discussion for the whole team.']
        );

        return $this->store($request, $channel);
    }

    public function updateForWorkspace(Request $request, Workspace $workspace, Message $message): JsonResponse
    {
        $channel = $message->channel;
        return $this->update($request, $channel, $message);
    }

    public function destroyForWorkspace(Request $request, Workspace $workspace, Message $message): JsonResponse
    {
        $channel = $message->channel;
        return $this->destroy($request, $channel, $message);
    }

    /**
     * Canonical message serializer shared by REST + all broadcast events.
     */
    public static function serializeMessage(Message $message): array
    {
        $data = [
            'id'              => $message->id,
            'channel_id'      => $message->channel_id,
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
