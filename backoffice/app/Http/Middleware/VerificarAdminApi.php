<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class VerificarAdminApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->session()->get('api_token');

        if (!$token) {
            return redirect()->route('login');
        }

        try {
            $resposta = Http::withToken($token)
                ->timeout(10)
                ->get(
                    rtrim(config('services.express_api.base_url'), '/')
                    . '/auth/eu'
                );

            if (!$resposta->successful() ||
                $resposta->json('papel') !== 'admin') {
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login');
            }
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            abort(503, 'API temporariamente indisponível.');
        }

        return $next($request);
    }
}
