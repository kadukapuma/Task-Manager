<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_matches_title_or_description(): void
    {
        $admin = User::factory()->admin()->create();

        Task::create([
            'title' => 'Fix printer in lobby',
            'task_type' => 'Repairing',
            'created_by' => $admin->id,
            'status' => 'Pending',
            'priority' => 'Normal',
        ]);
        Task::create([
            'title' => 'Install new router',
            'description' => 'Replace the lobby switch too',
            'task_type' => 'Installation',
            'created_by' => $admin->id,
            'status' => 'Pending',
            'priority' => 'Normal',
        ]);
        Task::create([
            'title' => 'Unrelated task',
            'task_type' => 'Maintenance',
            'created_by' => $admin->id,
            'status' => 'Pending',
            'priority' => 'Normal',
        ]);

        $response = $this->actingAsUser($admin)->getJson('/api/tasks?search=lobby');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title')->all();
        $this->assertCount(2, $titles);
        $this->assertContains('Fix printer in lobby', $titles);
        $this->assertContains('Install new router', $titles);
    }

    public function test_search_also_matches_by_task_number(): void
    {
        $admin = User::factory()->admin()->create();

        $target = Task::create([
            'title' => 'Completely unrelated title',
            'task_type' => 'Repairing',
            'created_by' => $admin->id,
            'status' => 'Pending',
            'priority' => 'Normal',
        ]);
        Task::create([
            'title' => 'Another task, different id',
            'task_type' => 'Maintenance',
            'created_by' => $admin->id,
            'status' => 'Pending',
            'priority' => 'Normal',
        ]);

        // Bare id
        $byId = $this->actingAsUser($admin)->getJson("/api/tasks?search={$target->id}");
        $byId->assertOk();
        $this->assertSame([$target->id], collect($byId->json('data'))->pluck('id')->all());

        // "#"-prefixed id, as a user would type a task number
        $byHash = $this->actingAsUser($admin)->getJson("/api/tasks?search=%23{$target->id}");
        $byHash->assertOk();
        $this->assertSame([$target->id], collect($byHash->json('data'))->pluck('id')->all());
    }

    private function actingAsUser(User $user): self
    {
        $token = app(\App\Services\JwtService::class)->issueFor($user);

        return $this->withHeader('Authorization', "Bearer {$token}");
    }
}
