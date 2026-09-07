<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Reject the request unless the authenticated user (set by Authenticate
     * middleware, which must run first) has the given role.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->attributes->get('auth_user');

        if (! $user || $user->role !== $role) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return $next($request);
    }
}
