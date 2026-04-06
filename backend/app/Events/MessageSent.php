<?php

namespace App\Events;

use App\Http\Controllers\Api\WorkspaceChatController;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('channel.' . $this->message->channel_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    /**
     * Reuse the controller's serializer so the broadcast payload
     * is always identical to the REST API response shape.
     */
    public function broadcastWith(): array
    {
        $this->message->loadMissing(['user', 'replyTo.user']);

        return WorkspaceChatController::serializeMessage($this->message);
    }
}
