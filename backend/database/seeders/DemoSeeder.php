<?php

namespace Database\Seeders;

use App\Enums\Priority;
use App\Enums\WorkspaceRole;
use App\Models\Board;
use App\Models\Column;
use App\Models\Comment;
use App\Models\Epic;
use App\Models\Sprint;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── Users ────────────────────────────────────────────────
        $alice = User::create([
            'name' => 'Alice Johnson',
            'email' => 'alice@kaiju.dev',
            'password' => 'password',
        ]);

        $bob = User::create([
            'name' => 'Bob Smith',
            'email' => 'bob@kaiju.dev',
            'password' => 'password',
        ]);

        $carol = User::create([
            'name' => 'Carol Williams',
            'email' => 'carol@kaiju.dev',
            'password' => 'password',
        ]);

        // ── Workspace ────────────────────────────────────────────
        $workspace = Workspace::create([
            'name' => 'Kaiju Labs',
            'slug' => 'kaiju-labs',
            'description' => 'The main workspace for Kaiju product development.',
            'owner_id' => $alice->id,
        ]);

        $workspace->members()->attach([
            $alice->id => ['role' => WorkspaceRole::Owner->value],
            $bob->id => ['role' => WorkspaceRole::Admin->value],
            $carol->id => ['role' => WorkspaceRole::Member->value],
        ]);

        // ── Tags ─────────────────────────────────────────────────
        $bugTag = Tag::create(['workspace_id' => $workspace->id, 'name' => 'Bug', 'color' => '#ef4444']);
        $featureTag = Tag::create(['workspace_id' => $workspace->id, 'name' => 'Feature', 'color' => '#3b82f6']);
        $uiTag = Tag::create(['workspace_id' => $workspace->id, 'name' => 'UI', 'color' => '#8b5cf6']);
        $apiTag = Tag::create(['workspace_id' => $workspace->id, 'name' => 'API', 'color' => '#22c55e']);
        $perfTag = Tag::create(['workspace_id' => $workspace->id, 'name' => 'Performance', 'color' => '#f59e0b']);

        // ── Epics ────────────────────────────────────────────────
        $authEpic = Epic::create([
            'workspace_id' => $workspace->id,
            'name' => 'Authentication & Authorization',
            'summary' => 'Implement user login, registration, and role-based access control.',
            'color' => '#6366f1',
        ]);

        $kanbanEpic = Epic::create([
            'workspace_id' => $workspace->id,
            'name' => 'Kanban Board',
            'summary' => 'Build the main Kanban board with drag-and-drop and column management.',
            'color' => '#06b6d4',
        ]);

        // ── Board ────────────────────────────────────────────────
        $board = Board::create([
            'workspace_id' => $workspace->id,
            'name' => 'Product Board',
            'slug' => 'product-board',
            'description' => 'Main product development board.',
            'color' => '#6366f1',
            'position' => 0,
        ]);

        // Columns
        $backlog = Column::create(['board_id' => $board->id, 'name' => 'Backlog', 'slug' => 'backlog', 'position' => 0, 'color' => '#6b7280']);
        $todo = Column::create(['board_id' => $board->id, 'name' => 'To Do', 'slug' => 'to-do', 'position' => 1, 'color' => '#3b82f6']);
        $inProgress = Column::create(['board_id' => $board->id, 'name' => 'In Progress', 'slug' => 'in-progress', 'position' => 2, 'color' => '#f59e0b', 'wip_limit' => 5]);
        $review = Column::create(['board_id' => $board->id, 'name' => 'Review', 'slug' => 'review', 'position' => 3, 'color' => '#8b5cf6', 'wip_limit' => 3]);
        $done = Column::create(['board_id' => $board->id, 'name' => 'Done', 'slug' => 'done', 'position' => 4, 'color' => '#22c55e', 'is_done_column' => true]);

        // ── Sprint ───────────────────────────────────────────────
        $sprint = Sprint::create([
            'board_id' => $board->id,
            'name' => 'Sprint 1',
            'goal' => 'Set up core authentication and initial board UI.',
            'status' => 'active',
            'started_at' => now()->subDays(7),
        ]);

        // ── Tasks ────────────────────────────────────────────────
        $taskCounter = 0;

        $t1 = Task::create([
            'board_id' => $board->id,
            'column_id' => $done->id,
            'creator_id' => $alice->id,
            'assignee_id' => $alice->id,
            'sprint_id' => $sprint->id,
            'epic_id' => $authEpic->id,
            'title' => 'Set up Laravel Sanctum',
            'description' => 'Install and configure Sanctum for token-based API authentication.',
            'priority' => Priority::High,
            'task_number' => ++$taskCounter,
            'position' => 0,
        ]);
        $t1->tags()->attach([$apiTag->id, $featureTag->id]);

        $t2 = Task::create([
            'board_id' => $board->id,
            'column_id' => $done->id,
            'creator_id' => $alice->id,
            'assignee_id' => $bob->id,
            'sprint_id' => $sprint->id,
            'epic_id' => $authEpic->id,
            'title' => 'Create User registration endpoint',
            'description' => 'POST /api/auth/register with name, email, password validation.',
            'priority' => Priority::High,
            'task_number' => ++$taskCounter,
            'position' => 1,
        ]);
        $t2->tags()->attach([$apiTag->id]);

        $t3 = Task::create([
            'board_id' => $board->id,
            'column_id' => $inProgress->id,
            'creator_id' => $alice->id,
            'assignee_id' => $carol->id,
            'sprint_id' => $sprint->id,
            'epic_id' => $kanbanEpic->id,
            'title' => 'Build Kanban column component',
            'description' => 'Create a reusable KanbanColumn component with shadcn Card, tasks list, and WIP indicator.',
            'priority' => Priority::Highest,
            'task_number' => ++$taskCounter,
            'position' => 0,
        ]);
        $t3->tags()->attach([$uiTag->id, $featureTag->id]);

        $t4 = Task::create([
            'board_id' => $board->id,
            'column_id' => $inProgress->id,
            'creator_id' => $bob->id,
            'assignee_id' => $bob->id,
            'sprint_id' => $sprint->id,
            'epic_id' => $kanbanEpic->id,
            'title' => 'Implement drag-and-drop with dnd-kit',
            'description' => 'Add @dnd-kit/core and @dnd-kit/sortable for task card drag-and-drop between columns.',
            'priority' => Priority::High,
            'task_number' => ++$taskCounter,
            'position' => 1,
            'estimated_hours' => 8,
        ]);
        $t4->tags()->attach([$uiTag->id]);

        $t5 = Task::create([
            'board_id' => $board->id,
            'column_id' => $review->id,
            'creator_id' => $carol->id,
            'assignee_id' => $alice->id,
            'sprint_id' => $sprint->id,
            'title' => 'Design task card layout',
            'description' => 'Create TaskCard component showing priority icon, title, assignee avatar, tag badges, and comment count.',
            'priority' => Priority::Medium,
            'task_number' => ++$taskCounter,
            'position' => 0,
            'due_date' => now()->addDays(3),
        ]);
        $t5->tags()->attach([$uiTag->id]);

        $t6 = Task::create([
            'board_id' => $board->id,
            'column_id' => $todo->id,
            'creator_id' => $alice->id,
            'sprint_id' => $sprint->id,
            'title' => 'Add task detail dialog',
            'description' => 'Modal/dialog for viewing and editing full task details: description, comments, attachments.',
            'priority' => Priority::Medium,
            'task_number' => ++$taskCounter,
            'position' => 0,
            'estimated_hours' => 6,
        ]);
        $t6->tags()->attach([$uiTag->id, $featureTag->id]);

        $t7 = Task::create([
            'board_id' => $board->id,
            'column_id' => $backlog->id,
            'creator_id' => $bob->id,
            'title' => 'Optimize board loading performance',
            'description' => 'Profile and optimize the GET /boards/{slug} endpoint to reduce query count and response time.',
            'priority' => Priority::Low,
            'task_number' => ++$taskCounter,
            'position' => 0,
        ]);
        $t7->tags()->attach([$perfTag->id, $apiTag->id]);

        $t8 = Task::create([
            'board_id' => $board->id,
            'column_id' => $backlog->id,
            'creator_id' => $carol->id,
            'title' => 'Fix column overflow on mobile',
            'description' => 'Columns are cut off on screens smaller than 768px. Add horizontal scroll.',
            'priority' => Priority::Lowest,
            'task_number' => ++$taskCounter,
            'position' => 1,
        ]);
        $t8->tags()->attach([$bugTag->id, $uiTag->id]);

        // Update board task_counter
        $board->update(['task_counter' => $taskCounter]);

        // ── Comments ──────────────────────────────────────────────
        Comment::create(['task_id' => $t3->id, 'user_id' => $alice->id, 'body' => 'Let\'s use shadcn Card as the base primitive for this.']);
        Comment::create(['task_id' => $t3->id, 'user_id' => $carol->id, 'body' => 'Sounds good! I\'ll start with a static mockup first.']);
        Comment::create(['task_id' => $t4->id, 'user_id' => $bob->id, 'body' => 'I\'ve tested dnd-kit and it works well with React 19.']);
        Comment::create(['task_id' => $t5->id, 'user_id' => $alice->id, 'body' => 'The priority icons look great — approved!']);
    }
}
