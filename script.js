const API_URL = 'http://localhost:3000';
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';

async function carregarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const loadingSpinner = document.getElementById('loading-spinner');
  const buscaFeedback = document.getElementById('busca-feedback');

  try {
    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    buscaFeedback.style.display = 'none';
    console.log('Carregando:', `${API_URL}/produtos`);
    const response = await fetch(`${API_URL}/produtos`);
    console.log('Resposta:', response.status, response.statusText);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    produtos = await response.json();
    filtrarProdutos();
  } catch (error) {
    console.error('Erro:', error);
    gridProdutos.innerHTML = '';
    mensagemVazia.textContent = 'Erro ao carregar produtos. Verifique o servidor.';
    mensagemVazia.style.display = 'block';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

function filtrarProdutos() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter(produto =>
    (categoriaSelecionada === 'todas' || produto.categoria.toLowerCase() === categoriaSelecionada.toLowerCase()) &&
    (lojaSelecionada === 'todas' || produto.loja.toLowerCase() === lojaSelecionada.toLowerCase()) &&
    (produto.nome.toLowerCase().includes(busca) || produto.descricao.toLowerCase().includes(busca))
  );

  gridProdutos.innerHTML = '';
  if (!produtosFiltrados.length) {
    mensagemVazia.textContent = 'Nenhum produto encontrado.';
    mensagemVazia.style.display = 'block';
    return;
  }

  mensagemVazia.style.display = 'none';
  produtosFiltrados.forEach(produto => {
    const card = document.createElement('div');
    card.className = 'produto-card';
    const imagem = produto.imagens?.length ? produto.imagens[0] : 'https://via.placeholder.com/150';
    card.innerHTML = `
      <img src="${imagem}" alt="${produto.nome}" loading="lazy">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <p><strong>Loja:</strong> ${produto.loja}</p>
      <p><strong>Preço:</strong> R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</p>
      <a href="${produto.link}" target="_blank" class="botao-comprar">Comprar</a>
    `;
    gridProdutos.appendChild(card);
  });
}

function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
  });
  filtrarProdutos();
}

function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja?.toLowerCase() === loja.toLowerCase() || (loja === 'todas' && item.classList.contains('loja-todas')));
  });
  filtrarProdutos();
}

document.getElementById('busca').addEventListener('input', () => {
  const buscaFeedback = document.getElementById('busca-feedback');
  buscaFeedback.style.display = 'block';
  setTimeout(() => {
    buscaFeedback.style.display = 'none';
    filtrarProdutos();
  }, 500);
});

document.getElementById('logo').addEventListener('dblclick', () => {
  window.location.href = 'admin-xyz-123.html';
});

document.getElementById('year').textContent = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', carregarProdutos);
