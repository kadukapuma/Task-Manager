<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('assigned_staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('priority', ['Normal', 'Urgent', 'Fire'])->default('Normal');
            $table->enum('status', ['Pending', 'In Progress', 'Paused', 'Done'])->default('Pending');
            $table->boolean('is_repeating')->default(false);
            $table->enum('repeat_frequency', ['Daily', 'Weekly', 'Monthly'])->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
