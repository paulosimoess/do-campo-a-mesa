import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import ImagemProduto from '../../components/ImagemProduto.jsx';

const estadoInicial = {
  nome: '',
  categoria: 'Hortícolas',
  preco: '',
  unidade: 'kg',
  stock: ''
};

export default function ProdutosProdutor() {
  const { utilizador, token } = useAuth();

  const [produtos, setProdutos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        setErro('');

        const dados = await api(
          `/products?produtor=${utilizador.id}`
        );

        setProdutos(dados);
      } catch (err) {
        setErro(err.message);
      } finally {
        setACarregar(false);
      }
    }

    carregarProdutos();
  }, [utilizador.id]);

  function alterar(campo) {
    return (e) => {
      setFormulario((anterior) => ({
        ...anterior,
        [campo]: e.target.value
      }));
    };
  }

  async function guardarProduto(e) {
    e.preventDefault();

    try {
      setErro('');
      setAGuardar(true);

      const corpo = {
        nome: formulario.nome,
        categoria: formulario.categoria,
        preco: Number(formulario.preco),
        unidade: formulario.unidade,
        stock: Number(formulario.stock || 0)
      };

      if (produtoEmEdicao) {
        const atualizado = await api(
          `/products/${produtoEmEdicao._id}`,
          {
            metodo: 'PUT',
            token,
            corpo
          }
        );

        setProdutos((atuais) =>
          atuais.map((produto) =>
            produto._id === atualizado._id
              ? atualizado
              : produto
          )
        );
      } else {
        const novoProduto = await api('/products', {
          metodo: 'POST',
          token,
          corpo
        });

        setProdutos((atuais) => [
          novoProduto,
          ...atuais
        ]);
      }

      setFormulario(estadoInicial);
      setProdutoEmEdicao(null);
      setMostrarFormulario(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setAGuardar(false);
    }
  }

  async function removerProduto(produtoId) {
    const confirmado = window.confirm(
      'Tem a certeza de que pretende remover este produto?'
    );

    if (!confirmado) {
      return;
    }

    try {
      setErro('');

      await api(`/products/${produtoId}`, {
        metodo: 'DELETE',
        token
      });

      setProdutos((atuais) =>
        atuais.filter(
          (produto) => produto._id !== produtoId
        )
      );
    } catch (err) {
      setErro(err.message);
    }
  }

  function editarProduto(produto) {
    setProdutoEmEdicao(produto);

    setFormulario({
      nome: produto.nome,
      categoria: produto.categoria,
      preco: String(produto.preco),
      unidade: produto.unidade || '',
      stock: String(produto.stock ?? 0)
    });

    setMostrarFormulario(true);
  }

  function atualizarImagemProduto(produtoId, imagemUrl) {
    setProdutos((atuais) =>
      atuais.map((produto) =>
        produto._id === produtoId
          ? { ...produto, imagemUrl }
          : produto
      )
    );

    setProdutoEmEdicao((atual) =>
      atual?._id === produtoId
        ? { ...atual, imagemUrl }
        : atual
    );
  }

  return (
    <section className="produtos-produtor">
      <div className="produtos-produtor__cabecalho">
        <div>
          <p className="produtos-produtor__etiqueta">
            CATÁLOGO DO PRODUTOR
          </p>

          <h1>Gerir produtos</h1>

          <p className="texto-secundario">
            Consulte os seus produtos, preços e stock.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success"
          onClick={() => {
            if (mostrarFormulario) {
              setMostrarFormulario(false);
              setProdutoEmEdicao(null);
              setFormulario(estadoInicial);
              return;
            }

            setProdutoEmEdicao(null);
            setFormulario(estadoInicial);
            setMostrarFormulario(true);
          }}
        >
          {mostrarFormulario
            ? 'Cancelar'
            : 'Novo produto'}
        </button>
      </div>

      {mostrarFormulario && (
        <form
          className="card card-body mb-4"
          onSubmit={guardarProduto}
        >
          <h2 className="h5 mb-3">
            {produtoEmEdicao
              ? 'Editar produto'
              : 'Novo produto'}
          </h2>

          <div className="mb-3">
            <label
              htmlFor="nome"
              className="form-label"
            >
              Nome
            </label>

            <input
              id="nome"
              type="text"
              className="form-control"
              value={formulario.nome}
              onChange={alterar('nome')}
              required
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="categoria"
              className="form-label"
            >
              Categoria
            </label>

            <select
              id="categoria"
              className="form-select"
              value={formulario.categoria}
              onChange={alterar('categoria')}
            >
              <option value="Hortícolas">
                Hortícolas
              </option>

              <option value="Fruta">
                Fruta
              </option>

              <option value="Mel">
                Mel
              </option>

              <option value="Vinho">
                Vinho
              </option>

              <option value="Queijo">
                Queijo
              </option>

              <option value="Padaria">
                Padaria
              </option>

              <option value="Outros">
                Outros
              </option>
            </select>
          </div>

          <div className="mb-3">
            <label
              htmlFor="preco"
              className="form-label"
            >
              Preço
            </label>

            <input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              value={formulario.preco}
              onChange={alterar('preco')}
              required
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="unidade"
              className="form-label"
            >
              Unidade
            </label>

            <input
              id="unidade"
              type="text"
              className="form-control"
              value={formulario.unidade}
              onChange={alterar('unidade')}
            />
          </div>

          <div className="mb-3">
            <label
              htmlFor="stock"
              className="form-label"
            >
              Stock
            </label>

            <input
              id="stock"
              type="number"
              min="0"
              className="form-control"
              value={formulario.stock}
              onChange={alterar('stock')}
            />
          </div>

          {produtoEmEdicao && (
            <div className="mb-4">
              <ImagemProduto
                produto={produtoEmEdicao}
                token={token}
                onImagemAtualizada={(imagemUrl) =>
                  atualizarImagemProduto(
                    produtoEmEdicao._id,
                    imagemUrl
                  )
                }
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-success"
            disabled={aGuardar}
          >
            {aGuardar
              ? 'A guardar...'
              : produtoEmEdicao
                ? 'Guardar alterações'
                : 'Criar produto'}
          </button>
        </form>
      )}

      {erro && (
        <div className="alert alert-danger">
          {erro}
        </div>
      )}

      {aCarregar && (
        <p className="texto-secundario">
          A carregar produtos...
        </p>
      )}

      {!aCarregar && produtos.length === 0 && (
        <p className="texto-secundario">
          Ainda não tem produtos.
        </p>
      )}

      <div className="produtos-produtor__lista">
        {produtos.map((produto) => (
          <article
            key={produto._id}
            className="produto-gestao"
          >
            <div>
              <h2>{produto.nome}</h2>

              <p className="texto-secundario">
                {produto.categoria}
                {' · '}
                {Number(produto.preco).toFixed(2)} €
                {' / '}
                {produto.unidade}
              </p>
            </div>

            <div className="produto-gestao__stock">
              <span>Stock</span>
              <strong>{produto.stock}</strong>
            </div>

            <div className="produto-gestao__acoes">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => editarProduto(produto)}
              >
                Editar
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  removerProduto(produto._id)
                }
              >
                Remover
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}