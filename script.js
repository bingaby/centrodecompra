// script.js para index.html
const API_URL = 'https://seu-servidor.render.com'; // Substitua pelo URL do seu servidor no Render

// Estado global
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';

// Função para buscar produtos do servidor
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const gridProdutos = document.getElementById('grid-produtos');

  try {
    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    gridProdutos.style.display = 'none';

    const response = await fetch(`${API_URL}/api/produtos`);
    if (!response.ok) throw new Error('Erro ao carregar produtos');
    produtos = await response.json();

    filtrarProdutos();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    mensagemVazia.textContent = 'Erro ao carregar produtos. Tente novamente mais tarde.';
    mensagemVazia.style.display = 'block';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Função para filtrar produtos com base em categoria, loja e busca
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = categoriaSelecionada === 'todas' || produto.categoria.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja = lojaSelecionada === 'todas' || produto.loja.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca = !termoBusca || produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchLoja && matchBusca;
  });

  gridProdutos.innerHTML = '';
  if (produtosFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    return;
  }

  mensagemVazia.style.display = 'none';
  gridProdutos.style.display = 'grid';

  produtosFiltrados.forEach(produto => {
    const imagem = produto.imagens && produto.imagens.length > 0 ? `${API_URL}${produto.imagens[0]}` : '/imagens/sem-imagem.jpg';
    const precoFormatado = produto.preco ? `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}` : 'Preço indisponível';
    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <img src="${imagem}" alt="${produto.nome}" loading="lazy" onerror="this.src='/imagens/sem-imagem.jpg'">
      <h3>${produto.nome}</h3>
      <p class="preco">${precoFormatado}</p>
      <p class="loja">${produto.loja}</p>
      <a href="${produto.link}" target="_blank" class="btn-comprar">Comprar agora</a>
    `;
    gridProdutos.appendChild(card);
  });
}

// Função para filtrar por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  filtrarProdutos();
}

// Função para filtrar por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  document.querySelectorAll('.loja').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja);
  });
  document.querySelector('.loja-todas').classList.toggle('ativa', loja === 'todas');
  filtrarProdutos();
}

// Função para buscar por texto
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');

  inputBusca.addEventListener('input', () => {
    termoBusca = inputBusca.value.trim();
    buscaFeedback.style.display = termoBusca ? 'block' : 'none';
    buscaFeedback.textContent = termoBusca ? `Buscando por "${termoBusca}"...` : '';
    filtrarProdutos();
  });
}

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  atualizarAnoFooter();

  // Configurar clique duplo no logo para redirecionar para admin
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('dblclick', () => {
      window.location.href = 'admin-xyz-123.html';
    });
  }
});
