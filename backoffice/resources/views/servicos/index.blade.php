@extends('layouts.app')

@section('titulo', 'Serviços Cloud')

@section('conteudo')

    <div class="barra">
        <div>
            <h2>Estado da infraestrutura</h2>

            <p class="subtitulo">
                Disponibilidade dos serviços utilizados pela plataforma.
            </p>
        </div>

        <form method="POST" action="{{ route('servicos.atualizar') }}">
            @csrf

            <button type="submit" class="botao">
                Atualizar estados
            </button>
        </form>

    </div>

    @if (!empty($mensagem))
        <div class="mensagem mensagem-sucesso" role="status">
            {{ $mensagem }}
        </div>
    @endif

    @if ($erro)
        <div class="mensagem mensagem-erro" role="alert">
            {{ $erro }}
        </div>
    @endif

    @php
        $servicos = [
            'api' => 'API Express',
            'mongodb' => 'MongoDB Atlas',
            'socketio' => 'Socket.IO',
            'storage' => 'Supabase Storage',
            'swagger' => 'Swagger UI'
        ];
    @endphp

    <section class="cartoes cartoes-servicos" aria-label="Estado dos serviços">

        @foreach ($servicos as $chave => $nome)
            @php
                $dados = $estados[$chave] ?? [];
                $estado = $dados['estado'] ?? 'desconhecido';

                $classe = in_array(
                    $estado,
                    ['operacional', 'indisponivel']
                ) ? $estado : 'desconhecido';

                $textoEstado = match ($classe) {
                    'operacional' => 'Operacional',
                    'indisponivel' => 'Indisponível',
                    default => 'Desconhecido'
                };
            @endphp

            <article class="cartao">
                <div class="barra">
                    <h3>{{ $nome }}</h3>

                    <span class="estado estado-{{ $classe }}">
                        {{ $textoEstado }}
                    </span>
                </div>

                <p class="detalhe">
                    {{ $dados['servico'] ?? $nome }}
                </p>

                @if (isset($dados['clientesLigados']))
                    <p class="detalhe">
                        <strong>{{ $dados['clientesLigados'] }}</strong>
                        ligações ativas
                    </p>
                @endif

                @if (isset($dados['tempoRespostaMs']))
                    <p class="detalhe">
                        Tempo de verificação:
                        <strong>
                            {{ $dados['tempoRespostaMs'] }} ms
                        </strong>
                    </p>
                @endif
            </article>
        @endforeach

    </section>

    <footer class="rodape">
        <p>
            Última consulta: {{ $verificadoEm }}
        </p>

        <p>
            Os estados representam verificações da aplicação
            e das suas integrações, não a disponibilidade
            global dos fornecedores cloud.
        </p>
    </footer>

@endsection
