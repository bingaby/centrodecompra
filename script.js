const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 24; // Definido como 24 itens por página
let totalProdutos = 1000; // Será atualizado dinamicamente

// Variável para contagem de cliques no logotipo
let clickCount = 0;
let clickTimeout = null;

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Configurar clique triplo no logotipo para abrir modal de login
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img');
  const loginModal = document.getElementById('loginModal');
  if (!logo || !loginModal) {
    console.error('ID site-logo-img ou loginModal não encontrado no DOM');
    return;
  }
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    console.log(`Clique ${clickCount} no logo detectado`);

    if (clickCount === 1) {
      // Iniciar temporizador na primeira vez
      clickTimeout = setTimeout(() => {
        console.log('Tempo de cliques expirado, reiniciando contador');
        clickCount = 0;
      }, 2000); // 2 segundos para os 3 cliques
    }

    if (clickCount === 3) {
      console.log('Três cliques detectados, abrindo modal de login');
      loginModal.style.display = 'flex';
      clearTimeout(clickTimeout);
      clickCount = 0;
    }
  });
}

// Configurar login
function configurarLogin() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  if (!loginForm || !loginError) {
    console.error('Elementos loginForm ou loginError não encontrados');
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Credenciais fixas (APENAS PARA DEMONSTRAÇÃO)
    const adminUsername = 'Princesaeloah';
    const adminPassword = '13082015';

    if (username === adminUsername && password === adminPassword) {
      console.log('Login bem-sucedido, redirecionando para admin-xyz-123.html');
      localStorage.setItem('adminToken', 'authenticated');
      window.location.href = '/admin-xyz-123.html';
    } else {
      console.warn('Falha no login: credenciais inválidas');
      loginError.textContent = 'Usuário ou senha incorretos.';
      loginError.style.display = 'block';
    }
  });
}

// Fechar modal de login
function closeLoginModal() {
  const loginModal = document.getElementById('loginModal');
  const loginError = document.getElementById('loginError');
  const loginForm = document.getElementById('loginForm');
  if (loginModal && loginError && loginForm) {
    loginModal.style.display = 'none';
    loginError.style.display = 'none';
    loginForm.reset();
  }
}

// Carregar produtos com retry
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos essenciais (grid-produtos, mensagem-vazia, error-message, loading-spinner) não encontrados');
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

      console.log(`Tentativa ${attempt}: Carregando produtos de ${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`);
      const response = await fetch(
        `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
        {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}`);
      }
      const data = await response.json();
      produtos = Array.isArray(data.produtos) ? data.produtos.slice(0, produtosPorPagina) : [];
      totalProdutos = data.total || produtos.length; // Atualizar dinamicamente
      console.log(`Produtos recebidos da API: ${produtos.length}, Total: ${totalProdutos}`);

      if (!Array.isArray(produtos)) {
        throw new Error('Resposta inválida da API: produtos não é um array');
      }

      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
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

  // Aplicar filtros e limitar a 24 itens
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
    .slice(0, produtosPorPagina); // Forçar limite de 24 itens

  console.log(`Produtos filtrados: ${produtosFiltrados.length} (limitado a ${produtosPorPagina})`);

  gridProdutos.innerHTML = '';
  if (produtosFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    console.log('Nenhum produto filtrado encontrado');
    return;
  }

  mensagemVazia.style.display = 'none';
  gridProdutos.style.display = 'grid';

  // Renderizar os produtos
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
      <span class="nome-produto">${produto.nome || 'Produto sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });

  console.log(`Exibidos ${produtosFiltrados.length} produtos no #grid-produtos`);
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

// Funções do modal de imagens
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.jpg'];
    currentImageIndex = imageIndex;

    console.log('🔍 Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

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
      <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" width="600" height="600" onerror="this.src='imagens/placeholder.jpg'">
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
    console.error('Erro ao abrir modal:', error);
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
  modal.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
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
      buscaFeedback.textContent = `Buscando por "${termoBusca}"...`;
    } else {
      buscaFeedback.style.display = 'none';
    }

    currentPage = 1;
    debounceTimer = setTimeout(() => {
      filtrarProdutos();
      buscaFeedback.style.display = termoBusca ? 'block' : 'none';
    }, 500);
  });
}

// Configurar filtros por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;

  const itensCategoria = document.querySelectorAll('.categoria-item');
  itensCategoria.forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });

  console.log(`Filtro de categoria aplicado: ${categoria}`);
  carregarProdutos();
}

// Configurar filtros por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;

  const lojas = document.querySelectorAll('.loja, .loja-todas');
  lojas.forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja || (loja === 'todas' && item.classList.contains('loja-todas')));
  });

  console.log(`Filtro de loja aplicado: ${loja}`);
  carregarProdutos();
}

// Atualizar paginação
function atualizarPaginacao() {
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  if (!prevPageButton || !nextPageButton || !pageInfo) {
    console.error('Elementos de paginação não encontrados');
    return;
  }

  const totalPages = Math.ceil(totalProdutos / produtosPorPagina);
  prevPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage >= totalPages || totalProdutos <= produtosPorPagina;
  pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1}`;

  console.log(`Paginação atualizada: Página ${currentPage}, Total de páginas: ${totalPages}`);
}

// Configurar botões de paginação
function configurarPaginacao() {
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');

  if (!prevPageButton || !nextPageButton) {
    console.error('Botões de paginação não encontrados');
    return;
  }

  prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      console.log(`Navegando para página anterior: ${currentPage}`);
      carregarProdutos();
    }
  });

  nextPageButton.addEventListener('click', () => {
    currentPage++;
    console.log(`Navegando para próxima página: ${currentPage}`);
    carregarProdutos();
  });
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
  atualizarAnoFooter();
  configurarCliqueLogo();
  configurarLogin();
  configurarBusca();
  configurarPaginacao();
  carregarProdutos();

  // Configurar fechamento do modal ao clicar fora
  const imageModal = document.getElementById('imageModal');
  const loginModal = document.getElementById('loginModal');

  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        closeModal();
      }
    });
  }

  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        closeLoginModal();
      }
    });
  }
});
