const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20; // 20 itens por página
let totalProdutos = 1000; // será atualizado dinamicamente

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

      const url = `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}: Falha ao carregar produtos`);
      }

      const data = await response.json();
      if (!Array.isArray(data.produtos)) {
        throw new Error('Resposta inválida da API: produtos não é um array');
      }

      // Aqui embaralhamos os produtos para ordem aleatória sempre que carregar
      produtos = shuffleArray(data.produtos.slice(0, produtosPorPagina));
      totalProdutos = data.total || produtos.length;

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
      <span>${produto.nome || 'Produto sem nome'}</span>
      <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
      <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
      <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar</a>
    `;
    gridProdutos.appendChild(produtoDiv);
  });
}

// (segue suas outras funções do carrossel, modal, busca e paginação exatamente iguais)

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
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
