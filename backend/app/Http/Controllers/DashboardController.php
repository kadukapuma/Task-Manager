<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        Gate::authorize('admin');

        return $this->ok([
            'time_per_staff' => $this->timePerStaff($request),
            'tasks_completed_this_month' => $this->tasksCompletedThisMonth(),
            'tasks_pending' => Task::where('status', 'Pending')->count(),
            'repeating_tasks' => Task::with('customer', 'assignedStaff')
                ->where('is_repeating', true)
                ->orderBy('due_date')
                ->get(),
            'open_urgent_tasks' => Task::with('customer', 'assignedStaff')
                ->whereIn('priority', ['Fire', 'Urgent'])
                ->whereIn('status', ['Pending', 'In Progress', 'Paused'])
                ->orderByRaw("FIELD(priority, 'Fire', 'Urgent')")
                ->orderByRaw('due_date IS NULL, due_date ASC')
                ->get(),
        ]);
    }

    private function timePerStaff(Request $request): array
    {
        $query = TimeLog::query()
            ->join('users', 'users.id', '=', 'time_logs.staff_id')
            ->whereNotNull('time_logs.duration_secs')
            ->when($request->query('from'), fn ($q, $from) => $q->whereDate('time_logs.start_time', '>=', $from))
            ->when($request->query('to'), fn ($q, $to) => $q->whereDate('time_logs.start_time', '<=', $to))
            ->groupBy('users.id', 'users.name')
            ->orderBy('users.name')
            ->selectRaw('users.id as staff_id, users.name as staff_name, SUM(time_logs.duration_secs) as total_secs');

        return $query->get()->map(fn ($row) => [
            'staff_id' => $row->staff_id,
            'staff_name' => $row->staff_name,
            'total_secs' => (int) $row->total_secs,
        ])->all();
    }

    private function tasksCompletedThisMonth(): int
    {
        return Task::where('status', 'Done')
            ->whereNotNull('completed_at')
            ->whereYear('completed_at', now()->year)
            ->whereMonth('completed_at', now()->month)
            ->count();
    }
}
