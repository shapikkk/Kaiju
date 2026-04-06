<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        if (!$workspace->hasAccess($request->user())) {
            abort(403);
        }

        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['tasks' => [], 'boards' => [], 'users' => []]);
        }

        $like = '%' . $q . '%';

        $tasks = Task::whereHas('column.board', function ($query) use ($workspace) {
            $query->where('workspace_id', $workspace->id);
        })
            ->where(function ($query) use ($like) {
                $query->where('title', 'like', $like)
                    ->orWhere('key', 'like', $like);
            })
            ->with(['column:id,board_id', 'column.board:id,slug'])
            ->select('id', 'key', 'title', 'column_id', 'priority')
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get()
            ->map(fn (Task $task) => [
                'id'             => $task->id,
                'key'            => $task->key,
                'title'          => $task->title,
                'priority'       => $task->priority,
                'board_slug'     => $task->column->board->slug,
                'workspace_slug' => $workspace->slug,
            ]);

        $boards = $workspace->boards()
            ->where('name', 'like', $like)
            ->select('id', 'name', 'slug', 'color')
            ->orderBy('position')
            ->limit(5)
            ->get();

        $users = $workspace->members()
            ->where(function ($query) use ($like) {
                $query->where('users.name', 'like', $like)
                    ->orWhere('users.email', 'like', $like);
            })
            ->select('users.id', 'users.name', 'users.email', 'users.avatar_url')
            ->limit(5)
            ->get();

        return response()->json([
            'tasks'  => $tasks->values(),
            'boards' => $boards->values(),
            'users'  => $users->values(),
        ]);
    }
}
