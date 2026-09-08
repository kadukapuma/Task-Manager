<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Customer;
use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends Controller
{
    // A CASE expression (not MySQL's FIELD()) so it also runs on sqlite in tests.
    private const PRIORITY_ORDER = "CASE priority WHEN 'Fire' THEN 0 WHEN 'Urgent' THEN 1 WHEN 'Normal' THEN 2 ELSE 3 END";

    /**
     * Paginated by default (20/page) so the Tasks Management list stays
     * fast as the table grows. Callers that genuinely want everything in
     * one shot (e.g. the Staff Work / Assign Tasks pages, which filter
     * client-side) pass a large `per_page` explicitly.
     */
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->query('per_page', 20), 1000));

        $paginator = $this->baseQuery()
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('priority'), fn ($q, $priority) => $q->where('priority', $priority))
            ->when($request->query('staff_id'), fn ($q, $staffId) => $q->where('assigned_staff_id', $staffId))
            ->when($request->query('customer_id'), fn ($q, $customerId) => $q->where('customer_id', $customerId))
            ->when($request->query('from'), fn ($q, $from) => $q->whereDate('created_at', '>=', $from))
            ->when($request->query('to'), fn ($q, $to) => $q->whereDate('created_at', '<=', $to))
            ->orderByRaw(self::PRIORITY_ORDER)
            ->orderByRaw('due_date IS NULL, due_date ASC')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function mine(Request $request)
    {
        $tasks = $this->baseQuery()
            ->where('assigned_staff_id', $request->user()->id)
            ->orderByRaw(self::PRIORITY_ORDER)
            ->orderByRaw('due_date IS NULL, due_date ASC')
            ->get();

        return $this->ok($tasks);
    }

    public function unassigned()
    {
        $tasks = $this->baseQuery()
            ->whereNull('assigned_staff_id')
            ->orderByRaw(self::PRIORITY_ORDER)
            ->orderByRaw('due_date IS NULL, due_date ASC')
            ->get();

        return $this->ok($tasks);
    }

    /**
     * Tasks the current user reported themselves, regardless of who (if
     * anyone) it's since been assigned to -- lets a staff member track a
     * task they added even before an admin picks it up.
     */
    public function reported(Request $request)
    {
        $tasks = $this->baseQuery()
            ->where('created_by', $request->user()->id)
            ->latest()
            ->get();

        return $this->ok($tasks);
    }

    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();
        $data['customer_id'] = $this->resolveCustomerId($data);
        $data['created_by'] = $request->user()->id;

        // Non-admins can only report a task exists (title, description,
        // customer, priority). Assignment, scheduling, estimation, and
        // recurrence are set later by an admin when they triage/assign it.
        if (! $request->user()->isAdmin()) {
            $data['assigned_staff_id'] = null;
            $data['estimated_minutes'] = null;
            $data['due_date'] = null;
            $data['is_repeating'] = false;
            $data['repeat_frequency'] = null;
        }

        $task = Task::create($data);

        return $this->ok($this->freshTask($task), 'Task created.', 201);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $data = $request->validated();

        if (array_key_exists('new_customer', $data) || array_key_exists('customer_id', $data)) {
            $data['customer_id'] = $this->resolveCustomerId($data);
        }

        $task->update($data);

        return $this->ok($this->freshTask($task), 'Task updated.');
    }

    public function start(Request $request, Task $task)
    {
        $this->authorizeTaskAction($request, $task);

        if ($task->assigned_staff_id === null) {
            return $this->ok(null, 'Task must be picked up or assigned before it can be started.', Response::HTTP_CONFLICT);
        }

        if (! in_array($task->status, ['Pending', 'Paused'], true)) {
            return $this->ok(null, "Task can't be started from its current status.", Response::HTTP_CONFLICT);
        }

        TimeLog::create([
            'task_id' => $task->id,
            'staff_id' => $task->assigned_staff_id,
            'start_time' => now(),
        ]);

        $task->update(['status' => 'In Progress']);

        return $this->ok($this->freshTask($task), 'Task started.');
    }

    public function pause(Request $request, Task $task)
    {
        $this->authorizeTaskAction($request, $task);

        if ($task->status !== 'In Progress') {
            return $this->ok(null, 'Task is not in progress.', Response::HTTP_CONFLICT);
        }

        $this->closeOpenTimeLog($task);
        $task->update(['status' => 'Paused']);

        return $this->ok($this->freshTask($task), 'Task paused.');
    }

    public function complete(Request $request, Task $task)
    {
        $this->authorizeTaskAction($request, $task);

        $this->closeOpenTimeLog($task);
        $task->update(['status' => 'Done', 'completed_at' => now()]);

        return $this->ok($this->freshTask($task), 'Task marked done.');
    }

    public function cannotComplete(Request $request, Task $task)
    {
        $this->authorizeTaskAction($request, $task);

        if (in_array($task->status, ['Done', 'Undone'], true)) {
            return $this->ok(null, "Task can't be marked incomplete from its current status.", Response::HTTP_CONFLICT);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->closeOpenTimeLog($task);

        $task->update([
            'status' => 'Undone',
            'cannot_complete_reason' => $validated['reason'],
        ]);

        return $this->ok($this->freshTask($task), 'Task marked as undone.');
    }

    public function destroy(Task $task)
    {
        $task->delete();

        return $this->ok(null, 'Task moved to Deleted Tasks.');
    }

    /**
     * Soft-deleted tasks awaiting review -- an admin can restore or
     * permanently delete them from here.
     */
    public function deleted()
    {
        $tasks = Task::onlyTrashed()
            ->with('customer', 'assignedStaff')
            ->withSum('timeLogs as total_logged_secs', 'duration_secs')
            ->orderByDesc('deleted_at')
            ->get();

        return $this->ok($tasks);
    }

    public function restore(Task $task)
    {
        $task->restore();

        return $this->ok($this->freshTask($task), 'Task restored.');
    }

    public function forceDelete(Task $task)
    {
        foreach ($task->attachments as $attachment) {
            Storage::disk('local')->delete($attachment->path);
        }

        $task->forceDelete();

        return $this->ok(null, 'Task permanently deleted.');
    }

    /**
     * Reload a task from the database with its relations and the
     * total time logged against it, so every response carries the
     * same shape the frontend expects (including freshly-defaulted
     * DB columns that an in-memory create()/update() call won't have).
     */
    private function freshTask(Task $task): Task
    {
        return $task->fresh(['customer', 'assignedStaff', 'activeTimeLog', 'attachments'])
            ->loadSum('timeLogs as total_logged_secs', 'duration_secs');
    }

    private function baseQuery()
    {
        return Task::with('customer', 'assignedStaff', 'activeTimeLog', 'attachments')
            ->withSum('timeLogs as total_logged_secs', 'duration_secs');
    }

    /**
     * A task's start/pause/complete actions may be triggered by the staff
     * member it's assigned to, or by an admin.
     */
    private function authorizeTaskAction(Request $request, Task $task): void
    {
        $user = $request->user();

        abort_unless(
            $user->role === 'admin' || $task->assigned_staff_id === $user->id,
            Response::HTTP_FORBIDDEN,
            'This task is not assigned to you.'
        );
    }

    private function closeOpenTimeLog(Task $task): void
    {
        $openLog = $task->timeLogs()->whereNull('finish_time')->latest('start_time')->first();

        if (! $openLog) {
            return;
        }

        $finishTime = now();

        $openLog->update([
            'finish_time' => $finishTime,
            'duration_secs' => $finishTime->timestamp - $openLog->start_time->timestamp,
        ]);
    }

    /**
     * Resolve the customer_id for a create/update payload: use the given
     * customer_id as-is, or create a new customer inline and use its id.
     */
    private function resolveCustomerId(array $data): ?int
    {
        if (! empty($data['new_customer']['name'] ?? null)) {
            return Customer::create($data['new_customer'])->id;
        }

        return $data['customer_id'] ?? null;
    }
}
