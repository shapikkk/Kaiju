<?php

namespace App\DTOs;

use App\Http\Requests\StoreBoardRequest;

final readonly class CreateBoardDTO
{
    public function __construct(
        public int $workspaceId,
        public string $name,
        public string $slug,
        public ?string $description,
        public ?string $color,
    ) {
    }

    public static function fromRequest(StoreBoardRequest $request, int $workspaceId): self
    {
        return new self(
            workspaceId: $workspaceId,
            name: $request->validated('name'),
            slug: $request->validated('slug'),
            description: $request->validated('description'),
            color: $request->validated('color'),
        );
    }
}
