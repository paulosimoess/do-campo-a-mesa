<?php

namespace App\Http\Controllers;

use App\Models\RegistoAuditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\View\View;

class ServicosController extends Controller
{
    private function consultarServicos(Request $request): array
    {
        $estados = [];
        $erro = null;

        $baseUrl = rtrim(
            config('services.express_api.base_url'),
            '/'
        );

        $origem = preg_replace('~/api/?$~', '', $baseUrl);

        try {
            $resposta = Http::withToken(
                $request->session()->get('api_token')
            )
                ->acceptJson()
                ->timeout(12)
                ->get($baseUrl . '/admin/cloud-status');

            if ($resposta->successful() && is_array($resposta->json())) {
                $estados = $resposta->json();
            } else {
                $erro = 'Não foi possível consultar os serviços da API.';
            }
        } catch (ConnectionException $e) {
            $erro = 'A API Express está indisponível.';
        }

        // Verificar Swagger UI
        $inicio = microtime(true);

        try {
            $swagger = Http::timeout(5)
                ->get($origem . '/api-docs/');

            $operacional = $swagger->successful()
                && str_contains(
                    strtolower($swagger->body()),
                    'swagger'
                );

            $estados['swagger'] = [
                'estado' => $operacional
                    ? 'operacional'
                    : 'indisponivel',
                'servico' => 'Swagger UI',
                'tempoRespostaMs' => round(
                    (microtime(true) - $inicio) * 1000
                )
            ];
        } catch (ConnectionException $e) {
            $estados['swagger'] = [
                'estado' => 'indisponivel',
                'servico' => 'Swagger UI'
            ];
        }

        return [
            'estados' => $estados,
            'erro' => $erro,
            'verificadoEm' => now()->format('d/m/Y H:i:s')
        ];
    }

    public function index(Request $request): View
    {
        return view(
            'servicos.index',
            $this->consultarServicos($request)
        );
    }

    public function atualizar(Request $request): View
    {
        $dados = $this->consultarServicos($request);

        $chaves = [
            'api',
            'mongodb',
            'socketio',
            'storage',
            'swagger'
        ];

        $operacionais = 0;

        foreach ($chaves as $chave) {
            if (
                ($dados['estados'][$chave]['estado'] ?? null)
                === 'operacional'
            ) {
                $operacionais++;
            }
        }

        $resultado = match (true) {
            $operacionais === 5 => 'sucesso',
            $operacionais === 0 => 'falha',
            default => 'parcial'
        };

        // Registar a operação com Eloquent
        try {
            RegistoAuditoria::create([
                'administrador_id' => (string) $request
                    ->session()->get('admin_id', ''),
                'administrador_nome' => $request
                    ->session()->get('admin_nome', 'Administrador'),
                'acao' => 'verificar_servicos',
                'entidade' => 'infraestrutura',
                'entidade_id' => 'cloud',
                'resultado' => $resultado
            ]);

            $dados['mensagem'] =
                'Verificação concluída e registada na auditoria.';

        } catch (\Throwable $e) {
            Log::error('Falha na auditoria da monitorização.', [
                'erro' => $e->getMessage()
            ]);

            $dados['mensagem'] =
                'Verificação concluída, mas não foi possível guardar a auditoria.';
        }

        return view('servicos.index', $dados);
    }
}
