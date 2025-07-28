// ID da planilha fornecida
const SPREADSHEET_ID = '1cQOP4Tpu-9lq1aG6FPNFTmO4C1E1WixGKlMXx_ybzR0';
const SHEET_NAME = 'Produtos'; // Certifique-se de que o nome da aba está exatamente igual

/**
 * Função principal para lidar com requisições POST.
 * Recebe dados de produtos e os insere na planilha Google.
 * @param {Object} e - O objeto de evento que contém os dados da requisição.
 * @returns {GoogleAppsScript.Content.TextOutput} Uma resposta JSON indicando o status da operação.
 */
function doPost(e) {
  try {
    // 1. Validação inicial dos dados da requisição
    if (!e || !e.postData || !e.postData.contents) {
      return criarRespostaErro('Dados ausentes ou formato inválido na requisição.');
    }

    const data = JSON.parse(e.postData.contents);

    // 2. Validação dos campos obrigatórios
    const camposObrigatorios = ['nome', 'descricao', 'categoria', 'preco', 'imagem', 'link'];
    const faltando = camposObrigatorios.filter(campo => {
      // Verifica se o campo está ausente ou é uma string vazia após trim()
      return !data.hasOwnProperty(campo) || (typeof data[campo] === 'string' && data[campo].trim() === '');
    });

    if (faltando.length > 0) {
      return criarRespostaErro('Campos obrigatórios faltando ou vazios: ' + faltando.join(', '));
    }

    // 3. Validação do preço
    const preco = parseFloat(data.preco);
    if (isNaN(preco) || preco < 0) {
      return criarRespostaErro('Preço inválido! Deve ser um número positivo.');
    }

    // 4. Validação da URL do link
    // Regex mais robusta para URLs (permite http e https, domínios variados)
    const urlPattern = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/i;
    if (!urlPattern.test(data.link.trim())) { // Usa trim() para remover espaços antes/depois
      return criarRespostaErro('Link inválido! Por favor, insira uma URL válida (ex: https://www.exemplo.com).');
    }

    // 5. Acesso à planilha e aba
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return criarRespostaErro(`Aba '${SHEET_NAME}' não encontrada na planilha. Verifique o nome da aba.`);
    }

    // 6. Insere a linha com os dados do produto
    // Garante que todos os dados sejam strings e o preço formatado, se necessário, antes de inserir
    sheet.appendRow([
      data.nome.trim(),
      data.descricao.trim(),
      data.categoria.trim(),
      preco.toFixed(2), // Formata o preço para 2 casas decimais
      data.imagem.trim(),
      data.link.trim(),
      new Date().toLocaleString("pt-BR", { timeZone: 'America/Sao_Paulo' }) // Garante fuso horário BR
    ]);

    // 7. Resposta de sucesso
    return criarRespostaSucesso('Produto cadastrado com sucesso!');

  } catch (error) {
    // 8. Tratamento de erros genérico
    return criarRespostaErro('Erro interno ao cadastrar produto: ' + error.message);
  }
}

/**
 * Cria uma resposta JSON de erro.
 * @param {string} message - A mensagem de erro.
 * @returns {GoogleAppsScript.Content.TextOutput} Resposta de erro formatada.
 */
function criarRespostaErro(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'error', message: message })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Cria uma resposta JSON de sucesso.
 * @param {string} message - A mensagem de sucesso.
 * @returns {GoogleAppsScript.Content.TextOutput} Resposta de sucesso formatada.
 */
function criarRespostaSucesso(message) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success', message: message })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Função doGet para requisições GET (opcional, mas recomendada para evitar "Função script não encontrada" em acessos diretos).
 * @param {Object} e - O objeto de evento.
 * @returns {GoogleAppsScript.Content.TextOutput} Uma resposta JSON informativa.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'info',
      message: 'Este é o endpoint GET do Centro de Compras. Para cadastrar produtos, envie uma requisição POST.'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
