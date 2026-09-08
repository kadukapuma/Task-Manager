<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DashboardController extends Controller
{
    // A CASE expression (not MySQL's FIELD()) so it also runs on sqlite in tests.
    private const PRIORITY_ORDER = "CASE priority WHEN 'Fire' THEN 0 WHEN 'Urgent' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END";

    public function summary(Request $request)
    {
        Gate::authorize('admin');

        return $this->ok([
            'time_per_staff' => $this->timePerStaff($request),
            'status_breakdown' => $this->statusBreakdown(),
            'tasks_completed_this_month' => $this->tasksCompletedThisMonth(),
            'tasks_pending' => Task::where('status', 'Pending')->count(),
            'repeating_tasks' => Task::with('customer', 'assignedStaff')
                ->where('is_repeating', true)
                ->orderBy('due_date')
                ->get(),
            'open_urgent_tasks' => Task::with('customer', 'assignedStaff')
                ->whereIn('priority', ['Fire', 'Urgent'])
                ->whereIn('status', ['Pending', 'In Progress', 'Paused'])
                ->orderByRaw("CASE priority WHEN 'Fire' THEN 0 WHEN 'Urgent' THEN 1 ELSE 2 END")
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

        $pausedCount = Task::where('assigned_staff_id', $user->id)
            ->where('status', 'Paused')
            ->count();

        $undoneCount = Task::where('assigned_staff_id', $user->id)
            ->where('status', 'Undone')
            ->count();

        $daysWorked = (clone $timeLogsQuery)
            ->selectRaw('DATE(start_time) as work_date')
            ->distinct()
            ->get()
            ->count();

        // Daily time-worked trend for the chart -- when no range is picked,
        // default the chart window to the last 14 days rather than the
        // (potentially huge) full history the "All Time" totals above cover.
        $chartFrom = $from ?: now()->subDays(13)->toDateString();
        $chartTo = $to ?: now()->toDateString();

        $dailyBreakdown = TimeLog::where('staff_id', $user->id)
            ->whereNotNull('duration_secs')
            ->whereDate('start_time', '>=', $chartFrom)
            ->whereDate('start_time', '<=', $chartTo)
            ->selectRaw('DATE(start_time) as work_date, SUM(duration_secs) as secs')
            ->groupBy('work_date')
            ->orderBy('work_date')
            ->get();

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
            'days_worked' => $daysWorked,
            'tasks_completed_count' => $completedTasks->count(),
            'tasks_in_progress_count' => $inProgressCount,
            'tasks_pending_count' => $pendingCount,
            'tasks_paused_count' => $pausedCount,
            'tasks_undone_count' => $undoneCount,
            'total_estimated_minutes' => $totalEstimatedMinutes,
            'completed_actual_secs' => $completedActualSecs,
            'completed_tasks' => $completedTasks,
            'recent_logs' => $recentLogs,
            'daily_breakdown' => $dailyBreakdown,
            'status_breakdown' => [
                ['status' => 'Pending', 'count' => $pendingCount],
                ['status' => 'In Progress', 'count' => $inProgressCount],
                ['status' => 'Paused', 'count' => $pausedCount],
                ['status' => 'Done', 'count' => $completedTasks->count()],
                ['status' => 'Undone', 'count' => $undoneCount],
            ],
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

            $daysWorked = (clone $timeLogsQuery)
                ->selectRaw('DATE(start_time) as work_date')
                ->distinct()
                ->get()
                ->count();

            $completedTasks = Task::where('assigned_staff_id', $staff->id)
                ->where('status', 'Done')
                ->when($from, fn ($q) => $q->whereDate('completed_at', '>=', $from))
                ->when($to, fn ($q) => $q->whereDate('completed_at', '<=', $to))
                ->withSum('timeLogs as total_logged_secs', 'duration_secs')
                ->get();

            $totalEstimatedMinutes = (int) $completedTasks->sum('estimated_minutes');
            $completedActualSecs = (int) $completedTasks->sum('total_logged_secs');

            $pendingCount = Task::where('assigned_staff_id', $staff->id)->where('status', 'Pending')->count();
            $pausedCount = Task::where('assigned_staff_id', $staff->id)->where('status', 'Paused')->count();
            $undoneCount = Task::where('assigned_staff_id', $staff->id)->where('status', 'Undone')->count();

            return [
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
                'total_secs' => $totalSecs,
                'days_worked' => $daysWorked,
                'completed_tasks_count' => $completedTasks->count(),
                'pending_tasks_count' => $pendingCount,
                'paused_tasks_count' => $pausedCount,
                'undone_tasks_count' => $undoneCount,
                'total_estimated_minutes' => $totalEstimatedMinutes,
                'completed_actual_secs' => $completedActualSecs,
            ];
        })->all();
    }

    private function statusBreakdown(): array
    {
        $counts = Task::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(Task::STATUSES)
            ->map(fn ($status) => ['status' => $status, 'count' => (int) ($counts[$status] ?? 0)])
            ->values()
            ->all();
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
