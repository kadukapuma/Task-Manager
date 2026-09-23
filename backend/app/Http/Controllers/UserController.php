<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'role' => ['sometimes', 'required', 'string', 'in:staff,admin'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (
            array_key_exists('role', $data) && $data['role'] !== 'admin'
            && $user->id === $request->user()->id
        ) {
            abort(Response::HTTP_CONFLICT, "You can't change your own role away from admin.");
        }

        $user->update($data);

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

    public function destroy(Request $request, User $user)
    {
        abort_if($user->id === $request->user()->id, Response::HTTP_CONFLICT, "You can't delete your own account.");

        abort_if(
            $user->timeLogs()->exists(),
            Response::HTTP_CONFLICT,
            'This user has logged work hours and cannot be deleted -- deactivate their account instead to preserve that history.'
        );

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
