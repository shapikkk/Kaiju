<?php

namespace App\Http\Controllers\Api;

use App\Actions\Comment\CreateCommentAction;
use App\DTOs\CreateCommentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CommentController extends Controller
{
    public function index(Task $task): AnonymousResourceCollection
    {
        return CommentResource::collection(
            $task->comments()->with('user')->orderBy('created_at')->get()
        );
    }

    public function store(
        StoreCommentRequest $request,
        Task $task,
        CreateCommentAction $action,
    ): JsonResponse {
        $dto = CreateCommentDTO::fromRequest($request, $task->id, $request->user()->id);
        $comment = $action->execute($dto);

        return (new CommentResource($comment))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Comment $comment): CommentResource
    {
        $validated = request()->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $comment->update($validated);

        return new CommentResource($comment->fresh('user'));
    }

    public function destroy(Comment $comment): JsonResponse
    {
        $comment->delete();

        return response()->json(null, 204);
    }
}
