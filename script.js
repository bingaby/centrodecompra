// Configuração da API
const API_CONFIG = {
    BASE_URL: 'https://minha-api-produtos.onrender.com',
    TIMEOUT: 15000
};

// Elementos do DOM
const productsGrid = document.getElementById('grid-produtos');
const loadingSpinner = document.getElementById('loading-spinner');
const emptyState = document.getElementById('mensagem-vazia');
const errorState = document.getElementById('error-message');
const loadMoreBtn = document.getElementById('load-more');
const searchInput = document.getElementById('busca');
const searchSuggestions = document.getElementById('search-suggestions');
const categoriesSidebar = document.getElementById('categories-sidebar');
const categoriesToggle = document.getElementById('categories-toggle');
const closeSidebar = document.getElementById('close-sidebar');
const overlay = document.getElementById('overlay');
const sortSelect = document.getElementById('sort-select');
const viewButtons = document.querySelectorAll('.view-btn');
const imageModal = document.getElementById('imageModal');
const modalCarrosselImagens = document.getElementById('modalCarrosselImagens');
const modalCarrosselDots = document.getElementById('modalCarrosselDots');
const modalPrev = document.getElementById('modalPrev');
const modalNext = document.getElementById('modalNext');
const modalClose = document.getElementById('modal-close');

// Estado da página
let currentPage = 1;
let currentCategoria = 'todas';
let currentLoja = 'todas';
let currentBusca = '';
let currentSort = 'relevance';
let totalProdutos = 0;

// Inicializar Socket.IO
const socket = io(API_CONFIG.BASE_URL);

// Função para buscar produtos
async function fetchProducts(page = 1, reset = false) {
    try {
        loadingSpinner.style.display = 'block';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
        if (reset) {
            currentPage = 1;
            productsGrid.innerHTML = '';
        }

        const params = new URLSearchParams({
            page,
            limit: 12,
            categoria: currentCategoria === 'todas' ? '' : currentCategoria,
            loja: currentLoja === 'todas' ? '' : currentLoja,
            busca: currentBusca,
            sort: currentSort
        });

        const response = await fetch(`${API_CONFIG.BASE_URL}/api/produtos?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: API_CONFIG.TIMEOUT
        });

        const result = await response.json();
        if (result.status === 'success') {
            totalProdutos = result.total;
            displayProducts(result.data, reset);
            updateLoadMoreButton();
        } else {
            showError('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        showError('Não foi possível carregar os produtos. Verifique sua conexão.');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Função para exibir produtos
function displayProducts(produtos, reset = false) {
    if (reset) {
        productsGrid.innerHTML = '';
    }

    if (produtos.length === 0 && currentPage === 1) {
        emptyState.style.display = 'block';
        return;
    }

    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = `product-card ${productsGrid.classList.contains('list-view') ? 'list-view' : ''}`;
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${produto.imagens[0] || 'https://via.placeholder.com/300'}" alt="${produto.nome}" class="product-image" data-images='${JSON.stringify(produto.imagens)}'>
            </div>
            <div class="product-info">
                <h3 class="product-title">${produto.nome}</h3>
                <p class="product-price">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                <p class="product-stats">Visualizações: ${produto.views} | Vendas: ${produto.sales}</p>
                <div class="product-tags">
                    <span class="tag category">${produto.categoria}</span>
                    <span class="tag store">${produto.loja}</span>
                </div>
                <a href="${produto.link}" class="product-link" target="_blank">Ver na Loja</a>
            </div>
        `;
        productsGrid.appendChild(card);

        // Adicionar evento para abrir modal de imagens
        card.querySelector('.product-image').addEventListener('click', () => openImageModal(produto.imagens));
    });

    updateProductGridView();
}

// Função para abrir modal de imagens
function openImageModal(images) {
    if (!images || images.length === 0) return;

    modalCarrosselImagens.innerHTML = '';
    modalCarrosselDots.innerHTML = '';
    let currentIndex = 0;

    images.forEach((image, index) => {
        const imgElement = document.createElement('div');
        imgElement.className = `carousel-image ${index === 0 ? 'active' : ''}`;
        imgElement.innerHTML = `<img src="${image}" alt="Imagem do produto">`;
        modalCarrosselImagens.appendChild(imgElement);

        const dot = document.createElement('span');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToImage(index));
        modalCarrosselDots.appendChild(dot);
    });

    imageModal.style.display = 'block';

    function goToImage(index) {
        document.querySelectorAll('.carousel-image').forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
        document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    modalPrev.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        goToImage(currentIndex);
    });

    modalNext.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        goToImage(currentIndex);
    });

    modalClose.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });
}

// Função para atualizar botão "Carregar Mais"
function updateLoadMoreButton() {
    const productsDisplayed = document.querySelectorAll('.product-card').length;
    loadMoreBtn.style.display = productsDisplayed < totalProdutos ? 'block' : 'none';
}

// Função para exibir erro
function showError(message) {
    errorState.querySelector('h3').textContent = 'Ops! Algo deu errado';
    errorState.querySelector('p').textContent = message;
    errorState.style.display = 'block';
}

// Função para atualizar visualização (grid/list)
function updateProductGridView() {
    const isListView = productsGrid.classList.contains('list-view');
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.toggle('list-view', isListView);
    });
}

// Eventos de filtros e navegação
categoriesToggle.addEventListener('click', () => {
    categoriesSidebar.classList.add('active');
    overlay.style.display = 'block';
});

closeSidebar.addEventListener('click', () => {
    categoriesSidebar.classList.remove('active');
    overlay.style.display = 'none';
});

overlay.addEventListener('click', () => {
    categoriesSidebar.classList.remove('active');
    overlay.style.display = 'none';
});

document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentCategoria = item.dataset.categoria;
        fetchProducts(1, true);
        categoriesSidebar.classList.remove('active');
        overlay.style.display = 'none';
    });
});

document.querySelectorAll('.store-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentLoja = card.dataset.loja;
        fetchProducts(1, true);
    });
});

searchInput.addEventListener('input', () => {
    currentBusca = searchInput.value.trim();
    fetchProducts(1, true);
});

sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    fetchProducts(1, true);
});

viewButtons.forEach(button => {
    button.addEventListener('click', () => {
        viewButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        productsGrid.classList.toggle('list-view', button.dataset.view === 'list');
        updateProductGridView();
    });
});

loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchProducts(currentPage);
});

// Atualizações em tempo real via Socket.IO
socket.on('novoProduto', () => {
    fetchProducts(1, true);
});

socket.on('produtoAtualizado', () => {
    fetchProducts(1, true);
});

socket.on('produtoExcluido', () => {
    fetchProducts(1, true);
});

// Atualizar ano no footer
document.getElementById('year').textContent = new Date().getFullYear();

// Carregar produtos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});
