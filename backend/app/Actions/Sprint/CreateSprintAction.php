<?php

namespace App\Actions\Sprint;

use App\DTOs\CreateSprintDTO;
use App\Models\Sprint;

final class CreateSprintAction
{
    public function execute(CreateSprintDTO $dto): Sprint
    {
        return Sprint::create([
            'board_id' => $dto->boardId,
            'name' => $dto->name,
            'goal' => $dto->goal,
            'status' => 'planning',
        ]);
    }
}
