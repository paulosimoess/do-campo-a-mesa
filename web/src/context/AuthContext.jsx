// Estado global da sessão (utilizador + token)
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {api} from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sessao')) || null; } catch { return null; }
  });

  const guardarSessao = useCallback((novaSessao) => {
    localStorage.setItem(
      'sessao',
      JSON.stringify(novaSessao)
    );

    setSessao(novaSessao);
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem('sessao');
    setSessao(null);
  }, []);

  async function entrar(email, password) {
    const dados = await api('/auth/login', {
      metodo: 'POST',
      corpo: {
        email,
        password
      }
    });

    guardarSessao(dados);

    return dados.utilizador;
  }

  const atualizar = useCallback(async () => {
    if (!sessao?.token) {
      return;
    }

    try {
      const utilizador = await api('/auth/eu', {
        token: sessao.token
      });

      guardarSessao({
        ...sessao,
        utilizador
      });
    } catch (err) {
      if (err.status === 401) {
        sair();
      }
    }
  }, [sessao, guardarSessao, sair]);

  useEffect(() => {
    atualizar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider
      value={{
        utilizador: sessao?.utilizador || null,
        token: sessao?.token || null,
        entrar,
        sair,
        guardarSessao,
        atualizar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);