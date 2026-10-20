const Auction = require('../models/Auction'); // eslint-disable-line no-unused-vars
const Bid = require('../models/Bid'); // eslint-disable-line no-unused-vars

const sala = (leilaoId) => `leilao:${leilaoId}`;
const { isValidObjectId } = require('mongoose');

function emitirPresenca(io, leilaoId) {
  const n = io.sockets.adapter.rooms.get(sala(leilaoId))?.size ?? 0;
  io.to(sala(leilaoId)).emit('presenca', n);
}

module.exports = (io, socket) => {
  socket.on('entrar', async (leilaoId) => {
    try {
      const leilao = await Auction.findById(leilaoId)
        .populate('produtor', 'nome produtor.nomeExploracao')
        .populate('produto', 'nome');

      if (!leilao) {
        socket.emit('recusada', 'Leilão não encontrado');
        return;
      }

      const licitacoes = await Bid.find({
        leilao: leilaoId
      })
        .sort({ createdAt: -1 })
        .limit(20);

      socket.join(sala(leilaoId));

      emitirPresenca(io, leilaoId);

      socket.emit('estado', {
        agora: new Date().toISOString(),
        leilao,
        licitacoes
      });
    } catch (err) {
      console.error('Erro ao entrar no leilão:', err.message);
      socket.emit('recusada', 'Não foi possível entrar no leilão');
    }
  });

  socket.on('sair', (leilaoId) => {
    socket.leave(sala(leilaoId));
    emitirPresenca(io, leilaoId);
  });

  socket.on('licitar', async (dados, responder) => {
    const { leilaoId, valor } = dados ?? {};

    const recusar = (mensagem) => {
      socket.emit('recusada', mensagem);
      if (typeof responder === 'function') {
        responder({ ok: false, erro: mensagem });
      }
    };

    try {
      if (socket.user.papel !== 'comprador') {
        return recusar('Apenas compradores podem licitar');
      }

      if (!isValidObjectId(leilaoId)) {
        return recusar('Leilão inválido');
      }

      if (
        typeof valor !== 'number' ||
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !Number.isSafeInteger(Math.round(valor * 100)) ||
        Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-7
      ) {
        return recusar('Valor da licitação inválido');
      }

      const base = await Auction.findById(leilaoId);

      if (!base) {
        return recusar('Leilão não encontrado');
      }

      const agora = new Date();

      if (
        base.estado !== 'ativo' ||
        base.iniciaEm > agora ||
        base.terminaEm <= agora
      ) {
        return recusar('O leilão não está ativo');
      }

      const cent = (n) => Math.round(n * 100) / 100;

      const minimo = cent(
        base.licitacaoAtual.valor + base.incremento
      );

      if (valor < minimo) {
        return recusar(
          `Licitação mínima: ${minimo.toFixed(2)} €`
        );
      }

      const leilao = await Auction.findOneAndUpdate(
        {
          _id: leilaoId,
          estado: 'ativo',
          iniciaEm: { $lte: agora },
          terminaEm: { $gt: agora },
          'licitacaoAtual.valor': {
            $lte: cent(valor - base.incremento)
          }
        },
        {
          $set: {
            licitacaoAtual: {
              valor,
              comprador: socket.user.id,
              nome: socket.user.nome,
              em: agora
            }
          },
          $inc: { numLicitacoes: 1 }
        },
        { new: true }
      );

      if (!leilao) {
        return recusar(
          'Licitação recusada: o preço pode ter sido atualizado'
        );
      }

      const bid = await Bid.create({
        leilao: leilaoId,
        comprador: socket.user.id,
        nome: socket.user.nome,
        valor
      });

      io.to(sala(leilaoId)).emit('nova-licitacao', {
        _id: bid._id,
        valor,
        comprador: socket.user.id,
        nome: socket.user.nome,
        createdAt: bid.createdAt,
        numLicitacoes: leilao.numLicitacoes
      });

      if (typeof responder === 'function') {
        responder({ ok: true, valor });
      }

    } catch (err) {
      console.error('Erro ao licitar:', err);
      recusar('Erro ao registar a licitação');
    }
  });

  // Atualizar a presença quando o utilizador fecha a página
  socket.on('disconnecting', () => {
    for (const s of socket.rooms) {
      if (s.startsWith('leilao:')) {
        setImmediate(() => emitirPresenca(io, s.slice('leilao:'.length)));
      }
    }
  });

  // TODO: fechar os leilões expirados (estado 'terminado') e avisar a sala e o vencedor
};
