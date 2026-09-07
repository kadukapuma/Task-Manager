<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

abstract class Controller
{
    use AuthorizesRequests;

    /**
     * The authenticated user, resolved by the Authenticate middleware.
     */
    protected function authUser(Request $request): User
    {
        return $request->user();
    }

    /**
     * Wrap a successful response in the { data, message } envelope used
     * across the API so the frontend can handle responses predictably.
     */
    protected function ok(mixed $data = null, ?string $message = null, int $status = 200)
    {
        return response()->json(array_filter([
            'data' => $data,
            'message' => $message,
        ], fn ($value) => $value !== null), $status);
    }
}
