<?php

namespace App\Actions\Task;

use App\DTOs\CreateTaskDTO;
use App\Models\Board;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

final class CreateTaskAction
{
    public function execute(CreateTaskDTO $dto): Task
    {
        return DB::transaction(function () use ($dto) {
            $board = Board::findOrFail($dto->boardId);
            $taskNumber = $board->nextTaskNumber();

            $maxPosition = Task::where('column_id', $dto->columnId)->max('position') ?? -1;

            $task = Task::create([
                'board_id' => $dto->boardId,
                'column_id' => $dto->columnId,
                'creator_id' => $dto->creatorId,
                'assignee_id' => $dto->assigneeId,
                'sprint_id' => $dto->sprintId,
                'epic_id' => $dto->epicId,
                'title' => $dto->title,
                'description' => $dto->description,
                'priority' => $dto->priority,
                'task_number' => $taskNumber,
                'position' => $maxPosition + 1,
                'due_date' => $dto->dueDate,
                'estimated_hours' => $dto->estimatedHours,
            ]);

            if (!empty($dto->tagIds)) {
                $task->tags()->sync($dto->tagIds);
            }

            // TaskResource's key_identifier accessor reads $task->board.
            $task->setRelation('board', $board);

            return $task->load(['creator', 'assignee', 'tags', 'column']);
        });
    }
}
