<?php

namespace App\Http\Controllers\Api;

use App\Actions\Workspace\CreateWorkspaceAction;
use App\DTOs\CreateWorkspaceDTO;
use App\Enums\WorkspaceRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $userId = $request->user()->id;

        $workspaces = Workspace::where('owner_id', $userId)
            ->orWhereHas('members', function ($query) use ($userId) {
                $query->where('users.id', $userId);
            })
            ->with('owner')
            ->orderBy('name')
            ->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(
        StoreWorkspaceRequest $request,
        CreateWorkspaceAction $action,
    ): JsonResponse {
        $dto = CreateWorkspaceDTO::fromRequest($request, $request->user()->id);
        $workspace = $action->execute($dto);

        return (new WorkspaceResource($workspace))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Workspace $workspace): WorkspaceResource
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $workspace->load(['owner', 'members', 'boards']);

        return new WorkspaceResource($workspace);
    }

    public function update(Request $request, Workspace $workspace): WorkspaceResource
    {
        $user = $request->user();

        if ($workspace->owner_id !== $user->id && !$workspace->userHasRole($user, WorkspaceRole::Admin)) {
            abort(403, 'Only workspace owners and admins can update this workspace.');
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $workspace->update($validated);

        return new WorkspaceResource($workspace->fresh('owner', 'members'));
    }

    public function destroy(Request $request, Workspace $workspace): JsonResponse
    {
        if ($workspace->owner_id !== $request->user()->id) {
            abort(403, 'Only the workspace owner can delete this workspace.');
        }

        $workspace->delete();

        return response()->json(null, 204);
    }
}
