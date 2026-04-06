<?php

namespace App\DTOs;

use App\Http\Requests\StoreEpicRequest;

final readonly class CreateEpicDTO
{
    public function __construct(
        public int $workspaceId,
        public string $name,
        public ?string $summary,
        public ?string $color,
    ) {
    }

    public static function fromRequest(StoreEpicRequest $request, int $workspaceId): self
    {
        return new self(
            workspaceId: $workspaceId,
            name: $request->validated('name'),
            summary: $request->validated('summary'),
            color: $request->validated('color'),
        );
    }
}
