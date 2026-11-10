// Produtor: painel de gestão
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import EstadoEncomenda from '../../components/EstadoEncomenda.jsx';

const euro = (valor) =>
  Number(valor || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

export default function PainelProdutor() {
  const { token, utilizador } = useAuth();
  const [encomendas, setEncomendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [avaliacao, setAvaliacao] = useState({
    media: null,
    total: 0
  });
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);
  const [leiloes, setLeiloes] = useState([]);
  const [estadoValidacao, setEstadoValidacao] = useState(null);

  useEffect(() => {
    if (!token || !utilizador?.id) return;

    let cancelado = false;

    async function carregarDados() {
      try {
        setErro('');
        setACarregar(true);

        const contaAtual = await api('/auth/eu', { token });

        if (cancelado) return;

        if (contaAtual.produtor?.rejeitado) {
          setEstadoValidacao('rejeitado');
          return;
        }

        if (!contaAtual.produtor?.validado) {
          setEstadoValidacao('pendente');
          return;
        }

        setEstadoValidacao('aprovado');

        const [
          listaEncomendas,
          listaProdutos,
          dadosProdutor,
          listaLeiloes
        ] = await Promise.all([
          api('/orders', { token }),
          api(`/products?produtor=${utilizador.id}`),
          api(`/producers/${utilizador.id}`),
          api('/auctions')
        ]);

        if (cancelado) return;

        setEncomendas(listaEncomendas);
        setProdutos(listaProdutos);
        setLeiloes(listaLeiloes);

        setAvaliacao({
          media: dadosProdutor.avaliacaoMedia ?? null,
          total: dadosProdutor.totalAvaliacoes ?? 0
        });
      } catch (err) {
        if (!cancelado) {
          setErro(err.message);
        }
      } finally {
        if (!cancelado) {
          setACarregar(false);
        }
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
    };
  }, [token, utilizador?.id]);

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

const agora = new Date();

const encomendasDoMes = encomendas.filter((encomenda) => {
  if (encomenda.estado !== 'entregue' || !encomenda.entregueEm) {
    return false;
  }

  const dataEntrega = new Date(encomenda.entregueEm);

  return (
    !Number.isNaN(dataEntrega.getTime()) &&
    dataEntrega.getMonth() === agora.getMonth() &&
    dataEntrega.getFullYear() === agora.getFullYear()
  );
});

const vendasMes = encomendasDoMes.reduce(
  (total, encomenda) =>
    total +
    (encomenda.linhas || []).reduce(
      (subtotal, linha) =>
        subtotal +
        Number(linha.precoUnit || 0) *
          Number(linha.quantidade || 0),
      0
    ),
  0
);

const porTratar = encomendas.filter(
  (e) => e.estado !== 'entregue'
).length;

const pendentes = encomendas.filter(
  (e) => e.estado === 'pendente'
).length;

const produtosAtivos = produtos.filter(
  (p) => Number(p.stock) > 0
).length;

const LIMITE_STOCK_BAIXO = 15;

const produtosStockBaixo = produtos.filter(
  (p) => Number(p.stock) <= LIMITE_STOCK_BAIXO
);

const mediaFormatada =
  avaliacao.media == null
    ? '—'
    : Number(avaliacao.media).toFixed(1).replace('.', ',');

const indicadores = [
  {
    titulo: 'Vendas este mês',
    valor: euro(vendasMes),
    detalhe: `${encomendasDoMes.length} encomendas entregues`
  },
  {
    titulo: 'Encomendas por tratar',
    valor: String(porTratar),
    detalhe: `${pendentes} pendentes`
  },
  {
    titulo: 'Produtos ativos',
    valor: String(produtosAtivos),
    detalhe: `${produtosStockBaixo.length} com stock baixo ou esgotado`
  },
  {
    titulo: 'Avaliação média',
    valor: mediaFormatada,
    detalhe: `${avaliacao.total} avaliações`
  }
];

{!aCarregar && !erro && produtosStockBaixo.length > 0 && (
  <div className="alert alert-warning mt-4" role="status">
    <strong>Atenção ao stock!</strong>
    <p className="mb-2">
      Os seguintes produtos têm stock igual ou inferior a {LIMITE_STOCK_BAIXO}:
    </p>

    <ul className="mb-0">
      {produtosStockBaixo.map((produto) => (
        <li key={produto._id}>
          {produto.nome} — {produto.stock} {produto.unidade}
        </li>
      ))}
    </ul>
  </div>
)}

const leiloesDoProdutor = leiloes
  .filter((leilao) => {
    const produtorId =
      leilao.produtor?._id ?? leilao.produtor;

    return (
      String(produtorId) === String(utilizador?.id) &&
      ['ativo', 'agendado'].includes(leilao.estado)
    );
  })
  .sort((a, b) => {
    if (a.estado !== b.estado) {
      return a.estado === 'ativo' ? -1 : 1;
    }

    return new Date(a.iniciaEm) - new Date(b.iniciaEm);
  });

  if (
    estadoValidacao === 'rejeitado' ||
    estadoValidacao === 'pendente'
  ) {
    const rejeitado = estadoValidacao === 'rejeitado';

    return (
      <section className="painel-produtor">
        <div className="painel-produtor__cabecalho">
          <div>
            <p className="painel-produtor__etiqueta">
              ÁREA DO PRODUTOR
            </p>

            <h1>Estado da conta</h1>

            <p className="texto-secundario">
              Consulte o estado da validação da sua exploração.
            </p>
          </div>
        </div>

        <div
          className={`alert ${
            rejeitado ? 'alert-danger' : 'alert-warning'
          } mt-4`}
          role="status"
        >
          <strong>
            {rejeitado
              ? 'Registo de produtor rejeitado'
              : 'Registo a aguardar validação'}
          </strong>

          <p className="mb-0 mt-2">
            {rejeitado
              ? 'O seu pedido de registo como produtor não foi aprovado pelo administrador. Não pode gerir produtos, encomendas ou leilões com esta conta.'
              : 'O seu pedido de registo está a aguardar validação pelo administrador.'}
          </p>
        </div>
      </section>
    );
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

      <section className="mt-5">
        <h2 className="h4 mb-3">Os meus leilões</h2>

        {!aCarregar && !erro && leiloesDoProdutor.length === 0 && (
          <p className="texto-secundario">
            Não existem leilões ativos ou agendados.
          </p>
        )}

        {!aCarregar && !erro && (
          <div className="row g-3">
            {leiloesDoProdutor.map((leilao) => (
              <div
                key={leilao._id}
                className="col-12 col-lg-6"
              >
                <article className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                      <h3 className="h5 mb-0">{leilao.lote}</h3>

                      <span
                        className={
                          leilao.estado === 'ativo'
                            ? 'badge bg-success'
                            : 'badge bg-secondary'
                        }
                      >
                        {leilao.estado === 'ativo'
                          ? 'Em direto'
                          : 'Agendado'}
                      </span>
                    </div>

                    <p className="mb-1">
                      Preço atual:{' '}
                      <strong>
                        {euro(
                          leilao.licitacaoAtual?.valor ??
                          leilao.precoBase
                        )}
                      </strong>
                    </p>

                    <p className="mb-1">
                      Licitações:{' '}
                      <strong>{leilao.numLicitacoes ?? 0}</strong>
                    </p>

                    <p className="texto-secundario small mb-3">
                      {leilao.estado === 'ativo'
                        ? 'Termina'
                        : 'Começa'}:{' '}
                      {new Date(
                        leilao.estado === 'ativo'
                          ? leilao.terminaEm
                          : leilao.iniciaEm
                      ).toLocaleString('pt-PT')}
                    </p>

                    <Link
                      to={`/leiloes/${leilao._id}`}
                      className="btn btn-outline-success w-100"
                    >
                      Acompanhar leilão
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-5">
        <h2 className="h4 mb-3">Encomendas recebidas</h2>

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

        <div className="encomendas__lista">
          {encomendas.map((encomenda) => (
            <article
              key={encomenda._id}
              className="encomenda-cartao"
            >
              <div className="encomenda-cartao__topo">
                <div>
                  <p className="encomenda-cartao__numero">
                    #{encomenda._id}
                  </p>

                  <h3 className="h5 mb-0">
                    {encomenda.comprador?.nome ||
                      'Encomenda recebida'}
                  </h3>
                </div>

                <div className="encomenda-cartao__resumo">
                  <span>
                    {new Date(
                      encomenda.createdAt
                    ).toLocaleDateString('pt-PT')}
                  </span>

                  <strong>{euro(encomenda.total)}</strong>
                </div>
              </div>

              <details className="mb-3">
                <summary
                  className="fw-semibold"
                  style={{ cursor: 'pointer' }}
                >
                  Ver produtos da encomenda
                </summary>

                <div className="border rounded-3 p-3 mt-2">
                  {encomenda.linhas?.map((linha, indice) => (
                    <div
                      key={linha._id || indice}
                      className="d-flex justify-content-between align-items-start gap-3 py-2"
                    >
                      <div>
                        <strong>{linha.nome}</strong>

                        <p className="texto-secundario mb-0">
                          {linha.quantidade}
                          {linha.unidade
                            ? ` ${linha.unidade}`
                            : ''}
                          {' × '}
                          {euro(linha.precoUnit)}
                        </p>
                      </div>

                      <strong>
                        {euro(
                          linha.quantidade * linha.precoUnit
                        )}
                      </strong>
                    </div>
                  ))}

                  {(!encomenda.linhas ||
                    encomenda.linhas.length === 0) && (
                    <p className="texto-secundario mb-0">
                      Não existem produtos associados
                      a esta encomenda.
                    </p>
                  )}
                </div>
              </details>

              <EstadoEncomenda estado={encomenda.estado} />

              {encomenda.estado !== 'entregue' && (
                <div className="encomenda-cartao__acoes">
                  {encomenda.estado === 'pendente' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        atualizarEstado(encomenda, 'confirmada')
                      }
                    >
                      Confirmar encomenda
                    </button>
                  )}

                  {encomenda.estado === 'confirmada' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        atualizarEstado(encomenda, 'pronta')
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
                        atualizarEstado(encomenda, 'entregue')
                      }
                    >
                      Marcar como entregue
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}