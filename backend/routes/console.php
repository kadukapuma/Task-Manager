<?php

use App\Models\TimeLog;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Pause running tasks whose "auto-pause at closing time" moment has passed.
// The log is closed at auto_pause_at (not now), so a late or missed run
// still records the right finish time.
Artisan::command('tasks:auto-pause', function () {
    $logs = TimeLog::with('task')
        ->whereNull('finish_time')
        ->whereNotNull('auto_pause_at')
        ->where('auto_pause_at', '<=', now())
        ->get();

    foreach ($logs as $log) {
        $log->close($log->auto_pause_at);

        if ($log->task?->status === 'In Progress') {
            $log->task->update(['status' => 'Paused']);
        }
    }

    $this->info("Auto-paused {$logs->count()} task(s).");
})->purpose('Pause running tasks that reached their auto-pause time');

Schedule::command('tasks:auto-pause')->everyMinute()->withoutOverlapping(5);
