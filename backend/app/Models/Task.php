<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    public const PRIORITIES = ['Normal', 'Urgent', 'Fire'];

    public const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done'];

    public const REPEAT_FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

    protected $fillable = [
        'title',
        'description',
        'customer_id',
        'assigned_staff_id',
        'priority',
        'status',
        'is_repeating',
        'repeat_frequency',
        'due_date',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_repeating' => 'boolean',
            'due_date' => 'date',
            'completed_at' => 'datetime',
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

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }
}
