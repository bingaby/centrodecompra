// ID da planilha fornecida
const SPREADSHEET_ID = '1cQOP4Tpu-9lq1aG6FPNFTmO4C1E1WixGKlMXx_ybzR0';
const SHEET_NAME = 'Produtos'; // Nome da aba na planilha

/**
 * Função principal para lidar com requisições GET.
 * Retorna produtos filtrados com base nos parâmetros de categoria, loja e busca.
 * @param {Object} e - O objeto de evento que contém os parâmetros da requisição.
 * @returns {GoogleAppsScript.Content.TextOutput} Resposta JSON com os produtos.
 */
function doGet(e) {
  const headers = {
    "Access-Control-Allow-Origin": "https://www.centrodecompra.com.br",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600"
  };

  try {
    // 1. Acesso à planilha e aba
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: `Aba '${SHEET_NAME}' não encontrada na planilha.` }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 2. Obtém os parâmetros da requisição
    const params = e.parameter;
    const category = params.category || 'todas';
    const store = params.store || 'todas';
    const query = params.query ? params.query.toLowerCase().trim() : '';

    // 3. Obtém todos os dados da planilha
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) { // Apenas cabeçalho ou vazio
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, products: [] }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 4. Mapeia os dados para objetos de produto
    const products = data.slice(1).map(row => ({
      nome: row[0] || '',
      descricao: row[1] || '',
      categoria: row[2] || 'desconhecida',
      preco: parseFloat(row[3]) || 0,
      imagem: row[4] || '',
      link: row[5] || '',
      createdAt: row[6] ? new Date(row[6]).toISOString() : new Date().toISOString()
    }));

    // 5. Filtra os produtos
    const filteredProducts = products.filter(product => {
      const matchesCategory = category === 'todas' || product.categoria.toLowerCase() === category.toLowerCase();
      const matchesStore = store === 'todas' || (product.loja && product.loja.toLowerCase() === store.toLowerCase());
      const matchesQuery = !query || 
        product.nome.toLowerCase().includes(query) || 
        product.descricao.toLowerCase().includes(query) ||
        product.categoria.toLowerCase().includes(query);
      return matchesCategory && matchesStore && matchesQuery;
    });

    // 6. Resposta de sucesso
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, products: filteredProducts }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Erro ao buscar produtos: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

/**
 * Função principal para lidar com requisições POST.
 * Recebe dados de produtos e os insere na planilha Google.
 * @param {Object} e - O objeto de evento que contém os dados da requisição.
 * @returns {GoogleAppsScript.Content.TextOutput} Resposta JSON indicando o status da operação.
 */
function doPost(e) {
  const headers = {
    "Access-Control-Allow-Origin": "https://www.centrodecompra.com.br",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600"
  };

  try {
    // 1. Validação inicial dos dados da requisição
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Dados ausentes ou formato inválido na requisição.' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    const data = JSON.parse(e.postData.contents);

    // 2. Validação dos campos obrigatórios
    const camposObrigatorios = ['nome', 'descricao', 'categoria', 'loja', 'preco', 'imagem', 'link'];
    const faltando = camposObrigatorios.filter(campo => 
      !data.hasOwnProperty(campo) || (typeof data[campo] === 'string' && data[campo].trim() === '')
    );

    if (faltando.length > 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Campos obrigatórios faltando ou vazios: ' + faltando.join(', ') }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 3. Validação do preço
    const preco = parseFloat(data.preco);
    if (isNaN(preco) || preco < 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Preço inválido! Deve ser um número positivo.' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 4. Validação da URL do link
    const urlPattern = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;
    if (!urlPattern.test(data.link.trim())) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Link inválido! Por favor, insira uma URL válida (ex: https://www.exemplo.com).' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 5. Validação da loja
    const lojasValidas = ['mercadolivre', 'amazon', 'magalu', 'shein', 'shopee', 'alibaba'];
    if (!lojasValidas.includes(data.loja.toLowerCase())) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Loja inválida! Escolha uma loja válida.' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 6. Acesso à planilha e aba
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: `Aba '${SHEET_NAME}' não encontrada na planilha.` }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders(headers);
    }

    // 7. Insere a linha com os dados do produto
    sheet.appendRow([
      data.nome.trim(),
      data.descricao.trim(),
      data.categoria.trim(),
      data.loja.trim(), // Adiciona o campo loja
      preco.toFixed(2),
      data.imagem.trim(),
      data.link.trim(),
      new Date().toLocaleString("pt-BR", { timeZone: 'America/Sao_Paulo' })
    ]);

    // 8. Resposta de sucesso
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Produto cadastrado com sucesso!' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Erro interno ao cadastrar produto: ' + error.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
  }
}

/**
 * Função para lidar com requisições OPTIONS (preflight CORS).
 * @returns {GoogleAppsScript.Content.TextOutput} Resposta vazia com cabeçalhos CORS.
 */
function doOptions() {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "https://www.centrodecompra.com.br",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600"
    });
}
