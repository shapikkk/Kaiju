<?php

namespace App\DTOs;

use App\Http\Requests\StoreColumnRequest;

final readonly class CreateColumnDTO
{
    public function __construct(
        public int $boardId,
        public string $name,
        public string $slug,
        public ?string $color,
        public ?int $wipLimit,
        public bool $isDoneColumn = false,
    ) {
    }

    public static function fromRequest(StoreColumnRequest $request, int $boardId): self
    {
        return new self(
            boardId: $boardId,
            name: $request->validated('name'),
            slug: $request->validated('slug'),
            color: $request->validated('color'),
            wipLimit: $request->validated('wip_limit'),
            isDoneColumn: $request->boolean('is_done_column'),
        );
    }
}
