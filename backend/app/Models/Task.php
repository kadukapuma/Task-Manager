<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use SoftDeletes;

    public const PRIORITIES = ['Normal', 'Urgent', 'Fire'];

    public const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done', 'Undone'];

    public const REPEAT_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

    protected $fillable = [
        'title',
        'description',
        'customer_id',
        'assigned_staff_id',
        'created_by',
        'priority',
        'status',
        'cannot_complete_reason',
        'estimated_minutes',
        'is_repeating',
        'repeat_frequency',
        'due_date',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'estimated_minutes' => 'integer',
            'is_repeating' => 'boolean',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            // withSum()/loadSum() aggregates come back from the DB driver as
            // strings -- without this, `total_logged_secs + elapsedSeconds`
            // in JS silently does string concatenation instead of addition.
            'total_logged_secs' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TaskAttachment::class);
    }

    /**
     * The currently-running time log (if any) -- lets the frontend compute
     * a live elapsed timer for an in-progress task without polling.
     */
    public function activeTimeLog(): HasOne
    {
        return $this->hasOne(TimeLog::class)->whereNull('finish_time')->latestOfMany('start_time');
    }
}
