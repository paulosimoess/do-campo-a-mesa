<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ServicosController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Middleware\VerificarAdminApi;

Route::get('/login', [AuthController::class, 'mostrarLogin'])
    ->name('login');

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1')
    ->name('login.post');

Route::post('/logout', [AuthController::class, 'logout'])
    ->name('logout');

Route::middleware([VerificarAdminApi::class])->group(function () {

    Route::get('/', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/servicos', [ServicosController::class, 'index'])
        ->name('servicos.index');

    Route::post('/servicos/atualizar', [
        ServicosController::class,
        'atualizar'
    ])
        ->middleware('throttle:10,1')
        ->name('servicos.atualizar');

    Route::get('/auditoria', [AuditoriaController::class, 'index'])
        ->name('auditoria.index');

});
