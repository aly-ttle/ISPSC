<?php

namespace App\Http\Controllers;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'id_number' => 'nullable|string|max:100',
            'role' => 'nullable|string|max:50',
            'department' => 'nullable|string|max:255',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($validated['email']));
        $requestedRole = strtolower((string) ($validated['role'] ?? 'student'));
        $role = in_array($requestedRole, ['adviser', 'supervisor'], true)
            ? $requestedRole
            : 'student';

        $user = User::create([
            'name' => $validated['name'],
            'id_number' => $validated['id_number'] ?? null,
            'role' => $role,
            'department' => $validated['department'] ?? null,
            'email' => $email,
            'email_verified_at' => now(),
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

        if (! $user) {
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

    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($validated['email']));
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'success' => true,
                'message' => 'If an account matches that email address, a password reset code has been sent.',
                'email' => $email,
                'expires_in_minutes' => 15,
            ]);
        }

        // Generate 6-digit OTP and secure token
        $otp = sprintf('%06d', random_int(100000, 999999));
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now(),
            ]
        );

        cache()->put('reset_otp_'.$email, [
            'otp' => $otp,
            'token' => $token,
            'expires_at' => Carbon::now()->addMinutes(15),
        ], now()->addMinutes(15));

        $resetUrl = url('/?action=reset-password&token='.urlencode($token).'&email='.urlencode($email));

        // Dispatch real email with 6-digit OTP to user
        try {
            Mail::to($email)->send(new ResetPasswordMail($user, $otp, $resetUrl, 15));
            Log::info('Password reset email dispatched.', ['email' => $email]);
        } catch (\Throwable $e) {
            Log::error('Password reset email delivery failed.', [
                'email' => $email,
                'exception' => $e,
            ]);

            DB::table('password_reset_tokens')->where('email', $email)->delete();
            cache()->forget('reset_otp_'.$email);

            return response()->json([
                'success' => false,
                'message' => 'We could not send the password reset email. Please try again later.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => 'If an account matches that email address, a password reset code has been sent.',
            'email' => $email,
            'expires_in_minutes' => 15,
        ]);
    }

    public function verifyResetOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ], [
            'otp.size' => 'The OTP code must be exactly 6 digits.',
        ]);

        $email = strtolower(trim($validated['email']));
        $otp = trim($validated['otp']);

        $cached = cache()->get('reset_otp_'.$email);
        $resetRecord = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $resetRecord && ! $cached) {
            return response()->json([
                'success' => false,
                'message' => 'No active password reset session found. Please request a new OTP.',
            ], 422);
        }

        // Check expiration
        if ($resetRecord) {
            $createdAt = Carbon::parse($resetRecord->created_at);
            if ($createdAt->addMinutes(15)->isPast()) {
                DB::table('password_reset_tokens')->where('email', $email)->delete();
                cache()->forget('reset_otp_'.$email);

                return response()->json([
                    'success' => false,
                    'message' => 'This OTP code has expired (valid for 15 minutes). Please request a new code.',
                ], 422);
            }
        }

        $isValidOtp = false;
        $activeToken = null;

        if ($cached && isset($cached['otp']) && (string) $cached['otp'] === (string) $otp) {
            $isValidOtp = true;
            $activeToken = $cached['token'] ?? null;
        }

        if (! $isValidOtp) {
            return response()->json([
                'success' => false,
                'message' => 'The OTP code you entered is invalid. Please double-check your email.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully! Please set your new password.',
            'email' => $email,
            'token' => $activeToken,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'nullable|string',
            'otp' => 'nullable|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[A-Za-z])(?=.*\d).+$/',
                'confirmed',
            ],
        ], [
            'password.min' => 'The password must be at least 8 characters long.',
            'password.regex' => 'The password must include both letters and numbers.',
            'password.confirmed' => 'The password confirmation does not match.',
        ]);

        $email = strtolower(trim($validated['email']));
        $token = $validated['token'] ?? null;
        $otp = $validated['otp'] ?? null;

        if (! $token && ! $otp) {
            return response()->json([
                'success' => false,
                'message' => 'OTP code or reset token is required.',
            ], 422);
        }

        $resetRecord = DB::table('password_reset_tokens')->where('email', $email)->first();
        $cached = cache()->get('reset_otp_'.$email);

        if (! $resetRecord && ! $cached) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset session. Please request a new OTP.',
            ], 422);
        }

        if ($resetRecord) {
            $createdAt = Carbon::parse($resetRecord->created_at);
            if ($createdAt->addMinutes(15)->isPast()) {
                DB::table('password_reset_tokens')->where('email', $email)->delete();
                cache()->forget('reset_otp_'.$email);

                return response()->json([
                    'success' => false,
                    'message' => 'This password reset session has expired (valid for 15 minutes). Please request a new code.',
                ], 422);
            }
        }

        $verified = false;
        if ($otp && $cached && isset($cached['otp']) && (string) $cached['otp'] === (string) $otp) {
            $verified = true;
        }
        if ($token && $resetRecord && Hash::check($token, $resetRecord->token)) {
            $verified = true;
        }

        if (! $verified) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code or reset token. Please check and try again.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User account not found.',
            ], 404);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $email)->delete();
        cache()->forget('reset_otp_'.$email);

        return response()->json([
            'success' => true,
            'message' => 'Your password has been successfully reset! You can now log in with your new password.',
        ]);
    }

    private function formatUser(User $user)
    {
        $nameParts = explode(' ', trim($user->name));
        $initials = strtoupper(
            ($nameParts[0][0] ?? 'U').($nameParts[count($nameParts) - 1][0] ?? '')
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
