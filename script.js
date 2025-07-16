const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 28; // Alterado para 28 itens por página
let totalProdutos = 0; // Alterado para 0, será atualizado dinamicamente

// Função para normalizar strings (remover acentos e converter para minúsculas)
function normalizarString(str) {
  return str
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') || '';
}

// Função para embaralhar um array (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  } else {
    console.warn('Elemento #year não encontrado no DOM');
  }
}

// Detectar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img');
  if (!logo) {
    console.error('ID site-logo-img não encontrado no DOM');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      const tempToken = 'triple-click-access';
      window.location.href = `admin-xyz-123.html?tempToken=${tempToken}`;
      clickCount = 0;
    }
  }, { once: false });
}

// Carregar produtos com retry
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos essenciais não encontrados');
    errorMessage.textContent = 'Erro: Elementos da página não encontrados. Contate o suporte.';
    errorMessage.style.display = 'block';
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

      let url = `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`;
      if (categoriaSelecionada !== 'todas') {
        url += `&categoria=${encodeURIComponent(categoriaSelecionada)}`;
      }
      if (lojaSelecionada !== 'todas') {
        url += `&loja=${encodeURIComponent(lojaSelecionada)}`;
      }

      console.log(`Tentativa ${attempt}: Carregando produtos de ${url}`);
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      });

      console.log('Status da resposta (index):', response.status, response.statusText);
      const data = await response.json();
      console.log('Dados recebidos (index):', JSON.stringify(data, null, 2));

      if (!response.ok) {
        const errorData = data || {};
        throw new Error(errorData.details || `Erro ${response.status}: Falha ao carregar produtos`);
      }

      if (!Array.isArray(data.produtos)) {
        throw new Error('Resposta inválida da API: produtos não é um array');
      }

      produtos = shuffleArray(data.produtos.slice(0, produtosPorPagina));
      totalProdutos = data.total || produtos.length;
      console.log('Produtos processados (index):', produtos, 'Total:', totalProdutos);

      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt === maxRetries) {
        errorMessage.textContent = `Não foi possível carregar os produtos após ${maxRetries} tentativas: ${error.message}. Tente novamente mais tarde.`;
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

  if (!gridProdutos || !mensagemVazia) {
    console.error('grid-produtos ou mensagem-vazia não encontrados');
    return;
  }

  const produtosFiltrados = produtos
    .filter((produto) => {
      const matchCategoria =
        categoriaSelecionada === 'todas' ||
        normalizarString(produto.categoria) === normalizarString(categoriaSelecionada);
      const matchLoja =
        lojaSelecionada === 'todas' ||
        normalizarString(produto.loja) === normalizarString(lojaSelecionada);
      const matchBusca =
        !termoBusca || normalizarString(produto.nome).includes(normalizarString(termoBusca));
      return matchCategoria && matchLoja && matchBusca;
    });

  console.log('Produtos filtrados:', produtosFiltrados);

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
    const carrosselId = `carrossel-${produtoIndex}-${produto._id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', normalizarString(produto.categoria) || 'todas');
    produtoDiv.setAttribute('data-loja', normalizarString(produto.loja) || 'todas');

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

// Funções do modal
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    carrosselImagens.innerHTML = currentImages.map(img => `<img src="${img}" alt="Imagem ampliada" onerror="this.src='imagens/placeholder.jpg'">`).join('');
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

    carrosselDots.innerHTML = currentImages.map((_, i) => `<span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})"></span>`).join('');

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

  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = index;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}

// Configurar busca
function configurarBusca() {
  const buscaInput = document.getElementById('busca');
  if (buscaInput) {
    buscaInput.addEventListener('input', (e) => {
      termoBusca = e.target.value;
      filtrarProdutos();
    });
  }
}

// Configurar filtros
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1; // Resetar para a primeira página ao mudar a categoria
  const itensCategoria = document.querySelectorAll('.categoria-item');
  itensCategoria.forEach(item => item.classList.remove('ativa'));
  document.querySelector(`.categoria-item[data-categoria="${categoria}"]`).classList.add('ativa');
  console.log('Categoria selecionada:', categoria);
  carregarProdutos(); // Recarregar produtos com o filtro de categoria
}

function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1; // Resetar para a primeira página ao mudar a loja
  const itensLoja = document.querySelectorAll('.loja, .loja-todas');
  itensLoja.forEach(item => item.classList.remove('ativa'));
  document.querySelector(`[data-loja="${loja}"]`).classList.add('ativa');
  console.log('Loja selecionada:', loja);
  carregarProdutos(); // Recarregar produtos com o filtro de loja
}

// Configurar paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        carregarProdutos();
      }
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentPage++;
      carregarProdutos();
    });
  }
}

function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');
  if (prevButton && nextButton && pageInfo) {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
    pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina) || 1}`;
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('script.js carregado');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }
});
