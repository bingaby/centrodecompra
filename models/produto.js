
const mongoose = require('mongoose');

// Definindo o esquema do produto
const produtoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  categoria: { type: String, required: true },
  loja: { type: String, required: true },
  link: { type: String, required: true },
  imagens: { type: [String], required: true }, // Um array de strings para armazenar URLs das imagens
  descricao: { type: String, required: false }
});

// Criando o modelo Produto a partir do esquema
const Produto = mongoose.model('Produto', produtoSchema);

module.exports = Produto;
