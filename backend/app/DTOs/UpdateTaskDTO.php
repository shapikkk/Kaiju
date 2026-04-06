<?php

namespace App\DTOs;

use App\Enums\Priority;
use App\Http\Requests\UpdateTaskRequest;

final readonly class UpdateTaskDTO
{
    public function __construct(
        public ?string $title,
        public ?string $description,
        public ?Priority $priority,
        public ?int $assigneeId,
        public ?int $sprintId,
        public ?int $epicId,
        public ?string $dueDate,
        public ?float $estimatedHours,
        /** @var int[]|null */
        public ?array $tagIds,
        /** Keys that were explicitly present in the request (even if null). */
        public array $presentKeys = [],
    ) {
    }

    public static function fromRequest(UpdateTaskRequest $request): self
    {
        $priority = $request->has('priority')
            ? Priority::from($request->validated('priority'))
            : null;

        return new self(
            title: $request->validated('title'),
            description: $request->validated('description'),
            priority: $priority,
            assigneeId: $request->validated('assignee_id'),
            sprintId: $request->validated('sprint_id'),
            epicId: $request->validated('epic_id'),
            dueDate: $request->validated('due_date'),
            estimatedHours: $request->validated('estimated_hours'),
            tagIds: $request->validated('tag_ids'),
            presentKeys: $request->keys(),
        );
    }
}
