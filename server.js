const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const cors = require('cors');

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  storageBucket: 'centrodecompra-5fa91.appspot.com',
});

const db = admin.firestore();
const storage = admin.storage().bucket();

const expressApp = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

expressApp.use(cors({
  origin: ['https://www.centrodecompra.com.br', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-token'],
}));
expressApp.use(express.json());

expressApp.options('/api/produtos', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.centrodecompra.com.br');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.status(204).send();
});

expressApp.post('/api/produtos', upload.array('imagens', 5), async (req, res) => {
  try {
    const { nome, descricao, categoria, loja, link, preco } = req.body;
    if (!nome || !descricao || !categoria || !loja || !link || !preco) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const imagensUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `produtos/${nome}/${Date.now()}-${file.originalname}`;
        const fileRef = storage.file(fileName);
        await fileRef.save(file.buffer, { contentType: file.mimetype });
        const [url] = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
        imagensUrls.push(url);
      }
    }

    const produto = {
      nome,
      descricao,
      categoria,
      loja,
      link,
      preco: parseFloat(preco),
      imagensUrls,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('produtos').add(produto);
    res.status(200).json({ message: 'Produto salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    res.status(500).json({ error: `Erro ao salvar produto: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
expressApp.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
