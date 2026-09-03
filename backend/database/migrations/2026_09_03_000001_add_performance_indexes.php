<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Covering indexes for the API's hot read paths.
 *
 * SQLite — unlike MySQL — does not index a FOREIGN KEY column automatically, so
 * every foreignId()->constrained() column here is unindexed unless it leads a
 * UNIQUE/PRIMARY key. That makes each eager load (a `WHERE fk IN (...)`) a full
 * table scan.
 */
return new class extends Migration {
    /**
     * @var array<string, array<int, array{0: array<int, string>, 1: string}>>
     *      table => [[columns, index name], ...]
     */
    private array $indexes = [
        'tasks' => [
            [['board_id', 'position'], 'tasks_board_id_position_index'],
            [['assignee_id'], 'tasks_assignee_id_index'],
            [['creator_id'], 'tasks_creator_id_index'],
            [['sprint_id'], 'tasks_sprint_id_index'],
            [['epic_id'], 'tasks_epic_id_index'],
            [['updated_at'], 'tasks_updated_at_index'],
        ],
        'task_tag' => [
            // task_id already leads the primary key; this covers the reverse.
            [['tag_id'], 'task_tag_tag_id_index'],
        ],
        'attachments' => [
            [['task_id'], 'attachments_task_id_index'],
            [['user_id'], 'attachments_user_id_index'],
        ],
        'comments' => [
            [['user_id'], 'comments_user_id_index'],
        ],
        'columns' => [
            // unique(board_id, slug) covers the lookup but not the sort.
            [['board_id', 'position'], 'columns_board_id_position_index'],
        ],
        'boards' => [
            [['workspace_id', 'position'], 'boards_workspace_id_position_index'],
        ],
        'sprints' => [
            [['board_id', 'created_at'], 'sprints_board_id_created_at_index'],
        ],
        'epics' => [
            [['workspace_id'], 'epics_workspace_id_index'],
        ],
        'workspace_user' => [
            // The primary key leads with workspace_id, so user_id lookups
            // (membership checks, "my workspaces") cannot use it.
            [['user_id'], 'workspace_user_user_id_index'],
        ],
        'messages' => [
            // The pre-existing index is (workspace_id, created_at), which the
            // actual query — filtered by channel_id — cannot use.
            [['channel_id', 'created_at'], 'messages_channel_id_created_at_index'],
            [['user_id'], 'messages_user_id_index'],
            [['reply_to_id'], 'messages_reply_to_id_index'],
        ],
        'direct_messages' => [
            [['conversation_id', 'user_id'], 'direct_messages_conversation_id_user_id_index'],
            [['conversation_id', 'attachment_type'], 'direct_messages_conversation_id_attachment_type_index'],
            [['reply_to_id'], 'direct_messages_reply_to_id_index'],
        ],
        'conversations' => [
            [['workspace_id', 'updated_at'], 'conversations_workspace_id_updated_at_index'],
        ],
        'blocked_users' => [
            // unique(user_id, blocked_user_id) covers the forward direction only.
            [['blocked_user_id'], 'blocked_users_blocked_user_id_index'],
        ],
        'workspace_invitations' => [
            [['workspace_id'], 'workspace_invitations_workspace_id_index'],
        ],
    ];

    public function up(): void
    {
        foreach ($this->indexes as $table => $definitions) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($definitions as [$columns, $name]) {
                foreach ($columns as $column) {
                    if (!Schema::hasColumn($table, $column)) {
                        continue 2;
                    }
                }

                if ($this->indexExists($table, $name)) {
                    continue;
                }

                Schema::table($table, function (Blueprint $blueprint) use ($columns, $name) {
                    $blueprint->index($columns, $name);
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->indexes as $table => $definitions) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($definitions as [, $name]) {
                if (!$this->indexExists($table, $name)) {
                    continue;
                }

                Schema::table($table, function (Blueprint $blueprint) use ($name) {
                    $blueprint->dropIndex($name);
                });
            }
        }
    }

    private function indexExists(string $table, string $name): bool
    {
        return collect(Schema::getIndexes($table))
            ->contains(fn (array $index) => $index['name'] === $name);
    }
};
