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

// Protected Practicum Workflows
Route::middleware('auth')->group(function () {
    Route::get('/practicum/state', [PracticumController::class, 'getState']);
    Route::post('/practicum/attendance', [PracticumController::class, 'recordAttendance']);
    Route::post('/practicum/application', [PracticumController::class, 'updateApplication']);
    Route::post('/practicum/task', [PracticumController::class, 'createTask']);
    Route::post('/practicum/task/{id}/toggle', [PracticumController::class, 'toggleTask']);
    Route::post('/practicum/journal', [PracticumController::class, 'createJournal']);
    Route::post('/practicum/report', [PracticumController::class, 'createReport']);
    Route::post('/practicum/requirement', [PracticumController::class, 'uploadRequirement']);
    Route::post('/practicum/evaluation', [PracticumController::class, 'saveEvaluation']);
    Route::post('/practicum/feedback', [PracticumController::class, 'saveFeedback']);
    Route::post('/practicum/review-attendance', [PracticumController::class, 'reviewAttendance']);
    Route::post('/practicum/review-journal', [PracticumController::class, 'reviewJournal']);
    Route::post('/practicum/update-placement', [PracticumController::class, 'updatePlacement']);
    Route::post('/practicum/admin/user', [PracticumController::class, 'adminAddUser']);
});
