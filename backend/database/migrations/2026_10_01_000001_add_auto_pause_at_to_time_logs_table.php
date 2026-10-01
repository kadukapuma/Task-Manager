<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('time_logs', function (Blueprint $table) {
            // When set, the scheduler closes this log (and pauses its task)
            // at this moment -- the staff member's "auto-pause at closing" toggle.
            $table->dateTime('auto_pause_at')->nullable()->after('duration_secs');
        });
    }

    public function down(): void
    {
        Schema::table('time_logs', function (Blueprint $table) {
            $table->dropColumn('auto_pause_at');
        });
    }
};
