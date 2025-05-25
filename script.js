const API_URL = 'https://centrodecompra-backend.onrender.com';

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;

// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// Detectar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo');
  if (logo) {
    let clickCount = 0;
    let clickTimer = null;
    logo.addEventListener('click', () => {
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 600);
      } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        window.location.href = 'admin.html';
        clickCount = 0;
      }
    });
  }
}

// Carregar produtos da API
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  try {
    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';
    gridProdutos.innerHTML = '';

    const response = await fetch(`${API_URL}/api/produtos`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Erro ao carregar produtos: ${response.status} ${response.statusText}`);
    }
    produtos = await response.json();

    if (!Array.isArray(produtos)) {
      throw new Error('Resposta da API não é uma lista válida');
    }

    filtrarProdutos();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    errorMessage.textContent = 'Erro ao carregar os produtos. Tente novamente mais tarde.';
    errorMessage.style.display = 'block';
    mensagemVazia.style.display = 'none';
    gridProdutos.style.display = 'none';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

// Filtrar e exibir produtos
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter(produto => {
    const matchCategoria = categoriaSelecionada === 'todas' || produto.categoria.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja = lojaSelecionada === 'todas' || produto.loja.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca = !termoBusca || produto.nome.toLowerCase().includes(termoBusca.toLowerCase());
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
    const imagens = produto.imagens && produto.imagens.length > 0
      ? produto.imagens
      : ['/imagens/sem-imagem.jpg'];
    const carrosselId = `carrossel-${produtoIndex}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', produto.categoria.toLowerCase());
    produtoDiv.setAttribute('data-loja', produto.loja.toLowerCase());

    produtoDiv.innerHTML = `
      <div class="carrossel" id="${carrosselId}">
        <div class="carrossel-imagens">
          ${imagens.map((img, i) => `<img src="${img}" alt="${produto.nome}" loading="lazy" onerror="this.src='/imagens/sem-imagem.jpg'" onclick="openModal(${produtoIndex}, ${i})">`).join('')}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)">►</button>
          <div class="carrossel-dots">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <h3>${produto.nome}</h3>
      <p class="preco"><a href="${produto.link}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
      <span class="loja">Loja: ${produto.loja}</span>
      <a href="${produto.link}" target="_blank" class="ver-na-loja ${produto.loja.toLowerCase()} btn-comprar">Comprar agora</a>
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
function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  try {
    currentImages = produtos[produtoIndex]?.imagens && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens
      : ['/imagens/sem-imagem.jpg'];
    currentImageIndex = imageIndex;

    carrosselImagens.innerHTML = currentImages.map(img => `<img src="${img}" alt="Imagem ampliada" onerror="this.src='/imagens/sem-imagem.jpg'">`).join('');
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

// Configurar busca com debounce
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;

  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();

    if (termoBusca) {
      buscaFeedback.style.display = 'block';
      buscaFeedback.textContent = `Buscando por "${termoBusca}"...`;
    } else {
      buscaFeedback.style.display = 'none';
      buscaFeedback.textContent = '';
    }

    debounceTimer = setTimeout(() => {
      filtrarProdutos();
    }, 300);
  });
}

// Filtrar por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  filtrarProdutos();
}

// Filtrar por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja);
  });
  filtrarProdutos();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
  configurarBusca();
  atualizarAnoFooter();
  configurarCliqueLogo();

  // Fechar modal ao clicar fora
  document.getElementById('imageModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
