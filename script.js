const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use localhost para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20;
const totalProdutos = 1000;

// Atualizar ano no footer
function atualizarAnoFooter() {
  document.getElementById('year').textContent = new Date().getFullYear();
}

// Detectar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo');
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(() => clickCount = 0, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      window.location.href = '/admin-xyz-123.html';
      clickCount = 0;
    }
  });
}

// Carregar produtos da API com retry
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');
  
  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      loadingSpinner.style.display = 'block';
      mensagemVazia.style.display = 'none';
      errorMessage.style.display = 'none';
      gridProdutos.innerHTML = '';

      const response = await fetch(
        `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}`);
      }
      produtos = await response.json();

      if (!Array.isArray(produtos)) throw new Error('Resposta inválida da API');

      filtrarProdutos();
      atualizarPaginacao();
      return; // Sucesso, sair do loop
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou:`, error);
      if (attempt === maxRetries) {
        errorMessage.textContent = `Erro ao carregar produtos após ${maxRetries} tentativas: ${error.message}.`;
        errorMessage.style.display = 'block';
        mensagemVazia.style.display = 'none';
        gridProdutos.style.display = 'none';
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Delay exponencial
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }
}

// Filtrar e exibir produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria =
      categoriaSelecionada === 'todas' ||
      produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja =
      lojaSelecionada === 'todas' ||
      produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca =
      !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
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

  produtosFiltrados.forEach((produto, produtoIndex) => {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? produto.imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    const carrosselId = `carrossel-${produtoIndex}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${produtoIndex}, ${i})">`).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)">▶</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome || 'Produto sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });
}

// Funções do carrossel
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');
  let currentIndex = parseInt(imagens.dataset.index || 0);
  const totalImagens = imagens.children.length;

  currentIndex = (currentIndex + direction + totalImagens) % totalImagens;
  imagens.style.transform = `translateX(-${currentIndex * 100}%)`;
  imagens.dataset.index = currentIndex;

  dots.forEach((dot, i) => dot.classList.toggle('ativo', i === currentIndex));
}

function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;

  dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

// Funções do modal
function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    console.log('Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

    carrosselImagens.innerHTML = currentImages.map((img, i) => `
      <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" onerror="this.src='imagens/placeholder.jpg'">
    `).join('');

    // Forçar layout
    carrosselImagens.style.width = '100%';
    carrosselImagens.style.display = 'flex';
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

    // Estilizar imagens
    const imagens = carrosselImagens.querySelectorAll('img');
    imagens.forEach(img => {
      img.style.width = '100%';
      img.style.flex = '0 0 100%';
      img.style.objectFit = 'contain';
    });

    // Forçar renderização
    carrosselImagens.offsetHeight; // Trigger reflow

    carrosselDots.innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})"></span>
    `).join('');

    modal.style.display = 'flex';
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
  }
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

  // Forçar renderização
  carrosselImagens.offsetHeight;

  console.log('Navegando modal:', { currentImageIndex, totalImagens, imagens: currentImages });

  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = index;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

  // Forçar renderização
  carrosselImagens.offsetHeight;

  console.log('Selecionando imagem:', { index, imagens: currentImages });

  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}

// Configurar busca com debounce
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
    }

    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(), 300);
  });
}

// Configurar paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(totalProdutos / produtosPorPagina)) {
      currentPage++;
      carregarProdutos();
    }
  });
}

function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)}`;
}

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
  });
  carregarProdutos();
}

// Filtrar por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja.toLowerCase() === loja.toLowerCase());
  });
  carregarProdutos();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();

  document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
});
const API_URL = 'https://centrodecompra-backend.onrender.com'; // Alterar para localhost em testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20;
const totalProdutos = 1000;

// Atualizar ano no footer
function atualizarAnoFooter() {
  document.getElementById('year').textContent = new Date().getFullYear();
}

// Detectar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo');
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', () => {
    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(() => clickCount = 0, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      window.location.href = '/admin-xyz-123.html';
      clickCount = 0;
    }
  });
}

// Carregar produtos com retry
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');
  
  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      loadingSpinner.style.display = 'block';
      mensagemVazia.style.display = 'none';
      errorMessage.style.display = 'none';
      gridProdutos.innerHTML = '';

      const response = await fetch(
        `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}`);
      }
      produtos = await response.json();

      if (!Array.isArray(produtos)) throw new Error('Resposta inválida da API');

      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`⚠️ Tentativa ${attempt} falhou:`, error);
      if (attempt === maxRetries) {
        errorMessage.textContent = `Erro ao carregar produtos após ${maxRetries} tentativas: ${error.message}.`;
        errorMessage.style.display = 'block';
        mensagemVazia.style.display = 'none';
        gridProdutos.style.display = 'none';
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }
}

