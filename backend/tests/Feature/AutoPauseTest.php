<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AutoPauseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.office_close_time' => '17:00', 'app.office_timezone' => 'Asia/Colombo']);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function makeTask(User $staff, string $status = 'Pending'): Task
    {
        return Task::create([
            'title' => 'Fix printer',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $staff->id,
            'created_by' => $staff->id,
            'status' => $status,
            'priority' => 'Normal',
        ]);
    }

    /** A moment expressed in office-local time, returned in the app timezone. */
    private function officeTime(string $time): Carbon
    {
        return Carbon::parse("2026-10-01 {$time}", 'Asia/Colombo')->setTimezone(config('app.timezone'));
    }

    public function test_starting_a_task_schedules_auto_pause_at_office_closing_by_default(): void
    {
        Carbon::setTestNow($this->officeTime('09:00'));
        $staff = User::factory()->create();
        $task = $this->makeTask($staff);

        $response = $this->actingAsUser($staff)->postJson("/api/tasks/{$task->id}/start");

        $response->assertOk();
        $log = TimeLog::where('task_id', $task->id)->first();
        $this->assertTrue($log->auto_pause_at->eq($this->officeTime('17:00')));
        $this->assertNotNull($response->json('data.active_time_log.auto_pause_at'));
    }

    public function test_starting_after_closing_schedules_for_the_next_day(): void
    {
        Carbon::setTestNow($this->officeTime('18:30'));
        $staff = User::factory()->create();
        $task = $this->makeTask($staff);

        $this->actingAsUser($staff)->postJson("/api/tasks/{$task->id}/start")->assertOk();

        $log = TimeLog::where('task_id', $task->id)->first();
        $this->assertTrue($log->auto_pause_at->eq($this->officeTime('17:00')->addDay()));
    }

    public function test_starting_with_auto_pause_off_leaves_it_unset(): void
    {
        $staff = User::factory()->create();
        $task = $this->makeTask($staff);

        $this->actingAsUser($staff)
            ->postJson("/api/tasks/{$task->id}/start", ['auto_pause' => false])
            ->assertOk();

        $this->assertNull(TimeLog::where('task_id', $task->id)->first()->auto_pause_at);
    }

    public function test_toggle_turns_auto_pause_off_and_on_for_a_running_task(): void
    {
        Carbon::setTestNow($this->officeTime('10:00'));
        $staff = User::factory()->create();
        $task = $this->makeTask($staff);
        $this->actingAsUser($staff)->postJson("/api/tasks/{$task->id}/start")->assertOk();

        $this->actingAsUser($staff)
            ->postJson("/api/tasks/{$task->id}/auto-pause", ['enabled' => false])
            ->assertOk();
        $this->assertNull(TimeLog::where('task_id', $task->id)->first()->auto_pause_at);

        $this->actingAsUser($staff)
            ->postJson("/api/tasks/{$task->id}/auto-pause", ['enabled' => true])
            ->assertOk();
        $this->assertTrue(TimeLog::where('task_id', $task->id)->first()->auto_pause_at->eq($this->officeTime('17:00')));
    }

    public function test_toggle_is_rejected_when_task_is_not_running(): void
    {
        $staff = User::factory()->create();
        $task = $this->makeTask($staff, 'Paused');

        $this->actingAsUser($staff)
            ->postJson("/api/tasks/{$task->id}/auto-pause", ['enabled' => true])
            ->assertStatus(409);
    }

    public function test_scheduler_pauses_due_tasks_at_closing_time_and_leaves_others_running(): void
    {
        $staff = User::factory()->create();
        $other = User::factory()->create();

        $due = $this->makeTask($staff, 'In Progress');
        $dueLog = TimeLog::create([
            'task_id' => $due->id,
            'staff_id' => $staff->id,
            'start_time' => $this->officeTime('16:00'),
            'auto_pause_at' => $this->officeTime('17:00'),
        ]);

        $optedOut = $this->makeTask($other, 'In Progress');
        $optedOutLog = TimeLog::create([
            'task_id' => $optedOut->id,
            'staff_id' => $other->id,
            'start_time' => $this->officeTime('16:00'),
        ]);

        // Run late on purpose: the log must still finish at 17:00, not 17:45.
        Carbon::setTestNow($this->officeTime('17:45'));
        $this->artisan('tasks:auto-pause')->assertSuccessful();

        $dueLog->refresh();
        $this->assertSame('Paused', $due->fresh()->status);
        $this->assertTrue($dueLog->finish_time->eq($this->officeTime('17:00')));
        $this->assertSame(3600, $dueLog->duration_secs);

        $this->assertSame('In Progress', $optedOut->fresh()->status);
        $this->assertNull($optedOutLog->fresh()->finish_time);
    }

    private function actingAsUser(User $user): self
    {
        $token = app(\App\Services\JwtService::class)->issueFor($user);

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
