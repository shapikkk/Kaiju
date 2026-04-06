<?php

namespace App\Http\Controllers\Api;

use App\Actions\Tag\CreateTagAction;
use App\DTOs\CreateTagDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TagController extends Controller
{
    public function index(Workspace $workspace): AnonymousResourceCollection
    {
        return TagResource::collection(
            $workspace->tags()->orderBy('name')->get()
        );
    }

    public function store(
        StoreTagRequest $request,
        Workspace $workspace,
        CreateTagAction $action,
    ): JsonResponse {
        $dto = CreateTagDTO::fromRequest($request, $workspace->id);
        $tag = $action->execute($dto);

        return (new TagResource($tag))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Tag $tag): TagResource
    {
        $validated = request()->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $tag->update($validated);

        return new TagResource($tag->fresh());
    }

    public function destroy(Tag $tag): JsonResponse
    {
        $tag->delete();

        return response()->json(null, 204);
    }
}
