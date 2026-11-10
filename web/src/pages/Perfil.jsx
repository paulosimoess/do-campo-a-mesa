import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function Perfil() {
  const { utilizador, token } = useAuth();
  const eProdutor = utilizador?.papel === 'produtor';

  const [exploracao, setExploracao] = useState({
    nomeExploracao: '',
    descricao: ''
  });

  const [aCarregar, setACarregar] = useState(eProdutor);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [estadoValidacao, setEstadoValidacao] = useState(null);

  useEffect(() => {
    if (!eProdutor || !utilizador?.id) return;

    let cancelado = false;

    async function carregarExploracao() {
      try {
        setACarregar(true);
        setErro('');
        setEstadoValidacao(null);

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

        const dados = await api(
          `/producers/${utilizador.id}`
        );

        if (cancelado) return;

        const perfil = dados.produtor?.produtor || {};

        setExploracao({
          nomeExploracao: perfil.nomeExploracao || '',
          descricao: perfil.descricao || ''
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

    carregarExploracao();

    return () => {
      cancelado = true;
    };
  }, [eProdutor, utilizador?.id, token]);

  async function guardarExploracao(e) {
    e.preventDefault();
    if (aGuardar) return;

    setErro('');
    setMensagem('');
    setAGuardar(true);

    try {
      const atualizado = await api('/producers/me', {
        metodo: 'PATCH',
        token,
        corpo: exploracao
      });

      setExploracao({
        nomeExploracao: atualizado.nomeExploracao,
        descricao: atualizado.descricao || ''
      });

      setMensagem('Perfil atualizado com sucesso.');
    } catch (err) {
      setErro(
        err.message || 'Não foi possível atualizar o perfil.'
      );
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <section className="novo-leilao">
      <div className="novo-leilao__cabecalho">
        <p className="novo-leilao__etiqueta">
          A MINHA CONTA
        </p>

        <h1>O meu perfil</h1>

        <p className="texto-secundario">
          Consulte as informações da sua conta
          {eProdutor
            ? ' e faça a gestão da sua exploração.'
            : '.'}
        </p>
      </div>

      <div className="novo-leilao__formulario">
        <h2 className="h5 mb-0">Dados da conta</h2>

        <div>
          <label className="form-label" htmlFor="perfil-nome">
            Nome
          </label>

          <input
            id="perfil-nome"
            className="form-control"
            value={utilizador?.nome || ''}
            readOnly
          />
        </div>

        <div>
          <label className="form-label" htmlFor="perfil-email">
            Email
          </label>

          <input
            id="perfil-email"
            className="form-control"
            value={utilizador?.email || ''}
            readOnly
          />
        </div>

        {eProdutor && (
          <>
            <hr className="my-2" />

            <h2 className="h5 mb-0">
              Perfil da exploração
            </h2>

            {aCarregar ? (
              <p className="texto-secundario">
                A carregar exploração...
              </p>
            ) : estadoValidacao === 'rejeitado' ? (
              <div className="alert alert-danger mb-0" role="status">
                <strong>Registo de produtor rejeitado</strong>
                <p className="mb-0 mt-2">
                  O seu pedido de registo como produtor não foi
                  aprovado pelo administrador. Não é possível
                  editar os dados da exploração.
                </p>
              </div>
            ) : estadoValidacao === 'pendente' ? (
              <div className="alert alert-warning mb-0" role="status">
                <strong>Registo a aguardar validação</strong>
                <p className="mb-0 mt-2">
                  Poderá editar os dados da exploração após
                  a aprovação do administrador.
                </p>
              </div>
            ) : estadoValidacao !== 'aprovado' ? (
              <div className="alert alert-danger mb-0" role="alert">
                {erro || 'Não foi possível verificar o estado da conta.'}
              </div>
            ) : (
              <form
                className="d-grid gap-3"
                onSubmit={guardarExploracao}
              >
                <div>
                  <label
                    htmlFor="perfil-exploracao"
                    className="form-label"
                  >
                    Nome da exploração
                  </label>

                  <input
                    id="perfil-exploracao"
                    type="text"
                    className="form-control"
                    maxLength={100}
                    required
                    value={exploracao.nomeExploracao}
                    onChange={(e) =>
                      setExploracao((atual) => ({
                        ...atual,
                        nomeExploracao: e.target.value
                      }))
                    }
                    disabled={aGuardar}
                  />
                </div>

                <div>
                  <label
                    htmlFor="perfil-descricao"
                    className="form-label"
                  >
                    Sobre a exploração
                  </label>

                  <textarea
                    id="perfil-descricao"
                    className="form-control"
                    rows={5}
                    maxLength={1000}
                    value={exploracao.descricao}
                    onChange={(e) =>
                      setExploracao((atual) => ({
                        ...atual,
                        descricao: e.target.value
                      }))
                    }
                    disabled={aGuardar}
                  />

                  <small className="texto-secundario">
                    {exploracao.descricao.length}/1000 caracteres
                  </small>
                </div>

                {erro && (
                  <div className="alert alert-danger" role="alert">
                    {erro}
                  </div>
                )}

                {mensagem && (
                  <div className="alert alert-success" role="status">
                    {mensagem}
                  </div>
                )}

                <div className="novo-leilao__acoes">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={aGuardar}
                  >
                    {aGuardar
                      ? 'A guardar...'
                      : 'Guardar alterações'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}