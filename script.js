const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' localmente

// Variáveis Globais
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

// Configurar o triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo');
  if (!logo) {
    console.error('❌ ID site-logo não encontrado');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', (e) => {
    e.preventDefault(); // Evita redirecionamento padrão
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
  
  try {
    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';
    gridProdutos.innerHTML = '';

    const response = await fetch(
      `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
      { cache: 'no-store' }
    );
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    produtos = await response.json();

    if (!Array.isArray(produtos)) throw new Error('Resposta inválida da API');

    filtrarProdutos();
    atualizarPaginacao();
  } catch (error) {
    errorMessage.textContent = `Erro ao carregar produtos: ${error.message}`;
    errorMessage.style.display = 'block';
    mensagemVazia.style.display = 'none';
    gridProdutos.style.display = 'none';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Filtrar e exibir produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  if (!gridProdutos || !mensagemVazia) return;

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria =
      categoriaSelecionada === 'todas' ||
      produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja =
      lojaSelecionada === 'todas' ||
      produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca =
      !termBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
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
      ? produto.imagens
      : ['imagens/placeholder.jpg'];
    const carrosselId = `carrossel-${produtoIndex}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card');
    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" onclick="openModal(${produtoIndex}, ${i})">`).join('')}
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
      <p class="descricao">${produto.descricao || 'Sem descrição'}</p>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank">Ver preço</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase()}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });
}

// Funções do Carrossel
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
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
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

// Funções do Modal
function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
    ? produtos[produtoIndex].imagens
    : ['imagens/placeholder.jpg'];
  currentImageIndex = imageIndex;

  carrosselImagens.innerHTML = currentImages.map((img, i) => `
    <img src="${img}" alt="Imagem ${i + 1}" loading="lazy">
  `).join('');

  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  carrosselDots.innerHTML = currentImages.map((_, i) => `
    <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})"></span>
  `).join('');

  modal.style.display = 'flex';
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = index;

  carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
}

// Configuração de Busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  inputBusca.addEventListener('input', () => {
    termoBusca = inputBusca.value.trim();
    currentPage = 1;
    carregarProdutos();
  });
}

// Configuração de Paginação
function configurarPaginacao() {
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });
  document.getElementById('next-page').addEventListener('click', () => {
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
  pageInfo.textContent = `Página ${currentPage}`;
}

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  carregarProdutos();
}

// Filtrar por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja || (loja === 'todas' && item.classList.contains('loja-todas')));
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
});
