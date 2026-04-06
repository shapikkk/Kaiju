<?php

namespace App\DTOs;

use App\Http\Requests\StoreWorkspaceRequest;

final readonly class CreateWorkspaceDTO
{
    public function __construct(
        public string $name,
        public string $slug,
        public ?string $description,
        public int $ownerId,
    ) {
    }

    public static function fromRequest(StoreWorkspaceRequest $request, int $ownerId): self
    {
        return new self(
            name: $request->validated('name'),
            slug: $request->validated('slug'),
            description: $request->validated('description'),
            ownerId: $ownerId,
        );
    }
}
