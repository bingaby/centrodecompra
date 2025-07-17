const PLANILHA_ID = '1SMpUcrobcuWVGq4F_3N59rhs2_GpDo2531_2blpwEhs';
const ABA_PRODUTOS = 'Produtos';
const PASTA_DRIVE_ID = '1Nkpfbi2idMvJEsLMZWInoWoVSbZGGTgA';

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ message: "API do Centro de Compras ativa." }))
    .setMimeType(ContentService.MimeType.JSON)
    setHeader("Access-Control-Allow-Origin", "*");
}

function doPost(e) {
  try {
    // Permitir CORS para requisições POST
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    
    // Responder pré-vôo OPTIONS
    if (e.method === "options") {
      return ContentService.createTextOutput("")
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
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*");
    }

    // Processar múltiplas imagens, se fornecidas
    let imagens = [];
    if (data.imagensBase64 && Array.isArray(data.imagensBase64)) {
      imagens = data.imagensBase64.map((base64, index) =>
        salvarImagemBase64(base64, `${data.nome || 'produto'}_${index + 1}.jpg`)
      );
    } else if (data.imagemBase64) {
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
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, imagemUrls: imagens }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: erro.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function salvarImagemBase64(base64String, nomeArquivo) {
  const pasta = DriveApp.getFolderById(PASTA_DRIVE_ID);
  const base64Clean = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  const bytes = Utilities.base64Decode(base64Clean);
  const blob = Utilities.newBlob(bytes, 'image/jpeg', nomeArquivo);
  const arquivo = pasta.createFile(blob);
  arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return arquivo.getUrl();
}
