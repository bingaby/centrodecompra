const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 20;
const totalProdutos = 1000;// Produtos mockados como fallback
const mockProdutos = [
  {
    id: '1',
    nome: 'Produto de Teste 1',
    categoria: 'eletronicos',
    loja: 'amazon',
    imagens: ['imagens/placeholder.png'],
    link: '#',
  },
  {
    id: '2',
    nome: 'Produto de Teste 2',
    categoria: 'moda',
    loja: 'shein',
    imagens: ['imagens/placeholder.png'],
    link: '#',
  },
];// Atualizar ano no footer
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}// Detectar triplo clique no logotipo
function configurarCliqueLogo() {
  const logo = document.getElementById('logo');
  if (!logo) {
    console.error('ID logo não encontrado no DOM');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    console.log(Clique detectado: ${clickCount});
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        console.log('Contagem de cliques resetada');
      }, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      console.log('Triplo clique detectado, redirecionando para admin-xyz-123.html');
      window.location.href = 'admin-xyz-123.html';
      clickCount = 0;
    }
  });
}// Carregar produtos
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos essenciais não encontrados');
    return;
  }  const maxRetries = 3;
  let attempt = 1;  while (attempt <= maxRetries) {
    try {
      loadingSpinner.style.display = 'block';
      mensagemVazia.style.display = 'none';
      errorMessage.style.display = 'none';
      gridProdutos.innerHTML = '';

  const url = `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`;
  console.log(`Tentativa ${attempt}: Carregando produtos de ${url}`);
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  produtos = await response.json();
  if (!Array.isArray(produtos)) throw new Error('Resposta inválida da API');

  console.log(`Produtos recebidos: ${produtos.length}`);
  if (produtos.length === 0 && attempt === maxRetries) {
    console.warn('Nenhum produto retornado, usando mock');
    produtos = mockProdutos;
  }

  await filtrarProdutos();
  atualizarPaginacao();
  return;
} catch (error) {
  console.error(`Erro na tentativa ${attempt}: ${error.message}`);
  if (attempt === maxRetries) {
    console.warn('Usando produtos mock devido a falha na API');
    produtos = mockProdutos;
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
}// Filtrar e exibir produtos
async function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');  if (!gridProdutos || !mensagemVazia) {
    console.error('Elementos de produtos não encontrados');
    return;
  }  console.log('Filtrando produtos:', { categoriaSelecionada, lojaSelecionada, termoBusca });  const produtosFiltrados = produtos.filter((produto) => {
    const matchCategoria =
      categoriaSelecionada === 'todas' ||
      produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
    const matchLoja =
      lojaSelecionada === 'todas' ||
      produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
    const matchBusca =
      !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
    return matchCategoria && matchLoja && matchBusca;
  });  gridProdutos.innerHTML = '';
  if (produtosFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    console.log('Nenhum produto filtrado encontrado');
    return;
  }  mensagemVazia.style.display = 'none';
  gridProdutos.style.display = 'grid';  for (const [produtoIndex, produto] of produtosFiltrados.entries()) {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? produto.imagens.filter(img => typeof img === 'string' && img)
      : ['imagens/placeholder.png'];
    const carrosselId = carrossel-${produtoIndex}-${produto.id || Date.now()};

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
      <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)">◄</button>
      <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)">▶</button>
      <div class="carrossel-dots">
        ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})"></span>`).join('')}
      </div>
    ` : ''}
  </div>
  <span>${produto.nome || 'Produto sem nome'}</span>
  <span class="descricao">Loja: ${produto.loja || 'Desconhecida'}</span>
  <p class="preco"><a href="${produto.link || '#'}" target="_blank" class="ver-preco">Clique aqui para ver o preço</a></p>
  <a href="${produto.link || '#'}" target="_blank" class="ver-na-loja ${produto.loja?.toLowerCase() || 'default'}">Comprar na Loja</a>
`;
gridProdutos.appendChild(produtoDiv);

  }
  console.log(Exibidos ${produtosFiltrados.length} produtos);
}// Funções do carrossel
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');
  let currentIndex = parseInt(imagens.dataset.index || 0);
  const totalImagens = imagens.children.length;  currentIndex = (currentIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    imagens.style.transform = translateX(-${currentIndex * 100}%);
    imagens.dataset.index = currentIndex;
    dots.forEach((dot, i) => dot.classList.toggle('ativa', i === currentIndex));
  });
}function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');  requestAnimationFrame(() => {
    imagens.style.transform = translateX(-${index * 100}%);
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle('ativa', i === index));
  });
}// Funções do modal
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img)
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
  <img src="${img}" alt="Imagem ${i + 1}" class="modal-image" loading="lazy" width="600" height="600" onerror="this.src='imagens/placeholder.png'">
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
  <span class="carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}" onclick="setModalCarrosselImage(${i})"></span>
`).join('');

modal.style.display = 'flex';

  } catch (error) {
    console.error('Erro ao abrir modal:', error);
  }
}function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  const totalImagens = currentImages.length;  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = translateX(-${currentImageIndex * 100}%);
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
  });
}function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  currentImageIndex = index;  requestAnimationFrame(() => {
    carrosselImagens.style.transform = translateX(-${index * 100}%);
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativa', i === currentImageIndex));
  });
}function closeModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  currentImages = [];
  currentImageIndex = 0;
}// Configurar busca
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;  if (!inputBusca || !buscaFeedback) {
    console.error('Elementos de busca não encontrados');
    return;
  }  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();

if (termoBusca) {
  buscaFeedback.style.display = 'block';
  buscaFeedback.textContent = `Buscando por "${termoBusca}"...`;
} else {
  buscaFeedback.style.display = 'none';
}

currentPage = 1;
debounceTimer = setTimeout(() => carregarProdutos(), 300);

  });
}// Configurar paginação
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');  if (!prevButton || !nextButton) {
    console.error('Botões de paginação não encontrados');
    return;
  }  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });  nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(totalProdutos / produtosPorPagina)) {
      currentPage++;
      carregarProdutos();
    }
  });
}function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');  if (!prevButton || !nextButton || !pageInfo) {
    console.error('Elementos de paginação não encontrados');
    return;
  }  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)};
}// Filtrar por categoria
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
  });
  carregarProdutos();
}// Filtrar por loja
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja-todas, .loja').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja.toLowerCase() === loja.toLowerCase());
  });
  carregarProdutos();
}// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando página');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }
});

