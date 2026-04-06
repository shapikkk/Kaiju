<?php

namespace App\Events;

use App\Http\Controllers\Api\DirectMessageController;
use App\Models\DirectMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DirectMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public DirectMessage $message,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dm.sent';
    }

    public function broadcastWith(): array
    {
        $this->message->loadMissing(['user', 'replyTo.user']);

        return DirectMessageController::serializeMessage($this->message);
    }
}
