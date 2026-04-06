<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreColumnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9\-]+$/'],
            'color' => ['nullable', 'string', 'max:7'],
            'wip_limit' => ['nullable', 'integer', 'min:1'],
            'is_done_column' => ['nullable', 'boolean'],
        ];
    }
}
