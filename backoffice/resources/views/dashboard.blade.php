@extends('layouts.app')

@section('titulo', 'Do Campo à Mesa')

@section('conteudo')

    <h2>Dashboard</h2>

    <p class="subtitulo">
        Estatísticas gerais da plataforma
    </p>

    @if ($erro)
        <div class="mensagem mensagem-erro" role="alert">
            {{ $erro }}
        </div>
    @endif

    <section class="cartoes">

        <article class="cartao">
            <p class="subtitulo">Utilizadores</p>
            <strong class="numero">
                {{ $estatisticas['utilizadores'] ?? '—' }}
            </strong>
        </article>

        <article class="cartao">
            <p class="subtitulo">Produtores</p>
            <strong class="numero">
                {{ $estatisticas['produtores'] ?? '—' }}
            </strong>
        </article>

        <article class="cartao">
            <p class="subtitulo">Encomendas hoje</p>
            <strong class="numero">
                {{ $estatisticas['encomendasHoje'] ?? '—' }}
            </strong>
        </article>

        <article class="cartao">
            <p class="subtitulo">Leilões ativos</p>
            <strong class="numero">
                {{ $estatisticas['leiloesAtivos'] ?? '—' }}
            </strong>
        </article>

    </section>

@endsection
