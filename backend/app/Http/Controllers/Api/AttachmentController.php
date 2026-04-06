<?php

namespace App\Http\Controllers\Api;

use App\Actions\Attachment\CreateAttachmentAction;
use App\DTOs\CreateAttachmentDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttachmentRequest;
use App\Http\Resources\AttachmentResource;
use App\Models\Attachment;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function index(Task $task): AnonymousResourceCollection
    {
        return AttachmentResource::collection(
            $task->attachments()->with('user')->orderByDesc('created_at')->get()
        );
    }

    public function store(
        StoreAttachmentRequest $request,
        Task $task,
        CreateAttachmentAction $action,
    ): JsonResponse {
        $dto = new CreateAttachmentDTO(
            taskId: $task->id,
            userId: $request->user()->id,
            file: $request->file('file'),
        );

        $attachment = $action->execute($dto);
        $attachment->load('user');

        return (new AttachmentResource($attachment))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Attachment $attachment): JsonResponse
    {
        if ($attachment->path) {
            Storage::disk('public')->delete($attachment->path);
        }

        $attachment->delete();

        return response()->json(null, 204);
    }
}
