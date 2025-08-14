const API_URL = 'https://minha-api-produtos.onrender.com';
let allProducts = [];
let currentPage = 1;
const productsPerPage = 12;

// Conectar ao Socket.IO
const socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 5 });

// Função para embaralhar array (Fisher–Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function carregarProdutos() {
  const grid = document.getElementById('grid-produtos');
  const errorMessage = document.getElementById('error-message');
  const loadingSpinner = document.getElementById('loading-spinner');
  const emptyState = document.getElementById('empty-state');

  if (!grid || !errorMessage || !loadingSpinner || !emptyState) {
    console.error('Elementos do DOM não encontrados');
    return;
  }

  try {
    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';
    emptyState.style.display = 'none';

    const response = await fetch(`${API_URL}/api/produtos`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);

    allProducts = Array.isArray(data) ? data : (data.data || []);

    // embaralhar os produtos
    allProducts = shuffleArray(allProducts);

    currentPage = 1;
    renderizarProdutos();
    renderizarPaginacao();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error.message);
    errorMessage.textContent = `Erro: ${error.message}`;
    errorMessage.style.display = 'block';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

function renderizarProdutos() {
  const grid = document.getElementById('grid-produtos');
  const emptyState = document.getElementById('empty-state');

  grid.innerHTML = '';

  if (allProducts.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const produtosParaMostrar = allProducts.slice(start, end);

  produtosParaMostrar.forEach(produto => {
    const imagem = produto.imagens && produto.imagens[0] 
      ? produto.imagens[0] 
      : 'https://minha-api-produtos.onrender.com/imagens/placeholder.jpg';

    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <img src="${imagem}" alt="${produto.nome}" 
           onerror="this.src='https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'">
      <h3>${produto.nome || 'Sem nome'}</h3>
      <p class="preco">R$ ${produto.preco || '0,00'}</p>
      <a href="${produto.link || '#'}" target="_blank" class="btn-comprar">Comprar</a>
    `;
    grid.appendChild(card);
  });
}

// Renderizar os botões de paginação
function renderizarPaginacao() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const totalPages = Math.ceil(allProducts.length / productsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = (i === currentPage) ? 'pagina ativa' : 'pagina';

    btn.addEventListener('click', () => {
      currentPage = i;
      renderizarProdutos();
      renderizarPaginacao();
    });

    pagination.appendChild(btn);
  }
}

// Eventos do Socket.IO
socket.on('connect', () => console.log('Conectado ao Socket.IO'));
socket.on('novoProduto', () => carregarProdutos());
socket.on('produtoAtualizado', () => carregarProdutos());
socket.on('produtoExcluido', () => carregarProdutos());

// Iniciar
document.addEventListener('DOMContentLoaded', () => {
  console.log('Script do index carregado');
  carregarProdutos();
});
