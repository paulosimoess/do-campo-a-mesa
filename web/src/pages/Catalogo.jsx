// Visitante: catálogo com pesquisa e filtros
import { useEffect, useState } from 'react';
import CartaoProduto from '../components/CartaoProduto.jsx';
import { useCarrinho } from '../context/CarrinhoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, USAR_DADOS_SIMULADOS } from '../api/client.js';
import produtosSimulados from '../data/produtos.json';

const CATEGORIAS = ['Todos', 'Hortícolas', 'Fruta', 'Mel', 'Vinho', 'Queijo', 'Padaria', 'Outros'];

export default function Catalogo() {
  const [produtos, setProdutos] = useState([]);
  const [filtro, setFiltro] = useState({
    q: '',
    categoria: 'Todos',
    bio: false,
    epoca: ''
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
          (!filtro.epoca || p.epocas?.includes(filtro.epoca)) &&
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
            placeholder="Pesquisar kiwi, mel, Horta, Alvarinho…"
            value={filtro.q}
            onChange={mudar('q')}
          />

          <div className="filtros-linha">
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

            <div className="filtros-opcoes">
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

              <div className="filtro-epoca">
                <label htmlFor="epoca">
                  Época
                </label>

                <select
                  id="epoca"
                  className="form-select form-select-sm"
                  value={filtro.epoca}
                  onChange={mudar('epoca')}
                >
                  <option value="">Todas as épocas</option>
                  <option value="Primavera">Primavera</option>
                  <option value="Verão">Verão</option>
                  <option value="Outono">Outono</option>
                  <option value="Inverno">Inverno</option>
                </select>
              </div>
            </div>
          </div>
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