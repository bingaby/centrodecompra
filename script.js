const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0';
let currentPage = 1;
const produtosPorPagina = 20;
let totalProdutos = 0; // Alterado para 0, será atualizado com a API.

// Produtos mockados padrão como fallback
const mockProdutos = [
  {
    id: '001',
    nome: 'Produto de Teste 1',
    categoria: 'eletronicos',
    loja: 'amazon',
    imagens: ['imagens/placeholder.png'],
    link: '#',
    preco: 199.99,
    relevancia: 5
  },
  {
    id: '002',
    nome: 'Produto de Teste 2',
    categoria: 'moda',
    loja: 'shein',
    imagens: ['imagens/placeholder.png'],
    link: '#',
    preco: 49.99,
    relevancia: 3
  },
];

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
    console.log('Ano do footer atualizado:', yearElement.textContent);
  } else {
    console.error('Elemento de ano do footer não encontrado');
  }
}

// Detectar clique triplo no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('logo');
  if (!logo) {
    console.error('Elemento com ID #logo não encontrado no DOM');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Evita interferência de outros eventos
    clickCount++;
    console.log(`Clique no logotipo detectado: ${clickCount}`);
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        console.log('Contagem de cliques resetada');
      }, 300); // Tempo reduzido para maior responsividade
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      console.log('Triplo clique detectado, redirecionando para admin-xyz-123.html');
      window.location.href = 'admin-xyz-123.html'; // Certifique-se de que este arquivo existe
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

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos necessários não encontrados:', {
      gridProdutos: !!gridProdutos,
      mensagemVazia: !!mensagemVazia,
      errorMessage: !!errorMessage,
      loadingSpinner: !!loadingSpinner,
    });
    return;
  }

  const maxRetries = 3;
  let attempt = 1;

  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  errorMessage.style.display = 'none';
  gridProdutos.innerHTML = '';

  while (attempt <= maxRetries) {
    try {
      console.log(`Tentativa ${attempt}: Carregando produtos de ${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`);
      const response = await fetch(`${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data.produtos)) {
        throw new Error('Resposta da API inválida: esperado um array de produtos');
      }

      produtos = data.produtos;
      totalProdutos = data.total || produtos.length; // Atualiza o total com base na API
      console.log(`Produtos recebidos: ${produtos.length}, Total: ${totalProdutos}`);

      if (produtos.length === 0 && attempt === maxRetries) {
        console.warn('Nenhum produto retornado, usando mockProdutos');
        produtos = mockProdutos;
        totalProdutos = mockProdutos.length;
      }

      await filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`Erro na tentativa ${attempt}: ${error.message}`);
      if (attempt === maxRetries) {
        console.warn('Usando fallback para mockProdutos devido a falha na API');
        produtos = mockProdutos;
        totalProdutos = mockProdutos.length;
        await filtrarProdutos();
        errorMessage.textContent = 'Erro ao carregar produtos. Exibindo itens de teste.';
        errorMessage.style.display = 'block';
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }
}

// Ordenar produtos
function ordenarProdutos() {
  const select = document.getElementById('ordenar-produtos');
  if (!select) {
    console.error('Elemento #ordenar-produtos não encontrado');
    return;
  }

  const criterio = select.value;
  console.log(`Ordenando produtos por: ${criterio}`);

  produtos.sort((a, b) => {
    if (criterio === 'preco-asc') {
      return (a.preco || Infinity) - (b.preco || Infinity);
    } else if (criterio === 'preco-desc') {
      return (b.preco || Infinity) - (preco || Infinity);
    }
    return (b.relevancia || 0) - (a.relevancia || 0); // Relevância padrão
  });

  filtrarProdutos();
}

// Filtrar e exibir produtos
async function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  if (!gridProdutos || !mensagemVazia) {
    console.error('Elementos de grid-produtos ou mensagem-vazia não encontrados');
    return false;
  }

  console.log('Filtrando produtos:', {
    categoriaSelecionada,
    lojaSelecionada,
    termoBusca,
    totalProdutos: produtos.length,
  });

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
  if (produtoFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    console.log('Nenhum produto encontrado após filtragem');
    return true;
  }

  mensagemVazia.style.display = 'none';
  gridProdutos.style.display = 'grid';

  for (const [produtoIndex, produto] of produtosFiltrados.entries()) {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? produto.imagens.filter(img => typeof img === 'string' && img.trim())
      : ['imagens/placeholder.png'];
    const carrosselId = `carrossel-${produtoIndex}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `
            <img src="${img}" alt="${produto.nome || 'Produto'} ${i + 1}" loading="lazy" width="200" height="200" onerror="this.src='imagens/placeholder.png'" onclick="openModal(${produtoIndex}, ${i})">
          `).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem">▶</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})" aria-label="Selecionar imagem ${i + 1}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome || 'Produto sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">R$ ${produto.preco ? produto.preco.toFixed(2) : 'Consultar'}</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar na Loja</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  }

  console.log(`Exibidos ${produtosFiltrados.length} produtos`);
  return true;
}

