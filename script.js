const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/centro_de_compras');
const Produto = mongoose.model('Produto', new mongoose.Schema({
  nome: String,
  categoria: String,
  loja: String,
  link: String,
  imagens: [String],
  descricao: String
}));
async function inserirProdutos() {
  for (let i = 0; i < 1000; i++) {
    await Produto.create({
      nome: `Produto ${i + 1}`,
      categoria: 'eletronicos',
      loja: 'amazon',
      link: 'https://example.com',
      imagens: ['/Uploads/placeholder.jpg'],
      descricao: 'Descrição teste'
    });
  }
  console.log('Produtos inseridos');
  mongoose.disconnect();
}
inserirProdutos();