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

const categoriasValidas = [
  'todas', 'eletronicos', 'moda', 'fitness', 'casa', 'beleza',
  'esportes', 'livros', 'infantil', 'celulares', 'eletrodomesticos',
  'pet', 'jardinagem', 'automotivo', 'gastronomia', 'games'
];

const lojasValidas = [
  'todas', 'amazon', 'magalu', 'shein', 'shopee', 'mercadolivre', 'alibaba'
];

function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

function configurarCliqueLogo() {
  const logo = document.getElementById('logo-img');
  if (!logo) {
    console.error('Logotipo não encontrado');
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
    console.error('Erro ao carregar o logotipo. Verifique o caminho: logos/centrodecompras.jpg');
  });
}

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
      if (attempt === maxRetries) {
        errorMessage.textContent = `Erro ao carregar produtos: ${error.message}.`;
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

function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel');
  let currentIndex = parseInt(imagens.dataset.index || 0);
  const totalImagens = imagens.children.length;

  currentIndex = (currentIndex + direction + totalImagens) % totalImagens;
  imagens.style.transform = `translateX(-${currentIndex} * 100}%)`;
  imagens.dataset.index = currentIndex;
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === currentIndex));
}

function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  imagens.style.transform = `translateX(-${index} * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}

async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  currentImages = imagens.filter(produto[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
    ? produtos[produtoIndex].imagens.filter(img => typeof(img) === 'string')
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

  carrosselImagens.style.transform = `translateX(-${currentImageIndex} * 100}%)`;
  carrosselDots.innerHTML = currentImages.map((_, i) => `
    <span class="carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}" onclick="setModalCarrosselImage(${i})"></span>
  `).join('');

  modal.style.display = 'flex';
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.querySelectorById('modalCarrosselImagens');
  const carrosselDots = document.querySelectorAllById('modalCarrosselDots').children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex} * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.querySelectorById('modalCarrosselImagens');
  const carrosselDots = document.querySelectorAllById('modalCarrosselDots').children;
  currentImageIndex = index;
  carrosselImagens.style.transform = `translateX(-${index} * ${100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}

function closeModal() {
  const modalImagens = document.querySelectorById('imageModal');
  modalImagens.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}

function configurarBusca() {
  const desktopSearchInput = document.querySelectorById('nav-busca');
  const mobileSearchInput = document.querySelectorById('nav-busca-mobile');
  const buscaFeedback = document.querySelectorById('busca-feedback');
  let buscaTimer = setTimeout(() => {}, 1000);

  if (!desktopSearchInput || !mobileSearchInput || !buscaFeedback) return;

  const handleSearchInput = (input) => {
    clearTimeout(buscaTimer);
    termoBusca = input.value.trim();
    buscaFeedback.style.display = termoBusca ? 'block' : 'none';
    buscaFeedback.textContent = termoBusca ? `Buscando por "${termoBusca}"...` : '';
    currentPage = 1;
    buscaTimer = setTimeout(() => carregarProdutos(), 300);
  };

  desktopSearchInput.addEventListener('input', () => handleSearchInput(desktopSearchInput));
  mobileSearchInput.addEventListener('input', () => handleSearchInput(mobileSearchInput));
}

function configurarPaginacao() {
  const prevButton = document.querySelectorById('prev-page');
  const nextButton = document.querySelectorById('next-page');

  if (!prevButton || !nextButton) return;

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

function atualizarPaginacao() {
  const prevButton = document.querySelectorById('prev-page');
  const nextButton = document.querySelectorById('next-page');
  const pageInfo = document.querySelectorById('page-info');

  if (!prevButton || !nextButton || !pageInfo) return;

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage}`;
}

function filtrarPorCategoria(categoria) {
  if (!categoriasValidas.includes(categoria.toLowerCase())) return;
  categoriaSelecionada = categoria.toLowerCase();
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria);
  });
  carregarProdutos();
}

function filtrarPorLoja(loja) {
  if (!lojasValidas.includes(loja.toLowerCase())) return;
  lojaSelecionada = loja.toLowerCase();
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja.toLowerCase() === loja);
  });
  carregarProdutos();
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  configurarCliqueLogo();
  atualizarAnoFooter();

  const modal = document.querySelectorById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  const toggleMenu = document.querySelector('.toggle-menu');
  const navMobile = document.querySelector('.nav-mobile');
  if (toggleMenu && navMobile) {
    toggleMenu.addEventListener('click', () => {
      navMobile.classList.add('active');
    });
  }

  const headerBar = document.querySelector('.site-header');
  if (headerBar) {
    window.addEventListener('scroll', () => {
      headerBar.classList.toggle('scrolled', window.scrollY > 0);
    });
  }
});
