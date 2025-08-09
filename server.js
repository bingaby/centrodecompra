const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
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

// Configuração do banco de dados
const pool = new Pool({
    user: process.env.DB_USER || 'centrodecompra_db_user',
    host: process.env.DB_HOST || 'dpg-d25392idbo4c73a974pg-a.oregon-postgres.render.com',
    database: process.env.DB_NAME || 'centrodecompra_db',
    password: process.env.DB_PASSWORD || 'cIqUg4jtqXIxlDmyWMruasKU5OLxbrcd',
    port: process.env.DB_PORT || 5432,
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
        CREATE TABLE IF NOT EXISTS admin_users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `, async (err) => {
        if (err) {
            console.error('Erro ao criar tabelas:', err);
            process.exit(1);
        }
        console.log('Tabelas criadas ou verificadas');
        // Insere o usuário admin padrão se ele não existir
        const defaultUsername = 'admin';
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'sua_senha_secreta', 10);
        pool.query(`
            INSERT INTO admin_users (username, password)
            VALUES ($1, $2)
            ON CONFLICT (username) DO NOTHING;
        `, [defaultUsername, hashedPassword], (err) => {
            if (err) console.error('Erro ao inserir usuário admin padrão:', err);
            else console.log('Usuário admin padrão verificado/criado');
        });
    });
});

// Configuração do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'damasyarq',
    api_key: process.env.CLOUDINARY_API_KEY || '156799321846881',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'bmqmdKA5PTbmkfWExr8SUr_FtTI',
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

// Middleware de autenticação JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ status: 'error', message: 'Token de autenticação é necessário.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Formato do token inválido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ status: 'error', message: 'Token de autenticação inválido ou expirado.' });
    }
};

// Cache simples em memória
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// --- Rotas Públicas ---
// Rota para login de admin
app.post('/api/login', [
    body('username').trim().notEmpty().withMessage('Nome de usuário é obrigatório.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    const { username, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
        const user = rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.json({ status: 'success', token });
        } else {
            return res.status(401).json({ status: 'error', message: 'Nome de usuário ou senha inválidos.' });
        }
    } catch (error) {
        console.error('Erro durante o login:', error);
        res.status(500).json({ status: 'error', message: 'Erro no servidor.' });
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
        if (cache.has(cacheKey) && Date.now() - cache.get(cacheKey).timestamp < CACHE_DURATION) {
            console.log('Retornando dados do cache');
            return res.json(cache.get(cacheKey).data);
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

// --- Rotas de Administrador (Protegidas por JWT) ---

// Rota para adicionar produto
app.post('/api/produtos', authenticateJWT, upload.array('imagens', 5), [
    body('nome').trim().notEmpty().escape(),
    body('descricao').trim().optional().escape(),
    body('preco').isNumeric().toFloat().withMessage('Preço deve ser um número.'),
    body('categoria').custom(value => CATEGORIAS_PERMITIDAS.includes(value)).withMessage('Categoria inválida.'),
    body('loja').custom(value => LOJAS_PERMITIDAS.includes(value)).withMessage('Loja inválida.'),
    body('link').isURL().withMessage('Link inválido.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Pelo menos uma imagem é obrigatória.' });
    }

    const { nome, descricao, preco, categoria, loja, link } = req.body;
    
    // Validação de tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = req.files.filter(file => !allowedMimeTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
        return res.status(400).json({ status: 'error', message: 'Apenas arquivos de imagem (JPEG, PNG, WEBP) são permitidos.' });
    }

    try {
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
        const values = [nome, descricao, preco, imageUrls, categoria, loja, link];
        const { rows } = await pool.query(query, values);

        io.emit('novoProduto', rows[0]);
        cache.clear();
        res.json({ status: 'success', data: rows[0], message: 'Produto adicionado com sucesso' });
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao adicionar produto' });
    }
});

// Rota para editar produto
app.put('/api/produtos/:id', authenticateJWT, upload.array('imagens', 5), [
    body('nome').trim().notEmpty().escape(),
    body('descricao').trim().optional().escape(),
    body('preco').isNumeric().toFloat().withMessage('Preço deve ser um número.'),
    body('categoria').custom(value => CATEGORIAS_PERMITIDAS.includes(value)).withMessage('Categoria inválida.'),
    body('loja').custom(value => LOJAS_PERMITIDAS.includes(value)).withMessage('Loja inválida.'),
    body('link').isURL().withMessage('Link inválido.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', errors: errors.array() });
    }
    
    const { id } = req.params;
    const { nome, descricao, preco, categoria, loja, link } = req.body;

    // Validação de tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = req.files ? req.files.filter(file => !allowedMimeTypes.includes(file.mimetype)) : [];
    if (invalidFiles.length > 0) {
        return res.status(400).json({ status: 'error', message: 'Apenas arquivos de imagem (JPEG, PNG, WEBP) são permitidos.' });
    }

    try {
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
            // Se nenhuma nova imagem for enviada, mantenha as imagens existentes
            const { rows } = await pool.query('SELECT imagens FROM produtos WHERE id = $1', [id]);
            if (rows.length > 0) {
                imageUrls = rows[0].imagens;
            }
        }

        const query = `
            UPDATE produtos
            SET nome = $1, descricao = $2, preco = $3, imagens = $4, categoria = $5, loja = $6, link = $7
            WHERE id = $8
            RETURNING *`;
        const values = [nome, descricao, preco, imageUrls, categoria, loja, link, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produto não encontrado' });
        }

        io.emit('produtoAtualizado', rows[0]);
        cache.clear();
        res.json({ status: 'success', data: rows[0], message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ status: 'error', message: 'Erro ao atualizar produto' });
    }
});

// Rota para excluir produto
app.delete('/api/produtos/:id', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM produtos WHERE id = $1 RETURNING *';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Produto não encontrado' });
        }
        io.emit('produtoExcluido', { id });
        cache.clear();
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
