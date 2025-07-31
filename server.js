require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const cloudinary = require('cloudinary').v2;
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Validação de variáveis de ambiente
const requiredEnvVars = ['PGUSER', 'PGHOST', 'PGDATABASE', 'PGPASSWORD', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Variável de ambiente ${varName} não definida`);
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }
});

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // Limite de 100 requisições por IP
});
app.use(limiter);

// Configuração do PostgreSQL
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false }
});

// Testar conexão com o banco
pool.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao PostgreSQL:', err);
    process.exit(1);
  }
  console.log('Conectado ao PostgreSQL');
});

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Apenas imagens JPEG, PNG ou GIF são permitidas'));
    }
    cb(null, true);
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.send('API do Centro de Compra online!');
});

// Validação de entrada
const validateProduct = (data) => {
  const { nome, preco, categoria, loja, link } = data;
  if (!nome || !preco || !categoria || !loja || !link) {
    throw new Error('Todos os campos são obrigatórios');
  }
  if (isNaN(preco) || preco <= 0) {
    throw new Error('Preço deve ser um número positivo');
  }
};

// Rota para adicionar produto
app.post('/api/produtos', upload.array('imagens', 3), async (req, res) => {
  try {
    validateProduct(req.body);
    const { nome, descricao, preco, categoria, loja, link } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Pelo menos uma imagem é obrigatória' });
    }

    // Upload para o Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'produtos' },
          (error, result) => {
            if (error) reject(error);
            resolve(result.secure_url);
          }
        ).end(file.buffer);
      });
    });

    const imagens = await Promise.all(uploadPromises);

    const query = `
      INSERT INTO produtos (nome, descricao, preco, imagens, categoria, loja, link)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const values = [nome, descricao, preco, imagens, categoria, loja, link];
    const { rows } = await pool.query(query, values);

    const newProduct = rows[0];
    io.emit('novo-produto', newProduct);
    res.status(201).json({ status: 'success', data: newProduct, message: 'Produto adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Erro ao adicionar produto' });
  }
});

// Rota para buscar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const { categoria, loja, busca, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM produtos';
    const values = [];
    let whereClauses = [];

    if (categoria && categoria !== 'todas') {
      whereClauses.push('categoria = $' + (values.length + 1));
      values.push(categoria);
    }
    if (loja && loja !== 'todas') {
      whereClauses.push('loja = $' + (values.length + 1));
      values.push(loja);
    }
    if (busca) {
      whereClauses.push('nome ILIKE $' + (values.length + 1));
      values.push(`%${busca}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    const countQuery = `SELECT COUNT(*) FROM produtos${whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : ''}`;
    const countResult = await pool.query(countQuery, values.slice(0, whereClauses.length));

    query += ' ORDER BY id DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);

    res.json({
      status: 'success',
      data: rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar produtos' });
  }
});

// Rota para excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM produtos WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Produto não encontrado' });
    }

    io.emit('produto-excluido', rows[0].id);
    res.json({ status: 'success', message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao excluir produto' });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Tratamento de erros globais
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ status: 'error', message: 'Erro interno do servidor' });
});

// Start do servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    pool.end(() => {
      console.log('Conexão com o banco de dados encerrada');
      process.exit(0);
    });
  });
});
