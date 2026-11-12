@extends('layouts.app')

@section('titulo', 'Histórico de Auditoria')

@section('conteudo')

<section class="cartao">
    <h2>Operações administrativas</h2>

    <p class="subtitulo">
        Histórico das operações registadas através do Eloquent.
    </p>

    @if ($registos->isEmpty())
        <p>Ainda não existem operações registadas.</p>
    @else

        <div class="tabela-container">
            <table class="tabela">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Administrador</th>
                        <th>Operação</th>
                        <th>Entidade</th>
                        <th>Resultado</th>
                    </tr>
                </thead>

                <tbody>
                    @foreach ($registos as $registo)
                        <tr>
                            <td>
                                {{ $registo->created_at->format('d/m/Y H:i') }}
                            </td>

                            <td>
                                {{ $registo->administrador_nome }}
                            </td>

                            <td>
                                {{ match($registo->acao) {
                                    'aprovar_produtor' => 'Aprovar produtor',
                                    'rejeitar_produtor' => 'Rejeitar produtor',
                                    'verificar_servicos' => 'Verificação dos serviços cloud',
                                    default => $registo->acao
                                } }}
                            </td>

                            <td>
                                {{ ucfirst($registo->entidade) }}
                                <br>

                                <small class="subtitulo">
                                    {{ $registo->entidade_id }}
                                </small>
                            </td>

                            <td>    
                                @php
                                    $classeResultado = match($registo->resultado) {
                                        'sucesso' => 'estado-operacional',
                                        'falha' => 'estado-indisponivel',
                                        default => 'estado-desconhecido'
                                    };
                                @endphp

                                <span class="estado {{ $classeResultado }}">
                                    {{ ucfirst($registo->resultado) }}
                                </span>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        @if ($registos->hasPages())
            <nav class="paginacao" aria-label="Paginação">

                @if ($registos->onFirstPage())
                    <span class="desativado">Anterior</span>
                @else
                    <a href="{{ $registos->previousPageUrl() }}">
                        Anterior
                    </a>
                @endif

                <span>
                    Página {{ $registos->currentPage() }}
                    de {{ $registos->lastPage() }}
                </span>

                @if ($registos->hasMorePages())
                    <a href="{{ $registos->nextPageUrl() }}">
                        Seguinte
                    </a>
                @else
                    <span class="desativado">Seguinte</span>
                @endif

            </nav>
        @endif

    @endif
</section>

@endsection
