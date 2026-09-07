<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'task_id',
        'staff_id',
        'start_time',
        'finish_time',
        'duration_secs',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'finish_time' => 'datetime',
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
}
