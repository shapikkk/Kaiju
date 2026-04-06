<?php

namespace App\Actions\Column;

use App\DTOs\CreateColumnDTO;
use App\Models\Column;

final class CreateColumnAction
{
    public function execute(CreateColumnDTO $dto): Column
    {
        $maxPosition = Column::where('board_id', $dto->boardId)->max('position') ?? -1;

        return Column::create([
            'board_id' => $dto->boardId,
            'name' => $dto->name,
            'slug' => $dto->slug,
            'color' => $dto->color,
            'position' => $maxPosition + 1,
            'is_done_column' => $dto->isDoneColumn,
            'wip_limit' => $dto->wipLimit,
        ]);
    }
}
