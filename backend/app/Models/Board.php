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
        // Read under lock: a plain increment-then-read can hand two concurrent
        // creates the same number.
        $next = (int) static::whereKey($this->getKey())
            ->lockForUpdate()
            ->value('task_counter') + 1;

        static::whereKey($this->getKey())->update(['task_counter' => $next]);

        $this->task_counter = $next;
        $this->syncOriginalAttribute('task_counter');

        return $next;
    }
}
