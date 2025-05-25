const API_URL = 'https://centrodecompra-backend.onrender.com';

let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';

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
    const imagem = produto.imagens && produto.imagens.length > 0
      ? `${API_URL}${produto.imagens[0].startsWith('/') ? '' : '/'}${produto.imagens[0]}`
      : '/imagens/sem-imagem.jpg';

    const precoFormatado = produto.preco
      ? `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`
      : 'Preço indisponível';

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

function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  filtrarProdutos();
}

function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  document.querySelectorAll('.loja').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja);
  });
  document.querySelector('.loja-todas').classList.toggle('ativa', loja === 'todas');
  filtrarProdutos();
}

function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;

  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();

    if (termoBusca) {
      buscaFeedback.style.display = 'block';
      buscaFeedback.textContent = `Buscando por "${termoBusca}"...`;
    } else {
      buscaFeedback.style.display = 'none';
      buscaFeedback.textContent = '';
    }

    debounceTimer = setTimeout(() => {
      filtrarProdutos();
    }, 300);
  });
}

function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  atualizarAnoFooter();

  const logo = document.getElementById('logo');
  if (logo) {
    let clickCount = 0;
    let clickTimer;

    logo.addEventListener('click', () => {
      clickCount++;
      if (clickCount === 3) {
        clearTimeout(clickTimer);
        clickCount = 0;
        window.location.href = 'admin-xyz-123.html';
      } else {
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 600);
      }
    });
  }
});
