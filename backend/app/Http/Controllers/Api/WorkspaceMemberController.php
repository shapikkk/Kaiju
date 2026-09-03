<?php

namespace App\Http\Controllers\Api;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkspaceMemberController extends Controller
{
    /**
     * List all workspace members (including the owner).
     *
     * Returns users with their pivot role. The owner is injected with
     * role = 'owner' if they are not already in the pivot table.
     */
    public function index(Request $request, Workspace $workspace): AnonymousResourceCollection
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $members = $workspace->members()->withPivot('role')->get();

        $ownerIncluded = $members->contains('id', $workspace->owner_id);
        if (!$ownerIncluded) {
            $owner = User::find($workspace->owner_id);
            if ($owner) {
                $owner->pivot = (object) ['role' => 'owner'];
                $members->prepend($owner);
            }
        }

        return UserResource::collection($members);
    }

    /**
     * Update a member's role.
     *
     * Security: Only Owners/Admins can update roles.
     * The Owner's role cannot be changed.
     */
    public function update(Request $request, Workspace $workspace, int $userId): JsonResponse
    {
        if (!$workspace->userHasRole($request->user(), WorkspaceRole::Owner, WorkspaceRole::Admin)) {
            abort(403, 'You do not have permission to manage members.');
        }

        if ($workspace->owner_id === $userId) {
            return response()->json([
                'message' => 'The workspace owner\'s role cannot be changed.',
            ], 422);
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,member'],
        ]);

        if (!$workspace->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'User is not a member of this workspace.'], 404);
        }

        $workspace->members()->updateExistingPivot($userId, [
            'role' => $validated['role'],
        ]);

        // Workspace memoises membership per request; drop the stale entry.
        Workspace::forgetMembership($workspace->id, $userId);

        return response()->json(['message' => 'Role updated successfully.']);
    }

    /**
     * Leave the workspace yourself.
     *
     * Distinct from destroy(), which is an admin removing somebody else. The
     * owner cannot leave — there would be nobody left to administer the
     * workspace — so they are told to hand it over or delete it instead.
     */
    public function leave(Request $request, Workspace $workspace): JsonResponse
    {
        $user = $request->user();

        if ($workspace->owner_id === $user->id) {
            return response()->json([
                'message' => 'You own this workspace. Transfer ownership or delete it instead of leaving.',
            ], 422);
        }

        if (!$workspace->members()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are not a member of this workspace.',
            ], 404);
        }

        $workspace->members()->detach($user->id);
        Workspace::forgetMembership($workspace->id, $user->id);

        return response()->json(['message' => 'You have left the workspace.']);
    }

    /**
     * Remove a member from the workspace.
     *
     * Security: Only Owners/Admins can remove members.
     * The Owner cannot be removed.
     */
    public function destroy(Request $request, Workspace $workspace, int $userId): JsonResponse
    {
        if (!$workspace->userHasRole($request->user(), WorkspaceRole::Owner, WorkspaceRole::Admin)) {
            abort(403, 'You do not have permission to remove members.');
        }

        if ($workspace->owner_id === $userId) {
            return response()->json([
                'message' => 'The workspace owner cannot be removed.',
            ], 422);
        }

        if (!$workspace->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'User is not a member of this workspace.'], 404);
        }

        $workspace->members()->detach($userId);

        Workspace::forgetMembership($workspace->id, $userId);

        return response()->json(null, 204);
    }
}
