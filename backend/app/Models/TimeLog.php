<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class TimeLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'task_id',
        'staff_id',
        'start_time',
        'finish_time',
        'duration_secs',
        'auto_pause_at',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'finish_time' => 'datetime',
            'auto_pause_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * End this log at the given moment (default: now), recording its duration.
     */
    public function close(?CarbonInterface $at = null): void
    {
        $finishTime = $at ?? now();

        $this->update([
            'finish_time' => $finishTime,
            'duration_secs' => max(0, $finishTime->timestamp - $this->start_time->timestamp),
        ]);
    }

    /**
     * The next office closing time after now, e.g. today 17:00 (or tomorrow's
     * if it has already passed), converted to the app timezone for storage.
     */
    public static function nextOfficeClose(): Carbon
    {
        $tz = config('app.office_timezone');
        [$hour, $minute] = array_map('intval', explode(':', config('app.office_close_time')));

        $now = now()->setTimezone($tz);
        $close = $now->copy()->setTime($hour, $minute);

        if ($close->lte($now)) {
            $close->addDay();
        }

        return $close->setTimezone(config('app.timezone'));
    }
}
