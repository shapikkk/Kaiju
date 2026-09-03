<?php

namespace App\Models;

use App\Enums\WorkspaceRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'owner_id',
        'invite_token',
        'invite_token_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'invite_token_expires_at' => 'datetime',
        ];
    }

    /** True when the shareable invite link is present and still valid. */
    public function hasUsableInviteToken(): bool
    {
        return $this->invite_token !== null
            && $this->invite_token_expires_at !== null
            && $this->invite_token_expires_at->isFuture();
    }

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

    /**
     * Per-request membership cache, keyed by "workspaceId:userId".
     *
     * @var array<string, string|false> the pivot role, or false when not a member
     */
    protected static array $membershipCache = [];

    /**
     * Resolve (and memoise) the pivot role of $user in this workspace.
     * Returns false for a non-member — distinct from a member with no role set.
     */
    protected function membershipRole(User $user): string|false
    {
        $cacheKey = $this->id . ':' . $user->id;

        if (array_key_exists($cacheKey, static::$membershipCache)) {
            return static::$membershipCache[$cacheKey];
        }

        if ($this->relationLoaded('members')) {
            $member = $this->members->firstWhere('id', $user->id);
            $role = $member === null
                ? false
                : ($member->pivot?->role ?? WorkspaceRole::Member->value);
        } else {
            $row = DB::table('workspace_user')
                ->where('workspace_id', $this->id)
                ->where('user_id', $user->id)
                ->first(['role']);

            $role = $row === null
                ? false
                : ($row->role ?? WorkspaceRole::Member->value);
        }

        return static::$membershipCache[$cacheKey] = $role;
    }

    /** Call after any attach/detach/role change to drop the stale entry. */
    public static function forgetMembership(int $workspaceId, int $userId): void
    {
        unset(static::$membershipCache[$workspaceId . ':' . $userId]);
    }

    /** Check if a user has access to this workspace. */
    public function hasAccess(User $user): bool
    {
        if ($this->owner_id === $user->id) {
            return true;
        }

        return $this->membershipRole($user) !== false;
    }

    /** Check if a user has at least the given role in this workspace. */
    public function userHasRole(User $user, WorkspaceRole ...$roles): bool
    {
        // The owner is implicitly the Owner role even without a pivot row.
        if ($this->owner_id === $user->id
            && in_array(WorkspaceRole::Owner, $roles, true)) {
            return true;
        }

        $role = $this->membershipRole($user);

        if ($role === false) {
            return false;
        }

        return in_array(WorkspaceRole::from($role), $roles, true);
    }
}
