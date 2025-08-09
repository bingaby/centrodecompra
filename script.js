document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://minha-api-produtos.onrender.com/api';
    const productsGrid = document.getElementById('grid-produtos');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyMessage = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    const loadMoreBtn = document.getElementById('load-more');
    const categoriesSidebar = document.getElementById('categories-sidebar');
    const categoriesToggle = document.getElementById('categories-toggle');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');
    const searchInput = document.getElementById('busca');
    const sortSelect = document.getElementById('sort-select');
    const storesGrid = document.getElementById('stores-grid');
    const categoriesList = document.getElementById('categories-list');

    // Estado da Aplicação
    let currentPage = 1;
    let currentCategory = 'todas';
    let currentStore = 'todas';
    let currentSearchTerm = '';
    const productsPerPage = 12;
    let isLoading = false;
    let hasMoreProducts = true;

    // --- Funções de API ---
    const fetchProducts = async (isNewSearch = false) => {
        if (isNewSearch) {
            currentPage = 1;
            productsGrid.innerHTML = '';
            hasMoreProducts = true;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (isLoading || !hasMoreProducts) return;

        isLoading = true;
        loadingSpinner.style.display = 'block';
        emptyMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        loadMoreBtn.style.display = 'none';

        try {
            const url = new URL(`${apiBaseUrl}/produtos`);
            url.searchParams.append('page', currentPage);
            url.searchParams.append('limit', productsPerPage);
            url.searchParams.append('sort', sortSelect.value);

            if (currentCategory !== 'todas') url.searchParams.append('categoria', currentCategory);
            if (currentStore !== 'todas') url.searchParams.append('loja', currentStore);
            if (currentSearchTerm) url.searchParams.append('busca', currentSearchTerm);

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                renderProducts(data.data, isNewSearch);
                if (data.data.length < productsPerPage || (currentPage * productsPerPage) >= data.total) {
                    hasMoreProducts = false;
                } else {
                    loadMoreBtn.style.display = 'block';
                }
                if (data.total === 0) {
                    emptyMessage.style.display = 'block';
                }
            } else {
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.style.display = 'block';
            console.error('Erro ao buscar produtos:', error);
        } finally {
            isLoading = false;
            loadingSpinner.style.display = 'none';
        }
    };

    // --- Renderização e Eventos ---
    const renderProducts = (products) => {
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-image-container">
                    <img src="${product.imagens[0]}" alt="${product.nome}">
                </div>
                <div class="product-card-content">
                    <h3 class="product-card-title">${product.nome}</h3>
                    <p class="product-card-price">R$ ${parseFloat(product.preco).toFixed(2)}</p>
                    <p class="product-card-store">${product.loja}</p>
                    <a href="${product.link}" target="_blank" class="buy-link"><i class="fas fa-shopping-cart"></i> Comprar</a>
                </div>
                <button class="btn-details" data-id="${product.id}">Detalhes</button>
            `;
            productsGrid.appendChild(card);
        });
    };

    const setupEventListeners = () => {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            fetchProducts();
        });

        // Eventos para filtros e ordenação
        document.querySelectorAll('.store-card').forEach(card => {
            card.addEventListener('click', () => {
                const loja = card.dataset.loja;
                currentStore = loja;
                currentCategory = 'todas';
                fetchProducts(true);
            });
        });

        categoriesList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                currentCategory = e.target.dataset.categoria;
                currentStore = 'todas';
                fetchProducts(true);
                categoriesSidebar.classList.remove('open');
                overlay.classList.remove('visible');
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentSearchTerm = searchInput.value;
                fetchProducts(true);
            }
        });

        sortSelect.addEventListener('change', () => {
            fetchProducts(true);
        });

        // Eventos de navegação e modals
        categoriesToggle.addEventListener('click', () => {
            categoriesSidebar.classList.add('open');
            overlay.classList.add('visible');
        });

        closeSidebarBtn.addEventListener('click', () => {
            categoriesSidebar.classList.remove('open');
            overlay.classList.remove('visible');
        });

        overlay.addEventListener('click', () => {
            categoriesSidebar.classList.remove('open');
            overlay.classList.remove('visible');
        });
    };
    
    // Inicialização da Página
    const init = () => {
        // Gerar categorias e lojas dinamicamente (para facilitar a manutenção)
        const categorias = [
            'todas', 'eletronicos', 'moda', 'casa', 'beleza', 'esportes',
            'livros', 'infantil', 'celulares', 'eletrodomesticos', 'pet',
            'jardinagem', 'automotivo', 'gastronomia', 'games'
        ];
        const lojas = ['todas', 'amazon', 'magalu', 'shein', 'shopee', 'mercadolivre', 'alibaba'];

        categoriesList.innerHTML = categorias.map(c => `<li class="category-item" data-categoria="${c}">${c}</li>`).join('');
        storesGrid.innerHTML = lojas.map(l => `
            <div class="store-card" data-loja="${l}">
                <div class="store-logo">
                    <i class="fas fa-store store-icon"></i>
                </div>
                <div class="store-name">${l}</div>
            </div>
        `).join('');

        setupEventListeners();
        fetchProducts();
        document.getElementById('year').textContent = new Date().getFullYear();
    };

    init();
});
