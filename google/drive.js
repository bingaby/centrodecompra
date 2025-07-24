const { drive } = require('./auth'); // Corrigido de '../config/google' para './auth'
const { Buffer } = require('buffer');

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

async function uploadImagem(base64Data) {
  try {
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) throw new Error('Formato de imagem inválido');
    const extension = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    const fileMetadata = {
      name: `produto_${Date.now()}.${extension}`,
      parents: [DRIVE_FOLDER_ID],
    };
    const media = {
      mimeType: `image/${extension}`,
      body: buffer,
    };
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });
    await drive.permissions.create({
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    });
    return response.data.webViewLink;
  } catch (error) {
    throw new Error('Erro ao fazer upload da imagem: ' + error.message);
  }
}

module.exports = { uploadImagem };
