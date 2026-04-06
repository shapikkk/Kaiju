<?php

namespace App\Http\Controllers\Api;

use App\Actions\Epic\CreateEpicAction;
use App\DTOs\CreateEpicDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEpicRequest;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EpicController extends Controller
{
    public function index(Workspace $workspace): AnonymousResourceCollection
    {
        return EpicResource::collection(
            $workspace->epics()->withCount('tasks')->orderBy('name')->get()
        );
    }

    public function store(
        StoreEpicRequest $request,
        Workspace $workspace,
        CreateEpicAction $action,
    ): JsonResponse {
        $dto = CreateEpicDTO::fromRequest($request, $workspace->id);
        $epic = $action->execute($dto);

        return (new EpicResource($epic))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Epic $epic): EpicResource
    {
        $validated = request()->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:2000'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $epic->update($validated);

        return new EpicResource($epic->fresh());
    }

    public function destroy(Epic $epic): JsonResponse
    {
        $epic->delete();

        return response()->json(null, 204);
    }
}
