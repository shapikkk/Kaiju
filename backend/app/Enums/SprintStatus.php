<?php

namespace App\Enums;

enum SprintStatus: string
{
    case Planning = 'planning';
    case Active = 'active';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Planning => 'Planning',
            self::Active => 'Active',
            self::Completed => 'Completed',
        };
    }
}
