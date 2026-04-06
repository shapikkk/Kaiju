<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:10240', // 10 MB
                'mimetypes:'
                    . 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,'
                    . 'application/pdf,'
                    . 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,'
                    . 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,'
                    . 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,'
                    . 'text/plain,text/csv,text/markdown,application/json,'
                    . 'application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar',
            ],
        ];
    }
}
