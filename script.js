const PLANILHA_ID = '1SMpUcrobcuWVGq4F_3N59rhs2_GpDo2531_2blpwEhs';
const ABA_PRODUTOS = 'Produtos';
const PASTA_DRIVE_ID = '1Nkpfbi2idMvJEsLMZWInoWoVSbZGGTgA';

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ message: "API do Centro de Compras ativa." }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}

function doPost(e) {
  try {
    // Configurar CORS
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Responder a requisições OPTIONS (pré-vôo CORS)
    if (e.parameter.method === 'OPTIONS') {
      return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(PLANILHA_ID).getSheetByName(ABA_PRODUTOS);
    if (!sheet) throw new Error(`Aba "${ABA_PRODUTOS}" não encontrada.`);

    // Ação de exclusão
    if (data.action === 'delete') {
      const rowIndex = parseInt(data.rowIndex);
      if (rowIndex < 2) throw new Error('Índice de linha inválido.');
      sheet.deleteRow(rowIndex);
      Logger.log(`Linha ${rowIndex} excluída com sucesso.`);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // Processar imagens
    let imagens = [];
    if (data.imagensBase64 && Array.isArray(data.imagensBase64)) {
      imagens = data.imagensBase64.map((base64, index) => {
        Logger.log(`Salvando imagem ${index + 1} para produto: ${data.nome}`);
        return salvarImagemBase64(base64, `${data.nome || 'produto'}_${index + 1}.jpg`);
      });
    } else if (data.imagemBase64) {
      Logger.log(`Salvando imagem única para produto: ${data.nome}`);
      imagens = [salvarImagemBase64(data.imagemBase64, `${data.nome || 'produto'}.jpg`)];
    }

    // Preparar dados do produto
    const produto = {
      nome: data.nome || '',
      descricao: data.descricao || '',
      categoria: data.categoria || '',
      loja: data.loja || '',
      link: data.link || '',
      preco: data.preco || '',
      imagens: imagens.join(','),
      data: new Date().toISOString()
    };

    // Adicionar ou atualizar produto
    if (data.rowIndex) {
      const rowIndex = parseInt(data.rowIndex);
      if (rowIndex < 2) throw new Error('Índice de linha inválido.');
      sheet.getRange(rowIndex, 1, 1, 8).setValues([[
        produto.nome,
        produto.descricao,
        produto.categoria,
        produto.loja,
        produto.link,
        produto.preco,
        produto.imagens,
        produto.data
      ]]);
      Logger.log(`Produto atualizado na linha ${rowIndex}: ${produto.nome}`);
    } else {
      sheet.appendRow([
        produto.nome,
        produto.descricao,
        produto.categoria,
        produto.loja,
        produto.link,
        produto.preco,
        produto.imagens,
        produto.data
      ]);
      Logger.log(`Produto adicionado: ${produto.nome}`);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, imagemUrls: imagens }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  } catch (erro) {
    Logger.log(`Erro: ${erro.message}`);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: erro.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

function salvarImagemBase64(base64String, nomeArquivo) {
  try {
    Logger.log(`Iniciando salvamento de imagem: ${nomeArquivo}`);
    const pasta = DriveApp.getFolderById(PASTA_DRIVE_ID);
    Logger.log(`Pasta encontrada: ${pasta.getName()}`);
    const base64Clean = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    const bytes = Utilities.base64Decode(base64Clean);
    const blob = Utilities.newBlob(bytes, 'image/jpeg', nomeArquivo);
    const arquivo = pasta.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const fileId = arquivo.getId();
    const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
    Logger.log(`Imagem salva com sucesso: ${url}`);
    return url;
  } catch (erro) {
    Logger.log(`Erro ao salvar imagem ${nomeArquivo}: ${erro.message}`);
    throw erro;
  }
}
