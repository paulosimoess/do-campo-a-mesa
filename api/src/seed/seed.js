// Dados de exemplo: npm run seed   (APAGA as coleções antes de inserir)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Auction = require('../models/Auction');
const Order = require('../models/Order');
const Bid = require('../models/Bid');
const Review = require('../models/Review');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all(
    [User, Product, Order, Auction, Bid, Review].map((Model) =>
      Model.deleteMany()
    )
  );

  const passwordHash = await bcrypt.hash('password123', 12);
  const [admin, horta, mel, comprador] = await User.create([
    { nome: 'Administração', email: 'admin@exemplo.pt', passwordHash, papel: 'admin' },
    { nome: 'Horta da Ribeira', email: 'horta@exemplo.pt', passwordHash, papel: 'produtor',
      produtor: { nomeExploracao: 'Horta da Ribeira', localidade: 'Ponte de Lima', validado: true } },
    { nome: 'Mel do Soajo', email: 'mel@exemplo.pt', passwordHash, papel: 'produtor',
      produtor: { nomeExploracao: 'Mel do Soajo', localidade: 'Arcos de Valdevez', validado: true } },
    { nome: 'Tasca do Lima', email: 'tasca@exemplo.pt', passwordHash, papel: 'comprador' }
  ]);

  const [kiwi, abobora, couve, melUrze, melCastanheiro] =
    await Product.create([
      {
        produtor: horta._id,
        nome: 'Kiwi Hayward',
        categoria: 'Fruta',
        preco: 2.4,
        unidade: 'kg',
        stock: 300,
        biologico: true,
        epocas: ['Outono', 'Inverno']
      },
      {
        produtor: horta._id,
        nome: 'Abóbora-menina',
        categoria: 'Hortícolas',
        preco: 1.2,
        unidade: 'kg',
        stock: 80,
        epocas: ['Outono']
      },
      {
        produtor: horta._id,
        nome: 'Couve-galega',
        categoria: 'Hortícolas',
        preco: 1.5,
        unidade: 'molho',
        stock: 40,
        biologico: true,
        epocas: ['Outono', 'Inverno']
      },
      {
        produtor: mel._id,
        nome: 'Mel de urze',
        categoria: 'Mel',
        preco: 7.5,
        unidade: '500 g',
        stock: 38
      },
      {
        produtor: mel._id,
        nome: 'Mel de castanheiro',
        categoria: 'Mel',
        preco: 7,
        unidade: '500 g',
        stock: 21
      }
    ]);

  const encomenda = await Order.create({
    comprador: comprador._id,
    produtor: horta._id,

    linhas: [
      {
        produto: kiwi._id,
        nome: kiwi.nome,
        precoUnit: kiwi.preco,
        unidade: kiwi.unidade,
        quantidade: 2
      }
    ],

    estado: 'entregue',

    entrega: {
      tipo: 'levantamento'
    },

    origem: 'loja'
  });

  await Review.create({
    autor: comprador._id,
    produtor: horta._id,
    produto: kiwi._id,
    encomenda: encomenda._id,
    classificacao: 5,
    comentario: 'Produto muito bom'
  });

  const agora = Date.now();
  const MIN = 60 * 1000;

  await Auction.create({
    produtor: horta._id,
    produto: kiwi._id,
    lote: '200 kg de kiwi Hayward, calibre A',
    quantidade: '200 kg',
    descricao: 'Excedente da colheita de outubro, em caixas de 10 kg.',
    precoBase: 200,
    incremento: 5,
    licitacaoAtual: {
      valor: 200
    },
    iniciaEm: new Date(agora),
    terminaEm: new Date(agora + 30 * MIN),
    estado: 'ativo'
  });

  console.log('Seed concluído. Utilizadores (password: password123):');
  console.log([admin, horta, mel, comprador].map((u) => `  ${u.papel.padEnd(10)} ${u.email}`).join('\n'));
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
