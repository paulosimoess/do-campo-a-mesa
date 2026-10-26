import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EstadoEncomenda from '../components/EstadoEncomenda.jsx';
import FormularioAvaliacao from '../components/FormularioAvaliacao.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { api } from '../api/client.js';

const euro = (valor) =>
  Number(valor || 0).toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  });

function nomeProdutor(produtor) {
  if (!produtor) return 'Produtor';
  if (typeof produtor === 'string') return produtor;

  return (
    produtor.produtor?.nomeExploracao ||
    produtor.nome ||
    'Produtor'
  );
}

function agruparCompras(encomendas) {
  const grupos = new Map();

  for (const encomenda of encomendas) {
    const chave = encomenda.compraId
      ? `compra-${encomenda.compraId}`
      : `encomenda-${encomenda._id}`;

    if (!grupos.has(chave)) {
      grupos.set(chave, {
        chave,
        compraId: encomenda.compraId || null,
        encomendas: []
      });
    }

    grupos.get(chave).encomendas.push(encomenda);
  }

  return [...grupos.values()].map((grupo) => ({
    ...grupo,
    total:
      grupo.encomendas.reduce(
        (soma, encomenda) =>
          soma + Math.round(Number(encomenda.total || 0) * 100),
        0
      ) / 100
  }));
}

function chaveAvaliacao(encomendaId, produtoId = null) {
  return `${String(encomendaId)}:${produtoId ? String(produtoId) : 'produtor'}`;
}

function produtosAvaliaveis(linhas = []) {
  const produtos = new Map();

  for (const linha of linhas) {
    const referencia = linha.produto?._id || linha.produto;

    if (!referencia) continue;

    const produtoId = String(referencia);

    if (!produtos.has(produtoId)) {
      produtos.set(produtoId, {
        id: produtoId,
        nome: linha.nome || 'Produto'
      });
    }
  }

  return [...produtos.values()];
}

function ItemAvaliacao({
  encomenda,
  titulo,
  produtoId = null,
  token,
  avaliacao,
  formularioAberto,
  setFormularioAberto,
  onAvaliada
}) {
  const chave = chaveAvaliacao(encomenda._id, produtoId);
  const aberto = formularioAberto === chave;
  const tipo = produtoId ? 'produto' : 'produtor';

  return (
    <div className="py-2">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <p className="fw-semibold mb-1">{titulo}</p>

          {avaliacao && (
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span
                className="text-warning fs-5"
                role="img"
                aria-label={`${avaliacao.classificacao} de 5 estrelas`}
              >
                {'★'.repeat(avaliacao.classificacao)}
                {'☆'.repeat(5 - avaliacao.classificacao)}
              </span>

              <span className="texto-secundario">
                {avaliacao.classificacao}/5
              </span>
            </div>
          )}
        </div>

        {avaliacao ? (
          <span className="badge text-bg-success">
            Avaliado
          </span>
        ) : !aberto ? (
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            onClick={() => setFormularioAberto(chave)}
          >
            Avaliar {tipo}
          </button>
        ) : null}
      </div>

      {avaliacao?.comentario && (
        <p className="texto-secundario mt-2 mb-0">
          {avaliacao.comentario}
        </p>
      )}

      {!avaliacao && aberto && (
        <FormularioAvaliacao
          key={chave}
          encomenda={encomenda}
          produtoId={produtoId}
          nomeProduto={produtoId ? titulo : ''}
          token={token}
          onAvaliada={onAvaliada}
          onCancelar={() => setFormularioAberto(null)}
        />
      )}
    </div>
  );
}

