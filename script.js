const API_URL = 'https://centrodecompra-backend.vercel.app'; // Ajustado para Vercel
// Para testes locais, use 'http://localhost:5000'

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20;
let totalProdutos = 0;

// Produtos mockados para teste
const mockProdutos = [
  {
    id: '1',
    nome: 'Smartphone Teste',
    categoria: 'eletronicos',
    loja: 'amazon',
    imagens: ['imagens/placeholder.png'],
    link: '#',
    preco: 999.99,
    relevancia: 5,
  },
  {
    id: '2',
    nome: 'Camiseta Teste',
    categoria: 'moda',
    loja: 'shein',
    imagens: ['imagens/placeholder.png'],
    link: '#',
    preco: 99.99,
    relevancia: 3,
  },
];

// Atualizar ano no footer
function atualizarAno() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
    console.log('Ano do footer atualizado');
  }
}

// Configurar triplo clique
function configurarCliqueLogo() {
  const logoContainer = document.getElementById('logo-container');
  if (!logoContainer) {
    console.error('Elemento #logo-container não encontrado');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logoContainer.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    clickCount++;
    console.log(`Clique detectado: ${clickCount}`);
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        console.log('Contagem de cliques resetada');
      }, 250); // Tempo reduzido para maior sensibilidade
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      console.log('Triplo clique detectado, redirecionando para admin-xyz-123.html');
      window.location.href = './admin-xyz-123.html';
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
    console.error('Elementos DOM não encontrados', {
      gridProdutos: !!gridProdutos,
      mensagemVazia: !!mensagemVazia,
      errorMessage: !!errorMessage,
      loadingSpinner: !!loadingSpinner,
    });
    return;
  }

  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  errorMessage.style.display = 'none';
  gridProdutos.innerHTML = '';

  // Exibir mockProdutos para teste imediato
  console.log('Carregando mockProdutos para teste');
  produtos = mockProdutos;
  totalProdutos = mockProdutos.length;
  await filtrarProdutos();
  atualizarPaginacao();
  loadingSpinner.style.display = 'none';

  // Tentar carregar da API em segundo plano
  try {
    console.log(`Carregando da API: ${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`);
    const response = await fetch(`${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    if (Array.isArray(data.produtos)) {
      produtos = data.produtos;
      totalProdutos = data.total || produtos.length;
      console.log(`Produtos da API: ${produtos.length}`);
      await filtrarProdutos();
      atualizarPaginacao();
    }
  } catch (error) {
    console.error('Erro ao carregar API:', error.message);
    errorMessage.textContent = 'Erro ao carregar produtos. Exibindo itens de teste.';
    errorMessage.style.display = 'block';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Ordenar produtos
function ordenarProdutos() {
  const select = document.getElementById('ordenar-produtos');
  if (!select) return;
  const criterio = select.value;

  produtos.sort((a, b) => {
    if (criterio === 'preco-asc') return (a.preco || 0) - (b.preco || 0);
    if (criterio === 'preco-desc') return (b.preco || 0) - (a.preco || 0);
    return (b.relevancia || 0) - (a.relevancia || 0);
  });

  filtrarProdutos();
}

// Filtrar e exibir produtos
async function filtrarProdutos() {
  const grid = document.getElementById('grid-produtos');
  const mensagem = document.getElementById('mensagem-vazia');
  if (!grid || !mensagem) return;

  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria = categoriaSelecionada === 'todas' || produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja = lojaSelecionada === 'todas' || produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca = !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchLoja && matchBusca;
  });

  grid.innerHTML = '';
  if (produtosFiltrados.length === 0) {
    mensagem.style.display = 'block';
    grid.style.display = 'none';
    console.log('Nenhum produto encontrado');
    return;
  }

  mensagem.style.display = 'none';
  grid.style.display = 'grid';

  produtosFiltrados.forEach((produto, index) => {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length ? produto.imagens : ['imagens/placeholder.png'];
    const carrosselId = `carrossel-${index}-${produto.id}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.className = 'produto-card';
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');
    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome}" loading="lazy" width="200" height="200" onclick="openModal(${index}, ${i})">`).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Previous">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Next">▶</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome || 'Sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}">R$ ${produto.preco ? produto.preco.toFixed(2) : 'Consultar'}</a></p>
      <a href="${produto.link || '#'}" class="ver-na-loja">Comprar na Loja</a>
    `;
    grid.appendChild(produtoDiv);
  });

  console.log(`Exibidos ${produtosFiltrados.length} produtos`);
}

// Carrossel
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

function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}

// Modal
function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');
  if (!modal || !carrosselImagens || !carrosselDots) return;

  currentImages = Array.isArray(produtos[produtoIndex]?.imagens) ? produtos[produtoIndex].imagens : ['imagens/placeholder.png'];
  currentImageIndex = imageIndex;

  carrosselImagens.innerHTML = currentImages.map((img, i) => `<img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy">`).join('');
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  carrosselDots.innerHTML = currentImages.map((_, i) => `<span class="carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}" onclick="setModalCarrosselImage(${i})"></span>`).join('');

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;

  currentImageIndex = index;
  carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  currentImages = [];
  currentImageIndex = 0;
}

// Busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  if (!inputBusca || !buscaFeedback) return;

  let debounceTimer;
  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();
    buscaFeedback.textContent = termoBusca ? `Buscando por "${termoBusca}"...` : '';
    buscaFeedback.style.display = termoBusca ? 'block' : 'none';
    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(), 300);
  });
}

// Paginação
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
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina) || 1}`;
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

// Voltar ao topo
function configurarBackToTop() {
  window.addEventListener('scroll', () => {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      backToTop.classList.toggle('show', window.scrollY > 200);
    }
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAno();
  configurarCliqueLogo();
  configurarBackToTop();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.querySelectorAll('.categoria-item, .loja, .loja-todas').forEach(item => {
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
});
