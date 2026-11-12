<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | Do Campo à Mesa</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7f4ec;
            font-family: Arial, sans-serif;
            color: #203c29;
        }

        .login {
            width: 100%;
            max-width: 400px;
            padding: 35px;
            margin: 20px;
            background: white;
            border: 1px solid #e4ddce;
            border-radius: 16px;
        }

        h1 { margin-bottom: 8px; }

        p { color: #647067; }

        label {
            display: block;
            margin: 20px 0 8px;
        }

        input {
            width: 100%;
            padding: 12px;
            box-sizing: border-box;
            border: 1px solid #ccc;
            border-radius: 7px;
        }

        button {
            width: 100%;
            margin-top: 25px;
            padding: 13px;
            background: #285b3b;
            color: white;
            border: none;
            border-radius: 7px;
            cursor: pointer;
        }

        .erro { color: #b42318; }
    </style>
</head>
<body>
    <main class="login">
        <h1>Do Campo à Mesa</h1>
        <p>Backoffice Administrativo</p>

        @if ($errors->any())
            <p class="erro" role="alert">
                {{ $errors->first() }}
            </p>
        @endif

        <form method="POST" action="{{ route('login.post') }}">
            @csrf

            <label for="email">Email</label>
            <input
                type="email"
                id="email"
                name="email"
                value="{{ old('email') }}"
                autocomplete="username"
                required
            >

            <label for="password">Palavra-passe</label>
            <input
                type="password"
                id="password"
                name="password"
                autocomplete="current-password"
                required
            >

            <button type="submit">Entrar</button>
        </form>
    </main>
</body>
</html>
