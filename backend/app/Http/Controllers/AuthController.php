<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwt) {}

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('username', $credentials['username'])->first();

        $invalid = ! $user
            || ! Hash::check($credentials['password'], $user->password)
            || ! $user->active;

        if ($invalid) {
            throw ValidationException::withMessages([
                'username' => 'Incorrect username or password.',
            ]);
        }

        return response()->json([
            'token' => $this->jwt->issueFor($user),
            'user' => $this->present($user),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($this->present($this->authUser($request)));
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        $user = $this->authUser($request);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Current password is incorrect.',
            ]);
        }

        $user->update(['password' => $data['new_password']]);

        return response()->json(['message' => 'Password updated.']);
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $user->role,
        ];
    }
}
