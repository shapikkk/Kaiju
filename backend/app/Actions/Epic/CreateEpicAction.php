<?php

namespace App\Actions\Epic;

use App\DTOs\CreateEpicDTO;
use App\Models\Epic;

final class CreateEpicAction
{
    public function execute(CreateEpicDTO $dto): Epic
    {
        return Epic::create([
            'workspace_id' => $dto->workspaceId,
            'name' => $dto->name,
            'summary' => $dto->summary,
            'color' => $dto->color,
        ]);
    }
}
