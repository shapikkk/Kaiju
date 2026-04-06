<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Column extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'name',
        'slug',
        'color',
        'position',
        'is_done_column',
        'wip_limit',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_done_column' => 'boolean',
            'wip_limit' => 'integer',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position');
    }

    /** Check if the column has reached its WIP limit. */
    public function isAtWipLimit(): bool
    {
        if ($this->wip_limit === null) {
            return false;
        }

        return $this->tasks()->count() >= $this->wip_limit;
    }
}
