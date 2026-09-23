<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardStaffSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_time_per_staff_includes_working_now_count_and_completed_task_detail(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->create();

        Task::create([
            'title' => 'Currently working on this',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $staff->id,
            'created_by' => $admin->id,
            'status' => 'In Progress',
            'priority' => 'Normal',
        ]);

        $done = Task::create([
            'title' => 'Finished this',
            'task_type' => 'Installation',
            'assigned_staff_id' => $staff->id,
            'created_by' => $admin->id,
            'status' => 'Done',
            'priority' => 'Normal',
            'estimated_minutes' => 60,
            'completed_at' => now(),
        ]);

        TimeLog::create([
            'task_id' => $done->id,
            'staff_id' => $staff->id,
            'start_time' => now()->subHour(),
            'finish_time' => now(),
            'duration_secs' => 3000,
        ]);

        $response = $this->actingAsUser($admin)->getJson('/api/dashboard/summary');

        $response->assertOk();

        $row = collect($response->json('data.time_per_staff'))->firstWhere('staff_id', $staff->id);

        $this->assertNotNull($row);
        $this->assertSame(1, $row['in_progress_tasks_count']);
        $this->assertSame(1, $row['completed_tasks_count']);
        $this->assertCount(1, $row['completed_tasks']);
        $this->assertSame('Finished this', $row['completed_tasks'][0]['title']);
    }

    private function actingAsUser(User $user): self
    {
        $token = app(\App\Services\JwtService::class)->issueFor($user);

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
