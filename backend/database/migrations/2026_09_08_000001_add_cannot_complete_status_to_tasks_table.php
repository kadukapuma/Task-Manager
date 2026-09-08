<?php

use App\Models\Task;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', Task::STATUSES)->default('Pending')->change();
            $table->text('cannot_complete_reason')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('cannot_complete_reason');
            $table->enum('status', ['Pending', 'In Progress', 'Paused', 'Done'])->default('Pending')->change();
        });
    }
};
