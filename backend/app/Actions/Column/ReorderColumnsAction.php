<?php

namespace App\Actions\Column;

use App\Models\Column;
use Illuminate\Support\Facades\DB;

final class ReorderColumnsAction
{
    /**
     * @param array<int, int> $orderedIds Array of column IDs in the desired order.
     */
    public function execute(int $boardId, array $orderedIds): void
    {
        DB::transaction(function () use ($boardId, $orderedIds) {
            foreach ($orderedIds as $position => $columnId) {
                Column::where('id', $columnId)
                    ->where('board_id', $boardId)
                    ->update(['position' => $position]);
            }
        });
    }
}
