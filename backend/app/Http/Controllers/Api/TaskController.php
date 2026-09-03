<?php

namespace App\Http\Controllers\Api;

use App\Actions\Task\CreateTaskAction;
use App\Actions\Task\MoveTaskAction;
use App\Actions\Task\UpdateTaskAction;
use App\DTOs\CreateTaskDTO;
use App\DTOs\MoveTaskDTO;
use App\DTOs\UpdateTaskDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\MoveTaskRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Board;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function index(Board $board): AnonymousResourceCollection
    {
        $tasks = $board->tasks()
            ->with(['creator', 'assignee', 'tags', 'column', 'epic', 'sprint'])
            ->withCount(['comments', 'attachments'])
            ->orderBy('position')
            ->get();

        $tasks->each(fn($task) => $task->setRelation('board', $board));

        return TaskResource::collection($tasks);
    }

    public function store(
        StoreTaskRequest $request,
        Board $board,
        CreateTaskAction $action,
        ): JsonResponse
    {
        $dto = CreateTaskDTO::fromRequest($request, $board->id, $request->user()->id);
        $task = $action->execute($dto);
        $task->setRelation('board', $board);

        return (new TaskResource($task))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Task $task): TaskResource
    {
        $task->load([
            'board',
            'creator',
            'assignee',
            'tags',
            'column',
            'sprint',
            'epic',
            'comments.user',
            'attachments.user',
        ]);

        return new TaskResource($task);
    }

    public function update(
        UpdateTaskRequest $request,
        Task $task,
        UpdateTaskAction $action,
        ): TaskResource
    {
        $dto = UpdateTaskDTO::fromRequest($request);
        $task = $action->execute($task, $dto);

        $task->load(['board', 'epic', 'sprint', 'assignee', 'tags', 'column']);

        return new TaskResource($task);
    }

    public function move(
        MoveTaskRequest $request,
        Task $task,
        MoveTaskAction $action,
        ): TaskResource
    {
        $dto = MoveTaskDTO::fromRequest($request);
        $task = $action->execute($task, $dto);

        return new TaskResource($task);
    }

    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json(null, 204);
    }
}
