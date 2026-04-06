<?php

namespace App\DTOs;

use Illuminate\Http\UploadedFile;

final readonly class CreateAttachmentDTO
{
    public function __construct(
        public int $taskId,
        public int $userId,
        public UploadedFile $file,
    ) {
    }
}
