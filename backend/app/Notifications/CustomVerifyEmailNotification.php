<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class CustomVerifyEmailNotification extends VerifyEmail
{
    /**
     * Build the mail message.
     *
     * Instead of generating a backend-signed URL, we build a frontend URL
     * that passes the verification parameters as query strings. The React
     * app will then POST to our API verification endpoint.
     */
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your Email — ' . config('app.name'))
            ->greeting('Welcome to ' . config('app.name') . '!')
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email Address', $frontendUrl)
            ->line('If you did not create an account, no further action is required.');
    }

    /**
     * Build SPA-routed verification URL.
     *
     * Generates: {FRONTEND_URL}/verify-email?id={id}&hash={hash}&expires={ts}&signature={sig}
     */
    protected function verificationUrl($notifiable): string
    {
        $backendUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );

        $parsed = parse_url($backendUrl);
        parse_str($parsed['query'] ?? '', $queryParams);

        $frontendUrl = Config::get('app.frontend_url', 'http://localhost:5173');

        return $frontendUrl . '/verify-email?' . http_build_query([
            'id'        => $notifiable->getKey(),
            'hash'      => sha1($notifiable->getEmailForVerification()),
            'expires'   => $queryParams['expires'] ?? '',
            'signature' => $queryParams['signature'] ?? '',
        ]);
    }
}
