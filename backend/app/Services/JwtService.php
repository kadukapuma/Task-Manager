<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use UnexpectedValueException;

class JwtService
{
    private const ALGO = 'HS256';

    /**
     * Issue a signed session token for the given user.
     */
    public function issueFor(User $user): string
    {
        $now = time();

        $payload = [
            'sub' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
            'iat' => $now,
            'exp' => $now + (config('jwt.ttl') * 60),
        ];

        return JWT::encode($payload, config('jwt.secret'), self::ALGO);
    }

    /**
     * Decode and verify a token, returning its payload, or null if invalid/expired.
     */
    public function decode(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key(config('jwt.secret'), self::ALGO));
        } catch (ExpiredException|SignatureInvalidException|UnexpectedValueException) {
            return null;
        }
    }
}
