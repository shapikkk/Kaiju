<?php

namespace App\Enums;

enum Priority: string
{
    case Lowest = 'lowest';
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Highest = 'highest';

    public function label(): string
    {
        return match ($this) {
            self::Lowest => 'Lowest',
            self::Low => 'Low',
            self::Medium => 'Medium',
            self::High => 'High',
            self::Highest => 'Highest',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Lowest => '⬇️',
            self::Low => '↓',
            self::Medium => '→',
            self::High => '↑',
            self::Highest => '⬆️',
        };
    }
}
