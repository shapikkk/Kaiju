<?php

namespace App\DTOs;

use App\Http\Requests\StoreTagRequest;

final readonly class CreateTagDTO
{
    public function __construct(
        public int $workspaceId,
        public string $name,
        public string $color,
    ) {
    }

    public static function fromRequest(StoreTagRequest $request, int $workspaceId): self
    {
        return new self(
            workspaceId: $workspaceId,
            name: $request->validated('name'),
            color: $request->validated('color', '#6366f1'),
        );
    }
}
