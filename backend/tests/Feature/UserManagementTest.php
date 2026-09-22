<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_edit_a_team_members_name_username_and_role(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->create(['name' => 'Old Name', 'username' => 'oldname']);

        $response = $this->actingAsUser($admin)->patchJson("/api/users/{$staff->id}", [
            'name' => 'New Name',
            'username' => 'newname',
            'role' => 'admin',
        ]);

        $response->assertOk();
        $response->assertJsonPath('name', 'New Name');
        $response->assertJsonPath('username', 'newname');
        $response->assertJsonPath('role', 'admin');
    }

    public function test_admin_cannot_change_their_own_role_away_from_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAsUser($admin)->patchJson("/api/users/{$admin->id}", [
            'role' => 'staff',
        ]);

        $response->assertStatus(409);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => 'admin']);
    }

    public function test_admin_can_delete_a_team_member_with_no_history(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->create();

        $response = $this->actingAsUser($admin)->deleteJson("/api/users/{$staff->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAsUser($admin)->deleteJson("/api/users/{$admin->id}");

        $response->assertStatus(409);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admin_cannot_delete_a_user_with_logged_time(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->create();
        $task = Task::create([
            'title' => 'Some task',
            'task_type' => 'Repairing',
            'assigned_staff_id' => $staff->id,
            'created_by' => $admin->id,
            'status' => 'Paused',
            'priority' => 'Normal',
        ]);
        TimeLog::create([
            'task_id' => $task->id,
            'staff_id' => $staff->id,
            'start_time' => now()->subHour(),
            'finish_time' => now(),
            'duration_secs' => 3600,
        ]);

        $response = $this->actingAsUser($admin)->deleteJson("/api/users/{$staff->id}");

        $response->assertStatus(409);
        $this->assertDatabaseHas('users', ['id' => $staff->id]);
    }

    private function actingAsUser(User $user): self
    {
        $token = app(\App\Services\JwtService::class)->issueFor($user);

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
