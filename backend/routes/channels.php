<?php

use App\Models\Channel;
use App\Models\Conversation;
use App\Models\Workspace;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Register authorization callbacks for broadcast channels. The callback
| determines whether the authenticated user can listen on the channel.
|
*/

// Private user channel (default scaffold)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Workspace Presence Channel
 *
 * Only verified workspace members can join. Returns user info for
 * the presence member list (who's online).
 */
Broadcast::channel('workspace.{slug}', function ($user, string $slug) {
    $workspace = Workspace::where('slug', $slug)->first();

    if (!$workspace || !$workspace->hasAccess($user)) {
        return false;
    }

    // Return user data for the presence channel member list
    return [
        'id'         => $user->id,
        'name'       => $user->name,
        'avatar_url' => $user->avatar_url ? url($user->avatar_url) : null,
    ];
});

/**
 * Channel Presence Channel
 *
 * Any workspace member can join a channel in their workspace.
 */
Broadcast::channel('channel.{id}', function ($user, int $id) {
    $channel = Channel::with('workspace')->find($id);

    if (!$channel || !$channel->workspace->hasAccess($user)) {
        return false;
    }

    return [
        'id'         => $user->id,
        'name'       => $user->name,
        'avatar_url' => $user->avatar_url ? url($user->avatar_url) : null,
    ];
});

/**
 * Private Direct Message Channel
 *
 * Only participants in the conversation can authorize it.
 */
Broadcast::channel('conversation.{id}', function ($user, int $id) {
    $conversation = Conversation::find($id);

    if (!$conversation) {
        return false;
    }

    return $conversation->participants()->where('users.id', $user->id)->exists();
});

/**
 * Private per-user notification channel.
 *
 * Carries contentless pings (e.g. "a DM arrived") so a client can refresh
 * without the payload ever touching a shared channel. Only the owner listens.
 */
Broadcast::channel('user.{id}', function ($user, int $id) {
    return (int) $user->id === $id;
});
