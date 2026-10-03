// Visitante: catálogo com pesquisa e filtros
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartaoProduto from '../components/CartaoProduto.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import produtosSimulados from '../data/produtos.json';

const CATEGORIAS = ['Todos', 'Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria'];

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState({
    q: '',
    categoria: 'Todos',
    bio: false
  });
  const [erro, setErro] = useState('');

  const carrinho = useCarrinho();
  const { utilizador } = useAuth();

  useEffect(() => {
    if (USAR_DADOS_SIMULADOS) {
      setProdutos(
        produtosSimulados.filter((p) =>
          (filtro.categoria === 'Todos' || p.categoria === filtro.categoria) &&
          (!filtro.bio || p.biologico) &&
          p.nome.toLowerCase().includes(filtro.q.toLowerCase())
        )
      );

      return;
    }

    const q = new URLSearchParams(filtro);

    api(`/products?${q}`)
      .then(setProdutos)
      .catch((e) => setErro(e.message));
  }, [filtro]);

  const mudar = (campo) => (e) =>
    setFiltro((f) => ({
      ...f,
      [campo]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value
    }));

  return (
    <>
      <section className="destaque">
        <div className="destaque__conteudo">
          <p className="destaque__etiqueta">
            PRODUTORES LOCAIS · ALTO MINHO
          </p>

          <h1>Direto de quem produz, para a sua mesa.</h1>

          <p className="destaque__descricao">
            Descubra produtos locais, conheça quem os produz e acompanhe
            lotes sazonais em leilão, tudo num só lugar.
          </p>

          <div className="destaque__acoes">
            <a href="#produtos" className="btn btn-success">
              Explorar produtos
            </a>

            <Link to="/leiloes" className="btn btn-outline-secondary">
              Ver leilões
            </Link>
          </div>
        </div>
      </section>

      <section
        id="produtos"
        className="seccao-produtos"
        aria-labelledby="titulo-produtos"
      >
        <div className="seccao-produtos__cabecalho">
          <p className="seccao-produtos__etiqueta">CATÁLOGO</p>

          <h2 id="titulo-produtos">Produtos locais</h2>

          <p className="seccao-produtos__descricao">
            Encontre produtos frescos diretamente dos produtores da região.
          </p>
        </div>

        <section className="filtros" aria-label="Filtros">
          <label className="visually-hidden" htmlFor="pesquisa">
            Pesquisar
          </label>

          <input
            id="pesquisa"
            type="search"
            className="form-control"
            placeholder="Pesquisar kiwi, mel, Alvarinho…"
            value={filtro.q}
            onChange={mudar('q')}
          />

          <div className="filtros-categorias">
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                type="button"
                className={`filtro-categoria ${
                  filtro.categoria === c ? 'ativo' : ''
                }`}
                onClick={() =>
                  setFiltro((f) => ({
                    ...f,
                    categoria: c
                  }))
                }
              >
                {c}
              </button>
            ))}
          </div>

          <div className="form-check">
            <input
              id="bio"
              className="form-check-input"
              type="checkbox"
              checked={filtro.bio}
              onChange={mudar('bio')}
            />

            <label className="form-check-label" htmlFor="bio">
              Só biológico
            </label>
          </div>

          {/* TODO: filtros por época, preço máximo e ordenação */}
        </section>

        {erro && (
          <div className="alert alert-danger">
            {erro}
          </div>
        )}

        <div className="grelha-produtos" aria-label="Produtos">
          {produtos.map((p) => (
            <CartaoProduto
              key={p._id}
              produto={p}
              onAdicionar={
                utilizador?.papel === 'comprador'
                  ? () => carrinho.adicionar(p)
                  : undefined
              }
            />
          ))}
        </div>

        {produtos.length === 0 && (
          <p className="texto-secundario">
            Nenhum produto encontrado.
          </p>
        )}
      </section>
    </>
  );
}