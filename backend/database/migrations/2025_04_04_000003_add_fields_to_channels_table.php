<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('description');
            $table->unsignedInteger('position')->default(0)->after('is_default');
        });

        // Mark existing #general channels as default
        DB::table('channels')->where('name', 'general')->update(['is_default' => true, 'position' => 0]);
    }

    public function down(): void
    {
        Schema::table('channels', function (Blueprint $table) {
            $table->dropColumn(['is_default', 'position']);
        });
    }
};
