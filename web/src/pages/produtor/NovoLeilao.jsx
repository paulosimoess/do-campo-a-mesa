import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import produtosSimulados from '../../data/produtos.json';

export default function NovoLeilao() {
  const navigate = useNavigate();

  const [dados, setDados] = useState({
    produto: '',
    quantidade: '',
    precoBase: '',
    incremento: '',
    duracao: '30',
    inicio: ''
  });

  const [mensagem, setMensagem] = useState('');

  function mudar(campo) {
    return (e) => {
      setDados((atual) => ({
        ...atual,
        [campo]: e.target.value
      }));
    };
  }

  function submeter(e) {
    e.preventDefault();

    setMensagem('Leilão simulado criado com sucesso.');
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

      <form className="novo-leilao__formulario" onSubmit={submeter}>
        <div>
          <label htmlFor="produto" className="form-label">
            Produto
          </label>

          <select
            id="produto"
            className="form-select"
            value={dados.produto}
            onChange={mudar('produto')}
            required
          >
            <option value="">
              Selecionar produto
            </option>

            {produtosSimulados.slice(0, 5).map((produto) => (
              <option
                key={produto._id}
                value={produto._id}
              >
                {produto.nome}
              </option>
            ))}
          </select>
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
              Preço base
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
              Incremento mínimo
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
              Duração
            </label>

            <select
              id="duracao"
              className="form-select"
              value={dados.duracao}
              onChange={mudar('duracao')}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>

          <div>
            <label htmlFor="inicio" className="form-label">
              Início
            </label>

            <input
              id="inicio"
              type="datetime-local"
              className="form-control"
              value={dados.inicio}
              onChange={mudar('inicio')}
              required
            />
          </div>
        </div>

        {mensagem && (
          <div className="alert alert-success">
            {mensagem}
          </div>
        )}

        <div className="novo-leilao__acoes">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/produtor')}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-success"
          >
            Criar leilão
          </button>
        </div>
      </form>
    </section>
  );
}