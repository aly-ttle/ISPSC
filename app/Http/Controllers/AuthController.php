<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'id_number' => 'nullable|string|max:100',
            'role' => 'required|in:student,supervisor,adviser,admin',
            'department' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'id_number' => $validated['id_number'] ?? null,
            'role' => $validated['role'],
            'department' => $validated['department'] ?? null,
            'email' => $validated['email'],
            'username' => strtolower($validated['username']),
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'success' => true,
            'message' => "Account created successfully! Welcome, {$user->name}.",
            'user' => $this->formatUser($user),
        ]);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $username = strtolower(trim($credentials['username']));

        if (Auth::attempt(['username' => $username, 'password' => $credentials['password']], $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();

            return response()->json([
                'success' => true,
                'message' => "Welcome back, {$user->name}!",
                'user' => $this->formatUser($user),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Incorrect username or password. Please check your credentials.',
        ], 422);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Signed out successfully.',
        ]);
    }

    public function me(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'authenticated' => false,
                'user' => null,
            ]);
        }

        return response()->json([
            'authenticated' => true,
            'user' => $this->formatUser($user),
        ]);
    }

    private function formatUser(User $user)
    {
        $nameParts = explode(' ', trim($user->name));
        $initials = strtoupper(
            ($nameParts[0][0] ?? 'U') . ($nameParts[count($nameParts) - 1][0] ?? '')
        );

        $roleTitle = match ($user->role) {
            'supervisor' => 'Department Supervisor',
            'adviser' => 'OJT Adviser',
            'admin' => 'Portal Administrator',
            default => 'OJT Student',
        };

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'idNumber' => $user->id_number,
            'role' => $user->role,
            'roleTitle' => $roleTitle,
            'roleKey' => $user->role,
            'department' => $user->department,
            'initials' => $initials,
        ];
    }
}
