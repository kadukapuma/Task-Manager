<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('start_time');
            $table->dateTime('finish_time')->nullable();
            $table->integer('duration_secs')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_logs');
    }
};
