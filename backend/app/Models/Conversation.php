<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = ['workspace_id'];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('last_read_at', 'local_name', 'local_note')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(DirectMessage::class);
    }

    public function latestMessage(): HasMany
    {
        return $this->hasMany(DirectMessage::class)->latest()->limit(1);
    }

    /**
     * Find an existing 1-on-1 conversation between two users in a workspace,
     * or return null if none exists.
     */
    public static function findBetween(int $workspaceId, int $userAId, int $userBId): ?self
    {
        return self::where('workspace_id', $workspaceId)
            ->whereHas('participants', fn($q) => $q->where('users.id', $userAId))
            ->whereHas('participants', fn($q) => $q->where('users.id', $userBId))
            ->whereDoesntHave('participants', fn($q) => $q->whereNotIn('users.id', [$userAId, $userBId]))
            ->first();
    }
}
