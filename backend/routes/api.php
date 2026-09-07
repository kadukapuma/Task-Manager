<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::patch('/users/{user}', [UserController::class, 'update']);
        Route::patch('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::patch('/customers/{customer}', [CustomerController::class, 'update']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/mine', [TaskController::class, 'mine']);
    Route::get('/tasks/unassigned', [TaskController::class, 'unassigned']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::post('/tasks/{task}/start', [TaskController::class, 'start']);
    Route::post('/tasks/{task}/pause', [TaskController::class, 'pause']);
    Route::post('/tasks/{task}/complete', [TaskController::class, 'complete']);
    Route::post('/tasks/{task}/pick-up', [TaskController::class, 'pickUp']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
});
