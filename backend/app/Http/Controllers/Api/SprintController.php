<?php

namespace App\Http\Controllers\Api;

use App\Actions\Sprint\CreateSprintAction;
use App\DTOs\CreateSprintDTO;
use App\Enums\SprintStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSprintRequest;
use App\Http\Resources\SprintResource;
use App\Models\Board;
use App\Models\Sprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SprintController extends Controller
{
    public function index(Board $board): AnonymousResourceCollection
    {
        return SprintResource::collection(
            $board->sprints()->orderByDesc('created_at')->get()
        );
    }

    public function store(
        StoreSprintRequest $request,
        Board $board,
        CreateSprintAction $action,
    ): JsonResponse {
        $dto = CreateSprintDTO::fromRequest($request, $board->id);
        $sprint = $action->execute($dto);

        return (new SprintResource($sprint))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Sprint $sprint): SprintResource
    {
        $validated = request()->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'goal' => ['nullable', 'string', 'max:1000'],
            'status' => ['sometimes', 'string', 'in:planning,active,completed'],
        ]);

        if (isset($validated['status'])) {
            $newStatus = SprintStatus::from($validated['status']);

            if ($newStatus === SprintStatus::Active && $sprint->status !== SprintStatus::Active) {
                $validated['started_at'] = now();
            }

            if ($newStatus === SprintStatus::Completed && $sprint->status !== SprintStatus::Completed) {
                $validated['ended_at'] = now();
            }
        }

        $sprint->update($validated);

        return new SprintResource($sprint->fresh());
    }
}
