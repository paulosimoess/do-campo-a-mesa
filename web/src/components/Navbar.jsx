import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';

export default function Navbar() {
  const { utilizador, sair } = useAuth();
  const { linhas } = useCarrinho();

  const navigate = useNavigate();

  function terminarSessao() {
    sair();
    navigate('/', { replace: true });
  }

  return (
    <header className="barra-topo">
      <nav
        className="navbar navbar-expand-lg container-xl"
        aria-label="Navegação principal"
      >
        <Link to="/" className="navbar-brand marca">
          Do Campo à Mesa
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menu"
          aria-controls="menu"
          aria-expanded="false"
          aria-label="Abrir menu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="menu">
          <ul className="navbar-nav me-auto navegacao-principal">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link">
                Início
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/produtos" className="nav-link">
                Produtos
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/leiloes" className="nav-link">
                Leilões
              </NavLink>
            </li>

            {utilizador?.papel === 'comprador' && (
              <li className="nav-item">
                <NavLink to="/encomendas" className="nav-link">
                  Encomendas
                </NavLink>
              </li>
            )}
          </ul>

          <div className="navbar-acoes">
            {utilizador ? (
              <>
                {['produtor', 'admin'].includes(utilizador.papel) && (
                  <NavLink
                    to={utilizador.papel === 'admin' ? '/admin' : '/produtor'}
                    end
                    className="nav-link">
                    Painel
                  </NavLink>
                )}

                {['produtor', 'comprador'].includes(utilizador.papel) && (
                  <NavLink
                    to={
                      utilizador.papel === 'produtor'
                        ? '/produtor/perfil'
                        : '/comprador/perfil'
                    }
                    className="nav-link"
                  >
                    Perfil
                  </NavLink>
                )}

                {utilizador?.papel === 'comprador' && (
                  <Link to="/carrinho" className="btn btn-outline-secondary">
                    Carrinho ({linhas.length})
                  </Link>
                )}

                <button
                  type="button"
                  className="btn btn-outline-secondary navbar-btn-sair"
                  onClick={terminarSessao}
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-secondary">
                  Entrar
                </Link>

                <Link to="/registo" className="btn btn-success">
                  Registar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}