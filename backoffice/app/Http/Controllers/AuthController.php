<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class AuthController extends Controller
{
    public function mostrarLogin(): View
    {
        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $dados = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string']
        ]);

        try {
            $resposta = Http::timeout(10)->post(
                rtrim(config('services.express_api.base_url'), '/') . '/auth/login',
                $dados
            );

            if (!$resposta->successful()) {
                return back()->withErrors([
                    'email' => 'Credenciais inválidas.'
                ])->onlyInput('email');
            }

            $utilizador = $resposta->json('utilizador');
            $token = $resposta->json('token');

            if (
                !is_array($utilizador) ||
                ($utilizador['papel'] ?? null) !== 'admin' ||
                !is_string($token) ||
                $token === ''
            ) {
                return back()->withErrors([
                    'email' => 'Acesso reservado a administradores.'
                ])->onlyInput('email');
            }

            $request->session()->regenerate();

            $request->session()->put([
                'api_token' => $token,
                'admin_id' => (string) (
                    $utilizador['id'] ?? $utilizador['_id'] ?? ''
                ),
                'admin_nome' => $utilizador['nome'] ?? 'Administrador'
            ]);

            return redirect()->route('dashboard');

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            return back()->withErrors([
                'email' => 'Não foi possível comunicar com a API.'
            ])->onlyInput('email');
        }
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
