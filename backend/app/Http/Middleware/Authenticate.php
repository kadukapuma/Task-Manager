<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    public function __construct(private JwtService $jwt) {}

    /**
     * Verify the bearer token, load the user, and reject if missing, invalid,
     * expired, or the account has since been deactivated.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        $payload = $token ? $this->jwt->decode($token) : null;

        $user = $payload ? User::find($payload->sub) : null;

        if (! $user || ! $user->active) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Bind the JWT-resolved user onto the default guard (in memory only --
        // nothing touches the session) so $request->user(), auth()->user(),
        // and Gate/Policy checks all work normally for the rest of the request.
        Auth::setUser($user);
        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
