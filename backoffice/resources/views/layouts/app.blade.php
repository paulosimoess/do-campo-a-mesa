<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>@yield('titulo', 'Backoffice') | Do Campo à Mesa</title>

    <link rel="stylesheet" href="{{ asset('css/backoffice.css') }}">
</head>

<body>
    <main class="container">

        <header class="cabecalho">
            <div>
                <h1>@yield('titulo', 'Backoffice')</h1>

                <p class="subtitulo">
                    Backoffice Administrativo
                </p>
            </div>

            <nav class="navegacao" aria-label="Navegação do backoffice">
                <a
                    href="{{ route('dashboard') }}"
                    class="{{ request()->routeIs('dashboard') ? 'ativo' : '' }}"
                    @if(request()->routeIs('dashboard')) aria-current="page" @endif
                >
                    Dashboard
                </a>

                <a
                    href="{{ route('servicos.index') }}"
                    class="{{ request()->routeIs('servicos.*') ? 'ativo' : '' }}"
                    @if(request()->routeIs('servicos.*')) aria-current="page" @endif
                >
                    Serviços Cloud
                </a>

                <a
                    href="{{ route('auditoria.index') }}"
                    class="{{ request()->routeIs('auditoria.*') ? 'ativo' : '' }}"
                    @if(request()->routeIs('auditoria.*')) aria-current="page" @endif
                >
                    Auditoria
                </a>

                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="botao botao-perigo">
                        Sair
                    </button>
                </form>
            </nav>
        </header>

        @yield('conteudo')

    </main>
</body>
</html>
