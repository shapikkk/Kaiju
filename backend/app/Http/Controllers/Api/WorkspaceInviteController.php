<?php

namespace App\Http\Controllers\Api;

use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Mail\WorkspaceInvitationMail;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class WorkspaceInviteController extends Controller
{
    public function store(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->userHasRole($request->user(), WorkspaceRole::Owner, WorkspaceRole::Admin)) {
            abort(403, 'You do not have permission to invite members to this workspace.');
        }

        $validated = $request->validate([
            'invites' => ['required', 'array', 'min:1'],
            'invites.*.email' => ['required', 'email', 'max:255'],
            'invites.*.role' => ['required', 'string', 'in:admin,member'],
        ]);

        $sentCount = 0;

        foreach ($validated['invites'] as $invite) {
            $isMember = $workspace->members()->where('users.email', $invite['email'])->exists();
            if ($isMember) {
                continue;
            }

            $invitation = WorkspaceInvitation::updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'email' => $invite['email'],
            ],
            [
                'role' => $invite['role'],
                'token' => Str::random(64),
                'expires_at' => now()->addDays(7),
            ],
            );

            $invitation->load('workspace');
            Mail::to($invite['email'])->send(new WorkspaceInvitationMail($invitation));
            $sentCount++;
        }

        return response()->json([
            'message' => $sentCount > 0 ? "$sentCount invitation(s) sent successfully." : 'No new invitations were sent.',
        ], 201);
    }

    /**
     * Generate a temporary invite link.
     */
    public function generateLink(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->userHasRole($request->user(), WorkspaceRole::Owner, WorkspaceRole::Admin)) {
            abort(403, 'You do not have permission to create invite links.');
        }

        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'workspaces.join',
            now()->addHours(48),
        ['workspace' => $workspace->slug]
        );

        return response()->json([
            'url' => $url
        ], 200);
    }

    /**
     * Accept an invitation via its secure token.
     *
     * The authenticated user's email MUST match the invitation email.
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $invitation = WorkspaceInvitation::where('token', $token)->first();

        if (!$invitation) {
            return response()->json([
                'message' => 'Invalid or expired invitation token.',
            ], 404);
        }

        if ($invitation->isExpired()) {
            $invitation->delete();

            return response()->json([
                'message' => 'This invitation has expired. Please request a new one.',
            ], 410);
        }

        $user = $request->user();
        if (strtolower($user->email) !== strtolower($invitation->email)) {
            return response()->json([
                'message' => 'This invitation was sent to a different email address.',
            ], 403);
        }

        $workspace = $invitation->workspace;
        if ($workspace->members()->where('user_id', $user->id)->exists()
        || $workspace->owner_id === $user->id) {
            $invitation->delete();

            return response()->json([
                'message' => 'You are already a member of this workspace.',
            ], 422);
        }

        $workspace->members()->attach($user->id, [
            'role' => $invitation->role,
        ]);

        // Workspace memoises membership per request; drop the stale entry.
        Workspace::forgetMembership($workspace->id, $user->id);

        $invitation->delete();

        return response()->json([
            'message' => 'Invitation accepted. Welcome to ' . $workspace->name . '!',
            'workspace_slug' => $workspace->slug,
        ]);
    }

    /**
     * Handle a click on a temporary signed invite link.
     *
     * - Validates the URL signature (prevents tampering / replay).
     * - Unauthenticated visitors are redirected to the frontend login page;
     *   the workspace slug is passed as a query param AND stored in a cookie
     *   so the frontend can auto-join after authentication.
     * - Authenticated users are added to the workspace (if not already a member)
     *   and redirected straight to the workspace chat.
     */
    public function joinWithLink(Request $request, Workspace $workspace): \Illuminate\Http\RedirectResponse
    {
        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        if (!$request->hasValidSignature()) {
            return redirect($frontendUrl . '/?invite_error=expired');
        }

        $user = $request->user('sanctum');

        if (!$user) {
            return redirect($frontendUrl . '/login?invite=' . $workspace->slug)
                ->cookie('invite_workspace', $workspace->slug, 60);
        }

        if (!$workspace->members()->where('user_id', $user->id)->exists()
            && $workspace->owner_id !== $user->id) {
            $workspace->members()->attach($user->id, ['role' => 'member']);
            Workspace::forgetMembership($workspace->id, $user->id);
        }

        return redirect($frontendUrl . '/' . $workspace->slug . '/chat');
    }

    /**
     * Accept a general invite link using a workspace slug token.
     *
     * The {token} route parameter carries the workspace slug extracted by the
     * frontend from the signed URL returned by generateLink().
     */
    public function acceptLink(Request $request, string $token): JsonResponse
    {
        $workspace = Workspace::where('slug', $token)->first();

        if (!$workspace) {
            return response()->json(['message' => 'Invalid invite link.'], 404);
        }

        $user = $request->user();

        if (!$workspace->members()->where('user_id', $user->id)->exists()
            && $workspace->owner_id !== $user->id) {
            $workspace->members()->attach($user->id, ['role' => 'member']);
            Workspace::forgetMembership($workspace->id, $user->id);
        }

        return response()->json(['slug' => $workspace->slug]);
    }
}
