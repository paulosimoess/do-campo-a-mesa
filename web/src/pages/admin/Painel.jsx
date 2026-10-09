const indicadores = [
  {
    titulo: 'Utilizadores',
    valor: '86',
    detalhe: '12 produtores'
  },
  {
    titulo: 'Encomendas',
    valor: '214',
    detalhe: '18 em curso'
  },
  {
    titulo: 'Leilões ativos',
    valor: '3',
    detalhe: '7 agendados'
  },
  {
    titulo: 'Avaliações denunciadas',
    valor: '5',
    detalhe: 'A aguardar moderação'
  }
];

const produtoresPendentes = [
  {
    id: 1,
    nome: 'Casa do Vale Verde',
    localidade: 'Caminha',
    tipo: 'Hortícolas biológicos'
  },
  {
    id: 2,
    nome: 'Apicultura Fonseca',
    localidade: 'Vila Nova de Cerveira',
    tipo: 'Mel e derivados'
  },
  {
    id: 3,
    nome: 'Quinta de Sá',
    localidade: 'Monção',
    tipo: 'Vinho Verde'
  }
];

const avaliacoesDenunciadas = [
  {
    id: 1,
    autor: 'Ana Pereira',
    produtor: 'Horta da Ribeira',
    comentario: 'Produto chegou estragado e o vendedor não respondeu.',
    classificacao: 2
  },
  {
    id: 2,
    autor: 'João Martins',
    produtor: 'Mel do Soajo',
    comentario: 'Preço muito alto comparado com outros produtores.',
    classificacao: 3
  }
];

const leiloesAtivos = [
  {
    id: 1,
    lote: '200 kg de kiwi Hayward, calibre A',
    produtor: 'Horta da Ribeira',
    licitacaoAtual: '312,00 €',
    terminaEm: '02:47'
  },
  {
    id: 2,
    lote: 'Alvarinho 2025 · 60 garrafas',
    produtor: 'Quinta da Lameira',
    licitacaoAtual: '540,00 €',
    terminaEm: '11:52'
  },
  {
    id: 3,
    lote: 'Castanha Longal · 150 kg',
    produtor: 'Souto da Serra',
    licitacaoAtual: '410,00 €',
    terminaEm: '24:10'
  }
];

export default function PainelAdmin() {
  return (
    <section className="painel-admin">
      <div className="painel-admin__cabecalho">
        <div>
          <p className="painel-admin__etiqueta">
            ÁREA DE ADMINISTRAÇÃO
          </p>

          <h1>Administração</h1>

          <p className="texto-secundario">
            Acompanhe a atividade global da plataforma e trate das tarefas de moderação.
          </p>
        </div>
      </div>

      <div className="painel-admin__indicadores">
        {indicadores.map((indicador) => (
          <article
            key={indicador.titulo}
            className="painel-indicador"
          >
            <span>{indicador.titulo}</span>
            <strong>{indicador.valor}</strong>
            <small>{indicador.detalhe}</small>
          </article>
        ))}
      </div>

      <section className="admin-bloco">
        <div className="admin-bloco__cabecalho">
          <div>
            <p className="admin-bloco__etiqueta">
              VALIDAÇÃO
            </p>

            <h2>Produtores por validar</h2>
          </div>

          <span className="admin-bloco__contador">
            {produtoresPendentes.length} pedidos
          </span>
        </div>

        <div className="admin-lista">
          {produtoresPendentes.map((produtor) => (
            <article
              key={produtor.id}
              className="admin-lista__item"
            >
              <div>
                <h3>{produtor.nome}</h3>

                <p className="texto-secundario mb-0">
                  {produtor.tipo} · {produtor.localidade}
                </p>
              </div>

              <div className="admin-lista__acoes">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                >
                  Rejeitar
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-success"
                >
                  Aprovar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-bloco">
        <div className="admin-bloco__cabecalho">
          <div>
            <p className="admin-bloco__etiqueta">
              MODERAÇÃO
            </p>

            <h2>Avaliações denunciadas</h2>
          </div>

          <span className="admin-bloco__contador">
            {avaliacoesDenunciadas.length} por moderar
          </span>
        </div>

        <div className="admin-lista">
          {avaliacoesDenunciadas.map((avaliacao) => (
            <article
              key={avaliacao.id}
              className="admin-lista__item"
            >
              <div>
                <h3>
                  {avaliacao.classificacao}/5 · {avaliacao.autor}
                </h3>

                <p className="mb-1">
                  “{avaliacao.comentario}”
                </p>

                <p className="texto-secundario mb-0">
                  Sobre {avaliacao.produtor}
                </p>
              </div>

              <div className="admin-lista__acoes">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                >
                  Manter
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                >
                  Ocultar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-bloco">
        <div className="admin-bloco__cabecalho">
          <div>
            <p className="admin-bloco__etiqueta">
              TEMPO REAL
            </p>

            <h2>Leilões ativos</h2>
          </div>

          <span className="admin-bloco__contador">
            {leiloesAtivos.length} em direto
          </span>
        </div>

        <div className="admin-lista">
          {leiloesAtivos.map((leilao) => (
            <article
              key={leilao.id}
              className="admin-lista__item"
            >
              <div>
                <h3>{leilao.lote}</h3>

                <p className="texto-secundario mb-1">
                  {leilao.produtor}
                </p>

                <p className="mb-0">
                  Licitação atual: <strong>{leilao.licitacaoAtual}</strong>
                </p>
              </div>

              <div className="text-md-end">
                <span className="texto-secundario small">
                  Termina em
                </span>

                <p className="fw-bold mb-0">
                  {leilao.terminaEm}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}