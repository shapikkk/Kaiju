<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'board_id' => $this->board_id,
            'column_id' => $this->column_id,
            'sprint_id' => $this->sprint_id,
            'epic_id' => $this->epic_id,
            'key' => $this->key_identifier,
            'title' => $this->title,
            'description' => $this->description,
            'priority' => $this->priority?->value,
            'priority_label' => $this->priority?->label(),
            'priority_icon' => $this->priority?->icon(),
            'task_number' => $this->task_number,
            'position' => $this->position,
            'due_date' => $this->due_date?->toDateString(),
            'estimated_hours' => $this->estimated_hours,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'column' => new ColumnResource($this->whenLoaded('column')),
            'sprint' => new SprintResource($this->whenLoaded('sprint')),
            'epic' => new EpicResource($this->whenLoaded('epic')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'attachments' => AttachmentResource::collection($this->whenLoaded('attachments')),
            'comments_count' => $this->whenCounted('comments'),
            'attachments_count' => $this->whenCounted('attachments'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
