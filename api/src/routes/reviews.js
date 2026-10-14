const router = require('express').Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Order = require('../models/Order');
const a = require('../utils/async');
const erro = require('../utils/erro');

// POST /api/reviews  (comprador, só após encomenda entregue)  -> 201
router.post(
  '/',
  auth('comprador'),
  a(async (req, res) => {
    const {
      encomenda,
      produto,
      classificacao,
      comentario
    } = req.body;

    if (!encomenda || classificacao == null) {
      throw erro(400, 'Dados da avaliação incompletos');
    }

    const order = await Order.findOne({
      _id: encomenda,
      comprador: req.user.id
    });

    if (!order) {
      throw erro(404, 'Encomenda não encontrada');
    }

    if (order.estado !== 'entregue') {
      throw erro(
        409,
        'Só é possível avaliar uma encomenda entregue'
      );
    }

    if (produto) {
      const pertence = order.linhas.some(
        (linha) => linha.produto?.toString() === produto
      );

      if (!pertence) {
        throw erro(
          400,
          'O produto não pertence a esta encomenda'
        );
      }
    }

    const existente = await Review.exists({
      autor: req.user.id,
      encomenda
    });

    if (existente) {
      throw erro(
        409,
        'Esta encomenda já foi avaliada'
      );
    }

    const avaliacao = await Review.create({
      autor: req.user.id,
      produtor: order.produtor,
      produto,
      encomenda,
      classificacao,
      comentario
    });

    res.status(201).json(avaliacao);
  })
);

// GET /api/reviews?produtor=&produto=  -> 200 [avaliações visíveis]
router.get(
  '/',
  a(async (req, res) => {
    const { produtor, produto } = req.query;

    const filtro = {
      visivel: true
    };

    if (produtor) {
      filtro.produtor = produtor;
    }

    if (produto) {
      filtro.produto = produto;
    }

    const avaliacoes = await Review.find(filtro)
      .sort({ createdAt: -1 })
      .populate('autor', 'nome')
      .populate('produtor', 'nome produtor.nomeExploracao')
      .populate('produto', 'nome categoria');

    res.json(avaliacoes);
  })
);

// POST /api/reviews/:id/denuncia  -> 204
router.post(
  '/:id/denuncia',
  auth(),
  a(async (req, res) => {
    const avaliacao = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $inc: {
          denuncias: 1
        }
      },
      {
        new: true
      }
    );

    if (!avaliacao) {
      throw erro(404, 'Avaliação não encontrada');
    }

    res.status(204).end();
  })
);

module.exports = router;
