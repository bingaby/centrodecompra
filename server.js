const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Lista de categorias e lojas permitidas
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
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
    if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
        return res.status(401).json({ status: 'error', message: 'Autenticação necessária' });
    }
    next();
};

// Configuração do banco de dados (usando variáveis de ambiente)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
});

// Conectar e criar a tabela
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

// Configuração do Cloudinary (usando variáveis de ambiente)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuração do Socket.IO
const server = http.createServer(app);
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

// --- ROTAS DO FRONTEND ---
// Servindo arquivos estáticos diretamente do diretório raiz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/contato.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contato.html'));
});

app.get('/admin-xyz-123.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-xyz-123.html'));
});

// Servir arquivos JavaScript
app.get('/admin.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.js'));
});

// Servir arquivos CSS do Font Awesome
app.get('/css/all.min.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/css/all.min.css'));
});

// Servir outros arquivos de pastas (ex: imagens, logos)
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));
app.use('/logos', express.static(path.join(__dirname, 'logos')));


// --- ROTAS DA API ---

// Rota para buscar estatísticas
app.get('/api/stats', async (req, res) => {
    try {
        const totalProductsQuery = 'SELECT COUNT(*) FROM produtos';
        const { rows } = await pool.query(totalProductsQuery);
        const totalProducts = parseInt(rows[0].count);

        const totalViews = Math.floor(Math.random() * 5000) + totalProducts;
        const totalSales = Math.floor(Math.random() * 200) + 1;

        res.json({
            status: 'success',
            totalProducts,
            totalViews,
            totalSales,
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao buscar estatísticas' });
    }
});

// Rota para buscar produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const { categoria, loja, busca, page = 1, limit = 12 } = req.query;
        const offset = (page - 1) * limit;

        if (categoria && categoria !== 'todas' && !CATEGORIAS_PERMITIDAS.includes(categoria)) {
            return res.status(400).json({ status: 'error', message: 'Categoria inválida' });
        }
        if (loja && loja !== 'todas' && !LOJAS_PERMITIDAS.includes(loja)) {
            return res.status(400).json({ status: 'error', message: 'Loja inválida' });
        }

        const cacheKey = `${categoria || 'todas'}-${loja || 'todas'}-${busca || ''}-${page}-${limit}`;
        if (cache.has(cacheKey)) {
            const cached = cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
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
        if (!nome || !preco || !categoria || !loja || !link) {
            return res.status(400).json({ status: 'error', message: 'Todos os campos são obrigatórios' });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Pelo menos uma imagem é obrigatória' });
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

        let imageUrls = [];
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
        } else {
             // Buscar imagens existentes se nenhuma nova for enviada
            const existingProduct = await pool.query('SELECT imagens FROM produtos WHERE id = $1', [id]);
            if (existingProduct.rows.length > 0) {
                imageUrls = existingProduct.rows[0].imagens;
            }
        }
        
        const query = `
            UPDATE produtos
            SET nome = $1, descricao = $2, preco = $3, imagens = $4, categoria = $5, loja = $6, link = $7
            WHERE id = $8
            RETURNING *`;
        const values = [nome, descricao, parseFloat(preco), imageUrls, categoria, loja, link, id];
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
