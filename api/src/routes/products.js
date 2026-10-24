const router = require('express').Router();
const multer = require('multer');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { guardarImagem, removerImagemLocal } = require('../services/imagens');
const a = require('../utils/async');
const erro = require('../utils/erro');

const escaparRegex = (texto) =>
  texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ORDENACAO = {
  recentes: { createdAt: -1 },
  precoAsc: { preco: 1 },
  precoDesc: { preco: -1 },
  nome: { nome: 1 }
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const produtorValidado = require('../middleware/produtorValidado');

const CAMPOS = [
  'nome',
  'descricao',
  'categoria',
  'preco',
  'unidade',
  'stock',
  'biologico',
  'epocas'
];

const escolher = (obj) =>
  Object.fromEntries(
    CAMPOS
      .filter((campo) => obj[campo] !== undefined)
      .map((campo) => [campo, obj[campo]])
  );

// GET /api/products?q=&categoria=&precoMax=&bio=&epoca=  -> 200 [produtos]
// Exemplo já implementado; completar com os restantes filtros (época, produtor, ordenação…)
router.get('/', a(async (req, res) => {
  const {
    q,
    categoria,
    precoMax,
    bio,
    epoca,
    produtor,
    ordenar
  } = req.query;

  const filtro = {};

  if (q) {
    filtro.nome = {
      $regex: escaparRegex(q),
      $options: 'i'
    };
  }

  if (categoria && categoria !== 'Todos') {
    filtro.categoria = categoria;
  }

  if (precoMax) {
    filtro.preco = {
      $lte: Number(precoMax)
    };
  }

  if (bio === 'true') {
    filtro.biologico = true;
  }

  if (epoca) {
    filtro.epocas = {
      $in: [epoca]
    };
  }

  if (produtor) {
    filtro.produtor = produtor;
  }

  const lista = await Product.find(filtro)
    .sort(ORDENACAO[ordenar] || ORDENACAO.recentes)
    .populate(
      'produtor',
      'nome produtor.localidade produtor.nomeExploracao'
    );

  res.json(lista);
}));

// GET /api/products/:id  -> 200 | 404
router.get('/:id', a(async (req, res) => {
  const produto = await Product.findById(req.params.id)
    .populate(
      'produtor',
      'nome produtor.localidade produtor.nomeExploracao'
    );

  if (!produto) {
    throw erro(404, 'Produto não encontrado');
  }

  res.json(produto);
}));

// POST /api/products  (produtor)  -> 201 + Location
router.post(
  '/',
  auth('produtor'),
  produtorValidado,
  a(async (req, res) => {
    const produto = await Product.create({
      ...escolher(req.body),
      produtor: req.user.id
    });

    res
      .status(201)
      .location(`/api/products/${produto._id}`)
      .json(produto);
  })
);

// PUT /api/products/:id  (produtor dono)  -> 200 | 404
router.put(
  '/:id',
  auth('produtor'),
  a(async (req, res) => {
    const produto = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        produtor: req.user.id
      },
      escolher(req.body),
      {
        new: true,
        runValidators: true
      }
    );

    if (!produto) {
      throw erro(404, 'Produto não encontrado');
    }

    res.json(produto);
  })
);

// DELETE /api/products/:id  (produtor dono)  -> 204 | 404
router.delete(
  '/:id',
  auth('produtor'),
  a(async (req, res) => {
    const resultado = await Product.deleteOne({
      _id: req.params.id,
      produtor: req.user.id
    });

    if (!resultado.deletedCount) {
      throw erro(404, 'Produto não encontrado');
    }

    res.status(204).end();
  })
);


 // POST /api/products/:id/imagem
router.post(
  '/:id/imagem',
  auth('produtor'),
  upload.single('imagem'),
  a(async (req, res) => {
    const produto = await Product.findOne({
      _id: req.params.id,
      produtor: req.user.id
    });

    if (!produto) {
      throw erro(404, 'Produto não encontrado');
    }

    if (!req.file) {
      throw erro(400, 'Selecione uma imagem');
    }

    const imagemAnterior = produto.imagemUrl;

    const imagemUrl = await guardarImagem(req.file);

    produto.imagemUrl = imagemUrl;
    await produto.save();

    if (imagemAnterior && imagemAnterior !== imagemUrl) {
      try {
        await removerImagemLocal(imagemAnterior);
      } catch (err) {
        console.warn(
          'Não foi possível remover a imagem anterior:',
          err.message
        );
      }
    }

    res.json({ imagemUrl });
  })
);


module.exports = router;
