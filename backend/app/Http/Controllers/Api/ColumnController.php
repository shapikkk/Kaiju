<?php

namespace App\Http\Controllers\Api;

use App\Actions\Column\CreateColumnAction;
use App\Actions\Column\ReorderColumnsAction;
use App\DTOs\CreateColumnDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderColumnsRequest;
use App\Http\Requests\StoreColumnRequest;
use App\Http\Resources\ColumnResource;
use App\Models\Board;
use App\Models\Column;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ColumnController extends Controller
{
    public function index(Board $board): AnonymousResourceCollection
    {
        return ColumnResource::collection(
            $board->columns()->withCount('tasks')->get()
        );
    }

    public function store(
        StoreColumnRequest $request,
        Board $board,
        CreateColumnAction $action,
    ): JsonResponse {
        $dto = CreateColumnDTO::fromRequest($request, $board->id);
        $column = $action->execute($dto);

        return (new ColumnResource($column))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Column $column): ColumnResource
    {
        $validated = request()->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:7'],
            'wip_limit' => ['nullable', 'integer', 'min:1'],
            'is_done_column' => ['nullable', 'boolean'],
        ]);

        $column->update($validated);

        return new ColumnResource($column->fresh());
    }

    public function reorder(
        ReorderColumnsRequest $request,
        Board $board,
        ReorderColumnsAction $action,
    ): JsonResponse {
        $action->execute($board->id, $request->validated('ordered_ids'));

        return response()->json(['message' => 'Columns reordered.']);
    }
}
