<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Channel;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChannelController extends Controller
{
    /**
     * List all channels for a workspace.
     * Auto-creates #general if none exists yet.
     */
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $channels = $workspace->channels()
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        $general = $channels->firstWhere('name', 'general');

        if (!$general) {
            $general = $workspace->channels()->create([
                'name'        => 'general',
                'description' => 'General discussion for the whole team.',
                'is_default'  => true,
                'position'    => 0,
            ]);
            $channels->prepend($general);
        } elseif (!$general->is_default) {
            $general->update(['is_default' => true]);
        }

        return response()->json([
            'data' => $channels->map(fn(Channel $c) => self::serialize($c))->values(),
        ]);
    }

    /**
     * Create a new channel in the workspace.
     */
    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $exists = $workspace->channels()
            ->where('name', strtolower($validated['name']))
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'A channel with that name already exists.'], 422);
        }

        $maxPosition = $workspace->channels()->max('position') ?? 0;

        $channel = $workspace->channels()->create([
            'name'        => strtolower($validated['name']),
            'description' => $validated['description'] ?? null,
            'is_default'  => false,
            'position'    => $maxPosition + 1,
        ]);

        return response()->json(['data' => self::serialize($channel)], 201);
    }

    /**
     * Update a channel's name / description.
     */
    public function update(Request $request, Workspace $workspace, Channel $channel): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        if ($channel->workspace_id !== $workspace->id) {
            abort(404);
        }

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:80', 'regex:/^[a-z0-9_-]+$/'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        if (isset($validated['name'])) {
            $newName = strtolower($validated['name']);
            $conflict = $workspace->channels()
                ->where('name', $newName)
                ->where('id', '!=', $channel->id)
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'A channel with that name already exists.'], 422);
            }
            $validated['name'] = $newName;
        }

        $channel->update($validated);

        return response()->json(['data' => self::serialize($channel)]);
    }

    /**
     * Delete a channel (not allowed for the default #general channel).
     */
    public function destroy(Request $request, Workspace $workspace, Channel $channel): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        if ($channel->workspace_id !== $workspace->id) {
            abort(404);
        }

        if ($channel->is_default) {
            return response()->json(['message' => 'The default #general channel cannot be deleted.'], 422);
        }

        $channel->delete();

        return response()->json(null, 204);
    }

    public static function serialize(Channel $c): array
    {
        return [
            'id'          => $c->id,
            'name'        => $c->name,
            'description' => $c->description,
            'is_default'  => (bool) $c->is_default,
            'position'    => (int) $c->position,
        ];
    }
}
