const express = require('express');
const admin = require('firebase-admin');
const formidable = require('formidable');

const app = express();
const cors = require('cors');

const allowedOrigins = ['https://www.centrodecompra.com.br'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir ferramentas locais como Postman (sem origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


// Verificar variáveis de ambiente
const requiredEnvVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Erro: Variável de ambiente ${envVar} não está definida`);
    throw new Error(`Variável de ambiente ${envVar} não está definida`);
  }
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: 'https://centrodecompra-5fa91.firebaseio.com',
    storageBucket: 'centrodecompra-5fa91.appspot.com'
  });
  console.log('Firebase Admin SDK inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin SDK:', error);
  throw error;
}

const db = admin.firestore();
const storage = admin.storage().bucket();

app.use(express.json());

app.post('/api/produtos', async (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token !== 'triple-click-access') {
    console.error('Acesso não autorizado: token inválido');
    return res.status(401).json({ error: 'Acesso não autorizado: token inválido' });
  }

  const form = new formidable.IncomingForm();
  
  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Erro ao processar formulário:', err);
        return res.status(500).json({ error: 'Erro ao processar formulário' });
      }

      const productData = {
        nome: fields.nome?.[0],
        descricao: fields.descricao?.[0],
        categoria: fields.categoria?.[0],
        loja: fields.loja?.[0],
        link: fields.link?.[0],
        preco: parseFloat(fields.preco?.[0]),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (files.imagens) {
        const imagem = Array.isArray(files.imagens) ? files.imagens[0] : files.imagens;
        const fileName = `produtos/${productData.nome}/${imagem.originalFilename}`;
        const file = storage.file(fileName);
        
        await file.save(imagem.buffer || imagem.filepath, {
          metadata: { contentType: imagem.mimetype },
        });
        
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        productData.imagemUrl = url;
      }

      await db.collection('produtos').doc(productData.nome).set(productData);
      console.log('Produto salvo com sucesso:', productData.nome);
      res.status(200).json({ message: 'Produto salvo com sucesso' });
    });
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    res.status(500).json({ error: `Erro ao salvar produto: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
