
import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { api } from '../api/client.js';

export function useLeilao(id) {
  const socket = useSocket();

  const [leilao, setLeilao] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [participantes, setParticipantes] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [offset, setOffset] = useState(0);
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(true);

  useEffect(() => {
    let cancelado = false;

    setLeilao(null);
    setHistorico([]);
    setParticipantes(0);
    setResultado(null);
    setErro('');
    setACarregar(true);

    async function carregar() {
      try {
        const dados = await api(`/auctions/${id}`);

        if (cancelado) return;

        setLeilao(dados.leilao);
        setHistorico(dados.licitacoes || []);

        if (dados.leilao.estado === 'terminado') {
          const atual = dados.leilao.licitacaoAtual;

          setResultado({
            vencedor: atual?.comprador
              ? { id: atual.comprador, nome: atual.nome }
              : null,
            valor: atual?.comprador ? atual.valor : null
          });
        }
      } catch (err) {
        if (!cancelado) {
          setErro(err.message || 'Erro ao carregar o leilão.');
        }
      } finally {
        if (!cancelado) setACarregar(false);
      }
    }

    carregar();

    return () => {
      cancelado = true;
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return undefined;

    const entrar = () => socket.emit('entrar', id);

    const onEstado = ({ agora, leilao: dados, licitacoes }) => {
      if (String(dados?._id) !== String(id)) return;

      setLeilao(dados);
      setHistorico(licitacoes || []);
      setOffset(new Date(agora).getTime() - Date.now());
      setACarregar(false);
    };

    const onNovaLicitacao = (licitacao) => {
      setLeilao((anterior) => anterior && ({
        ...anterior,
        licitacaoAtual: {
          valor: licitacao.valor,
          comprador: licitacao.comprador,
          nome: licitacao.nome,
          em: licitacao.createdAt
        },
        numLicitacoes: licitacao.numLicitacoes
      }));

      setHistorico((anterior) => [
        licitacao,
        ...anterior.filter(
          (item) => String(item._id) !== String(licitacao._id)
        )
      ].slice(0, 20));
    };

    const onTerminado = (dados) => {
      setResultado(dados);
      setLeilao((anterior) => anterior && ({
        ...anterior,
        estado: 'terminado'
      }));
    };

    const onAberto = () => entrar();

    socket.on('connect', entrar);
    socket.on('estado', onEstado);
    socket.on('presenca', setParticipantes);
    socket.on('nova-licitacao', onNovaLicitacao);
    socket.on('terminado', onTerminado);
    socket.on('aberto', onAberto);
    socket.on('recusada', setErro);

    if (socket.connected) entrar();

    return () => {
      if (socket.connected) socket.emit('sair', id);

      socket.off('connect', entrar);
      socket.off('estado', onEstado);
      socket.off('presenca', setParticipantes);
      socket.off('nova-licitacao', onNovaLicitacao);
      socket.off('terminado', onTerminado);
      socket.off('aberto', onAberto);
      socket.off('recusada', setErro);
    };
  }, [socket, id]);

  function licitar(valor) {
    setErro('');

    if (!socket?.connected) {
      setErro('É necessária uma ligação autenticada para licitar.');
      return;
    }

    socket.timeout(5000).emit(
      'licitar',
      { leilaoId: id, valor },
      (erroSocket, resposta) => {
        if (erroSocket) {
          setErro('O servidor não respondeu à licitação.');
        } else if (!resposta?.ok) {
          setErro(resposta?.erro || 'Licitação recusada.');
        }
      }
    );
  }

  return {
    leilao,
    atual: leilao?.licitacaoAtual || null,
    historico,
    participantes,
    resultado,
    offset,
    erro,
    aCarregar,
    licitar
  };
}
