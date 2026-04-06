<?php

namespace App\Models;

use App\Enums\WorkspaceRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'owner_id',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function boards(): HasMany
    {
        return $this->hasMany(Board::class)->orderBy('position');
    }

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    public function epics(): HasMany
    {
        return $this->hasMany(Epic::class);
    }

    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class)->orderBy('id');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /** Check if a user has access to this workspace. */
    public function hasAccess(User $user): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }

        if ($this->relationLoaded('members')) {
            return $this->members->contains('id', $user->id);
        }

        return $this->members()->where('users.id', $user->id)->exists();
    }

    /** Check if a user has at least the given role in this workspace. */
    public function userHasRole(User $user, WorkspaceRole ...$roles): bool
    {
        if ($this->relationLoaded('members')) {
            $member = $this->members->firstWhere('id', $user->id);
            if (!$member || !isset($member->pivot->role)) {
                return false;
            }
            return in_array(WorkspaceRole::from($member->pivot->role), $roles, true);
        }

        $pivot = $this->members()->where('user_id', $user->id)->first()?->pivot;

        if (!$pivot) {
            return false;
        }

        return in_array(WorkspaceRole::from($pivot->role), $roles, true);
    }
}
