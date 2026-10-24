// Cliente HTTP da API: junta o URL base e o token JWT a cada pedido
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const USAR_DADOS_SIMULADOS = import.meta.env.VITE_USAR_DADOS_SIMULADOS === 'true';

export async function api(
  caminho,
  { metodo = 'GET', corpo, token } = {}
) {
  const ehFormulario =
    typeof FormData !== 'undefined' &&
    corpo instanceof FormData;

  const resposta = await fetch(`${API_URL}/api${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo != null && !ehFormulario
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {})
    },
    body:
      corpo == null
        ? undefined
        : ehFormulario
          ? corpo
          : JSON.stringify(corpo)
  });

  if (resposta.status === 204) return null;

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = new Error(
      dados?.erro || `Erro ${resposta.status}`
    );

    erro.status = resposta.status;

    throw erro;
  }

  return dados;
}