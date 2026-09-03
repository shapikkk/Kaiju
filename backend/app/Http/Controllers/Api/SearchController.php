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

        // Reused below to scope the task query and to build each display key.
        $boardSlugs = $workspace->boards()->pluck('slug', 'id');

        $tasks = collect();

        if ($boardSlugs->isNotEmpty()) {
            $taskQuery = Task::query()
                ->whereIn('board_id', $boardSlugs->keys())
                ->select('id', 'title', 'priority', 'board_id', 'task_number')
                ->orderByDesc('updated_at')
                ->limit(8);

            // A task key ("PREFIX-12") is derived, not a column, so it cannot be
            // matched with LIKE; match the trailing number against task_number.
            $taskNumber = $this->parseTaskNumber($q);

            $taskQuery->where(function ($query) use ($like, $taskNumber) {
                $query->where('title', 'like', $like);

                if ($taskNumber !== null) {
                    $query->orWhere('task_number', $taskNumber);
                }
            });

            $tasks = $taskQuery->get()->map(fn (Task $task) => [
                'id'             => $task->id,
                'key'            => strtoupper($boardSlugs[$task->board_id] ?? 'TASK')
                                    . '-' . $task->task_number,
                'title'          => $task->title,
                'priority'       => $task->priority?->value,
                'board_slug'     => $boardSlugs[$task->board_id] ?? null,
                'workspace_slug' => $workspace->slug,
            ]);
        }

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

    /**
     * Extract a task number from a query like "KAI-42", "kai 42" or "42".
     */
    private function parseTaskNumber(string $q): ?int
    {
        if (preg_match('/(\d+)\s*$/', $q, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }
}
