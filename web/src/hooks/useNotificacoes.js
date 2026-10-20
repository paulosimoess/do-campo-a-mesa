
import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function useNotificacoes() {
  const socket = useSocket();
  const { token } = useAuth();

  const [notificacoes, setNotificacoes] = useState([]);
  const proximoId = useRef(0);

  // Limpar notificações quando a sessão muda.
  useEffect(() => {
    setNotificacoes([]);
  }, [token]);

  useEffect(() => {
    if (!socket) return undefined;

    function onLeilaoGanho(dados) {
      if (!dados?.leilaoId || !dados?.encomendaId) return;

      proximoId.current += 1;

      const valor = Number(dados.valor).toLocaleString('pt-PT', {
        style: 'currency',
        currency: 'EUR'
      });

      const notificacao = {
        id: proximoId.current,
        titulo: 'Ganhaste um leilão!',
        mensagem: `A tua licitação de ${valor} venceu. A encomenda já foi criada.`,
        destino: '/encomendas'
      };

      setNotificacoes((anteriores) => [
        notificacao,
        ...anteriores
      ].slice(0, 5));
    }

    socket.on('leilao-ganho', onLeilaoGanho);

    return () => {
      socket.off('leilao-ganho', onLeilaoGanho);
    };
  }, [socket]);

  function removerNotificacao(id) {
    setNotificacoes((anteriores) =>
      anteriores.filter((notificacao) => notificacao.id !== id)
    );
  }

  return {
    notificacoes,
    removerNotificacao
  };
}
