<?php

namespace App\DTOs;

use App\Http\Requests\StoreCommentRequest;

final readonly class CreateCommentDTO
{
    public function __construct(
        public int $taskId,
        public int $userId,
        public string $body,
    ) {
    }

    public static function fromRequest(StoreCommentRequest $request, int $taskId, int $userId): self
    {
        return new self(
            taskId: $taskId,
            userId: $userId,
            body: $request->validated('body'),
        );
    }
}
