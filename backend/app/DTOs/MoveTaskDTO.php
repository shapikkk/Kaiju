<?php

namespace App\DTOs;

use App\Http\Requests\MoveTaskRequest;

final readonly class MoveTaskDTO
{
    public function __construct(
        public int $columnId,
        public int $position,
    ) {
    }

    public static function fromRequest(MoveTaskRequest $request): self
    {
        return new self(
            columnId: $request->validated('column_id'),
            position: $request->validated('position'),
        );
    }
}
