const { sheets } = require('../config/google');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function salvarProduto({ nome, descricao, categoria, loja, link, preco, imagens }) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Produtos!A:G', // Alterado de Sheet1 para Produtos
      valueInputOption: 'RAW',
      resource: {
        values: [[nome, descricao, categoria, loja, link, preco, imagens.join(',')]],
      },
    });
  } catch (error) {
    throw new Error('Erro ao salvar no Google Sheets: ' + error.message);
  }
}

async function listarProdutos(page = 1, limit = 25) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Produtos!A:G', // Alterado de Sheet1 para Produtos
    });
    const rows = response.data.values || [];
    const produtos = rows.map((row, index) => ({
      rowIndex: index + 1,
      nome: row[0] || '',
      descricao: row[1] || '',
      categoria: row[2] || '',
      loja: row[3] || '',
      link: row[4] || '',
      preco: row[5] || '',
      imagens: row[6] ? row[6].split(',') : [],
    }));
    const total = Math.min(produtos.length, 1000);
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      produtos: produtos.slice(start, end),
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error('Erro ao listar produtos: ' + error.message);
  }
}

module.exports = { salvarProduto, listarProdutos };
