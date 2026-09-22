<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCompletionNotesTest extends TestCase
{
    use RefreshDatabase;

    public function test_completion_notes_are_optional(): void
    {
        $staff = User::factory()->create();
        $task = Task::create([
            'title' => 'Fix printer',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $staff->id,
            'created_by' => $staff->id,
            'status' => 'In Progress',
            'priority' => 'Normal',
        ]);

        $response = $this->actingAsUser($staff)->postJson("/api/tasks/{$task->id}/complete", []);

        $response->assertOk();
        $response->assertJsonPath('data.status', 'Done');
        $response->assertJsonPath('data.completion_notes', null);
    }

    public function test_completion_notes_are_saved_when_provided(): void
    {
        $staff = User::factory()->create();
        $task = Task::create([
            'title' => 'Fix printer',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $staff->id,
            'created_by' => $staff->id,
            'status' => 'In Progress',
            'priority' => 'Normal',
        ]);

        $response = $this->actingAsUser($staff)->postJson("/api/tasks/{$task->id}/complete", [
            'notes' => 'Replaced the toner cartridge.',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.completion_notes', 'Replaced the toner cartridge.');
    }

    private function actingAsUser(User $user): self
    {
        $token = app(\App\Services\JwtService::class)->issueFor($user);

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
