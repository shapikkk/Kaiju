<?php

namespace App\DTOs;

use App\Enums\Priority;
use App\Http\Requests\StoreTaskRequest;

final readonly class CreateTaskDTO
{
    public function __construct(
        public int $boardId,
        public int $columnId,
        public int $creatorId,
        public string $title,
        public ?string $description,
        public Priority $priority,
        public ?int $assigneeId,
        public ?int $sprintId,
        public ?int $epicId,
        public ?string $dueDate,
        public ?float $estimatedHours,
        /** @var int[] */
        public array $tagIds = [],
    ) {
    }

    public static function fromRequest(StoreTaskRequest $request, int $boardId, int $creatorId): self
    {
        return new self(
            boardId: $boardId,
            columnId: $request->validated('column_id'),
            creatorId: $creatorId,
            title: $request->validated('title'),
            description: $request->validated('description'),
            priority: Priority::from($request->validated('priority', 'medium')),
            assigneeId: $request->validated('assignee_id'),
            sprintId: $request->validated('sprint_id'),
            epicId: $request->validated('epic_id'),
            dueDate: $request->validated('due_date'),
            estimatedHours: $request->validated('estimated_hours'),
            tagIds: $request->validated('tag_ids', []),
        );
    }
}
