const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/core');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configurar CORS
app.use(cors({
  origin: ['https://www.centrodecompra.com.br', 'https://bingaby.github.io'], // Permitir múltiplas origens
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato não suportado. Use JPEG ou PNG.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 }, // 500 KB
  fileFilter
});

// Middleware
app.use(express.json());
app.use('/imagens', express.static(path.join(__dirname, 'Uploads')));

// Inicializar Octokit
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Endpoint para upload de produto
app.post('/produtos', upload.array('imagens', 3), async (req, res) => {
  try {
    const { nome, descricao, categoria, loja, link, preco } = req.body;
    if (!nome || !descricao || !categoria || !loja || !link || !preco) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Gerar URLs para imagens
    const imagens = req.files.map(file => `${process.env.SERVER_URL || 'http://localhost:3000'}/imagens/${file.filename}`);

    // Carregar produtos.json atual
    let produtos = [];
    let sha;
    try {
      const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'bingaby',
        repo: 'centrodecompra',
        path: 'produtos.json'
      });
      produtos = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
      sha = response.data.sha;
    } catch (error) {
      if (error.status === 404) {
        produtos = [];
      } else {
        throw error;
      }
    }

    // Adicionar novo produto
    const produto = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      nome,
      descricao,
      categoria,
      loja,
      link,
      preco,
      imagens
    };
    produtos.push(produto);

    // Validar tamanho do JSON
    const jsonContent = JSON.stringify(produtos, null, 2);
    if (new TextEncoder().encode(jsonContent).length > 90 * 1024 * 1024) {
      throw new Error('produtos.json excede 90 MB.');
    }

    // Atualizar produtos.json no GitHub
    const content = Buffer.from(jsonContent).toString('base64');
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: 'bingaby',
      repo: 'centrodecompra',
      path: 'produtos.json',
      message: 'Adiciona novo produto via servidor',
      content,
      sha,
      branch: 'main'
    });

    res.status(201).json({ message: 'Produto adicionado com sucesso!', produto });
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({ error: error.message || 'Erro ao adicionar produto.' });
  }
});

// Endpoint para listar produtos
app.get('/produtos', async (req, res) => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: 'bingaby',
      repo: 'centrodecompra',
      path: 'produtos.json'
    });
    const produtos = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    res.json(produtos);
  } catch (error) {
    if (error.status === 404) {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Erro ao carregar produtos.' });
    }
  }
});

// Endpoint para excluir produto
app.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Carregar produtos.json atual
    let produtos = [];
    let sha;
    try {
      const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'bingaby',
        repo: 'centrodecompra',
        path: 'produtos.json'
      });
      produtos = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
      sha = response.data.sha;
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ error: 'Nenhum produto encontrado.' });
      }
      throw error;
    }

    // Verificar se o produto existe
    const produtoIndex = produtos.findIndex(p => p._id === id);
    if (produtoIndex === -1) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    // Remover produto
    produtos.splice(produtoIndex, 1);

    // Atualizar produtos.json no GitHub
    const jsonContent = JSON.stringify(produtos, null, 2);
    const content = Buffer.from(jsonContent).toString('base64');
    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: 'bingaby',
      repo: 'centrodecompra',
      path: 'produtos.json',
      message: 'Remove produto via servidor',
      content,
      sha,
      branch: 'main'
    });

    res.json({ message: 'Produto excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir produto.' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
