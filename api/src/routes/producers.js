// Páginas públicas dos produtores
const router = require('express').Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Review = require('../models/Review');
const a = require('../utils/async');
const erro = require('../utils/erro');

// GET /api/producers?localidade=  -> 200 [produtores validados]
router.get(
  '/',
  a(async (req, res) => {
    const { localidade } = req.query;

    const filtro = {
      papel: 'produtor',
      'produtor.validado': true
    };

    if (localidade) {
      filtro['produtor.localidade'] = {
        $regex: localidade,
        $options: 'i'
      };
    }

    const produtores = await User.find(filtro)
      .select('nome produtor createdAt')
      .sort({ nome: 1 });

    res.json(produtores);
  })
);

// GET /api/producers/:id  -> 200 { produtor, produtos, avaliacaoMedia }
router.get(
  '/:id',
  a(async (req, res) => {
    const produtor = await User.findOne({
      _id: req.params.id,
      papel: 'produtor',
      'produtor.validado': true
    }).select('nome produtor createdAt');

    if (!produtor) {
      throw erro(404, 'Produtor não encontrado');
    }

    const produtos = await Product.find({
      produtor: produtor._id
    }).sort({ createdAt: -1 });

    const avaliacoes = await Review.find({
      produtor: produtor._id,
      visivel: true
    }).select('classificacao');

    const avaliacaoMedia =
      avaliacoes.length > 0
        ? avaliacoes.reduce(
            (soma, avaliacao) => soma + avaliacao.classificacao,
            0
          ) / avaliacoes.length
        : null;

    res.json({
      produtor,
      produtos,
      avaliacaoMedia
    });
  })
);

module.exports = router;
