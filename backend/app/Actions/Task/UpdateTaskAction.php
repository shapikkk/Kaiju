<?php

namespace App\Actions\Task;

use App\DTOs\UpdateTaskDTO;
use App\Models\Task;

final class UpdateTaskAction
{
    public function execute(Task $task, UpdateTaskDTO $dto): Task
    {
        $data = [];
        $present = array_flip($dto->presentKeys);

        if ($dto->title !== null) {
            $data['title'] = $dto->title;
        }
        if ($dto->priority !== null) {
            $data['priority'] = $dto->priority;
        }

        if (array_key_exists('description', $present)) {
            $data['description'] = $dto->description;
        }
        if (array_key_exists('assignee_id', $present)) {
            $data['assignee_id'] = $dto->assigneeId;
        }
        if (array_key_exists('sprint_id', $present)) {
            $data['sprint_id'] = $dto->sprintId;
        }
        if (array_key_exists('epic_id', $present)) {
            $data['epic_id'] = $dto->epicId;
        }
        if (array_key_exists('due_date', $present)) {
            $data['due_date'] = $dto->dueDate;
        }
        if (array_key_exists('estimated_hours', $present)) {
            $data['estimated_hours'] = $dto->estimatedHours;
        }

        if (!empty($data)) {
            $task->update($data);
        }

        if ($dto->tagIds !== null) {
            $task->tags()->sync($dto->tagIds);
        }

        return $task->fresh(['creator', 'assignee', 'tags', 'column', 'sprint', 'epic']);
    }
}
