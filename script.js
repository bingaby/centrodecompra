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
const imageModal = document.getElementById('imageModal');
const modalCarrosselImagens = document.getElementById('modalCarrosselImagens');
const modalCarrosselDots = document.getElementById('modalCarrosselDots');

let produtos = [];
let currentPage = 1;
const productsPerPage = 12;
let currentCategoria = 'todas';
let currentLoja = 'todas';
let currentBusca = '';
let currentImageIndex = 0;

// Função para exibir mensagens de erro
const showError = (message) => {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }, 5000);
};

// Função para carregar produtos do Firestore
const loadProducts = async () => {
  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  productGrid.innerHTML = '';

  try {
    const querySnapshot = await getDocs(collection(db, 'produtos'));
    console.log('Documentos encontrados:', querySnapshot.size); // Depuração
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

// Função para filtrar e exibir produtos
const filterAndDisplayProducts = () => {
  let filteredProducts = produtos;

  // Filtrar por categoria
  if (currentCategoria !== 'todas') {
    filteredProducts = filteredProducts.filter(produto => produto.categoria === currentCategoria);
  }

  // Filtrar por loja
  if (currentLoja !== 'todas') {
    filteredProducts = filteredProducts.filter(produto => produto.loja === currentLoja);
  }

  // Filtrar por busca
  if (currentBusca) {
    filteredProducts = filteredProducts.filter(produto =>
      produto.nome.toLowerCase().includes(currentBusca.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(currentBusca.toLowerCase())
    );
  }

  // Filtrar por "produtos pequenos" (tamanho: 'pequeno')
  filteredProducts = filteredProducts.filter(produto => produto.tamanho === 'pequeno');

  if (filteredProducts.length === 0) {
    mensagemVazia.style.display = 'block';
    productGrid.innerHTML = '';
    updatePagination(0);
    return;
  }

  // Paginação
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = filteredProducts.slice(start, end);

  // Exibir produtos
  productGrid.innerHTML = '';
  paginatedProducts.forEach(produto => {
    const productItem = document.createElement('div');
    productItem.className = 'produto';
    productItem.innerHTML = `
      <h3>${produto.nome}</h3>
      ${produto.imagens && produto.imagens.length > 0 ? `<img src="${produto.imagens[0]}" alt="${produto.nome}" loading="lazy" onclick="openModal(${JSON.stringify(produto.imagens)})">` : ''}
      <p>${produto.descricao.substring(0, 100)}...</p>
      <p>Categoria: ${produto.categoria}</p>
      <p>Tamanho: ${produto.tamanho}</p>
      <p>Preço: R$${produto.preco.toFixed(2)}</p>
      <p>Loja: ${produto.loja}</p>
      <a href="${produto.link}" target="_blank" rel="noopener noreferrer">Comprar</a>
    `;
    productGrid.appendChild(productItem);
  });

  updatePagination(totalPages);
};

// Função para atualizar paginação
const updatePagination = (totalPages) => {
  pageInfo.textContent = `Página ${currentPage}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
};

// Filtros por categoria
window.filtrarPorCategoria = (categoria) => {
  currentCategoria = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`.categoria-item[data-categoria="${categoria}"]`).classList.add('ativa');
  filterAndDisplayProducts();
};

// Filtros por loja
window.filtrarPorLoja = (loja) => {
  currentLoja = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`[data-loja="${loja}"], .loja-todas`).classList.add('ativa');
  filterAndDisplayProducts();
};

// Busca por texto
buscaInput.addEventListener('input', (e) => {
  currentBusca = e.target.value;
  currentPage = 1;
  buscaFeedback.textContent = currentBusca ? `Buscando: ${currentBusca}` : '';
  filterAndDisplayProducts();
});

// Paginação
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

// Funções do modal de imagens
window.openModal = (imagens) => {
  currentImageIndex = 0;
  modalCarrosselImagens.innerHTML = '';
  modalCarrosselDots.innerHTML = '';
  imagens.forEach((img, index) => {
    const imgElement = document.createElement('img');
    imgElement.src = img;
    imgElement.style.display = index === 0 ? 'block' : 'none';
    modalCarrosselImagens.appendChild(imgElement);

    const dot = document.createElement('span');
    dot.className = 'dot' + (index === 0 ? ' active' : '');
    dot.onclick = () => goToImage(index);
    modalCarrosselDots.appendChild(dot);
  });
  imageModal.style.display = 'block';
};

window.closeModal = () => {
  imageModal.style.display = 'none';
};

window.moveModalCarrossel = (direction) => {
  const images = modalCarrosselImagens.querySelectorAll('img');
  images[currentImageIndex].style.display = 'none';
  document.querySelector('.dot.active').classList.remove('active');

  currentImageIndex = (currentImageIndex + direction + images.length) % images.length;

  images[currentImageIndex].style.display = 'block';
  document.querySelectorAll('.dot')[currentImageIndex].classList.add('active');
};

const goToImage = (index) => {
  const images = modalCarrosselImagens.querySelectorAll('img');
  images[currentImageIndex].style.display = 'none';
  document.querySelector('.dot.active').classList.remove('active');

  currentImageIndex = index;

  images[currentImageIndex].style.display = 'block';
  document.querySelectorAll('.dot')[currentImageIndex].classList.add('active');
};

// Carregar produtos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementById('year').textContent = new Date().getFullYear();
});
