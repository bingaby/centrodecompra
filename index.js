const express = require('express');
const admin = require('firebase-admin');
const formidable = require('formidable');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://www.centrodecompra.com.br'],
}));

// Inicialização do Firebase (mantida como no código original)

app.post('/api/produtos', async (req, res) => {
  // Autenticação (substitua por autenticação robusta)
  const token = req.headers['x-admin-token'];
  if (token !== 'triple-click-access') {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const form = formidable({ multiples: true });
  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // Validação de campos obrigatórios
    const requiredFields = ['nome', 'descricao', 'categoria', 'loja', 'preco'];
    for (const field of requiredFields) {
      if (!fields[field]?.[0]) {
        return res.status(400).json({ error: `Campo ${field} é obrigatório` });
      }
    }

    const productData = {
      nome: fields.nome[0],
      descricao: fields.descricao[0],
      categoria: fields.categoria[0],
      loja: fields.loja[0],
      link: fields.link?.[0] || '',
      preco: parseFloat(fields.preco[0]),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Validação de preço
    if (isNaN(productData.preco) || productData.preco <= 0) {
      return res.status(400).json({ error: 'Preço inválido' });
    }

    // Upload de imagem
    if (files.imagens) {
      const imagem = Array.isArray(files.imagens) ? files.imagens[0] : files.imagens;
      if (!['image/jpeg', 'image/png'].includes(imagem.mimetype)) {
        return res.status(400).json({ error: 'Formato de imagem inválido' });
      }

      const fileName = `produtos/${uuidv4()}-${sanitizeFileName(productData.nome)}`;
      const file = storage.file(fileName);
      await file.save(imagem.filepath, {
        metadata: { contentType: imagem.mimetype },
      });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      });
      productData.imagemUrl = url;
    }

    // Verificar duplicatas
    const docRef = db.collection('produtos').doc(sanitizeFileName(productData.nome));
    const doc = await docRef.get();
    if (doc.exists) {
      return res.status(400).json({ error: 'Produto com este nome já existe' });
    }

    await docRef.set(productData);
    res.status(200).json({ message: 'Produto salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar produto:', error);
    res.status(500).json({ error: `Erro ao salvar produto: ${error.message}` });
  }
});

// Função auxiliar para sanitizar nomes de arquivos
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
