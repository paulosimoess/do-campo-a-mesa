import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CampoPassword from '../components/CampoPassword.jsx';

const INICIO = {
  comprador: '/',
  produtor: '/produtor',
  admin: '/admin'
};

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dados, setDados] = useState({
    email: '',
    password: ''
  });

  const [erro, setErro] = useState('');
  const [aEntrar, setAEntrar] = useState(false);

  async function submeter(e) {
    e.preventDefault();

    try {
      setErro('');
      setAEntrar(true);

      const utilizador = await entrar(
        dados.email,
        dados.password
      );

      navigate(
        location.state?.de ||
        INICIO[utilizador.papel] ||
        '/',
        { replace: true }
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAEntrar(false);
    }
  }

  return (
    <section className="registo" aria-labelledby="titulo-login">
      <div className="registo__cabecalho">
        <p className="registo__etiqueta">
          BEM-VINDO DE VOLTA
        </p>

        <h1 id="titulo-login">Entrar</h1>

        <p className="texto-secundario">
          Aceda à sua conta e continue a descobrir
          produtos locais e leilões dos nossos produtores.
        </p>
      </div>

      <form
        className="registo__formulario"
        onSubmit={submeter}
      >
        <div>
          <label htmlFor="login-email" className="form-label">
            Email
          </label>

          <input
            id="login-email"
            type="email"
            className="form-control"
            autoComplete="email"
            value={dados.email}
            onChange={(e) =>
              setDados((anterior) => ({
                ...anterior,
                email: e.target.value
              }))
            }
            required
            disabled={aEntrar}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="form-label">
            Password
          </label>

          <CampoPassword
            id="login-password"
            value={dados.password}
            onChange={(e) =>
              setDados((anterior) => ({
                ...anterior,
                password: e.target.value
              }))
            }
            autoComplete="current-password"
            disabled={aEntrar}
          />
        </div>

        {erro && (
          <div className="alert alert-danger mb-0" role="alert">
            {erro}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={aEntrar}
        >
          {aEntrar ? 'A entrar...' : 'Entrar'}
        </button>

        <p className="text-center texto-secundario mb-0">
          Ainda não tem conta?{' '}
          <Link to="/registo">
            Criar conta
          </Link>
        </p>
      </form>
    </section>
  );
}
