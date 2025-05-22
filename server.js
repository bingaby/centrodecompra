const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const port = 3000;
const produtosFile = path.join(__dirname, 'produtos.json');
const uploadsDir = path.join(__dirname, 'Uploads');

// Criar pasta Uploads
fs.mkdir(uploadsDir, { recursive: true }).catch(err => {
  console.error('Erro ao criar pasta Uploads:', err);
});

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:3000', 'file://'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Configurar multer
const storage = multer.diskStorage({
  destination: './Uploads/',
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
app.use('/imagens', express.static(uploadsDir));

// Criar produtos.json se não existir
async function inicializarProdutos() {
  try {
    await fs.access(produtosFile);
  } catch {
    await fs.writeFile(produtosFile, JSON.stringify([], null, 2));
  }
}
inicializarProdutos();

// Endpoint para adicionar produto
app.post('/produtos', upload.array('imagens', 3), async (req, res) => {
  try {
    const { nome, descricao, categoria, loja, link, preco } = req.body;
    if (!nome || !descricao || !categoria || !loja || !link || !preco) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Gerar URLs para imagens
    const imagens = req.files.map(file => `http://localhost:3000/imagens/${file.filename}`);

    // Carregar produtos existentes
    const produtos = JSON.parse(await fs.readFile(produtosFile, 'utf8'));

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

    // Salvar no arquivo
    await fs.writeFile(produtosFile, JSON.stringify(produtos, null, 2));

    res.status(201).json({ message: 'Produto adicionado com sucesso!', produto });
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({ error: error.message || 'Erro ao adicionar produto.' });
  }
});

// Endpoint para listar produtos
app.get('/produtos', async (req, res) => {
  try {
    const produtos = JSON.parse(await fs.readFile(produtosFile, 'utf8'));
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    res.status(500).json({ error: 'Erro ao carregar produtos.' });
  }
});

// Endpoint para excluir produto
app.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let produtos = JSON.parse(await fs.readFile(produtosFile, 'utf8'));
    const produtoIndex = produtos.findIndex(p => p._id === id);
    if (produtoIndex === -1) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    produtos.splice(produtoIndex, 1);
    await fs.writeFile(produtosFile, JSON.stringify(produtos, null, 2));
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