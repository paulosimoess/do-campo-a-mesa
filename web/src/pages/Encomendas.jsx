import { useEffect, useState } from 'react';

import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useSearchParams } from 'react-router-dom';

const euro = (valor) =>
  Number(valor || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

function nomeProdutor(produtor) {
  if (!produtor) {
    return 'Produtor';
  }

  if (typeof produtor === 'string') {
    return produtor;
  }

  return (
    produtor.produtor?.nomeExploracao ||
    produtor.nome ||
    'Produtor'
  );
}

export default function Encomendas() {
  const { token } = useAuth();
  const socket = useSocket();

  const [encomendas, setEncomendas] = useState([]);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);

  const [searchParams] = useSearchParams();
  const encomendaSelecionada = searchParams.get('encomenda');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setErro('');

        const dados = await api('/orders', {
          token
        });

        if (ativo) {
          setEncomendas(dados);
        }
      } catch (err) {
        if (ativo) {
          setErro(err.message);
        }
      } finally {
        if (ativo) {
          setACarregar(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [token]);

  useEffect(() => {
    if (!socket) return undefined;

    function onEncomendaAtualizada({ id, estado }) {
      setEncomendas((anteriores) =>
        anteriores.map((encomenda) =>
          String(encomenda._id) === String(id)
            ? { ...encomenda, estado }
            : encomenda
        )
      );
    }

    socket.on('encomenda-atualizada', onEncomendaAtualizada);

    return () => {
      socket.off('encomenda-atualizada', onEncomendaAtualizada);
    };
  }, [socket]);

  useEffect(() => {
    if (aCarregar || !encomendaSelecionada) return;

    const elemento = document.getElementById(
      `encomenda-${encomendaSelecionada}`
    );

    elemento?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, [aCarregar, encomendaSelecionada, encomendas.length]);

  return (
    <section className="encomendas">
      <div className="encomendas__cabecalho">
        <div>
          <p className="encomendas__etiqueta">
            COMPRAS
          </p>

          <h1>As minhas encomendas</h1>

          <p className="texto-secundario">
            Acompanhe o estado das suas encomendas e consulte compras anteriores.
          </p>
        </div>
      </div>

      {aCarregar && (
        <p className="texto-secundario">
          A carregar encomendas...
        </p>
      )}

      {erro && (
        <div className="alert alert-danger">
          {erro}
        </div>
      )}

      {!aCarregar && !erro && encomendas.length === 0 && (
        <p className="texto-secundario">
          Ainda não tem encomendas.
        </p>
      )}

      <div className="encomendas__lista">
        {encomendas.map((encomenda) => (
          <article
            key={encomenda._id}
            id={`encomenda-${encomenda._id}`}
            className={`encomenda-cartao ${
              String(encomenda._id) === encomendaSelecionada
                ? 'border border-success'
                : ''
            }`}
          >
            <div className="encomenda-cartao__topo">
              <div>
                <p className="encomenda-cartao__numero">
                  #{encomenda._id}
                </p>

                <h2>
                  {nomeProdutor(encomenda.produtor)}
                </h2>
              </div>

              <div className="encomenda-cartao__resumo">
                <span>
                  {new Date(
                    encomenda.createdAt
                  ).toLocaleDateString('pt-PT')}
                </span>

                <strong>
                  {euro(encomenda.total)}
                </strong>
              </div>
            </div>

            <EstadoEncomenda
              estado={encomenda.estado}
            />

            {encomenda.estado === 'entregue' && (
              <div className="encomenda-cartao__acoes">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                >
                  Avaliar encomenda
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
} 