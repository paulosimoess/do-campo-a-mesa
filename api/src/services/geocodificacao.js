const cache = new Map();

let fila = Promise.resolve();
let ultimaConsulta = 0;

async function obterLocalizacaoAproximada(localidade) {
  const nome = String(localidade || '').trim();

  if (!nome) return null;

  const chave = nome.toLocaleLowerCase('pt-PT');

  if (cache.has(chave)) {
    return cache.get(chave);
  }

  const tarefa = fila.then(async () => {
    if (cache.has(chave)) {
      return cache.get(chave);
    }

    const userAgent = process.env.NOMINATIM_USER_AGENT;

    if (!userAgent) {
      throw new Error('NOMINATIM_USER_AGENT não configurado');
    }

    const espera = Math.max(
      0,
      1100 - (Date.now() - ultimaConsulta)
    );

    if (espera > 0) {
      await new Promise((resolve) => setTimeout(resolve, espera));
    }

    ultimaConsulta = Date.now();

    const url = new URL(
      'https://nominatim.openstreetmap.org/search'
    );

    url.search = new URLSearchParams({
      q: `${nome}, Portugal`,
      format: 'jsonv2',
      countrycodes: 'pt',
      limit: '1'
    }).toString();

    const resposta = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Accept-Language': 'pt-PT'
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!resposta.ok) {
      throw new Error(
        `Erro na geocodificação: HTTP ${resposta.status}`
      );
    }

    const resultados = await resposta.json();
    const primeiro = resultados[0];

    if (!primeiro) return null;

    const lat = Number(primeiro.lat);
    const lng = Number(primeiro.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    const coordenadas = { lat, lng };

    cache.set(chave, coordenadas);

    return coordenadas;
  });

  fila = tarefa.then(
    () => {},
    () => {}
  );

  return tarefa;
}

module.exports = { obterLocalizacaoAproximada };