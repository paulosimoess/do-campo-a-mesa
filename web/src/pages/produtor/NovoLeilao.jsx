import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../api/client.js';

const estadoInicial = {
  produto: '',
  lote: '',
  quantidade: '',
  precoBase: '',
  incremento: '',
  duracao: '30',
  inicio: ''
};

export default function NovoLeilao() {
  const navigate = useNavigate();
  const { utilizador, token } = useAuth();
  const [dados, setDados] = useState(estadoInicial);
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState('');
  const [aCarregarProdutos, setACarregarProdutos] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [imagemPrevia, setImagemPrevia] = useState('');
  const [leilaoCriadoId, setLeilaoCriadoId] = useState(null);
  const idProdutor = utilizador?.id;

  useEffect(() => {
    if (!idProdutor) {
      setACarregarProdutos(false);
      return;
    }

    let cancelado = false;

    async function carregarProdutos() {
      try {
        const lista = await api(
          `/products?produtor=${encodeURIComponent(idProdutor)}`
        );

        if (!cancelado) {
          setProdutos(lista);
        }
      } catch (err) {
        if (!cancelado) {
          setErro(err.message || 'Erro ao carregar produtos.');
        }
      } finally {
        if (!cancelado) {
          setACarregarProdutos(false);
        }
      }
    }

    carregarProdutos();

    return () => {
      cancelado = true;
    };
  }, [idProdutor]);

  function mudar(campo) {
    return (e) => {
      setDados((atual) => ({
        ...atual,
        [campo]: e.target.value
      }));
    };
  }

  useEffect(() => {
    if (!imagem) {
      setImagemPrevia('');
      return;
    }

    const url = URL.createObjectURL(imagem);
    setImagemPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  function escolherImagem(e) {
    const ficheiro = e.target.files?.[0];

    if (!ficheiro) {
      setImagem(null);
      return;
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!tiposPermitidos.includes(ficheiro.type)) {
      setErro('A imagem deve ser JPG, PNG ou WebP.');
      e.target.value = '';
      setImagem(null);
      return;
    }

    if (ficheiro.size > 5 * 1024 * 1024) {
      setErro('A imagem não pode ultrapassar 5 MB.');
      e.target.value = '';
      setImagem(null);
      return;
    }

    setImagem(ficheiro);
    setErro('');
  }

  async function submeter(e) {
    e.preventDefault();
    if (aGuardar) return;

    setErro('');

    const precoBase = Number(dados.precoBase);
    const incremento = Number(dados.incremento);

    if (
      dados.precoBase.trim() === '' ||
      dados.incremento.trim() === '' ||
      !Number.isFinite(precoBase) ||
      !Number.isFinite(incremento) ||
      precoBase < 0 ||
      incremento < 0.01
    ) {
      setErro('Indique um preço base e incremento válidos.');
      return;
    }

    if (
      ![precoBase, incremento].every(
        (n) =>
          Number.isSafeInteger(Math.round(n * 100)) &&
          Math.abs(n * 100 - Math.round(n * 100)) < 1e-7
      )
    ) {
      setErro('Os valores monetários só podem ter duas casas decimais.');
      return;
    }

    const inicio = dados.inicio
      ? new Date(dados.inicio)
      : new Date();

    if (
      Number.isNaN(inicio.getTime()) ||
      (dados.inicio && inicio.getTime() < Date.now() - 30000)
    ) {
      setErro('Escolha uma data de início válida, que não esteja no passado.');
      return;
    }

    const lote = dados.lote.trim();
    const quantidade = dados.quantidade.trim();

    if (!lote || lote.length > 150 || !quantidade) {
      setErro('Preencha corretamente o lote e a quantidade.');
      return;
    }

    let idLeilao = leilaoCriadoId;

    try {
      setAGuardar(true);

      if (!idLeilao) {
        const novoLeilao = await api('/auctions', {
          metodo: 'POST',
          token,
          corpo: {
            produto: dados.produto,
            lote,
            quantidade,
            precoBase,
            incremento,
            iniciaEm: inicio.toISOString(),
            duracaoMin: Number(dados.duracao)
          }
        });

        idLeilao = novoLeilao._id;
        setLeilaoCriadoId(idLeilao);
      }

      if (imagem) {
        const formData = new FormData();
        formData.append('imagem', imagem);

        await api(`/auctions/${idLeilao}/imagem`, {
          metodo: 'POST',
          token,
          corpo: formData
        });
      }

      navigate(`/leiloes/${idLeilao}`);
    } catch (err) {
      if (idLeilao) {
        setErro(
          `O leilão foi criado, mas não foi possível guardar a fotografia: ${
            err.message
          }. Pode tentar novamente ou abrir o leilão sem fotografia.`
        );
      } else {
        setErro(err.message || 'Não foi possível criar o leilão.');
      }
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <section className="novo-leilao">
      <div className="novo-leilao__cabecalho">
        <p className="novo-leilao__etiqueta">
          ÁREA DO PRODUTOR
        </p>

        <h1>Criar leilão</h1>

        <p className="texto-secundario">
          Defina o lote, o preço inicial e as condições do leilão.
        </p>
      </div>

      <form
        className="novo-leilao__formulario"
        onSubmit={submeter}
      >
        <div>
          <label htmlFor="produto" className="form-label">
            Produto
          </label>

          <select
            id="produto"
            className="form-select"
            value={dados.produto}
            onChange={mudar('produto')}
            disabled={aCarregarProdutos || aGuardar}
            required
          >
            <option value="">
              {aCarregarProdutos
                ? 'A carregar produtos...'
                : 'Selecionar produto'}
            </option>

            {produtos.map((produto) => (
              <option
                key={produto._id}
                value={produto._id}
              >
                {produto.nome}
              </option>
            ))}
          </select>

          {!aCarregarProdutos && produtos.length === 0 && (
            <p className="texto-secundario small mt-2">
              Ainda não tem produtos. Crie primeiro um produto
              na área de gestão de produtos.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="imagemLeilao" className="form-label">
            Fotografia do lote (opcional)
          </label>

          <input
            id="imagemLeilao"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="form-control"
            onChange={escolherImagem}
            disabled={aGuardar}
          />

          <p className="texto-secundario small mt-2">
            Formatos permitidos: JPG, PNG e WebP (máximo 5 MB).
          </p>

          {imagemPrevia && (
            <div className="mt-3">
              <img
                src={imagemPrevia}
                alt="Pré-visualização da fotografia do lote"
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  maxHeight: '240px',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="lote" className="form-label">
            Nome do lote
          </label>

          <input
            id="lote"
            type="text"
            className="form-control"
            placeholder="Ex.: 200 kg de kiwi Hayward"
            maxLength={150}
            value={dados.lote}
            onChange={mudar('lote')}
            required
          />
        </div>

        <div>
          <label htmlFor="quantidade" className="form-label">
            Quantidade no lote
          </label>

          <input
            id="quantidade"
            type="text"
            className="form-control"
            placeholder="Ex.: 200 kg"
            value={dados.quantidade}
            onChange={mudar('quantidade')}
            required
          />
        </div>

        <div className="novo-leilao__linha">
          <div>
            <label htmlFor="precoBase" className="form-label">
              Preço base (€)
            </label>

            <input
              id="precoBase"
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              value={dados.precoBase}
              onChange={mudar('precoBase')}
              required
            />
          </div>

          <div>
            <label htmlFor="incremento" className="form-label">
              Incremento mínimo (€)
            </label>

            <input
              id="incremento"
              type="number"
              min="0.01"
              step="0.01"
              className="form-control"
              value={dados.incremento}
              onChange={mudar('incremento')}
              required
            />
          </div>
        </div>

        <div className="novo-leilao__linha">
          <div>
            <label htmlFor="duracao" className="form-label">
              Duração (minutos)
            </label>

            <input
              id="duracao"
              type="number"
              className="form-control"
              min="10"
              step="1"
              value={dados.duracao}
              onChange={mudar('duracao')}
              placeholder="Ex.: 45"
              required
            />

            <p className="texto-secundario small mt-1 mb-0">
              Defina a duração pretendida em minutos.
            </p>
          </div>

          <div>
            <label htmlFor="inicio" className="form-label">
              Início (opcional)
            </label>

            <input
              id="inicio"
              type="datetime-local"
              className="form-control"
              value={dados.inicio}
              onChange={mudar('inicio')}
            />

            <p className="texto-secundario small mt-1 mb-0">
              Deixe em branco para iniciar imediatamente.
            </p>
          </div>
        </div>

        {leilaoCriadoId && (
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={() => navigate(`/leiloes/${leilaoCriadoId}`)}
          >
            Abrir leilão sem fotografia
          </button>
        )}

        <div className="novo-leilao__acoes">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/produtor')}
            disabled={aGuardar}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-success"
            disabled={
              aGuardar ||
              aCarregarProdutos ||
              produtos.length === 0
            }
          >
            {aGuardar
              ? 'A guardar...'
                : leilaoCriadoId
                  ? 'Tentar enviar fotografia'
                  : 'Criar leilão'}
          </button>
        </div>
      </form>
    </section>
  );
}
