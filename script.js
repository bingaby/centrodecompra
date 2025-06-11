const API_URL = 'https://centrodecompra-backend.onrender.com';

let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20;
const totalProdutos = 1000;

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(error => console.error('Falha ao registrar Service Worker:', error));
  });
}

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}

// Detectar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img');
  if (!logo) return;
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
}

// Carregar produtos
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) return;

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
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      produtos = await response.json();
      if (!Array.isArray(produtos)) throw new Error('Resposta inválida da API');

      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
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

// Filtrar e exibir produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  if (!gridProdutos || !mensagemVazia) return;

  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = categoriaSelecionada === 'todas' || produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja = lojaSelecionada === 'todas' || produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca = !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
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
      : ['/imagens/placeholder.jpg'];
    const carrosselId = `car-${produtoIndex}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.dataset.categoria = produto.categoria?.toLowerCase() ?? 'todas';
    produtoDiv.dataset.loja = produto.loja?.toLowerCase() ?? 'todas';

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `
            <img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" width="200" height="auto" onerror="this.src='/imagens/placeholder.jpg'" onclick="openModal(${produtoIndex}, ${i})">
          `).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" aria-label="Imagem anterior" onclick="moveCarrossel('${carroselId}', -1)">◄</button>
          <button class="carrossel-next" aria-label="Próxima imagem" onclick="moveCarrossel('${carroselId}', 1)">◯</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrosselImg('${carroselId}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome || 'Produto sem nome'}</span>
      <span class="loja">Loja: ${produto.loja || 'Desconhecida'}</span>
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
    dots.forEach((dot, i) => dot.classList.toggle('ativa', i === currentIndex));
  });
}

function setCarrosselImagem(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  requestAnimationFrame(() => {
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle('ativa', i === index));
  });
}

// Funções do modal
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');
  if (!modal || !carrosselImagens || !carrosselDots || !produtos[produtoIndex]) return;

  try {
    currentImages = Array.isArray(produtos[produtoIndex].imagens) && produtos[produtoIndex].imagens.length > 0 ?
      produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img) :
      ['/imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    const validImages = await Promise.all(currentImages.map(img => {
      return new Promise(resolve => {
        const testImg = new Image();
        testImg.src = img;
        testImg.onload = () => resolve(img);
        testImg.onerror = () => resolve('/imagens/placeholder.jpg');
      }));
    }));
    currentImages = validImages;

    carrosselImagens.innerHTML = currentImages.map((img, i) => `
      <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" width="auto" height="600" onerror="this.src='/imagens/placeholder.jpg'">
    `).join('');

    requestAnimationFrame(() => {
      carrosselImagens.style.width = '100%';
      carrosselImagens.style.display = 'flex';
      carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
      carrosselImagens.querySelectorAll('img').forEach(img => {
        img.style.width = '100%';
        img.style.flex = '0 0 100%';
        img.style.objectFit = 'contain';
      });
    });

    carrosselDots.innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}" onclick="setModalCarrosselImage(${i})"></span>`
    ).join('');

    modal.style.display = 'flex';
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
  }
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.querySelectorAll('#modalCarrosselDots .carrossel-dot');
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    carrosselDots.forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
  });
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.querySelectorAll('#modalCarrosselDots .carrossel-dot');
  currentImageIndex = index;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    carrosselDots.forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
  });
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
    currentImages = [];
    currentImageIndex = 0;
  }
}

// Configurar busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;
  if (!inputBusca || !buscaFeedback) return;

  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();
    buscaFeedback.style.display = termoBusca ? 'block' : 'none';
    buscaFeedback.textContent = termoBusca ? `Buscando por "${termoBusca}"...` : '';
    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(), 300);
  });
}

// Configurar paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  if (!prevButton || !nextButton) return;

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
  if (!prevButton || !nextButton || !pageInfo) return;

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)}`;
}

// Filtros
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  carregarProdutos();
}

function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja);
  });
  carregarProdutos();
}

// Sidebar toggle
function configurarSidebarToggle() {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!sidebarToggle || !sidebar) return;

  sidebarToggle.addEventListener('click', () => {
    const isExpanded = sidebarToggle.getAttribute('aria-expanded') === 'true';
    sidebarToggle.setAttribute('aria-expanded', !isExpanded);
    sidebar.classList.toggle('active');
    sidebarToggle.textContent = isExpanded ? '☰ Categorias' : '✕';
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();
  configurarSidebarToggle();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }
});