// Filtrar e exibir produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria =
      categoriaSelecionada === 'todas' ||
      produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja =
      lojaSelecionada === 'todas' ||
      produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca =
      !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
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

  produtosFiltrados.forEach((produto, produtoIndex) => {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? produto.imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    const carrosselId = `carrossel-${produtoIndex}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${produtoIndex}, ${i})">`).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)">▶</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome || 'Produto sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });
}

// Funções do carrossel
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');
  let currentIndex = parseInt(imagens.dataset.index || 0);
  const totalImagens = imagens.children.length;

  currentIndex = (currentIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    imagens.style.transform = `translateX(-${currentIndex * 100}%)`;
    imagens.dataset.index = currentIndex;
    dots.forEach((dot, i) => dot.classList.toggle('ativo', i === currentIndex));
  });
}

function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  requestAnimationFrame(() => {
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
  });
}

// Funções do modal
function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    console.log('🔍 Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

    // Validar imagens
    const validImages = currentImages.map(img => {
      return new Promise(resolve => {
        const testImg = new Image();
        testImg.src = img;
        testImg.onload = () => resolve(img);
        testImg.onerror = () => resolve('imagens/placeholder.jpg');
      });
    });
    currentImages = await Promise.all(validImages);

    carrosselImagens.innerHTML = currentImages.map((img, i) => `
      <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" onerror="this.src='imagens/placeholder.jpg'">
    `).join('');

    requestAnimationFrame(() => {
      carrosselImagens.style.width = '100%';
      carrosselImagens.style.display = 'flex';
      carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

      const imagens = carrosselImagens.querySelectorAll('img');
      imagens.forEach(img => {
        img.style.width = '100%';
        img.style.flex = '0 0 100%';
        img.style.objectFit = 'contain';
      });
    });

    carrosselDots.innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})"></span>
    `).join('');

    modal.style.display = 'flex';
  } catch (error) {
    console.error('❌ Erro ao abrir modal:', error);
  }
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('active', i === currentImageIndex));
  });

  console.log('🔄 Navegando modal:', { currentImageIndex,
    totalImagens,
    imagens: currentImages });
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = index;
  
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
  });

  console.log('🔍 Selecionando imagem:', { index, imagens: currentImages });
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}

// Configurar busca com debounce
function configurarBusca() {
  const busca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;
  
  busca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = busca.value.trim();
    
    if (termoBusca) {
      buscaFeedback.style.display = 'block';
      buscaFeedback.textContent = `Buscando por "${termoBusca}"...`;
    } else {
      buscaFeedback.style.display = 'none';
    }
    
    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(), 200);
  });
}

// Configurar paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(totalProdutos / produtosPorPagina)) {
      currentPage++;
      carregarProdutos();
    }
  });
}

function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)}`;
}

// Filtrar por categoria por página
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
  });
  carregarProdutos();
}

// Filtrar por loja por página
function filtrarPorLoja(loja) {
  lojaSeleção = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja.toLowerCase() === loja.toLowerCase());
  });
  carregarProdutos();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();
  
  document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  });
  const express = require('express');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuração CORS
app.use(cors({
  origin: ['https://www.centrodecompra.com.br', 'http://localhost:8080', 'http://localhost:10000'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Validar GITHUB_TOKEN
if (!process.env.GITHUB_TOKEN) {
  console.error('❌ Erro: GITHUB_TOKEN não configurado');
  process.exit(1);
}

// Criar diretório uploads
const uploadsDir = './uploads';
fs.mkdir(uploadsDir, { recursive: true }).catch(error => {
  console.error('❌ Erro ao criar diretório uploads:', error);
});

// Configuração do Multer
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage }).array('images');

// Configuração do Octokit
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const repoOwner = 'bingaby';
const repoName = 'centrodecompra';
const produtosJsonPath = 'produtos.json';
const imagensDir = 'imagens';
const MAX_PRODUTOS = 1000;

// Servir arquivos estáticos
app.use(express.static('public'));

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'Servidor Centro de Compra ativo', version: '1.0.0' });
});

// Inicializar produtos.json
async function inicializarProdutosJson() {
  try {
    console.log('🔍 Verificando produtos.json...');
    await octokit.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path: produtosJsonPath
    });
    console.log('✅ produtos.json encontrado');
  } catch (error) {
    if (error.status === 404) {
      console.log('⚠️ produtos.json não encontrado, criando...');
      await octokit.repos.createOrUpdateFileContents({
        owner: repoOwner,
        repo: repoName,
        path: produtosJsonPath,
        message: 'Inicializa produtos.json',
        content: Buffer.from(JSON.stringify([])).toString('base64')
      });
      console.log('✅ produtos.json criado');
    } else {
      console.error('❌ Erro ao verificar produtos.json:', error);
      throw error;
    }
  }
}

