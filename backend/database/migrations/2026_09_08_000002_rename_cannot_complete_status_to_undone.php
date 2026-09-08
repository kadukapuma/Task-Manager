<?php

use App\Models\Task;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Widen the enum so both the old and new value are valid while we
        // migrate existing rows, then narrow it down to the final set.
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'In Progress', 'Paused', 'Done', 'Cannot Complete', 'Undone'])
                ->default('Pending')
                ->change();
        });

        DB::table('tasks')->where('status', 'Cannot Complete')->update(['status' => 'Undone']);

        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', Task::STATUSES)->default('Pending')->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'In Progress', 'Paused', 'Done', 'Cannot Complete', 'Undone'])
                ->default('Pending')
                ->change();
        });

        DB::table('tasks')->where('status', 'Undone')->update(['status' => 'Cannot Complete']);

        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['Pending', 'In Progress', 'Paused', 'Done', 'Cannot Complete'])
                ->default('Pending')
                ->change();
        });
    }
};
