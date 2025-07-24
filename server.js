// server.js
const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDryJc0Y7JV_Os5DZdEDts5XaFUEtJ7wDk",
  authDomain: "centrodecompra-5fa91.firebaseapp.com",
  projectId: "centrodecompra-5fa91",
  storageBucket: "centrodecompra-5fa91.firebasestorage.app",
  messagingSenderId: "276696026262",
  appId: "1:276696026262:web:979a68c0796ea1d17346b7",
  measurementId: "G-PM11NQL61N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const expressApp = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

expressApp.use(cors({
  origin: ['https://www.centrodecompra.com.br', 'http://localhost:3000', 'https://api-centro-de-compras.onrender.com'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

expressApp.use(express.static(path.join(__dirname, 'public')));
expressApp.use(express.json());

expressApp.options('/api/produtos', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).send();
});

expressApp.post('/api/produtos', upload.array('imagens', 5), async (req, res) => {
  try {
    const { nome, descricao, categoria, loja, link, preco } = req.body;
    if (!nome || !descricao || !categoria || !loja || !link || !preco) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    const imagensBase64 = req.files && req.files.length > 0
      ? req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`)
      : [];

    const produto = {
      nome,
      descricao,
      categoria,
      loja,
      link,
      preco: parseFloat(preco),
      imagensBase64,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'produtos'), produto);
    res.status(200).json({ message: 'Produto salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    res.status(500).json({ error: `Erro ao salvar produto: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
expressApp.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
