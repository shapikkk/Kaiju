<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('color')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_done_column')->default(false);
            $table->unsignedInteger('wip_limit')->nullable();
            $table->timestamps();

            $table->unique(['board_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('columns');
    }
};
