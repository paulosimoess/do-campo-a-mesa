import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useSearchParams } from 'react-router-dom';
import ModalConfirmacao from '../../components/ModalConfirmacao.jsx';

const estadoInicial = {
  nome: '',
  categoria: 'Hortícolas',
  preco: '',
  unidade: 'kg',
  stock: '',
  biologico: false,
  epocas: []
};

const EPOCAS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

function urlImagem(imagemUrl) {
  if (!imagemUrl) return '';
  if (/^https?:\/\//i.test(imagemUrl)) return imagemUrl;
  if (!imagemUrl.startsWith('/uploads/')) return '';

  const base = (
    import.meta.env.VITE_API_URL || 'http://localhost:3000'
  ).replace(/\/+$/, '');

  return `${base}${imagemUrl}`;
}

export default function ProdutosProdutor() {
  const { utilizador, token } = useAuth();
  const socket = useSocket();
  const [parametros] = useSearchParams();
  const produtoDestacado = parametros.get('produto');
  const [produtos, setProdutos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [produtoCriado, setProdutoCriado] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [imagemPrevia, setImagemPrevia] = useState('');
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [produtoParaRemover, setProdutoParaRemover] = useState(null);

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

  useEffect(() => {
    if (!socket) return undefined;

    function onStockBaixo({ produtoId, stock }) {
      if (
        !produtoId ||
        !Number.isFinite(Number(stock))
      ) {
        return;
      }

      setProdutos((anteriores) =>
        anteriores.map((produto) =>
          String(produto._id) === String(produtoId)
            ? { ...produto, stock: Number(stock) }
            : produto
        )
      );
    }

    socket.on('stock-baixo', onStockBaixo);

    return () => {
      socket.off('stock-baixo', onStockBaixo);
    };
  }, [socket]);

  useEffect(() => {
    if (aCarregar || !produtoDestacado) return;

    const elemento = document.getElementById(
      `produto-${produtoDestacado}`
    );

    if (elemento) {
      elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [aCarregar, produtoDestacado]);

  useEffect(() => {
    if (!imagem) {
      setImagemPrevia('');
      return undefined;
    }

    const url = URL.createObjectURL(imagem);
    setImagemPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  function alterar(campo) {
    return (e) => {
      setFormulario((anterior) => ({
        ...anterior,
        [campo]: e.target.value
      }));
    };
  }

  function alternarEpoca(epoca) {
    setFormulario((anterior) => ({
      ...anterior,
      epocas: anterior.epocas.includes(epoca)
        ? anterior.epocas.filter((e) => e !== epoca)
        : [...anterior.epocas, epoca]
    }));
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setFormulario(estadoInicial);
    setProdutoEmEdicao(null);
    setProdutoCriado(null);
    setImagem(null);
    setImagemFalhou(false);
    setErro('');
  }

  function abrirCriacaoProduto() {
    setProdutoEmEdicao(null);
    setProdutoCriado(null);
    setFormulario(estadoInicial);
    setImagem(null);
    setImagemFalhou(false);
    setErro('');
    setMostrarFormulario(true);
  }

  function selecionarImagem(e) {
    const ficheiro = e.target.files?.[0];

    if (!ficheiro) {
      setImagem(null);
      return;
    }

    if (!TIPOS_IMAGEM.includes(ficheiro.type)) {
      setErro('A fotografia deve ser JPG, PNG ou WebP.');
      setImagem(null);
      e.target.value = '';
      return;
    }

    if (ficheiro.size === 0 || ficheiro.size > TAMANHO_MAXIMO_IMAGEM) {
      setErro('A fotografia deve ter entre 1 byte e 5 MB.');
      setImagem(null);
      e.target.value = '';
      return;
    }

    setImagem(ficheiro);
    setErro('');
  }

  async function guardarProduto(e) {
    e.preventDefault();
    if (aGuardar) return;

    let guardado = null;
    let aEnviarImagem = false;

    try {
      setErro('');
      setAGuardar(true);
      setImagemFalhou(false);

      const corpo = {
        nome: formulario.nome.trim(),
        categoria: formulario.categoria,
        preco: Number(formulario.preco),
        unidade: formulario.unidade.trim(),
        stock: Number(formulario.stock || 0),
        biologico: formulario.biologico,
        epocas: formulario.epocas
      };

      const idExistente = produtoEmEdicao?._id || produtoCriado?._id;

      if (idExistente) {
        guardado = await api(`/products/${idExistente}`, {
          metodo: 'PUT',
          token,
          corpo
        });
      } else {
        guardado = await api('/products', {
          metodo: 'POST',
          token,
          corpo
        });
        setProdutoCriado(guardado);
      }

      const produtoGuardado = guardado;
      setProdutos((atuais) => {
        const existe = atuais.some((p) => p._id === produtoGuardado._id);
        return existe
          ? atuais.map((p) =>
              p._id === produtoGuardado._id ? produtoGuardado : p
            )
          : [produtoGuardado, ...atuais];
      });

      if (imagem) {
        aEnviarImagem = true;
        const ficheiro = new FormData();
        ficheiro.append('imagem', imagem);

        const resposta = await api(`/products/${guardado._id}/imagem`, {
          metodo: 'POST',
          token,
          corpo: ficheiro
        });

        guardado = { ...guardado, imagemUrl: resposta.imagemUrl };
        const produtoComImagem = guardado;
        setProdutos((atuais) =>
          atuais.map((p) =>
            p._id === produtoComImagem._id ? produtoComImagem : p
          )
        );
      }

      fecharFormulario();
    } catch (err) {
      if (guardado && aEnviarImagem) {
        setImagemFalhou(true);
        setErro(
          `Os dados do produto foram guardados, mas a fotografia não: ${err.message}. ` +
          'Pode tentar guardar novamente ou concluir sem fotografia.'
        );
      } else {
        setErro(err.message || 'Não foi possível guardar o produto.');
      }
    } finally {
      setAGuardar(false);
    }
  }

  async function removerProduto(produtoId) {
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
    setProdutoCriado(null);
    setImagem(null);
    setImagemFalhou(false);
    setErro('');

    setFormulario({
      nome: produto.nome,
      categoria: produto.categoria,
      preco: String(produto.preco),
      unidade: produto.unidade || '',
      stock: String(produto.stock ?? 0),
      biologico: produto.biologico ?? false,
      epocas: produto.epocas || []
    });

    setMostrarFormulario(true);
  }

  return (
    <section
      className={`produtos-produtor${
        mostrarFormulario ? ' formulario-produtor' : ''
      }`}
    >
      <div
        className={mostrarFormulario
          ? 'formulario-produtor__cabecalho'
          : 'produtos-produtor__cabecalho'}
      >
        <div>
          <p className={mostrarFormulario
            ? 'formulario-produtor__etiqueta'
            : 'produtos-produtor__etiqueta'}>
            ÁREA DO PRODUTOR
          </p>

          <h1>
            {mostrarFormulario
              ? produtoEmEdicao
                ? 'Editar produto'
                : 'Criar produto'
              : 'Gerir produtos'}
          </h1>

          <p className="texto-secundario">
            {mostrarFormulario
              ? 'Preencha os dados e escolha uma fotografia opcional.'
              : 'Consulte os seus produtos, preços e stock.'}
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            className="btn btn-success"
            onClick={abrirCriacaoProduto}
          >
            Novo produto
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <form
          className="formulario-produtor__formulario produtos-produtor__formulario"
          onSubmit={guardarProduto}
        >
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

          <div className="formulario-produtor__linha">
            <div className="mb-3">
              <label htmlFor="preco" className="form-label">
                Preço (€)
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
              <label htmlFor="unidade" className="form-label">
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
              onWheel={(e) => e.currentTarget.blur()}
            />
          </div>

          <div className="form-check mb-3">
            <input
              id="biologico"
              type="checkbox"
              className="form-check-input"
              checked={formulario.biologico}
              onChange={(e) =>
                setFormulario((anterior) => ({
                  ...anterior,
                  biologico: e.target.checked
                }))
              }
            />

            <label
              htmlFor="biologico"
              className="form-check-label"
            >
              Produto biológico (BIO)
            </label>
          </div>

          <fieldset className="mb-3">
            <legend className="form-label">
              Épocas de disponibilidade
            </legend>

            <div className="d-flex flex-wrap gap-3">
              {EPOCAS.map((epoca) => (
                <div className="form-check" key={epoca}>
                  <input
                    id={`epoca-${epoca}`}
                    type="checkbox"
                    className="form-check-input"
                    checked={formulario.epocas.includes(epoca)}
                    onChange={() => alternarEpoca(epoca)}
                  />

                  <label
                    htmlFor={`epoca-${epoca}`}
                    className="form-check-label"
                  >
                    {epoca}
                  </label>
                </div>
              ))}
            </div>

            <small className="texto-secundario">
              Selecione a(s) época(s) em que o produto está disponível.
            </small>
          </fieldset>

          <div className="produtos-produtor__campo-imagem">
            <label htmlFor="imagemProduto" className="form-label">
              Fotografia do produto (opcional)
            </label>

            <input
              id="imagemProduto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="form-control"
              onChange={selecionarImagem}
              disabled={aGuardar}
            />

            <p className="texto-secundario small mt-2 mb-0">
              JPG, PNG ou WebP (máximo 5 MB).
              {produtoEmEdicao && (
                ' Se não escolher uma nova imagem, mantém-se a atual.'
              )}
            </p>

            {(imagemPrevia || produtoEmEdicao?.imagemUrl) && (
              <div className="formulario-produtor__imagem-previa mt-3">
                <img
                  src={imagemPrevia || urlImagem(produtoEmEdicao.imagemUrl)}
                  alt={imagemPrevia
                    ? 'Pré-visualização da nova fotografia'
                    : 'Fotografia atual do produto'}
                />
              </div>
            )}
          </div>

          {erro && (
            <div className="alert alert-danger" role="alert">
              {erro}
            </div>
          )}

          <div className="formulario-produtor__acoes">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={fecharFormulario}
              disabled={aGuardar}
            >
              {imagemFalhou ? 'Concluir sem nova fotografia' : 'Cancelar'}
            </button>

            <button
              type="submit"
              className="btn btn-success"
              disabled={aGuardar}
            >
              {aGuardar
                ? 'A guardar...'
                : imagemFalhou
                  ? 'Tentar enviar fotografia'
                  : produtoEmEdicao
                    ? 'Guardar alterações'
                    : 'Criar produto'}
            </button>
          </div>
        </form>
      )}

      {!mostrarFormulario && erro && (
        <div className="alert alert-danger" role="alert">
          {erro}
        </div>
      )}

      {!mostrarFormulario && aCarregar && (
        <p className="texto-secundario">
          A carregar produtos...
        </p>
      )}

      {!mostrarFormulario && !aCarregar && produtos.length === 0 && (
        <p className="texto-secundario">
          Ainda não tem produtos.
        </p>
      )}

      {!mostrarFormulario && (
        <div className="produtos-produtor__lista">
        {produtos.map((produto) => (
          <article
            key={produto._id}
            id={`produto-${produto._id}`}
            className={
              `produto-gestao${
                String(produto._id) === produtoDestacado
                  ? ' produto-gestao--destacado'
                  : ''
              }`
            }
          >
            <div>
              <h2>
                {produto.nome}
                {produto.biologico && (
                  <span className="badge bg-success ms-2">
                    BIO
                  </span>
                )}
              </h2>

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

              <strong
                className={
                  Number(produto.stock) <= 15 ? 'text-danger' : ''
                }
              >
                {produto.stock}
              </strong>

              <small
                className="text-danger fw-semibold"
                style={{ minHeight: '1.25rem' }}
              >
                {Number(produto.stock) === 0
                  ? 'Esgotado'
                  : Number(produto.stock) <= 15
                    ? 'Stock baixo'
                    : '\u00A0'}
              </small>
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
                onClick={() => setProdutoParaRemover(produto)}
              >
                Remover
              </button>
            </div>
          </article>
        ))}
        </div>
      )}

      <ModalConfirmacao
        aberto={Boolean(produtoParaRemover)}
        titulo="Remover produto"
        mensagem={`Tem a certeza de que pretende remover o produto "${produtoParaRemover?.nome}"? Esta ação não pode ser desfeita.`}
        textoConfirmar="Remover produto"
        variante="danger"
        cancelarVermelho={false}
        onCancelar={() => setProdutoParaRemover(null)}
        onConfirmar={() => {
          if (!produtoParaRemover) return;

          const produtoId = produtoParaRemover._id;
          setProdutoParaRemover(null);

          removerProduto(produtoId);
        }}
      />
    </section>
  );
}
