const VERSION = "1.0.8";
const API_URL = 'https://minha-api-produtos.onrender.com';
let currentPage = 1;
const productsPerPage = 20;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentSearch = "";
let currentSort = "relevance";

// Elementos do DOM
const gridProdutos = document.getElementById('grid-produtos');
const loadMoreBtn = document.getElementById('load-more');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const sidebar = document.querySelector('.sidebar');
const yearSpan = document.getElementById('year');
const categoriasLista = document.querySelector('.category-list');

// Modal de Imagem
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image-display');
const modalCloseBtn = document.querySelector('.close-btn');

// Admin Access (mantido do seu código original)
const logo = document.getElementById("site-logo");
let clickCount = 0, clickTimeout = null;
logo.addEventListener("click", (e) => {
    e.stopPropagation();
    clickCount++;
    if (clickCount === 1) {
        clickTimeout = setTimeout(() => { clickCount = 0; }, 500);
    } else if (clickCount === 3) {
        clearTimeout(clickTimeout);
        window.location.href = "admin-xyz-123.html";
        clickCount = 0;
    }
});

// Funções de Utilitários
const atualizarEstadoPagina = (estado, mensagem = '') => {
    gridProdutos.innerHTML = '';
    loadMoreBtn.style.display = 'none';

    if (estado === 'loading') {
        gridProdutos.innerHTML = `<div class="loading-message"><i class="fas fa-spinner fa-spin"></i><br>Carregando produtos...</div>`;
    } else if (estado === 'error') {
        gridProdutos.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><br>Ocorreu um erro ao carregar os produtos. Tente novamente mais tarde.</div>`;
    } else if (estado === 'no-products') {
        gridProdutos.innerHTML = `<div class="no-products-message"><i class="fas fa-info-circle"></i><br>Nenhum produto encontrado para o termo "${mensagem}".</div>`;
    }
};

const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco);
};

const renderizarProdutos = (produtos) => {
    gridProdutos.innerHTML = '';
    if (produtos.length === 0) {
        atualizarEstadoPagina('no-products', currentSearch);
        return;
    }

    produtos.forEach(produto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${produto.image}" alt="${produto.name}" loading="lazy">
                <span class="store-badge">${produto.store}</span>
            </div>
            <div class="product-details">
                <h3 class="product-name">${produto.name}</h3>
                <div class="price-info">
                    ${produto.old_price ? `<span class="old-price">${formatarPreco(produto.old_price)}</span>` : ''}
                    <span class="current-price">${formatarPreco(produto.price)}</span>
                </div>
            </div>
            <a href="${produto.link}" class="buy-btn" target="_blank">Ver Oferta</a>
        `;

        const productImage = productCard.querySelector('.product-image-container img');
        productImage.addEventListener('click', () => {
            modalImage.src = produto.image;
            imageModal.style.display = 'block';
        });

        gridProdutos.appendChild(productCard);
    });

    if (allProducts.length > currentPage * productsPerPage) {
        loadMoreBtn.style.display = 'block';
    } else {
        loadMoreBtn.style.display = 'none';
    }
};

const filtrarEOrdenarProdutos = () => {
    let produtosFiltrados = allProducts;

    // Filtrar por categoria
    if (currentCategory !== 'todas') {
        produtosFiltrados = produtosFiltrados.filter(p => p.category.toLowerCase() === currentCategory);
    }

    // Filtrar por busca
    if (currentSearch) {
        produtosFiltrados = produtosFiltrados.filter(p =>
            p.name.toLowerCase().includes(currentSearch) ||
            p.store.toLowerCase().includes(currentSearch) ||
            (p.category && p.category.toLowerCase().includes(currentSearch))
        );
    }

    // Ordenar os produtos
    produtosFiltrados.sort((a, b) => {
        switch (currentSort) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'newest':
                return new Date(b.date) - new Date(a.date);
            default:
                return 0; // Relevância
        }
    });

    currentPage = 1;
    renderizarProdutos(produtosFiltrados.slice(0, productsPerPage));
};

const carregarMaisProdutos = () => {
    currentPage++;
    const produtosJaCarregados = document.querySelectorAll('.product-card').length;
    
    // Obtém os produtos que ainda não foram renderizados
    const produtosParaAdicionar = allProducts.slice(produtosJaCarregados, produtosJaCarregados + productsPerPage);

    // Adiciona ao DOM sem renderizar tudo de novo
    produtosParaAdicionar.forEach(produto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${produto.image}" alt="${produto.name}" loading="lazy">
                <span class="store-badge">${produto.store}</span>
            </div>
            <div class="product-details">
                <h3 class="product-name">${produto.name}</h3>
                <div class="price-info">
                    ${produto.old_price ? `<span class="old-price">${formatarPreco(produto.old_price)}</span>` : ''}
                    <span class="current-price">${formatarPreco(produto.price)}</span>
                </div>
            </div>
            <a href="${produto.link}" class="buy-btn" target="_blank">Ver Oferta</a>
        `;
        const productImage = productCard.querySelector('.product-image-container img');
        productImage.addEventListener('click', () => {
            modalImage.src = produto.image;
            imageModal.style.display = 'block';
        });

        gridProdutos.appendChild(productCard);
    });

    if (produtosJaCarregados + productsPerPage >= allProducts.length) {
        loadMoreBtn.style.display = 'none';
    }
};

const carregarProdutosDaApi = async () => {
    atualizarEstadoPagina('loading');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Erro na API');
        }
        allProducts = await response.json();
        filtrarEOrdenarProdutos(); // Exibe os produtos iniciais
    } catch (error) {
        console.error('Falha ao carregar produtos:', error);
        atualizarEstadoPagina('error');
    }
};

// Event Listeners
sidebar.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        e.preventDefault();
        document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
        e.target.closest('.category-item').classList.add('active');
        currentCategory = e.target.dataset.categoria;
        filtrarEOrdenarProdutos();
    }
});

searchBtn.addEventListener('click', () => {
    currentSearch = searchInput.value.toLowerCase().trim();
    filtrarEOrdenarProdutos();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentSearch = searchInput.value.toLowerCase().trim();
        filtrarEOrdenarProdutos();
    }
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filtrarEOrdenarProdutos();
});

loadMoreBtn.addEventListener('click', carregarMaisProdutos);

modalCloseBtn.addEventListener('click', () => {
    imageModal.style.display = "none";
});

window.addEventListener('click', (e) => {
    if (e.target === imageModal) {
        imageModal.style.display = "none";
    }
});

// Inicializa o site
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosDaApi();
    yearSpan.textContent = new Date().getFullYear();
});
