
import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/api\/?$/, '');

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [ligacao, setLigacao] = useState(null);

  useEffect(() => {
    if (!token) {
      setLigacao(null);
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Socket.io ligado:', socket.id);
    });

    socket.on('connect_error', (erro) => {
      console.error('Erro Socket.io:', erro.message);
    });

    socket.on('disconnect', (motivo) => {
      console.log('Socket.io desligado:', motivo);
    });

    setLigacao({ token, socket });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const socket = ligacao?.token === token
    ? ligacao.socket
    : null;

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
