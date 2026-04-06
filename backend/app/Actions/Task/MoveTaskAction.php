<?php

namespace App\Actions\Task;

use App\DTOs\MoveTaskDTO;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

final class MoveTaskAction
{
    public function execute(Task $task, MoveTaskDTO $dto): Task
    {
        return DB::transaction(function () use ($task, $dto) {
            $oldColumnId = $task->column_id;
            $oldPosition = $task->position;
            $newColumnId = $dto->columnId;
            $newPosition = $dto->position;

            if ($oldColumnId === $newColumnId) {
                if ($oldPosition < $newPosition) {
                    Task::where('column_id', $oldColumnId)
                        ->whereBetween('position', [$oldPosition + 1, $newPosition])
                        ->decrement('position');
                } elseif ($oldPosition > $newPosition) {
                    Task::where('column_id', $oldColumnId)
                        ->whereBetween('position', [$newPosition, $oldPosition - 1])
                        ->increment('position');
                }
            } else {
                Task::where('column_id', $oldColumnId)
                    ->where('position', '>', $oldPosition)
                    ->decrement('position');

                Task::where('column_id', $newColumnId)
                    ->where('position', '>=', $newPosition)
                    ->increment('position');
            }

            $task->update([
                'column_id' => $newColumnId,
                'position' => $newPosition,
            ]);

            return $task->fresh(['creator', 'assignee', 'tags', 'column']);
        });
    }
}
