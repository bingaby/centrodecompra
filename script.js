const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 24;
let totalProdutos = 1000;

// Função para escapar HTML e evitar XSS
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (match) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
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
    console.log(`Clique detectado: ${clickCount}`);
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        console.log('Contagem de cliques resetada');
      }, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      console.log('Triplo clique detectado, redirecionando para admin-xyz-123.html');
      window.location.href = '/admin-xyz-123.html';
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
    errorMessage.textContent = 'Erro: Elementos da página não encontrados.';
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

      const response = await fetch(
        `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}`);
      }
      const data = await response.json();
      produtos = Array.isArray(data.produtos) ? data.produtos.slice(0, produtosPorPagina) : [];
      totalProdutos = data.total || produtos.length;
      console.log(`Produtos recebidos: ${produtos.length}, Total: ${totalProdutos}`);

      if (!Array.isArray(produtos)) {
        throw new Error('Resposta inválida da API: produtos não é um array');
      }

      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou: ${error.message}`);
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

  if (!gridProdutos || !mensagemVazia) {
    console.error('grid-produtos ou mensagem-vazia não encontrados');
    return;
  }

  const produtosFiltrados = produtos
    .filter((produto) => {
      const matchCategoria =
        categoriaSelecionada === 'todas' ||
        produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
      const matchLoja =
        lojaSelecionada === 'todas' ||
        produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
      const matchBusca =
        !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
      return matchCategoria && matchLoja && matchBusca;
    })
    .slice(0, produtosPorPagina);

  console.log(`Produtos filtrados: ${produtosFiltrados.length}`);

  gridProdutos.innerHTML = '';
  if (produtosFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    console.log('Nenhum produto filtrado encontrado');
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
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}" role="region" aria-label="Carrossel de imagens do produto">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `
            <img src="${escapeHTML(img)}" alt="${escapeHTML(produto.nome || 'Produto')} ${i + 1}" loading="lazy" width="200" height="200" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${produtoIndex}, ${i})">
          `).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem">▶</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})" aria-label="Selecionar imagem ${i + 1}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${escapeHTML(produto.nome || 'Produto sem nome')}</span>
      <span class="descricao">Loja: ${escapeHTML(produto.loja || 'Desconhecida')}</span>
      <p class="preco"><a href="${escapeHTML(produto.link || '#')}" target="_blank" class="ver-preco" rel="noopener noreferrer">Clique aqui para ver o preço</a></p>
      <a href="${escapeHTML(produto.link || '#')}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}" rel="noopener noreferrer">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });

  console.log(`Exibidos ${produtosFiltrados.length} produtos`);
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
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  if (!modal || !carrosselImagens || !carrosselDots) {
    console.error('Elementos do modal não encontrados');
    return;
  }

  try {
    modal.classList.add('modal-carregando');
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    console.log('Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

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
      <img src="${escapeHTML(img)}" alt="${escapeHTML(produtos[produtoIndex]?.nome || 'Produto')} ${i + 1}" class="modal-image" loading="lazy" width="600" height="600" onerror="this.src='imagens/placeholder.jpg'">
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
        img.addEventListener('click', () => {
          img.classList.toggle('zoomed');
        });
      });
    });

    carrosselDots.innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})" aria-label="Selecionar imagem ${i + 1}"></span>
    `).join('');

    modal.classList.add('aberto');
    modal.classList.remove('modal-carregando');
    modal.setAttribute('aria-hidden', 'false');
    modal.focus();
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
    modal.classList.remove('modal-carregando');
  }
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  });
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  currentImageIndex = index;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  });
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  modal.classList.remove('aberto');
  modal.setAttribute('aria-hidden', 'true');
  currentImages = [];
  currentImageIndex = 0;
  carrosselImagens.querySelectorAll('img').forEach(img => img.classList.remove('zoomed'));
}

// Configurar busca com debounce
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;

  if (!inputBusca || !buscaFeedback) {
    console.error('Elementos de busca não encontrados');
    return;
  }

  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();

    if (termoBusca) {
      buscaFeedback.style.display = 'block';
      buscaFeedback.textContent = `Buscando por "${escapeHTML(termoBusca)}"...`;
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

  if (!prevButton || !nextButton) {
    console.error('Botões de paginação não encontrados');
    return;
  }

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

  if (!prevButton || !nextButton || !pageInfo) {
    console.error('Elementos de paginação não encontrados');
    return;
  }

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
  console.log('Inicializando página');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Fechar modal com tecla Esc
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('aberto')) {
        closeModal();
      }
    });
  }
});
