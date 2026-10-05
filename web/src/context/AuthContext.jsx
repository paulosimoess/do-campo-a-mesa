// Estado global da sessão (utilizador + token)
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sessao')) || null; } catch { return null; }
  });

  async function entrar(email, password) {
    const utilizadoresSimulados = [
      {
        email: 'comprador@exemplo.pt',
        password: 'password123',
        utilizador: {
          id: 'comprador-1',
          nome: 'Comprador Teste',
          email: 'comprador@exemplo.pt',
          papel: 'comprador'
        }
      },
      {
        email: 'produtor@exemplo.pt',
        password: 'password123',
        utilizador: {
          id: 'produtor-1',
          nome: 'Produtor Teste',
          email: 'produtor@exemplo.pt',
          papel: 'produtor'
        }
      },
      {
        email: 'admin@exemplo.pt',
        password: 'password123',
        utilizador: {
          id: 'admin-1',
          nome: 'Administrador',
          email: 'admin@exemplo.pt',
          papel: 'admin'
        }
      }
    ];

    const conta = utilizadoresSimulados.find(
      (u) =>
        u.email === email.trim().toLowerCase() &&
        u.password === password
    );

    if (!conta) {
      throw new Error('Credenciais inválidas');
    }

    const novaSessao = {
      token: 'token-simulado',
      utilizador: conta.utilizador
    };

    guardarSessao(novaSessao);

    return conta.utilizador;
  }

  function sair() {
    localStorage.removeItem('sessao');
    setSessao(null);
  }

  function guardarSessao(nova) {
    localStorage.setItem('sessao', JSON.stringify(nova));
    setSessao(nova);
  }

  return (
    <AuthContext.Provider value={{
      utilizador: sessao?.utilizador || null,
      token: sessao?.token || null,
      entrar, sair, guardarSessao
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
