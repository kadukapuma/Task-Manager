<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Customer;
use App\Models\Task;
use App\Models\TimeLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TaskController extends Controller
{
    private const PRIORITY_ORDER = "FIELD(priority, 'Fire', 'Urgent', 'Normal')";

    public function index(Request $request)
    {
        $tasks = $this->baseQuery()
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('priority'), fn ($q, $priority) => $q->where('priority', $priority))
            ->when($request->query('staff_id'), fn ($q, $staffId) => $q->where('assigned_staff_id', $staffId))
            ->when($request->query('customer_id'), fn ($q, $customerId) => $q->where('customer_id', $customerId))
            ->orderByRaw(self::PRIORITY_ORDER)
            ->orderByRaw('due_date IS NULL, due_date ASC')
            ->get();

        return $this->ok($tasks);
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

    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();
        $data['customer_id'] = $this->resolveCustomerId($data);

        $task = Task::create($data)->fresh(['customer', 'assignedStaff']);

        return $this->ok($task, 'Task created.', 201);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $data = $request->validated();

        if (array_key_exists('new_customer', $data) || array_key_exists('customer_id', $data)) {
            $data['customer_id'] = $this->resolveCustomerId($data);
        }

        $task->update($data);

        return $this->ok($task->load('customer', 'assignedStaff'), 'Task updated.');
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

        return $this->ok($task->load('customer', 'assignedStaff'), 'Task started.');
    }

    public function pause(Request $request, Task $task)
    {
        $this->authorizeTaskAction($request, $task);

        if ($task->status !== 'In Progress') {
            return $this->ok(null, 'Task is not in progress.', Response::HTTP_CONFLICT);
        }

        $this->closeOpenTimeLog($task);
        $task->update(['status' => 'Paused']);

        return $this->ok($task->load('customer', 'assignedStaff'), 'Task paused.');
    }

    public function complete(Request $request, Task $task)
    {
        $this->authorizeTaskAction($request, $task);

        $this->closeOpenTimeLog($task);
        $task->update(['status' => 'Done', 'completed_at' => now()]);

        return $this->ok($task->load('customer', 'assignedStaff'), 'Task marked done.');
    }

    public function pickUp(Request $request, Task $task)
    {
        if ($task->assigned_staff_id !== null) {
            return $this->ok(null, 'Task has already been picked up.', Response::HTTP_CONFLICT);
        }

        $task->update(['assigned_staff_id' => $request->user()->id]);

        return $this->ok($task->load('customer', 'assignedStaff'), 'Task picked up.');
    }

    private function baseQuery()
    {
        return Task::with('customer', 'assignedStaff');
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
