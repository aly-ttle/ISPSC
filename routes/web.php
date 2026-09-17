<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PracticumController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Authentication Routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/verify-otp', [AuthController::class, 'verifyResetOtp'])->middleware('throttle:10,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

// Protected Practicum Workflows
Route::middleware('auth')->group(function () {
    Route::get('/practicum/state', [PracticumController::class, 'getState']);
    Route::post('/practicum/attendance', [PracticumController::class, 'recordAttendance']);
    Route::post('/practicum/application', [PracticumController::class, 'updateApplication']);
    Route::post('/practicum/assign-student', [PracticumController::class, 'assignStudent']);
    Route::post('/practicum/approve-student', [PracticumController::class, 'approveStudent']);
    Route::post('/practicum/task', [PracticumController::class, 'createTask']);
    Route::post('/practicum/task/{id}/toggle', [PracticumController::class, 'toggleTask']);
    Route::post('/practicum/journal', [PracticumController::class, 'createJournal']);
    Route::post('/practicum/report', [PracticumController::class, 'createReport']);
    Route::post('/practicum/requirement', [PracticumController::class, 'uploadRequirement']);
    Route::get('/practicum/requirements/{id}/preview', [PracticumController::class, 'previewRequirement']);
    Route::post('/practicum/review-requirement', [PracticumController::class, 'reviewRequirement']);
    Route::post('/practicum/evaluation', [PracticumController::class, 'saveEvaluation']);
    Route::post('/practicum/feedback', [PracticumController::class, 'saveFeedback']);
    Route::post('/practicum/review-attendance', [PracticumController::class, 'reviewAttendance']);
    Route::post('/practicum/review-journal', [PracticumController::class, 'reviewJournal']);
    Route::post('/practicum/review-report', [PracticumController::class, 'reviewReport']);
    Route::post('/practicum/update-placement', [PracticumController::class, 'updatePlacement']);
    Route::post('/practicum/admin/assign-role', [PracticumController::class, 'adminAssignRole']);
    Route::post('/practicum/admin/user', [PracticumController::class, 'adminAddUser']);
});
