const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Lista de categorias e lojas permitidas (alinhada com o frontend)
const CATEGORIAS_PERMITIDAS = [
    'eletronicos', 'moda', 'fitness', 'casa', 'beleza', 'esportes', 'livros',
    'infantil', 'Celulares', 'Eletrodomésticos', 'pet', 'jardinagem', 'automotivo',
    'gastronomia', 'games'
];
const LOJAS_PERMITIDAS = ['amazon', 'magalu', 'shein', 'shopee', 'mercadolivre', 'alibaba'];

// Configuração do CORS
const allowedOrigins = [
    'http://localhost:3000',
    'https://www.centrodecompra.com.br',
    'https://minha-api-produtos.onrender.com',
    // Adicione o domínio do frontend hospedado no Render, se diferente
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
}));
app.use(express.json());

// Middleware de autenticação básica
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'seu_token_secreto';
    if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
        return res.status(401).json({ status: 'error', message: 'Autenticação necessária' });
    }
    next();
};

// Configuração do banco de dados
const pool = new Pool({
    user: 'centrodecompra_db_user',
    host: 'dpg-d25392idbo4c73a974pg-a.oregon-postgres.render.com',
    database: 'centrodecompra_db',
    password: 'cIqUg4jtqXIxlDmyWMruasKU5OLxbrcd',
    port: 5432,
    ssl: { rejectUnauthorized: false },
});

// Criar tabela produtos se não existir
pool.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao PostgreSQL:', err);
        process.exit(1);
    }
    console.log('Conectado ao PostgreSQL');
    pool.query(`
        CREATE TABLE IF NOT EXISTS produtos (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            descricao TEXT,
            preco NUMERIC NOT NULL,
            imagens TEXT[] NOT NULL,
            categoria TEXT NOT NULL,
            loja TEXT NOT NULL,
            link TEXT NOT NULL
        );
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela produtos:', err);
            process.exit(1);
        }
        console.log('Tabela produtos criada ou verificada');
    });
});

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: 'damasyarq',
    api_key: '156799321846881',
    api_secret: 'bmqmdKA5PTbmkfWExr8SUr_FtTI',
});

// Configuração do Socket.IO
const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Cache simples em memória
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Rota para buscar produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const { categoria, loja, busca, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;
        console.log('Parâmetros recebidos:', { categoria, loja, busca, page, limit });

        // Validação de categoria e loja
        if (categoria && categoria !== 'todas' && !CATEGORIAS_PERMITIDAS.includes(categoria)) {
            return res.status(400).json({ status: 'error', message: 'Categoria inválida' });
        }
        if (loja && loja !== 'todas' && !LOJAS_PERMITIDAS.includes(loja)) {
            return res.status(400).json({ status: 'error', message: 'Loja inválida' });
        }

        // Chave para cache
        const cacheKey = `${categoria || 'todas'}-${loja || 'todas'}-${busca || ''}-${page}-${limit}`;
        if (cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log('Retornando dados do cache');
                return res.json(cached.data);
            }
        }

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

        const responseData = {
            status: 'success',
            data: rows,
            total: parseInt(countResult.rows[0].count),
        };

        // Armazenar no cache
        cache.set(cacheKey, { data: responseData, timestamp: Date.now() });

        res.json(responseData);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao buscar produtos' });
    }
});

// Rota para adicionar produto
app.post('/api/produtos', authenticate, upload.array('imagens', 5), async (req, res) => {
    try {
        const { nome, descricao, preco, categoria, loja, link } = req.body;
        if (!nome || !preco || !categoria || !loja || !link || !req.files || req.files.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Todos os campos são obrigatórios, incluindo pelo menos uma imagem' });
        }

        if (!CATEGORIAS_PERMITIDAS.includes(categoria)) {
            return res.status(400).json({ status: 'error', message: 'Categoria inválida' });
        }
        if (!LOJAS_PERMITIDAS.includes(loja)) {
            return res.status(400).json({ status: 'error', message: 'Loja inválida' });
        }

        const imageUrls = [];
        for (const file of req.files) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { transformation: [{ width: 300, height: 300, crop: 'limit' }] },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
            imageUrls.push(result.secure_url);
        }

        const query = `
            INSERT INTO produtos (nome, descricao, preco, imagens, categoria, loja, link)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`;
        const values = [nome, descricao, parseFloat(preco), imageUrls, categoria, loja, link];
        const { rows } = await pool.query(query, values);

        io.emit('novoProduto', rows[0]);
        cache.clear(); // Limpar cache ao adicionar produto
        res.json({ status: 'success', data: rows[0], message: 'Produto adicionado com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao adicionar produto' });
    }
});

// Rota para editar produto
app.put('/api/produtos/:id', authenticate, upload.array('imagens', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, preco, categoria, loja, link } = req.body;
        if (!nome || !preco || !categoria || !loja || !link) {
            return res.status(400).json({ status: 'error', message: 'Todos os campos são obrigatórios' });
        }

        if (!CATEGORIAS_PERMITIDAS.includes(categoria)) {
            return res.status(400).json({ status: 'error', message: 'Categoria inválida' });
        }
        if (!LOJAS_PERMITIDAS.includes(loja)) {
            return res.status(400).json({ status: 'error', message: 'Loja inválida' });
        }

        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { transformation: [{ width: 300, height: 300, crop: 'limit' }] },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(file.buffer);
                });
                imageUrls.push(result.secure_url);
            }
        }

        const query = `
            UPDATE produtos
            SET nome = $1, descricao = $2, preco = $3, imagens = $4, categoria = $5, loja = $6, link = $7
            WHERE id = $8
            RETURNING *`;
        const values = [
            nome,
            descricao,
            parseFloat(preco),
            imageUrls.length > 0 ? imageUrls : (await pool.query('SELECT imagens FROM produtos WHERE id = $1', [id])).rows[0].imagens,
            categoria,
            loja,
            link,
            id
        ];
        const { rows } = await pool.query(query, values);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produto não encontrado' });
        }

        io.emit('produtoAtualizado', rows[0]);
        cache.clear(); // Limpar cache ao atualizar produto
        res.json({ status: 'success', data: rows[0], message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao atualizar produto' });
    }
});

// Rota para excluir produto
app.delete('/api/produtos/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM produtos WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produto não encontrado' });
        }
        io.emit('produtoExcluido', { id });
        cache.clear(); // Limpar cache ao excluir produto
        res.json({ status: 'success', message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao excluir produto' });
    }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
