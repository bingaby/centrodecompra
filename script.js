const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais
const ITEMS_PER_PAGE = 25; // 25 itens por página
let currentPage = 1;
let totalPages = 1;
let currentImages = [];
let currentImageIndex = 0;
let clickCount = 0;
let clickTimer;

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Configurar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img');
  if (!logo) {
    console.error('ID site-logo-img não encontrado');
    return;
  }
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    console.log(`Clique detectado: ${clickCount}`);
    if (clickCount === 1) {
      clickTimer = setTimeout(() => clickCount = 0, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      console.log('Triplo clique detectado, redirecionando para admin-xyz-123.html');
      window.location.href = '/admin-xyz-123.html';
      clickCount = 0;
    }
  });
}

// Carregar produtos com retry
async function carregarProdutos(search = '', categoria = '', loja = '') {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos essenciais não encontrados');
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

      const params = new URLSearchParams({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(search && { search }),
        ...(categoria && categoria !== 'todas' && { categoria }),
        ...(loja && loja !== 'todas' && { loja })
      });

      console.log(`Tentativa ${attempt}: Carregando produtos de ${API_URL}/api/produtos?${params}`);
      const response = await fetch(`${API_URL}/api/produtos?${params}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}`);
      }

      const data = await response.json();
      const produtos = Array.isArray(data.produtos) ? data.produtos : [];
      totalPages = Math.ceil(data.total / ITEMS_PER_PAGE) || 1;

      console.log(`Produtos recebidos: ${produtos.length}, Total: ${data.total}, Páginas: ${totalPages}`);

      if (produtos.length === 0) {
        mensagemVazia.style.display = 'block';
        gridProdutos.style.display = 'none';
        loadingSpinner.style.display = 'none';
        atualizarPaginacao();
        return;
      }

      gridProdutos.style.display = 'grid';
      produtos.forEach(produto => {
        const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
          ? produto.imagens.filter(img => typeof img === 'string' && img)
          : ['imagens/placeholder.jpg'];
        const linkAfiliado = produto.link || '#';
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
          <img src="${imagens[0]}" alt="${produto.nome || 'Produto'}" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${JSON.stringify(imagens)})">
          <div class="produto-card-content">
            <span>${produto.nome || 'N/A'}</span>
            <div class="descricao">Loja: ${produto.loja || 'N/A'}</div>
            <div class="preco"><a href="${linkAfiliado}" target="_blank" rel="noopener">Ver oferta</a></div>
            <a href="${linkAfiliado}" class="ver-na-loja" target="_blank" rel="noopener">Comprar</a>
          </div>
        `;
        gridProdutos.appendChild(card);
      });

      loadingSpinner.style.display = 'none';
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt === maxRetries) {
        errorMessage.textContent = `Erro ao carregar produtos após ${maxRetries} tentativas: ${error.message}.`;
        errorMessage.style.display = 'block';
        mensagemVazia.style.display = 'none';
        gridProdutos.style.display = 'none';
        loadingSpinner.style.display = 'none';
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Atualizar paginação
function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  if (!prevButton || !nextButton || !pageInfo) {
    console.error('Elementos de paginação não encontrados');
    return;
  }

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= totalPages;
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

  prevButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos(
        document.getElementById('busca').value,
        document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas',
        document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas'
      );
    }
  };

  nextButton.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      carregarProdutos(
        document.getElementById('busca').value,
        document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas',
        document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas'
      );
    }
  };
}

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
  document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`.categoria-item[data-categoria="${categoria}"]`).classList.add('ativa');
  currentPage = 1;
  carregarProdutos(
    document.getElementById('busca').value,
    categoria,
    document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas'
  );
}

// Filtrar por loja
function filtrarPorLoja(loja) {
  document.querySelectorAll('.loja, .loja-todas').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`[data-loja="${loja}"]`).classList.add('ativa');
  currentPage = 1;
  carregarProdutos(
    document.getElementById('busca').value,
    document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas',
    loja
  );
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
    const termo = inputBusca.value.trim();
    buscaFeedback.textContent = termo ? `Buscando por "${termo}"...` : '';
    buscaFeedback.style.display = termo ? 'block' : 'none';
    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(
      termo,
      document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas',
      document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas'
    ), 300);
  });
}

// Modal de imagens
function openModal(imagens) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  currentImages = imagens.length > 0 ? imagens : ['imagens/placeholder.jpg'];
  currentImageIndex = 0;

  carrosselImagens.innerHTML = currentImages.map((img, i) => `
    <img src="${encodeURIComponent(img)}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" onerror="this.src='imagens/placeholder.jpg'">
  `).join('');

  carrosselDots.innerHTML = currentImages.map((_, i) => `
    <span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})"></span>
  `).join('');

  carrosselImagens.style.transform = `translateX(0%)`;
  modal.style.display = 'flex';
}

function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
}

function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots').children;
  currentImageIndex = index;
  carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
  Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
}

function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}

// Toggle para nav e sidebar
function toggleNav() {
  document.getElementById('main-nav').classList.toggle('active');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando página');
  carregarProdutos();
  configurarBusca();
  atualizarAnoFooter();
  configurarCliqueLogo();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
});
