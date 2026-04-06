<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Board extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'name',
        'slug',
        'description',
        'color',
        'prefix',
        'position',
        'task_counter',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'task_counter' => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function columns(): HasMany
    {
        return $this->hasMany(Column::class)->orderBy('position');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** Atomically increment the task counter and return the new number. */
    public function nextTaskNumber(): int
    {
        $this->increment('task_counter');
        $this->refresh();

        return $this->task_counter;
    }
}
