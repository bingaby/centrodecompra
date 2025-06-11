const API_URL = 'https://centrodecompra-backend.onrender.com/api/produtos';

let produtos = [];
const mockProdutos = [
  {
    id: '1',
    nomeProduto: 'Produto de Teste',
    categoria: 'eletrônicos',
    loja: 'Amazon',
    imagens: ['/imagens/placeholder.jpg'],
    link: 'https://example.com',
  },
];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 10;
const totalProdutos = 50;

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker registrado'))
      .catch(error => console.error('Erro ao registrar Service Worker:', error));
  });
}

// Atualizar ano no footer
function atualizarFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}

// Configurar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img'); // Corrigido para o ID correto
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
 e
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');
  if (!loadingSpinner || !mensagemVazia || !errorMessage || !gridProdutos) {
    console.error('Elementos do DOM não encontrados');
    return;
  }

  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  errorMessage.style.display = 'none';
  gridProdutos.innerHTML = '';

  try {
    console.log(`Carregando produtos, página ${currentPage}`); // Log
    const response = await fetch(`${API_URL}?page=${currentPage}&limit=${produtosPorPagina}`, { cache: 'no-store' });
    console.log('Status da API response.status:', ); // Log
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const data = await response.json();
    console.log('Dados da API:', data); // Log
    produtos = Array.isArray(data) ? data : (Array.isArray(data.produtos) ? data.produtos : [];
    
    if (!produtos.length) {
      console.warn('Nenhum produto retornado, usando mock');
      produtos = mockProdutos;
    }

    filtrarProdutos();
    atualizarPaginacao();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error.message); // Log
    errorMessage.textContent = `Erro: ${error.message}. Usando dados de teste.`;
    errorMessage.style.display = 'block';
    produtos = mockProdutos;
    filtrarProdutos();
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Filtrar e exibir produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  if (!gridProdutos || !mensagemVazia) return;

  console.log('Filtrando:', { categoriaSelecionada, lojaSelecionada, termoBusca }); // Log
  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = categoriaSelecionada === 'todas' || produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja = lojaSelecionada === 'todas' || produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca = !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase()) || produto.nomeProduto?.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchLoja && matchBusca;
  });

  console.log('Produtos filtrados:', produtosFiltrados.length); // Log
  gridProdutos.innerHTML = '';
  if (!produtosFiltrados.length) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    return;
  }

  mensagemVazia.style.display = 'none';
  gridProdutos.style.display = 'grid';

  produtosFiltrados.forEach((produto, index) => {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length ? imagens : ['/imagens/placeholder.jpg'];
    const carrosselId = `carrossel-${index}-${produto.id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card');
    produtoDiv.dataset.categoria = produto.categoria?.toLowerCase() || 'todas';
    produtoDiv.dataset.loja = produto.loja?.toLowerCase() || 'todas';

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome || produto.nomeProduto || 'Produto'} ${i + 1}" loading="lazy" width="200" height="200" onerror="this.src='/imagens/placeholder.jpg'" onclick="openModal('${img}')">`).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)">◄</button>
          <div class="carrossel-dots">            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
        ` : ''}        </div>
      </div>
      <span>${produto.nome || produto.nomeProduto || 'Sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      </span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preço">Ver Preço</p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja">Comprar</a>
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

// Modal simplificado
function openModal(imgUrl) {
  const modal = document.getElementById('imageModal');
  const modalCarrosselImagens = document.getElementById('modalCarrosselImagens');
  if (!modal || !modalCarrosselImagens) return;

  modalCarrosselImagens.innerHTML = `<img src="${imgUrl}" class="modal-image" alt="Imagem Ampliada" onerror="this.src='/imagens/placeholder.jpg'" />`;
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) modal.style.display = 'none';
}

// Configurar busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  if (!inputBusca) return;

  let debounceTimer;
  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();
    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(), 300);
  });
}

// ConfigurarPaginacao
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
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

// Configurar toggle da sidebar
function configurarSidebar() {
  const toggleButton = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggleButton || !sidebar) return;

  toggleButton.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    sidebar.classList.toggle('open', !isOpen);
    toggleButton.setAttribute('aria-expanded', !isOpen);
    toggleButton.textContent = isOpen ? '☰ Categorias' : '✕ Fechar';
    console.log('Sidebar toggled:', !isOpen); // Log
});
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  configurarCliqueLogo();
  configurarSidebar();
  atualizarFooter();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
});
