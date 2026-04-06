<?php

namespace App\Actions\Attachment;

use App\DTOs\CreateAttachmentDTO;
use App\Models\Attachment;
use Illuminate\Support\Facades\Storage;

final class CreateAttachmentAction
{
    public function execute(CreateAttachmentDTO $dto): Attachment
    {
        $file = $dto->file;

        $path = $file->store(
            "attachments/{$dto->taskId}",
            'public',
        );

        return Attachment::create([
            'task_id' => $dto->taskId,
            'user_id' => $dto->userId,
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getClientMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize(),
        ]);
    }
}
