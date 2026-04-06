<?php

namespace App\Http\Controllers\Api;

use App\Actions\Board\CreateBoardAction;
use App\DTOs\CreateBoardDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoardRequest;
use App\Http\Resources\BoardResource;
use App\Models\Board;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BoardController extends Controller
{
    public function index(Workspace $workspace): AnonymousResourceCollection
    {
        if (!$workspace->hasAccess(request()->user()))
            abort(403);

        $boards = $workspace->boards()->with('columns')->get();

        return BoardResource::collection($boards);
    }

    public function store(
        StoreBoardRequest $request,
        Workspace $workspace,
        CreateBoardAction $action,
    ): JsonResponse {
        if (!$workspace->hasAccess($request->user()))
            abort(403);

        $dto = CreateBoardDTO::fromRequest($request, $workspace->id);
        $board = $action->execute($dto);

        return (new BoardResource($board))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Workspace $workspace, Board $board): BoardResource
    {
        if (!$workspace->hasAccess(request()->user()))
            abort(403);

        $board->load(['columns', 'sprints']);

        foreach ($board->columns as $column) {
            $tasks = $column->tasks()
                ->with(['creator', 'assignee', 'tags', 'epic', 'sprint'])
                ->withCount(['comments', 'attachments'])
                ->orderBy('position')
                ->get();

            $tasks->each(fn($task) => $task->setRelation('board', $board));
            $column->setRelation('tasks', $tasks);
        }

        return new BoardResource($board);
    }

    public function update(Board $board): BoardResource
    {
        if (!$board->workspace->hasAccess(request()->user()))
            abort(403);

        $validated = request()->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $board->update($validated);

        return new BoardResource($board->fresh('columns'));
    }

    public function destroy(Board $board): JsonResponse
    {
        if (!$board->workspace->hasAccess(request()->user()))
            abort(403);

        $board->delete();

        return response()->json(null, 204);
    }
}
