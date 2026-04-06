<?php

namespace App\Actions\Comment;

use App\DTOs\CreateCommentDTO;
use App\Models\Comment;

final class CreateCommentAction
{
    public function execute(CreateCommentDTO $dto): Comment
    {
        return Comment::create([
            'task_id' => $dto->taskId,
            'user_id' => $dto->userId,
            'body' => $dto->body,
        ])->load('user');
    }
}
