// Leilão em direto. As licitações ficam numa coleção própria (Bid): podem ser centenas.
const { Schema, model, Types } = require('mongoose');

const auctionSchema = new Schema({
  produtor: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  produto: { type: Types.ObjectId, ref: 'Product' },
  lote: { type: String, required: true, trim: true, maxlength: 150 },
  descricao: { type: String, maxlength: 1000 },
  quantidade: String,
  precoBase: { type: Number, required: true, min: 0 },
  incremento: { type: Number, required: true, min: 0.01 },
  licitacaoAtual: {
    valor: Number,
    comprador: { type: Types.ObjectId, ref: 'User' },
    nome: String,
    em: Date
  },
  numLicitacoes: { type: Number, default: 0 },
  iniciaEm: { type: Date, required: true },
  terminaEm: { type: Date, required: true, index: true },
  estado: { type: String, enum: ['agendado', 'ativo', 'terminado'], default: 'agendado', index: true },
  encomenda: { type: Types.ObjectId, ref: 'Order' },
  imagemUrl: { type: String, default: null }
}, { timestamps: true });

module.exports = model('Auction', auctionSchema);
