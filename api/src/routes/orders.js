// Encomendas
const router = require('express').Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const a = require('../utils/async');
const erro = require('../utils/erro');

async function reporStock(reservas) {
  await Promise.all(
    reservas.map(({ id, quantidade }) =>
      Product.updateOne(
        { _id: id },
        { $inc: { stock: quantidade } }
      )
    )
  );
}

// POST /api/orders  (comprador)  -> 201
router.post(
  '/',
  auth('comprador'),
  a(async (req, res) => {
    const { linhas, entrega = {} } = req.body;

    if (!Array.isArray(linhas) || linhas.length === 0) {
      throw erro(400, 'A encomenda deve ter pelo menos um produto');
    }

    const reservas = [];
    const porProdutor = new Map();

    try {
      for (const linha of linhas) {
        const quantidade = Number(linha.quantidade);

        if (!linha.produto || !Number.isInteger(quantidade) || quantidade < 1) {
          throw erro(400, 'Linha de encomenda inválida');
        }

        const produto = await Product.findOneAndUpdate(
          {
            _id: linha.produto,
            stock: { $gte: quantidade }
          },
          {
            $inc: { stock: -quantidade }
          },
          {
            new: true
          }
        );

        if (!produto) {
          const existe = await Product.findById(linha.produto)
            .select('nome');

          throw erro(
            409,
            existe
              ? `Stock insuficiente: ${existe.nome}`
              : 'Produto não encontrado'
          );
        }

        reservas.push({
          id: produto._id,
          quantidade
        });

        const produtorId = produto.produtor.toString();

        if (!porProdutor.has(produtorId)) {
          porProdutor.set(produtorId, []);
        }

        porProdutor.get(produtorId).push({
          produto: produto._id,
          nome: produto.nome,
          precoUnit: produto.preco,
          unidade: produto.unidade,
          quantidade
        });
      }

      const encomendas = await Order.create(
        [...porProdutor].map(([produtor, linhasProdutor]) => ({
          comprador: req.user.id,
          produtor,
          linhas: linhasProdutor,
          entrega: {
            tipo: entrega.tipo || 'levantamento',
            morada: entrega.morada
          }
        }))
      );

      res.status(201).json(encomendas);
    } catch (err) {
      await reporStock(reservas);
      throw err;
    }
  })
);

// GET /api/orders  -> 200 [encomendas do utilizador: como comprador ou como produtor]
router.get(
  '/',
  auth(),
  a(async (req, res) => {
    const filtro =
      req.user.papel === 'produtor'
        ? { produtor: req.user.id }
        : { comprador: req.user.id };

    const encomendas = await Order.find(filtro)
      .sort({ createdAt: -1 })
      .populate('comprador', 'nome email')
      .populate('produtor', 'nome produtor.nomeExploracao');

    res.json(encomendas);
  })
);

// GET /api/orders/:id  -> 200 | 404
router.get(
  '/:id',
  auth(),
  a(async (req, res) => {
    const filtro = {
      _id: req.params.id
    };

    if (req.user.papel === 'comprador') {
      filtro.comprador = req.user.id;
    }

    if (req.user.papel === 'produtor') {
      filtro.produtor = req.user.id;
    }

    const encomenda = await Order.findOne(filtro)
      .populate('comprador', 'nome email')
      .populate('produtor', 'nome produtor.nomeExploracao');

    if (!encomenda) {
      throw erro(404, 'Encomenda não encontrada');
    }

    res.json(encomenda);
  })
);

// PATCH /api/orders/:id/estado  (produtor)  -> 200
// TODO (Passo 7): depois de gravar, notificar o comprador em tempo real:
//   req.app.get('io').to(`user:${encomenda.comprador}`)
//     .emit('encomenda-atualizada', { id: encomenda._id, estado: encomenda.estado });
router.patch(
  '/:id/estado',
  auth('produtor'),
  a(async (req, res) => {
    const { estado } = req.body;

    const ESTADOS = Order.ESTADOS;
    const novoIndice = ESTADOS.indexOf(estado);

    if (novoIndice < 0) {
      throw erro(400, 'Estado inválido');
    }

    const encomenda = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        produtor: req.user.id,
        estado: {
          $in: ESTADOS.slice(0, novoIndice)
        }
      },
      {
        estado
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!encomenda) {
      const existe = await Order.exists({
        _id: req.params.id,
        produtor: req.user.id
      });

      throw erro(
        existe ? 409 : 404,
        existe
          ? 'O estado só pode avançar'
          : 'Encomenda não encontrada'
      );
    }

    res.json(encomenda);
  })
);

module.exports = router;
