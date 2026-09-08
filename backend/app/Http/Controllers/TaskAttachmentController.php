<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class TaskAttachmentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $this->authorizeAccess($request, $task);

        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:5'],
            'files.*' => ['file', 'mimes:jpg,jpeg,png,gif,webp,pdf', 'max:10240'],
        ]);

        $attachments = collect($request->file('files'))->map(function ($file) use ($task, $request) {
            $path = $file->store("tasks/{$task->id}", 'local');

            return $task->attachments()->create([
                'uploaded_by' => $request->user()->id,
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        });

        return $this->ok($attachments->values(), 'File(s) uploaded.', 201);
    }

    /**
     * Stream the attachment back so it can be previewed/downloaded from
     * behind the same bearer-token auth as the rest of the API.
     */
    public function show(Request $request, Task $task, TaskAttachment $attachment)
    {
        $this->authorizeAccess($request, $task);
        abort_unless($attachment->task_id === $task->id, Response::HTTP_NOT_FOUND);

        return Storage::disk('local')->response($attachment->path, $attachment->original_name);
    }

    public function destroy(Request $request, Task $task, TaskAttachment $attachment)
    {
        $this->authorizeAccess($request, $task);
        abort_unless($attachment->task_id === $task->id, Response::HTTP_NOT_FOUND);

        Storage::disk('local')->delete($attachment->path);
        $attachment->delete();

        return $this->ok(null, 'Attachment removed.');
    }

    /**
     * A task's attachments are visible to an admin, the assigned staff
     * member, or whoever originally reported the task.
     */
    private function authorizeAccess(Request $request, Task $task): void
    {
        $user = $request->user();

        abort_unless(
            $user->role === 'admin' || $task->assigned_staff_id === $user->id || $task->created_by === $user->id,
            Response::HTTP_FORBIDDEN,
            'You do not have access to this task.'
        );
    }
}
