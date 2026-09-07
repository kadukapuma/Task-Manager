<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    private const PRIORITY_ORDER = "FIELD(priority, 'Fire', 'Urgent', 'Normal')";

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
            'unassigned_tasks' => Task::with('customer')
                ->whereNull('assigned_staff_id')
                ->orderByRaw(self::PRIORITY_ORDER)
                ->orderByRaw('due_date IS NULL, due_date ASC')
                ->get(),
        ]);
    }

    public function staffSummary(Request $request)
    {
        $user = $request->user();
        $from = $request->query('from');
        $to = $request->query('to');

        // Working hours logged in date range
        $timeLogsQuery = TimeLog::where('staff_id', $user->id)
            ->whereNotNull('duration_secs')
            ->when($from, fn ($q) => $q->whereDate('start_time', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('start_time', '<=', $to));

        $totalLoggedSecs = (int) $timeLogsQuery->sum('duration_secs');

        // Tasks assigned to this staff member
        $tasksQuery = Task::where('assigned_staff_id', $user->id)
            ->with('customer')
            ->withSum('timeLogs as total_logged_secs', 'duration_secs');

        $completedTasks = (clone $tasksQuery)
            ->where('status', 'Done')
            ->when($from, fn ($q) => $q->whereDate('completed_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('completed_at', '<=', $to))
            ->orderBy('completed_at', 'desc')
            ->get();

        $inProgressCount = Task::where('assigned_staff_id', $user->id)
            ->where('status', 'In Progress')
            ->count();

        $pendingCount = Task::where('assigned_staff_id', $user->id)
            ->where('status', 'Pending')
            ->count();

        $recentLogs = TimeLog::where('staff_id', $user->id)
            ->with('task:id,title')
            ->when($from, fn ($q) => $q->whereDate('start_time', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('start_time', '<=', $to))
            ->orderBy('start_time', 'desc')
            ->limit(20)
            ->get();

        $totalEstimatedMinutes = (int) $completedTasks->sum('estimated_minutes');
        $completedActualSecs = (int) $completedTasks->sum('total_logged_secs');

        return $this->ok([
            'total_logged_secs' => $totalLoggedSecs,
            'tasks_completed_count' => $completedTasks->count(),
            'tasks_in_progress_count' => $inProgressCount,
            'tasks_pending_count' => $pendingCount,
            'total_estimated_minutes' => $totalEstimatedMinutes,
            'completed_actual_secs' => $completedActualSecs,
            'completed_tasks' => $completedTasks,
            'recent_logs' => $recentLogs,
        ]);
    }

    private function timePerStaff(Request $request): array
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $staffUsers = User::where('role', 'staff')->get();

        return $staffUsers->map(function ($staff) use ($from, $to) {
            $timeLogsQuery = TimeLog::where('staff_id', $staff->id)
                ->whereNotNull('duration_secs')
                ->when($from, fn ($q) => $q->whereDate('start_time', '>=', $from))
                ->when($to, fn ($q) => $q->whereDate('start_time', '<=', $to));

            $totalSecs = (int) $timeLogsQuery->sum('duration_secs');

            $completedTasks = Task::where('assigned_staff_id', $staff->id)
                ->where('status', 'Done')
                ->when($from, fn ($q) => $q->whereDate('completed_at', '>=', $from))
                ->when($to, fn ($q) => $q->whereDate('completed_at', '<=', $to))
                ->withSum('timeLogs as total_logged_secs', 'duration_secs')
                ->get();

            $totalEstimatedMinutes = (int) $completedTasks->sum('estimated_minutes');
            $completedActualSecs = (int) $completedTasks->sum('total_logged_secs');

            return [
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
                'total_secs' => $totalSecs,
                'completed_tasks_count' => $completedTasks->count(),
                'total_estimated_minutes' => $totalEstimatedMinutes,
                'completed_actual_secs' => $completedActualSecs,
            ];
        })->all();
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
