// Produtor: painel de gestão
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

const indicadores = [
  {
    titulo: 'Vendas este mês',
    valor: '1 284 €',
    detalhe: '+15% face a setembro'
  },
  {
    titulo: 'Encomendas por tratar',
    valor: '4',
    detalhe: '2 pendentes'
  },
  {
    titulo: 'Produtos ativos',
    valor: '12',
    detalhe: '3 com stock baixo'
  },
  {
    titulo: 'Avaliação média',
    valor: '4,7',
    detalhe: '51 avaliações'
  }
];

const euro = (valor) =>
  Number(valor || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

export default function PainelProdutor() {
  const { token } = useAuth();

  const [encomendas, setEncomendas] = useState([]);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    async function carregarEncomendas() {
      try {
        setErro('');

        const dados = await api('/orders', {
          token
        });

        setEncomendas(dados);
      } catch (err) {
        setErro(err.message);
      } finally {
        setACarregar(false);
      }
    }

    carregarEncomendas();
  }, [token]);

  async function atualizarEstado(encomenda, novoEstado) {
    try {
      setErro('');

      const atualizada = await api(
        `/orders/${encomenda._id}/estado`,
        {
          metodo: 'PATCH',
          corpo: {
            estado: novoEstado
          },
          token
        }
      );

      setEncomendas((atuais) =>
        atuais.map((item) =>
          item._id === atualizada._id
            ? atualizada
            : item
        )
      );
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <section className="painel-produtor">
      <div className="painel-produtor__cabecalho">
        <div>
          <p className="painel-produtor__etiqueta">
            ÁREA DO PRODUTOR
          </p>

          <h1>Painel do produtor</h1>

          <p className="texto-secundario">
            Acompanhe a atividade da sua exploração e faça a gestão dos seus produtos.
          </p>
        </div>

        <div className="painel-produtor__acoes">
          <Link
            to="/produtor/produtos"
            className="btn btn-outline-secondary"
          >
            Gerir produtos
          </Link>

          <Link
            to="/produtor/leiloes/novo"
            className="btn btn-success"
          >
            Criar leilão
          </Link>
        </div>
      </div>

      <div className="painel-produtor__indicadores">
        {indicadores.map((indicador) => (
          <article
            key={indicador.titulo}
            className="painel-indicador"
          >
            <span>{indicador.titulo}</span>

            <strong>{indicador.valor}</strong>

            <small>{indicador.detalhe}</small>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <h2 className="h4 mb-3">
          Encomendas recebidas
        </h2>

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
            Ainda não existem encomendas para esta exploração.
          </p>
        )}

        <div className="d-grid gap-3">
          {encomendas.map((encomenda) => (
            <article
              key={encomenda._id}
              className="card"
            >
              <div className="card-body">
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <h3 className="h5">
                      Encomenda #{encomenda._id}
                    </h3>

                    <p className="mb-1">
                      Estado: <strong>{encomenda.estado}</strong>
                    </p>

                    <p className="mb-0">
                      Total: <strong>{euro(encomenda.total)}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-3 d-flex gap-2 flex-wrap">
                  {encomenda.estado === 'pendente' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        atualizarEstado(
                          encomenda,
                          'confirmada'
                        )
                      }
                    >
                      Confirmar
                    </button>
                  )}

                  {encomenda.estado === 'confirmada' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        atualizarEstado(
                          encomenda,
                          'pronta'
                        )
                      }
                    >
                      Marcar como pronta
                    </button>
                  )}

                  {encomenda.estado === 'pronta' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        atualizarEstado(
                          encomenda,
                          'entregue'
                        )
                      }
                    >
                      Marcar como entregue
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}