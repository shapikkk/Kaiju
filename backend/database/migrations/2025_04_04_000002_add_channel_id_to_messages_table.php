<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add nullable channel_id so existing rows don't break immediately
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('channel_id')->nullable()->after('workspace_id')->constrained()->cascadeOnDelete();
        });

        // 2. For every workspace that has no #general channel yet, create one
        //    then assign all its messages to it.
        $workspaceIds = DB::table('messages')
            ->whereNull('channel_id')
            ->distinct()
            ->pluck('workspace_id');

        foreach ($workspaceIds as $workspaceId) {
            // Find or create the #general channel
            $channelId = DB::table('channels')
                ->where('workspace_id', $workspaceId)
                ->where('name', 'general')
                ->value('id');

            if (!$channelId) {
                $channelId = DB::table('channels')->insertGetId([
                    'workspace_id' => $workspaceId,
                    'name'        => 'general',
                    'description' => 'General discussion for the whole team.',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            // Assign all unassigned messages for this workspace
            DB::table('messages')
                ->where('workspace_id', $workspaceId)
                ->whereNull('channel_id')
                ->update(['channel_id' => $channelId]);
        }

        // 3. Now that all rows are filled, make channel_id NOT NULL
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('channel_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['channel_id']);
            $table->dropColumn('channel_id');
        });
    }
};