// Funções do carrossel
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) {
    console.error(`Carrossel com ID ${carrosselId} não encontrado`);
    return;
  }
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

function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) {
    console.error(`Carrossel com ID ${carrosselId} não encontrado`);
    return;
  }
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

  if (!modal || !carrosselImagens || !carrosselDots) {
    console.error('Elementos do modal não encontrados');
    return;
  }

  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img.trim())
      : ['imagens/placeholder.png'];
    currentImageIndex = imageIndex;

    console.log('🔍 Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

    const validImages = await Promise.all(currentImages.map(img => {
      return new Promise(resolve => {
        const testImg = new Image();
        testImg.src = img;
        testImg.onload = () => resolve(img);
        testImg.onerror = () => resolve('imagens/placeholder.png');
      });
    }));
    currentImages = validImages;

    carrosselImagens.innerHTML = currentImages.map((img, i) => `
      <img src="${img}" alt="Imagem ${i + 1} do produto ${produtos[produtoIndex]?.nome || 'Produto'}" class="modal-image" loading="lazy" width="600" height="600" onerror="this.src='imagens/placeholder.png'">
    `).join('');

    requestAnimationFrame(() => {
      carrosselImagens.style.width = '100%';
      carrosselImagens.style.display = 'flex';
      carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

      const imgs = carrosselImagens.querySelectorAll('img');
      imgs.forEach(img => {
        img.style.width = '100%';
        img.style.flex = '0 0 100%';
        img.style.objectFit = 'contain';
      });
    });

    carrosselDots.innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}" onclick="setModalCarrosselImage(${i})" aria-label="Selecionar imagem ${i + 1}"></span>
    `).join('');

    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modal.focus();
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
  }
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  if (!carrosselImagens || !carrosselDots) return;

  const totalImagens = currentImages.length;
  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
  });
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  if (!carrosselImagens || !carrosselDots) return;

  currentImageIndex = index;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
  });
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;

  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  currentImages = [];
  currentImageIndex = 0;
}

// Configurar busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('Busca-feedback');
  if (!inputBusca || !buscaFeedback) {
    console.error('Busca por elementos não encontrados:', { inputBusca: !!inputBusca, buscaFeedback: !!buscaFeedback });
    return;
  }

  let debounceTimer;
  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();

    if (termoBusca) {
      buscaFeedback buscaFeedback.style.display = 'block';
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
  nextButton.disabled = totalProdutos === 0 || currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)}`;
}

// Filtrar por categoria
async function filtrarPorCategoria(categoria) {
  categoriaSeleçãoada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
}));
  carregarProdutos();
}

// Filtrar por loja
function filtrarPorLoja(loja) {
  lojaSeleçãoada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja-todas, .loja').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja?.toLowerCase() === loja.toLowerCase());
  }));
  carregarProdutos();
}

// Configurar botão Voltar ao Topo
function configurarBackTopTo() {
  window.addEventListener('scroll', () => {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      backToTop.classList.toggle('show', window.scrollY > 300);
    }
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ Inicializando página');
  try {
    await carregarProdutos();
    configurarBusca();
    configurarPaginacao();
    atualizarAnoFooter();
    configurarCliqueLogo();
    configurarBackToTop();
  } catch (error) {
    console.error('Erro durante inicialização:', error);
  }

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });
  }

  // Adicionar suporte à navegação por teclado
  document.querySelectorAll('.categoria-item, .loja, .loja-todas').forEach(item => {
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
