import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

const estadoInicial = {
  nome: '',
  email: '',
  password: '',
  papel: 'comprador',
  exploracao: '',
  localidade: ''
};

export default function Registo() {
  const [formulario, setFormulario] = useState(estadoInicial);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();
  const [erro, setErro] = useState('');

  function alterar(campo) {
    return (e) => {
      setFormulario((anterior) => ({
        ...anterior,
        [campo]: e.target.value
      }));
    };
  }

  async function submeter(e) {
    e.preventDefault();

    try {
      setErro('');
      setMensagem('');

      const corpo = {
        nome: formulario.nome,
        email: formulario.email,
        password: formulario.password,
        papel: formulario.papel
      };

      if (formulario.papel === 'produtor') {
        corpo.produtor = {
          nomeExploracao: formulario.exploracao,
          localidade: formulario.localidade
        };
      }

      await api('/auth/registo', {
        metodo: 'POST',
        corpo
      });

      setMensagem('Conta criada com sucesso. Já pode iniciar sessão.');

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <section className="registo">
      <div className="registo__cabecalho">
        <p className="registo__etiqueta">
          CRIAR CONTA
        </p>

        <h1>Registar</h1>

        <p className="texto-secundario">
          Crie uma conta para comprar produtos locais ou vender enquanto produtor.
        </p>
      </div>

      <form
        className="registo__formulario"
        onSubmit={submeter}
      >
        <div>
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

        <div>
          <label
            htmlFor="email"
            className="form-label"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            className="form-control"
            value={formulario.email}
            onChange={alterar('email')}
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="form-label"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            className="form-control"
            value={formulario.password}
            onChange={alterar('password')}
            required
          />
        </div>

        <div>
          <label
            htmlFor="papel"
            className="form-label"
          >
            Tipo de conta
          </label>

          <select
            id="papel"
            className="form-select"
            value={formulario.papel}
            onChange={alterar('papel')}
          >
            <option value="comprador">
              Comprador
            </option>

            <option value="produtor">
              Produtor
            </option>
          </select>
        </div>

        {formulario.papel === 'produtor' && (
          <div className="registo__campos-produtor">
            <div>
              <label
                htmlFor="exploracao"
                className="form-label"
              >
                Nome da exploração
              </label>

              <input
                id="exploracao"
                type="text"
                className="form-control"
                value={formulario.exploracao}
                onChange={alterar('exploracao')}
                required
              />
            </div>

            <div>
              <label
                htmlFor="localidade"
                className="form-label"
              >
                Localidade
              </label>

              <input
                id="localidade"
                type="text"
                className="form-control"
                value={formulario.localidade}
                onChange={alterar('localidade')}
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-success w-100"
        >
          Criar conta
        </button>

        {mensagem && (
          <div className="alert alert-success mb-0">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="alert alert-danger mb-0">
            {erro}
          </div>
        )}
      </form>
    </section>
  );
}