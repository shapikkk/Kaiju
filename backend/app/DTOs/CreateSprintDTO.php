<?php

namespace App\DTOs;

use App\Http\Requests\StoreSprintRequest;

final class CreateSprintDTO
{
    public function __construct(
        public readonly int $boardId,
        public readonly string $name,
        public readonly ?string $goal,
    ) {
    }

    public static function fromRequest(StoreSprintRequest $request, int $boardId): self
    {
        return new self(
            boardId: $boardId,
            name: $request->validated('name'),
            goal: $request->validated('goal'),
        );
    }
}
