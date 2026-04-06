<?php

use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlockController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\DirectMessageController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\EpicController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SprintController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WorkspaceChatController;
use App\Http\Controllers\Api\WorkspaceController;
use App\Http\Controllers\Api\WorkspaceInviteController;
use App\Http\Controllers\Api\WorkspaceMemberController;
use Illuminate\Support\Facades\Route;

/* |-------------------------------------------------------------------------- | Auth (public) |-------------------------------------------------------------------------- */
Route::post('/auth/register', [AuthController::class , 'register']);
Route::post('/auth/login', [AuthController::class , 'login']);

/* |-------------------------------------------------------------------------- | Public: Workspace invite links (validated by signed URL; handles guests) |-------------------------------------------------------------------------- */
Route::get('/workspaces/{workspace:slug}/join', [WorkspaceInviteController::class, 'joinWithLink'])
    ->name('workspaces.join');

/* |-------------------------------------------------------------------------- | Protected routes (Sanctum) — any authenticated user |-------------------------------------------------------------------------- */
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class , 'logout']);
    Route::get('/auth/me', [AuthController::class , 'me']);

    // Email Verification (must be accessible before verified)
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class , 'verify'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class , 'resend']);

    // Profile (accessible before verified so users can fix their email)
    Route::patch('/profile', [ProfileController::class , 'update']);
    Route::patch('/profile/password', [ProfileController::class , 'updatePassword']);
    Route::patch('/profile/notifications', [ProfileController::class , 'updateNotificationPreferences']);
    Route::post('/profile/avatar', [ProfileController::class , 'updateAvatar']);
    Route::patch('/user/profile', [ProfileController::class , 'updateProfile']);
    Route::post('/user/banner', [ProfileController::class , 'uploadBanner']);


    // Invitation acceptance (accessible before verified)
    Route::post('/invites/{token}/accept', [WorkspaceInviteController::class , 'accept']);
    Route::post('/invites/link/{token}/accept', [WorkspaceInviteController::class , 'acceptLink']);

    /*
     |--------------------------------------------------------------------------
     | Verified-only routes — core application features
     |--------------------------------------------------------------------------
     */
    Route::middleware('verified')->group(function () {

            // Public user profile
            Route::get('/users/{id}', [ProfileController::class , 'show']);

            // Workspaces
            Route::apiResource('workspaces', WorkspaceController::class)
                ->only(['index', 'store', 'show', 'update', 'destroy'])
                ->parameters(['workspaces' => 'workspace:slug']);

            // Invitations (sending)
            Route::post('/workspaces/{workspace:slug}/invites', [WorkspaceInviteController::class , 'store']);
            Route::post('/workspaces/{workspace:slug}/invite-links', [WorkspaceInviteController::class , 'generateLink']);

            // Search
            Route::get('/workspaces/{workspace:slug}/search', [SearchController::class, 'index']);

            // Members
            Route::get('/workspaces/{workspace:slug}/members', [WorkspaceMemberController::class , 'index']);
            Route::patch('/workspaces/{workspace:slug}/members/{userId}', [WorkspaceMemberController::class , 'update']);
            Route::delete('/workspaces/{workspace:slug}/members/{userId}', [WorkspaceMemberController::class , 'destroy']);

            // Channels (CRUD)
            Route::get('/workspaces/{workspace:slug}/channels', [ChannelController::class, 'index']);
            Route::post('/workspaces/{workspace:slug}/channels', [ChannelController::class, 'store']);
            Route::patch('/workspaces/{workspace:slug}/channels/{channel}', [ChannelController::class, 'update']);
            Route::delete('/workspaces/{workspace:slug}/channels/{channel}', [ChannelController::class, 'destroy']);

            // Channel messages (primary channel-based routes)
            Route::get('/channels/{channel}/messages', [WorkspaceChatController::class , 'index']);
            Route::post('/channels/{channel}/messages', [WorkspaceChatController::class , 'store']);
            Route::patch('/channels/{channel}/messages/{message}', [WorkspaceChatController::class , 'update']);
            Route::delete('/channels/{channel}/messages/{message}', [WorkspaceChatController::class , 'destroy']);

            // Workspace message routes (backward-compat — delegate to #general channel)
            Route::get('/workspaces/{workspace:slug}/messages', [WorkspaceChatController::class , 'indexForWorkspace']);
            Route::post('/workspaces/{workspace:slug}/messages', [WorkspaceChatController::class , 'storeForWorkspace']);
            Route::patch('/workspaces/{workspace:slug}/messages/{message}', [WorkspaceChatController::class , 'updateForWorkspace']);
            Route::delete('/workspaces/{workspace:slug}/messages/{message}', [WorkspaceChatController::class , 'destroyForWorkspace']);

            // Direct Messages
            Route::get('/workspaces/{workspace:slug}/conversations', [DirectMessageController::class, 'conversations']);
            Route::post('/workspaces/{workspace:slug}/conversations', [DirectMessageController::class, 'findOrCreate']);
            Route::get('/conversations/{conversation}/messages', [DirectMessageController::class, 'messages']);
            Route::post('/conversations/{conversation}/messages', [DirectMessageController::class, 'store']);
            Route::patch('/conversations/{conversation}/read', [DirectMessageController::class, 'markRead']);
            Route::get('/conversations/{conversation}/attachments', [DirectMessageController::class, 'attachments']);
            Route::delete('/conversations/{conversation}', [DirectMessageController::class, 'destroy']);
            Route::patch('/conversations/{conversation}/contact-name', [DirectMessageController::class, 'updateContactName']);

            // Block / Unblock users
            Route::post('/users/{userId}/block', [BlockController::class, 'store']);
            Route::delete('/users/{userId}/block', [BlockController::class, 'destroy']);
            Route::get('/users/{userId}/block', [BlockController::class, 'check']);

            // Boards (nested under workspace)
            Route::scopeBindings()->group(function () {
                    Route::apiResource('workspaces.boards', BoardController::class)
                        ->only(['index', 'store', 'show', 'destroy'])
                        ->parameters([
                        'workspaces' => 'workspace:slug',
                        'boards' => 'board:slug',
                    ]);
                }
                );

                // Board update (flat route for convenience)
                Route::patch('/boards/{board}', [BoardController::class , 'update']);

                // Columns (board resolved by ID for flat routes)
                Route::get('/boards/{board:id}/columns', [ColumnController::class , 'index']);
                Route::post('/boards/{board:id}/columns', [ColumnController::class , 'store']);
                Route::patch('/boards/{board:id}/columns/reorder', [ColumnController::class , 'reorder']);
                Route::patch('/columns/{column}', [ColumnController::class , 'update']);

                // Tasks (board resolved by ID for flat routes)
                Route::get('/boards/{board:id}/tasks', [TaskController::class , 'index']);
                Route::post('/boards/{board:id}/tasks', [TaskController::class , 'store']);
                Route::get('/tasks/{task}', [TaskController::class , 'show']);
                Route::patch('/tasks/{task}', [TaskController::class , 'update']);
                Route::patch('/tasks/{task}/move', [TaskController::class , 'move']);
                Route::delete('/tasks/{task}', [TaskController::class , 'destroy']);

                // Comments (nested under task)
                Route::get('/tasks/{task}/comments', [CommentController::class , 'index']);
                Route::post('/tasks/{task}/comments', [CommentController::class , 'store']);
                Route::patch('/comments/{comment}', [CommentController::class , 'update']);
                Route::delete('/comments/{comment}', [CommentController::class , 'destroy']);

                // Attachments (nested under task)
                Route::get('/tasks/{task}/attachments', [AttachmentController::class , 'index']);
                Route::post('/tasks/{task}/attachments', [AttachmentController::class , 'store']);
                Route::delete('/attachments/{attachment}', [AttachmentController::class , 'destroy']);

                // Sprints (board resolved by ID)
                Route::get('/boards/{board:id}/sprints', [SprintController::class , 'index']);
                Route::post('/boards/{board:id}/sprints', [SprintController::class , 'store']);
                Route::patch('/sprints/{sprint}', [SprintController::class , 'update']);

                // Epics (nested under workspace)
                Route::get('/workspaces/{workspace:slug}/epics', [EpicController::class , 'index']);
                Route::post('/workspaces/{workspace:slug}/epics', [EpicController::class , 'store']);
                Route::patch('/epics/{epic}', [EpicController::class , 'update']);
                Route::delete('/epics/{epic}', [EpicController::class , 'destroy']);

                // Tags (nested under workspace)
                Route::get('/workspaces/{workspace:slug}/tags', [TagController::class , 'index']);
                Route::post('/workspaces/{workspace:slug}/tags', [TagController::class , 'store']);
                Route::patch('/tags/{tag}', [TagController::class , 'update']);
                Route::delete('/tags/{tag}', [TagController::class , 'destroy']);
            }
            );        });
