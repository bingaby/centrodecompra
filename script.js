// URL da API
const API_URL = 'https://centrodecompra-backend.onrender.com';

// Estado global
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20;
const totalProdutos = 1000;

// Categorias válidas
const categoriasValidas = [
  'todas', 'eletronicos', 'moda', 'fitness', 'casa', 'beleza',
  'esportes', 'livros', 'infantil', 'celulares', 'eletrodomesticos'
];

// Lojas válidas
const lojasValidas = [
  'todas', 'amazon', 'magalu', 'shein', 'shopee', 'mercadolivre', 'alibaba'
];

// Atualiza o ano no rodapé
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  } else {
    console.warn('Elemento #year não encontrado no rodapé.');
  }
}

// Configura clique triplo no logotipo para admin
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img');
  if (!logo) {
    console.error('Logotipo não encontrado. Verifique o ID "site-logo-img".');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(() => clickCount = 0, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      window.location.href = '/admin-xyz-123.html';
      clickCount = 0;
    }
  });
  logo.addEventListener('error', () => {
    console.error('Erro ao carregar logotipo. Verifique o caminho: logos/logoscentrodecompras.jpeg');
  });
}

// Carrega produtos da API
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos DOM não encontrados: #loading-spinner, #mensagem-vazia, #error-message, #grid-produtos.');
    return;
  }

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
        throw new Error(errorData.details || `Erro HTTP ${response.status}`);
      }
      produtos = await response.json();
      if (!Array.isArray(produtos)) {
        throw new Error('Resposta da API não é um array.');
      }
      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt === maxRetries) {
        errorMessage.textContent = `Erro ao carregar produtos: ${error.message}. Tente novamente.`;
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

// Filtra e exibe produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  if (!gridProdutos || !mensagemVazia) {
    console.error('Elementos #grid-produtos ou #mensagem-vazia não encontrados.');
    return;
  }

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
    produtoDiv.classList.add('produto-card');
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `
            <img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" width="200" height="200" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${produtoIndex}, ${i})">
          `).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)">▶</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome || 'Produto sem nome'}</span>
      <span class="loja-info">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique para ver o preço</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });
}

// Move o carrossel de imagens
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
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === currentIndex));
}

// Define imagem específica no carrossel
function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}

// Abre o modal de imagens
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  if (!modal || !carrosselImagens || !carrosselDots) {
    console.error('Elementos do modal não encontrados.');
    return;
  }

  currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
    ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
    : ['imagens/placeholder.jpg'];
  currentImageIndex = imageIndex;

  const validImages = await Promise.all(currentImages.map(img => {
    return new Promise(resolve => {
      const testImg = new Image();
      testImg.src = img;
      testImg.onload = () => resolve(img);
      testImg.onerror = () => resolve('imagens/placeholder.jpg');
    });
  }));
  currentImages = validImages;

  carrosselImagens.innerHTML = currentImages.map((img, i) => `
    <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" width="600" height="600">
  `).join('');

  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  carrosselDots.innerHTML = currentImages.map((_, i) => `
    <span class="carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}" onclick="setModalCarrosselImage(${i})"></span>
  `).join('');

  modal.style.display = 'flex';
}

// Move o carrossel no modal
function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  const totalImagens = currentImages.length;

  if (!carrosselImagens || !carrosselDots) return;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
}

// Define imagem específica no modal
function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;

  if (!carrosselImagens || !carrosselDots) return;

  currentImageIndex = index;
  carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}

// Fecha o modal
function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
    currentImages = [];
    currentImageIndex = 0;
  }
}

// Configura a busca
function configurarBusca() {
  const searchInput = document.getElementById('nav-busca');
  const buscaFeedback = document.getElementById('busca-feedback');

  if (!searchInput || !buscaFeedback) {
    console.error('Elementos de busca não encontrados: #nav-busca, #busca-feedback.');
    return;
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(window.buscaTimer);
    termoBusca = searchInput.value.trim();
    buscaFeedback.style.display = termoBusca ? 'block' : 'none';
    buscaFeedback.textContent = termoBusca ? `Buscando por "${termoBusca}"...` : '';
    currentPage = 1;
    window.buscaTimer = setTimeout(() => carregarProdutos(), 300);
  });
}

// Configura a paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  if (!prevButton || !nextButton) {
    console.error('Botões de paginação não encontrados: #prev-page, #next-page.');
    return;
  }

  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  };

  nextButton.onclick = () => {
    if (currentPage < Math.ceil(totalProdutos / produtosPorPagina)) {
      currentPage++;
      carregarProdutos();
    }
  };
}

// Atualiza a paginação
function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  if (!prevButton || !nextButton || !pageInfo) {
    console.error('Elementos de paginação não encontrados: #prev-page, #next-page, #page-info.');
    return;
  }

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage}`;
}

// Filtra por categoria
function filtrarPorCategoria(categoria) {
  if (!categoriasValidas.includes(categoria.toLowerCase())) {
    console.warn(`Categoria inválida: ${categoria}`);
    return;
  }
  categoriaSelecionada = categoria.toLowerCase();
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria?.toLowerCase() === categoria);
  });
  carregarProdutos();
}

// Filtra por loja
function filtrarPorLoja(loja) {
  if (!lojasValidas.includes(loja.toLowerCase())) {
    console.warn(`Loja inválida: ${loja}`);
    return;
  }
  lojaSelecionada = loja.toLowerCase();
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja?.toLowerCase() === loja);
  });
  carregarProdutos();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  configurarCliqueLogo();
  atualizarAnoFooter();

  // Fecha modal ao clicar fora
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Sombra no cabeçalho ao rolar
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 0);
    });
  } else {
    console.warn('Cabeçalho (.site-header) não encontrado.');
  }
});
