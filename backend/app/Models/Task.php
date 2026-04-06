<?php

namespace App\Models;

use App\Enums\Priority;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'column_id',
        'sprint_id',
        'epic_id',
        'creator_id',
        'assignee_id',
        'title',
        'description',
        'priority',
        'task_number',
        'position',
        'due_date',
        'estimated_hours',
    ];

    protected function casts(): array
    {
        return [
            'priority' => Priority::class,
            'task_number' => 'integer',
            'position' => 'integer',
            'due_date' => 'date',
            'estimated_hours' => 'decimal:2',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(Column::class);
    }

    public function sprint(): BelongsTo
    {
        return $this->belongsTo(Sprint::class);
    }

    public function epic(): BelongsTo
    {
        return $this->belongsTo(Epic::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'task_tag');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->orderBy('created_at');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    public function getKeyIdentifierAttribute(): string
    {
        $boardSlug = $this->board?->slug ?? 'TASK';

        return strtoupper($boardSlug) . '-' . $this->task_number;
    }
}
