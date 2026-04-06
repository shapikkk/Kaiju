<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Fetch the public profile of any user by ID.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Update the authenticated user's name and/or email.
     *
     * If the email changes, reset verification and send a new notification.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
        ]);

        $emailChanged = isset($validated['email']) && $validated['email'] !== $user->email;

        $user->update($validated);

        if ($emailChanged) {
            $user->email_verified_at = null;
            $user->save();
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => $emailChanged
                ? 'Profile updated. Please verify your new email address.'
                : 'Profile updated successfully.',
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Update the authenticated user's profile text/JSON fields
     * (bio, job_title, department, location, skills, experience).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'bio'                     => ['sometimes', 'nullable', 'string', 'max:2000'],
            'job_title'               => ['sometimes', 'nullable', 'string', 'max:255'],
            'department'              => ['sometimes', 'nullable', 'string', 'max:255'],
            'location'                => ['sometimes', 'nullable', 'string', 'max:255'],
            'skills'                  => ['sometimes', 'nullable', 'array'],
            'skills.*'                => ['string', 'max:100'],
            'experience'              => ['sometimes', 'nullable', 'array'],
            'experience.*.company'    => ['required_with:experience', 'string', 'max:255'],
            'experience.*.title'      => ['required_with:experience', 'string', 'max:255'],
            'experience.*.start_date' => ['required_with:experience', 'string', 'max:50'],
            'experience.*.end_date'   => ['nullable', 'string', 'max:50'],
            'experience.*.current'    => ['boolean'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user'    => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Upload a new avatar image.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->avatar_url) {
            $oldPath = str_replace('/storage/', '', $user->avatar_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update([
            'avatar_url' => '/storage/' . $path,
        ]);

        return response()->json([
            'message' => 'Avatar updated successfully.',
            'user'    => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Upload a new banner image.
     */
    public function uploadBanner(Request $request): JsonResponse
    {
        $request->validate([
            'banner' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ]);

        $user = $request->user();

        if ($user->banner_url) {
            $oldPath = str_replace('/storage/', '', $user->banner_url);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('banner')->store('banners', 'public');

        $user->update([
            'banner_url' => '/storage/' . $path,
        ]);

        return response()->json([
            'message' => 'Banner updated successfully.',
            'user'    => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Update the user's notification preferences.
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'email'    => ['sometimes', 'boolean'],
            'push'     => ['sometimes', 'boolean'],
            'assigned' => ['sometimes', 'boolean'],
            'comments' => ['sometimes', 'boolean'],
            'due_date' => ['sometimes', 'boolean'],
        ]);

        $existing = $user->notification_preferences ?? [];
        $user->update([
            'notification_preferences' => array_merge($existing, $validated),
        ]);

        return response()->json([
            'message' => 'Notification preferences updated.',
            'user'    => new UserResource($user->fresh()),
        ]);
    }
}
