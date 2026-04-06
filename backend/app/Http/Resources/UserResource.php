<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = [
            'id'                         => $this->id,
            'name'                       => $this->name,
            'email'                      => $this->email,
            'avatar_url'                 => $this->avatar_url ? url($this->avatar_url) : null,
            'banner_url'                 => $this->banner_url ? url($this->banner_url) : null,
            'bio'                        => $this->bio,
            'job_title'                  => $this->job_title,
            'department'                 => $this->department,
            'location'                   => $this->location,
            'skills'                     => $this->skills ?? [],
            'experience'                 => $this->experience ?? [],
            'notification_preferences'   => $this->notification_preferences,
            'email_verified_at'          => $this->email_verified_at?->toISOString(),
            'created_at'                 => $this->created_at?->toISOString(),
        ];


        if ($this->pivot && isset($this->pivot->role)) {
            $data['role'] = $this->pivot->role;
        }

        return $data;
    }
}
