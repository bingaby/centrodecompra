const express = require('express');
const router = express.Router();
const { salvarProduto, listarProdutos } = require('../google/sheets');
const { uploadImagem } = require('../google/drive');

router.post('/', async (req, res) => {
  try {
    const { nome, descricao, categoria, loja, link, preco, imagensBase64, rowIndex } = req.body;

    if (!nome || !categoria || !loja || !link || !preco || !imagensBase64 || !Array.isArray(imagensBase64)) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes ou inválidos' });
    }

    const imagens = await Promise.all(imagensBase64.map(uploadImagem));
    await salvarProduto({ nome, descricao, categoria, loja, link, preco, imagens });

    res.status(201).json({ success: true, message: 'Produto salvo com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const { produtos, total, totalPages } = await listarProdutos(page, limit);
    res.json({ produtos, total, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
