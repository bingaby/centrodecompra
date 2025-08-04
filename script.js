const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const { createClient } = require('redis');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://www.centrodecompra.com.br',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

app.use(cors({
    origin: 'https://www.centrodecompra.com.br',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Configuração do PostgreSQL
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do Redis
const redisClient = createClient({
    url: 'redis://default:password@localhost:6379' // Ajuste conforme necessário
});
redisClient.on('error', err => console.error('Erro no Redis:', err));
redisClient.connect().then(() => console.log('Conectado ao Redis'));

// Middleware de autenticação (apenas para rotas administrativas)
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
    }
    next();
};

// Rota para obter todos os produtos (sem autenticação)
app.get('/api/produtos', async (req, res) => {
    const { page = 1, limit = 12, categoria, loja, busca } = req.query;
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM produtos WHERE 1=1';
        const values = [];

        if (categoria && categoria !== 'todas') {
            values.push(categoria);
            query += ` AND categoria = $${values.length}`;
        }

        if (loja && loja !== 'todas') {
            values.push(loja);
            query += ` AND loja = $${values.length}`;
        }

        if (busca) {
            values.push(`%${busca}%`);
            query += ` AND (nome ILIKE $${values.length} OR descricao ILIKE $${values.length})`;
        }

        const cacheKey = `produtos:${page}:${limit}:${categoria || 'todas'}:${loja || 'todas'}:${busca || ''}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            console.log('Retornando produtos do cache');
            return res.json(JSON.parse(cached));
        }

        query += ` ORDER BY id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        const totalResult = await pool.query('SELECT COUNT(*) FROM produtos WHERE 1=1' +
            (categoria && categoria !== 'todas' ? ' AND categoria = $1' : '') +
            (loja && loja !== 'todas' ? ` AND loja = $${categoria && categoria !== 'todas' ? 2 : 1}` : '') +
            (busca ? ` AND (nome ILIKE $${(categoria && categoria !== 'todas') + (loja && loja !== 'todas') + 1} OR descricao ILIKE $${(categoria && categoria !== 'todas') + (loja && loja !== 'todas') + 1})` : ''),
            values.slice(0, values.length - 2));

        const total = parseInt(totalResult.rows[0].count);
        const response = { data: result.rows, total };

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
        res.json(response);
    } catch (error) {
        console.error('Erro ao obter produtos:', error);
        res.status(500).json({ error: 'Erro ao obter produtos' });
    }
});

// Rota para obter um produto específico (sem autenticação)
app.get('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const cacheKey = `produto:${id}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            console.log('Retornando produto do cache');
            return res.json(JSON.parse(cached));
        }

        const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const produto = result.rows[0];
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(produto));
        res.json(produto);
    } catch (error) {
        console.error('Erro ao obter produto:', error);
        res.status(500).json({ error: 'Erro ao obter produto' });
    }
});

// Rotas administrativas (com autenticação)
app.post('/api/produtos', authenticate, async (req, res) => {
    const { nome, preco, categoria, loja, link, imagens, descricao } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO produtos (nome, preco, categoria, loja, link, imagens, descricao) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [nome, preco, categoria, loja, link, imagens, descricao]
        );
        const produto = result.rows[0];
        io.emit('novoProduto', produto);
        await redisClient.del('produtos:*');
        res.status(201).json(produto);
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ error: 'Erro ao adicionar produto' });
    }
});

app.put('/api/produtos/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { nome, preco, categoria, loja, link, imagens, descricao } = req.body;

    try {
        const result = await pool.query(
            'UPDATE produtos SET nome = $1, preco = $2, categoria = $3, loja = $4, link = $5, imagens = $6, descricao = $7 WHERE id = $8 RETURNING *',
            [nome, preco, categoria, loja, link, imagens, descricao, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        const produto = result.rows[0];
        io.emit('produtoAtualizado', produto);
        await redisClient.del(`produto:${id}`);
        await redisClient.del('produtos:*');
        res.json(produto);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

app.delete('/api/produtos/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        io.emit('produtoExcluido', { id });
        await redisClient.del(`produto:${id}`);
        await redisClient.del('produtos:*');
        res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
});

// Rota para upload de imagens
app.post('/api/upload-imagem', authenticate, async (req, res) => {
    try {
        const { image } = req.body;
        const result = await cloudinary.uploader.upload(image, {
            folder: 'centrodecompra'
        });
        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
