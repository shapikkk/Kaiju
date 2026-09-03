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
        // Must stay ahead of the interpolation below: these ids go into raw SQL.
        $orderedIds = array_values(array_map('intval', $orderedIds));

        if (empty($orderedIds)) {
            return;
        }

        $cases = '';
        foreach ($orderedIds as $position => $columnId) {
            $cases .= " WHEN {$columnId} THEN {$position}";
        }

        DB::transaction(function () use ($boardId, $orderedIds, $cases) {
            Column::where('board_id', $boardId)
                ->whereIn('id', $orderedIds)
                ->update([
                    'position' => DB::raw("CASE id{$cases} ELSE position END"),
                ]);
        });
    }
}
