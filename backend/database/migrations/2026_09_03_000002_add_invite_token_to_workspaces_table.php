<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gives a workspace its own shareable invite token.
 *
 * The previous invite link accepted the workspace *slug* as its token and
 * validated nothing, so any authenticated user could join any workspace just
 * by guessing a slug. A real, rotatable, expiring token closes that.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('invite_token', 64)->nullable()->unique()->after('owner_id');
            $table->timestamp('invite_token_expires_at')->nullable()->after('invite_token');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropUnique(['invite_token']);
            $table->dropColumn(['invite_token', 'invite_token_expires_at']);
        });
    }
};
