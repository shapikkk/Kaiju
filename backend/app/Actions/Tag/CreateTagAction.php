<?php

namespace App\Actions\Tag;

use App\DTOs\CreateTagDTO;
use App\Models\Tag;

final class CreateTagAction
{
    public function execute(CreateTagDTO $dto): Tag
    {
        return Tag::create([
            'workspace_id' => $dto->workspaceId,
            'name' => $dto->name,
            'color' => $dto->color,
        ]);
    }
}
