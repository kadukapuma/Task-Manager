<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return User::orderBy('name')
            ->get(['id', 'name', 'username', 'role', 'active', 'created_at']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:staff,admin'],
        ]);

        $user = User::create([...$data, 'active' => true]);

        return response()->json($user->only(['id', 'name', 'username', 'role', 'active', 'created_at']), 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'active' => ['sometimes', 'boolean'],
        ]);

        $user->update(['active' => $data['active'] ?? ! $user->active]);

        return response()->json($user->only(['id', 'name', 'username', 'role', 'active', 'created_at']));
    }

    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        $user->update(['password' => $data['new_password']]);

        return response()->json(['message' => 'Password reset.']);
    }
}
