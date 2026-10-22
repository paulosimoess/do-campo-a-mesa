
import { Link } from 'react-router-dom';
import { useNotificacoes } from '../hooks/useNotificacoes.js';

export default function Notificacoes() {
  const {
    notificacoes,
    removerNotificacao
  } = useNotificacoes();

  if (notificacoes.length === 0) {
    return null;
  }

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{
        zIndex: 1080,
        width: '100%',
        maxWidth: '400px'
      }}
      aria-live="polite"
    >
      {notificacoes.map((notificacao) => (
        <div
          key={notificacao.id}
          className="alert alert-success shadow-sm mb-2"
          role="status"
        >
          <div className="d-flex justify-content-between gap-3">
            <div>
              <strong>{notificacao.titulo}</strong>

              <p className="mb-2 mt-2">
                {notificacao.mensagem}
              </p>

              <Link
                to={notificacao.destino}
                className="alert-link"
                onClick={() =>
                  removerNotificacao(notificacao.id)
                }
              >
                Ver encomenda
              </Link>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Fechar notificação"
              onClick={() =>
                removerNotificacao(notificacao.id)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
