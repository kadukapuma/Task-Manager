<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffSelfAssignTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_self_assign_their_own_task(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAsUser($staff)->postJson('/api/tasks', [
            'title' => 'Fix printer',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $staff->id,
            'estimated_minutes' => 45,
            'due_date' => now()->addDay()->toDateString(),
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.assigned_staff_id', $staff->id);
        $response->assertJsonPath('data.estimated_minutes', 45);
        $response->assertJsonPath('data.created_by', $staff->id);
    }

    public function test_staff_cannot_assign_a_task_to_someone_else(): void
    {
        $staff = User::factory()->create();
        $otherStaff = User::factory()->create();

        $response = $this->actingAsUser($staff)->postJson('/api/tasks', [
            'title' => 'Fix printer',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $otherStaff->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.assigned_staff_id', null);
    }

    private function actingAsUser(User $user): self
    {
        $token = app(\App\Services\JwtService::class)->issueFor($user);

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
