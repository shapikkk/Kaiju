<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('banner_url')->nullable()->after('avatar_url');
            $table->text('bio')->nullable()->after('banner_url');
            $table->string('job_title')->nullable()->after('bio');
            $table->string('department')->nullable()->after('job_title');
            $table->string('location')->nullable()->after('department');
            $table->json('skills')->nullable()->after('location');
            $table->json('experience')->nullable()->after('skills');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'banner_url',
                'bio',
                'job_title',
                'department',
                'location',
                'skills',
                'experience',
            ]);
        });
    }
};
