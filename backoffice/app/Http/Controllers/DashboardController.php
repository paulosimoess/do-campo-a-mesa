<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $estatisticas = null;
        $erro = null;

        try {
            $resposta = Http::withToken(
                $request->session()->get('api_token')
            )
                ->acceptJson()
                ->timeout(10)
                ->get(
                    rtrim(
                        config('services.express_api.base_url'),
                        '/'
                    ) . '/admin/estatisticas'
                );

            if ($resposta->successful()) {
                $estatisticas = $resposta->json();
            } else {
                $erro = 'Não foi possível obter as estatísticas da API.';
            }
        } catch (ConnectionException $e) {
            $erro = 'A API está temporariamente indisponível.';
        }

        return view('dashboard', [
            'estatisticas' => $estatisticas,
            'erro' => $erro
        ]);
    }
}
