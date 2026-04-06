<?php

namespace App\Actions\Board;

use App\DTOs\CreateBoardDTO;
use App\Models\Board;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

final class CreateBoardAction
{
    public function execute(CreateBoardDTO $dto): Board
    {
        return DB::transaction(function () use ($dto) {
            $maxPosition = Board::where('workspace_id', $dto->workspaceId)->max('position') ?? -1;

            $board = Board::create([
                'workspace_id' => $dto->workspaceId,
                'name' => $dto->name,
                'slug' => $dto->slug,
                'description' => $dto->description,
                'color' => $dto->color,
                'position' => $maxPosition + 1,
            ]);

            $defaultColumns = [
                ['name' => 'Backlog', 'slug' => 'backlog', 'position' => 0, 'color' => '#6b7280'],
                ['name' => 'To Do', 'slug' => 'to-do', 'position' => 1, 'color' => '#3b82f6'],
                ['name' => 'In Progress', 'slug' => 'in-progress', 'position' => 2, 'color' => '#f59e0b'],
                ['name' => 'Review', 'slug' => 'review', 'position' => 3, 'color' => '#8b5cf6'],
                ['name' => 'Done', 'slug' => 'done', 'position' => 4, 'color' => '#22c55e', 'is_done_column' => true],
            ];

            foreach ($defaultColumns as $columnData) {
                $board->columns()->create($columnData);
            }

            return $board->load('columns');
        });
    }
}