// Endpoint para obter produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    console.log(`📥 GET /api/produtos?page=${page}&limit=${limit}`);

    let data;
    try {
      const response = await octokit.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: produtosJsonPath
      });
      data = response.data;
    } catch (error) {
      if (error.status === 404) {
        await inicializarProdutosJson();
        return res.json([]);
      }
      console.error('❌ Erro ao acessar produtos.json:', error);
      throw error;
    }

    let produtos;
    try {
      produtos = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    } catch (error) {
      console.error('❌ Erro ao parsear produtos.json:', error);
      throw new Error('Arquivo produtos.json corrompido');
    }

    if (!Array.isArray(produtos)) {
      console.error('❌ produtos.json não é uma lista válida:', produtos);
      throw new Error('produtos.json não é uma lista válida');
    }

    const produtosFiltrados = produtos.slice(startIndex, startIndex + limit);
    res.json(produtosFiltrados);
  } catch (error) {
    console.error('❌ Erro ao obter produtos:', {
      message: error.message,
      status: error.status,
      stack: error.stack
    });
    res.status(500).json({ error: 'Erro ao buscar produtos', details: error.message });
  }
});

// Endpoint para criar produto
app.post('/api/produtos', upload, async (req, res) => {
  try {
    const { nome, idProduto, descricao, categoria, loja, link, preco, imagens: imagensUrls } = req.body;
    const imagens = req.files || [];

    console.log(`📤 POST /api/produtos: ${nome}`);

    // Verificar limite de produtos
    const { data: currentData } = await octokit.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path: produtosJsonPath
    });
    const produtos = JSON.parse(Buffer.from(currentData.content, 'base64').toString('utf8'));
    if (produtos.length >= MAX_PRODUTOS) {
      return res.status(400).json({ error: 'Limite de 1.000 produtos atingido' });
    }

    // Processar imagens (uploads ou URLs)
    let imagemUrls = [];
    if (imagensUrls && Array.isArray(JSON.parse(imagensUrls || '[]'))) {
      imagemUrls = JSON.parse(imagensUrls).filter(img => typeof img === 'string' && img.startsWith('https://'));
    }
    if (imagens.length > 0) {
      const uploadedUrls = await Promise.all(imagens.map(async (file) => {
        const imagemContent = await fs.readFile(file.path);
        const imagemPath = `${imagensDir}/${file.filename}`;

        await octokit.repos.createOrUpdateFileContents({
          owner: repoOwner,
          repo: repoName,
          path: imagemPath,
          message: `Adiciona imagem ${file.filename}`,
          content: imagemContent.toString('base64')
        });

        const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${imagemPath}`;
        console.log(`✅ Imagem carregada: ${url}`);
        return url;
      }));
      imagemUrls = imagemUrls.concat(uploadedUrls);
    }

    // Atualizar produtos.json
    produtos.push({
      nome,
      id: idProduto,
      descricao,
      categoria,
      loja,
      link,
      preco: parseFloat(preco),
      imagens: imagemUrls.length > 0 ? imagemUrls : ['https://raw.githubusercontent.com/bingaby/centrodecompra/main/imagens/placeholder.jpg']
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: produtosJsonPath,
      message: `Adiciona produto ${nome}`,
      content: Buffer.from(JSON.stringify(produtos, null, 2)).toString('base64'),
      sha: currentData.sha
    });

    // Remover arquivos locais
    await Promise.all(imagens.map(file => fs.unlink(file.path).catch(console.error)));

    res.status(201).json({ message: 'Produto adicionado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao adicionar produto:', error);
    res.status(500).json({ error: 'Erro ao adicionar produto', details: error.message });
  }
});

// Endpoint para excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const idProduto = req.params.id;
    console.log(`🗑️ DELETE /api/produtos/${idProduto}`);

    const { data } = await octokit.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path: produtosJsonPath
    });

    let produtos = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    const produto = produtos.find(p => p.id === idProduto);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Remover imagens
    await Promise.all(produto.imagens.map(async (url) => {
      if (!url.includes('placeholder.jpg')) {
        const imagemPath = url.split(`https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/`)[1];
        try {
          const { data: imagemData } = await octokit.repos.getContent({
            owner: repoOwner,
            repo: repoName,
            path: imagemPath
          });
          await octokit.repos.deleteFile({
            owner: repoOwner,
            repo: repoName,
            path: imagemPath,
            message: `Remove imagem ${imagemPath}`,
            sha: imagemData.sha
          });
          console.log(`✅ Imagem removida: ${imagemPath}`);
        } catch (error) {
          console.warn(`⚠️ Imagem ${imagemPath} não encontrada`, error);
        }
      }
    }));

    // Remover produto
    produtos = produtos.filter(p => p.id !== idProduto);

    await octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: produtosJsonPath,
      message: `Remove produto ${idProduto}`,
      content: Buffer.from(JSON.stringify(produtos, null, 2)).toString('base64'),
      sha: data.sha
    });

    res.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro ao excluir produto', details: error.message });
  }
});

// Inicializar servidor
inicializarProdutosJson().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('❌ Erro ao inicializar servidor:', error);
  process.exit(1);
});
