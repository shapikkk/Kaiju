<?php

namespace App\Enums;

enum WorkspaceRole: string
{
    case Owner = 'owner';
    case Admin = 'admin';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Admin => 'Admin',
            self::Member => 'Member',
        };
    }

    /** Returns true if this role can manage workspace settings and members. */
    public function canManage(): bool
    {
        return in_array($this, [self::Owner, self::Admin], true);
    }
}