export default function Encomendas() {
  const { token } = useAuth();
  const socket = useSocket();
  const [encomendas, setEncomendas] = useState([]);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);
  const [avaliacoesPorAlvo, setAvaliacoesPorAlvo] = useState({});
  const [formularioAberto, setFormularioAberto] = useState(null);
  const [searchParams] = useSearchParams();
  const encomendaSelecionada = searchParams.get('encomenda');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setErro('');

        const [dados, minhasAvaliacoes] = await Promise.all([
          api('/orders', { token }),
          api('/reviews/minhas', { token })
        ]);

        if (ativo) {
          setEncomendas(dados);

          const avaliacoesMap = Object.fromEntries(
            minhasAvaliacoes
              .filter((avaliacao) => avaliacao.encomenda)
              .map((avaliacao) => [
                chaveAvaliacao(
                  avaliacao.encomenda,
                  avaliacao.produto
                ),
                avaliacao
              ])
          );

          setAvaliacoesPorAlvo(avaliacoesMap);
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

  function avaliacaoConcluida(avaliacao) {
    const chave = chaveAvaliacao(
      avaliacao.encomenda,
      avaliacao.produto
    );

    setAvaliacoesPorAlvo((anteriores) => ({
      ...anteriores,
      [chave]: avaliacao
    }));

    setFormularioAberto(null);
  }

  const gruposCompras = agruparCompras(encomendas);

  return (
    <section className="encomendas">
      <div className="encomendas__cabecalho">
        <div>
          <p className="encomendas__etiqueta">
            ENCOMENDAS
          </p>

          <h1>As minhas encomendas</h1>

          <p className="texto-secundario">
            Acompanhe o estado das suas encomendas e consulte
            compras anteriores.
          </p>
        </div>
      </div>

      {aCarregar && (
        <p className="texto-secundario">
          A carregar encomendas...
        </p>
      )}

      {erro && (
        <div className="alert alert-danger" role="alert">
          {erro}
        </div>
      )}

      {!aCarregar && !erro && encomendas.length === 0 && (
        <p className="texto-secundario">
          Ainda não tem encomendas.
        </p>
      )}

      <div className="encomendas__lista">
        {gruposCompras.map((grupo) => (
          <div
            key={grupo.chave}
            className={`compra-grupo ${
              !grupo.compraId ? 'compra-grupo--antiga' : ''
            }`}
          >
            {grupo.compraId && (
              <div className="compra-grupo__cabecalho">
                <div>
                  <p className="compra-grupo__etiqueta">
                    Compra #{String(grupo.compraId).slice(-6)}
                  </p>

                  <p className="texto-secundario mb-0">
                    {grupo.encomendas.length}{' '}
                    {grupo.encomendas.length === 1
                      ? 'produtor'
                      : 'produtores'}
                  </p>
                </div>

                <strong className="compra-grupo__total">
                  {euro(grupo.total)}
                </strong>
              </div>
            )}

            <div className="compra-grupo__encomendas">
              {grupo.encomendas.map((encomenda) => {
                const produtos = produtosAvaliaveis(
                  encomenda.linhas
                );

                return (
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
                            Não existem produtos associados a esta
                            encomenda.
                          </p>
                        )}
                      </div>
                    </details>

                    <EstadoEncomenda
                      estado={encomenda.estado}
                    />

                    {encomenda.estado === 'entregue' && (
                      <div className="encomenda-cartao__acoes">
                        <h3 className="h6 mb-3">
                          Avaliações
                        </h3>

                        <div className="border rounded-3 p-3 mb-3">
                          <h4 className="h6 mb-2">
                            Produtos
                          </h4>

                          {produtos.length === 0 && (
                            <p className="texto-secundario mb-0">
                              Não existem produtos disponíveis
                              para avaliação.
                            </p>
                          )}

                          {produtos.map((produto) => {
                            const chave = chaveAvaliacao(
                              encomenda._id,
                              produto.id
                            );

                            return (
                              <ItemAvaliacao
                                key={chave}
                                encomenda={encomenda}
                                titulo={produto.nome}
                                produtoId={produto.id}
                                token={token}
                                avaliacao={
                                  avaliacoesPorAlvo[chave]
                                }
                                formularioAberto={formularioAberto}
                                setFormularioAberto={
                                  setFormularioAberto
                                }
                                onAvaliada={avaliacaoConcluida}
                              />
                            );
                          })}
                        </div>

                        <div className="border rounded-3 p-3">
                          <h4 className="h6 mb-2">
                            Produtor
                          </h4>

                          <ItemAvaliacao
                            encomenda={encomenda}
                            titulo={nomeProdutor(
                              encomenda.produtor
                            )}
                            token={token}
                            avaliacao={
                              avaliacoesPorAlvo[
                                chaveAvaliacao(encomenda._id)
                              ]
                            }
                            formularioAberto={formularioAberto}
                            setFormularioAberto={
                              setFormularioAberto
                            }
                            onAvaliada={avaliacaoConcluida}
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
