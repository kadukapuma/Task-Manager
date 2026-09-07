<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('admin');
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],

            'customer_id' => ['nullable', 'exists:customers,id'],
            'new_customer' => ['nullable', 'array'],
            'new_customer.name' => ['required_with:new_customer', 'string', 'max:255'],
            'new_customer.company' => ['nullable', 'string', 'max:255'],
            'new_customer.phone' => ['nullable', 'string', 'max:50'],
            'new_customer.email' => ['nullable', 'email', 'max:255'],

            'assigned_staff_id' => ['nullable', 'exists:users,id'],
            'priority' => ['sometimes', 'in:'.implode(',', Task::PRIORITIES)],
            'status' => ['sometimes', 'in:'.implode(',', Task::STATUSES)],
            'estimated_minutes' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
            'is_repeating' => ['boolean'],
            'repeat_frequency' => ['nullable', 'required_if:is_repeating,true', 'in:'.implode(',', Task::REPEAT_FREQUENCIES)],
        ];
    }
}
