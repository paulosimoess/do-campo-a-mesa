// TODO (Passo 4): decidir se as avaliações ficam embebidas no produto/produtor
// ou numa coleção própria, e justificar a decisão no relatório.
const { Schema, model, Types } = require('mongoose');

const reviewSchema = new Schema({
  autor: { type: Types.ObjectId, ref: 'User', required: true },
  produtor: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  produto: { type: Types.ObjectId, ref: 'Product', index: true },
  encomenda: { type: Types.ObjectId, ref: 'Order', index: true },
  classificacao: { type: Number, min: 1, max: 5, required: true },
  comentario: String,
  denuncias: { type: Number, default: 0 },

  denunciantes: {
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
    select: false
  },

  visivel: { type: Boolean, default: true }
}, { timestamps: true });

reviewSchema.index(
  {
    autor: 1,
    encomenda: 1,
    produto: 1
  },
  {
    unique: true,
    name: 'uniq_avaliacao_encomenda_produto',
    partialFilterExpression: {
      encomenda: { $exists: true }
    }
  }
);


module.exports = model('Review', reviewSchema);
