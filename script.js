import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const db = window.firebaseDb;
const productGrid = document.getElementById('grid-produtos');
const loadingSpinner = document.getElementById('loading-spinner');
const mensagemVazia = document.getElementById('mensagem-vazia');
const errorMessage = document.getElementById('error-message');
const buscaInput = document.getElementById('busca');
const buscaFeedback = document.getElementById('busca-feedback');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

let produtos = [];
let currentPage = 1;
const productsPerPage = 12;
let currentCategoria = 'todas';
let currentLoja = 'todas';
let currentBusca = '';

const showError = (message) => {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }, 5000);
};

const loadProducts = async () => {
  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  productGrid.innerHTML = '';

  try {
    const querySnapshot = await getDocs(collection(db, 'produtos'));
    console.log('Documentos encontrados:', querySnapshot.size);
    produtos = [];
    querySnapshot.forEach((doc) => {
      const produto = { id: doc.id, ...doc.data() };
      produtos.push(produto);
    });

    if (produtos.length === 0) {
      mensagemVazia.style.display = 'block';
      return;
    }

    filterAndDisplayProducts();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    showError('Erro ao carregar produtos: ' + error.message);
  } finally {
    loadingSpinner.style.display = 'none';
  }
};

const filterAndDisplayProducts = () => {
  let filteredProducts = produtos;

  if (currentCategoria !== 'todas') {
    filteredProducts = filteredProducts.filter(produto => produto.categoria === currentCategoria);
  }

  if (currentLoja !== 'todas') {
    filteredProducts = filteredProducts.filter(produto => produto.loja === currentLoja);
  }

  if (currentBusca) {
    filteredProducts = filteredProducts.filter(produto =>
      produto.nome.toLowerCase().includes(currentBusca.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(currentBusca.toLowerCase())
    );
  }

  // Removido o filtro de tamanho para simplificar
  // filteredProducts = filteredProducts.filter(produto => produto.tamanho === 'pequeno');

  if (filteredProducts.length === 0) {
    mensagemVazia.style.display = 'block';
    productGrid.innerHTML = '';
    updatePagination(0);
    return;
  }

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = filteredProducts.slice(start, end);

  productGrid.innerHTML = '';
  paginatedProducts.forEach(produto => {
    const productItem = document.createElement('div');
    productItem.className = 'produto';
    productItem.innerHTML = `
      <h3>${produto.nome}</h3>
      ${produto.imagens && produto.imagens.length > 0 ? `<img src="${produto.imagens[0]}" alt="${produto.nome}" loading="lazy">` : ''}
      <p>${produto.descricao.substring(0, 100)}...</p>
      <p>Categoria: ${produto.categoria}</p>
      <p>Tamanho: ${produto.tamanho || 'Não especificado'}</p>
      <p>Preço: R$${produto.preco.toFixed(2)}</p>
      <p>Loja: ${produto.loja}</p>
      <a href="${produto.link}" target="_blank" rel="noopener noreferrer">Comprar</a>
    `;
    productGrid.appendChild(productItem);
  });

  updatePagination(totalPages);
};

const updatePagination = (totalPages) => {
  pageInfo.textContent = `Página ${currentPage}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
};

window.filtrarPorCategoria = (categoria) => {
  currentCategoria = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`.categoria-item[data-categoria="${categoria}"]`).classList.add('ativa');
  filterAndDisplayProducts();
};

window.filtrarPorLoja = (loja) => {
  currentLoja = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`[data-loja="${loja}"], .loja-todas`).classList.add('ativa');
  filterAndDisplayProducts();
};

buscaInput.addEventListener('input', (e) => {
  currentBusca = e.target.value;
  currentPage = 1;
  buscaFeedback.textContent = currentBusca ? `Buscando: ${currentBusca}` : '';
  filterAndDisplayProducts();
});

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    filterAndDisplayProducts();
  }
});

nextPageBtn.addEventListener('click', () => {
  currentPage++;
  filterAndDisplayProducts();
});

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementById('year').textContent = new Date().getFullYear();
});
