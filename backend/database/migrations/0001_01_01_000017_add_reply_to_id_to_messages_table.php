<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('reply_to_id')
                ->nullable()
                ->after('body')
                ->constrained('messages')
                ->nullOnDelete(); // If the original is deleted, clear the reference
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Message::class, 'reply_to_id');
            $table->dropColumn('reply_to_id');
        });
    }
};
