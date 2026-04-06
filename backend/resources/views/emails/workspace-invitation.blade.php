<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 16px;">

                {{-- Card --}}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden;">

                    {{-- Header --}}
                    <tr>
                        <td style="padding: 32px 32px 0; text-align: center;">
                            <div style="display: inline-block; background-color: #6366f1; color: #ffffff; font-size: 14px; font-weight: 700; width: 40px; height: 40px; line-height: 40px; border-radius: 8px; text-align: center;">
                                K
                            </div>
                            <h1 style="margin: 16px 0 0; font-size: 22px; font-weight: 700; color: #18181b;">
                                You're invited!
                            </h1>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding: 24px 32px;">
                            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #3f3f46;">
                                You've been invited to join the workspace
                                <strong style="color: #18181b;">{{ $invitation->workspace->name }}</strong>
                                as a <strong style="color: #6366f1;">{{ ucfirst($invitation->role) }}</strong>.
                            </p>

                            <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: #71717a;">
                                This invitation expires on {{ $invitation->expires_at->format('F j, Y \a\t g:i A') }}.
                            </p>

                            {{-- CTA Button --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ config('app.frontend_url') }}/invites/{{ $invitation->token }}"
                                           style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 32px; border-radius: 8px; letter-spacing: 0.01em;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding: 20px 32px; border-top: 1px solid #f4f4f5;">
                            <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #a1a1aa; text-align: center;">
                                If you didn't expect this invitation, you can safely ignore this email.
                                <br>
                                &copy; {{ date('Y') }} Kaiju. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>
