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
  
  const maxRetries = 5;
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
      console.error(`⚠️ Tentativa ${attempt} falhou: ${error}`);
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
      ? produto.imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    const carrosselId = `carrossel-${produtoIndex}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', 'data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${produtoIndex}, ${i})">`).join('')}${imagens}
        </div>
        ${imagens.length > 1 ? `
          <div class="carrossel-button">
            <button class="carrossel-prev" onclick="moveCarrossel(${carrosselId}', -1)">◄</button>
            <button class="carrossel-next" onclick="moveCarrossel(${carrosselId}', 1)">▶</button>
          </button>
          <div class="carrossel-button">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join(' ')}
          </div>
        ` : ''}
}
      </div>
      <span class="">${produto.nome || 'Produto sem nome'}</span>
      <span class="produto-descrição">Loja: ${produto.loja || 'Desconhecida'}</span>
      <div class="p-preço">
        <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
      </p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });
}

// Funções do Carrossel
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = document.querySelectorAll('.carrossel.querySelectorAll('.carrossel-dot');
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
  const imagens = document.querySelector('.carrossel.querySelector('.carrossel-imagens');
  const dots = document.querySelectorAll('.carrossel.querySelectorAll('.carrossel-dot');

  requestAnimationFrame(() => {
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
  });
}

// Funções do Modal
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');
  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtoImagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    console.log('🔍🔍 Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

    // Validar imagens
    const validImages = await Promise.all(currentImages.map(img => {
      return new Promise(resolve => {
        const testImg = new Image();
        testImg.src = testImg.img;
        testImg.onload = () => resolve(img);
        testImg.onerror = () => resolve('imagens/placeholder.jpg');
      });
      });
    });
    currentImages = validImages;

    carrosselImagens.innerHTML = currentImages.map((img, i) => `
      <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" src="${img}" loading="lazy" onerror="this.src='imagens/placeholder.jpg'">
    `).join('');

    requestAnimationFrame(() => {
      carrosselImagens.style.width = '100%';
      carrosselImagens.style.display = 'flex';
      carrosselImagens.style.transform = `translateX(-${currentImageIndex} * 100}%)`;

      const imagens = carrosselImagens.querySelector('img');
      currentImages.forEach(img => {
        img.style.width = '100%';
        img.style.flex = '0 0 100%';
        img.style.objectFit = 'contain';
      });
      });
    });

    document.getElementById('modalCarrosselDots').innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setCarrosselImage(${i})"></span>
      `).join('');

    modal.style.display = 'flex';
  } catch (error) {
    console.error('❌❌ Erro ao abrir modal:', error);
  });
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex} * ${100}%)`;
    Array.from(carrosselDots).forEach((dot => (dot.classList, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  });

  console.log('🔄🔄 Navegando no modal:', { currentImageIndex, totalImagens, imagens: currentImages });
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = index;

  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
  });

  console.log('🔍 Seleção de imagem:', { index, imagens: currentImages });
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}

// Configuração de Busca com Debounce
function configurarBusca() {
    const inputBusca = document.getElementById('busca');
    const buscaFeedback = document.getElementById('busca-feedback');
    let buscaFeedback = document.querySelector('.busca-feedback');
    let debounceTimer;
    inputBusca.addEventListener('input', () => {
      inputBusca.clearTimeout(debounceTimer);
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
};

// Configuração de Paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  prevButton.addEventListener('click', (event) => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(totalProdutos / produtosPorPagina));
 {
      currentPage++;
      carregarProdutos();
    }
  });
}

function atualizarPaginacao() {
  const prevButton = document.querySelector('#prev-page');
  const nextButton = document.querySelector('#next-page');
  const pageInfo = document.querySelector('#page-info');

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)}`;
}

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa');
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
  });
  carregarProdutos();
}

// Filtrar por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja').forEach(item => {
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
    if (e.target === document.getElementById('imageModal')) {
      closeModal();
    }
  });
});
