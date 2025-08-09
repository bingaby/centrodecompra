// main-script.js (atualizado)

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
const connectionStatus = document.querySelector('.connection-status');
const statusMessage = document.getElementById('status-message');

// Estado da página
let currentPage = 1;
let currentCategoria = 'todas';
let currentLoja = 'todas';
let currentBusca = '';
let currentSort = 'relevance';
let totalProdutos = 0;

// Inicializar Socket.IO
const socket = io(API_CONFIG.BASE_URL, { transports: ['websocket'] });

// Atualizar status de conexão
function updateConnectionStatus(isOnline) {
    if (connectionStatus) {
        connectionStatus.classList.toggle('online', isOnline);
        connectionStatus.classList.toggle('offline', !isOnline);
        statusMessage.textContent = isOnline ? 'Conectado ao servidor' : 'Sem conexão com o servidor';
        connectionStatus.classList.remove('hidden');
    }
}

// Verificar conexão com a API
async function checkConnection() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
            method: 'GET',
            timeout: 5000
        });
        const result = await response.json();
        updateConnectionStatus(result.status === 'success');
        console.log('Conexão com API:', result);
    } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        updateConnectionStatus(false);
    }
}

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
        console.log('Resposta da API /api/produtos:', result);
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
        updateConnectionStatus(false);
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Função para exibir produtos
function displayProducts(produtos, reset = false) {
    console.log('Exibindo produtos:', produtos);
    if (reset) {
        productsGrid.innerHTML = '';
    }

    if (produtos.length === 0 && currentPage === 1) {
        emptyState.style.display = 'flex';
        return;
    }

    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = `produto-card ${productsGrid.classList.contains('list-view') ? 'list-view' : ''}`;
        card.innerHTML = `
            <div class="carrossel">
                <div class="carrossel-imagens">
                    ${produto.imagens.map(img => `<img src="${img || 'https://via.placeholder.com/300'}" alt="${produto.nome}">`).join('')}
                </div>
                <button class="carrossel-prev"><i class="fas fa-chevron-left"></i></button>
                <button class="carrossel-next"><i class="fas fa-chevron-right"></i></button>
                <div class="carrossel-dots">
                    ${produto.imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}"></span>`).join('')}
                </div>
            </div>
            <h3 class="produto-nome">${produto.nome}</h3>
            <p class="descricao">${produto.descricao || 'Sem descrição'}</p>
            <a href="${produto.link}" class="tarja-preco tarja-${produto.loja}" target="_blank">
                <span>R$ ${parseFloat(produto.preco).toFixed(2)}</span>
                <i class="fas fa-shopping-cart"></i>
            </a>
        `;
        productsGrid.appendChild(card);

        // Configurar carrossel
        const carrossel = card.querySelector('.carrossel-imagens');
        const prevBtn = card.querySelector('.carrossel-prev');
        const nextBtn = card.querySelector('.carrossel-next');
        const dots = card.querySelectorAll('.carrossel-dot');
        let currentImage = 0;

        function updateCarrossel(index) {
            carrossel.style.transform = `translateX(-${index * 100}%)`;
            dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
            currentImage = index;
        }

        prevBtn.addEventListener('click', () => {
            currentImage = (currentImage - 1 + produto.imagens.length) % produto.imagens.length;
            updateCarrossel(currentImage);
        });

        nextBtn.addEventListener('click', () => {
            currentImage = (currentImage + 1) % produto.imagens.length;
            updateCarrossel(currentImage);
        });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => updateCarrossel(i));
        });

        // Abrir modal de imagens
        carrossel.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => openImageModal(produto.imagens));
        });
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
        dot.className = `carrossel-dot ${index === 0 ? 'ativo' : ''}`;
        dot.addEventListener('click', () => goToImage(index));
        modalCarrosselDots.appendChild(dot);
    });

    imageModal.style.display = 'flex';

    function goToImage(index) {
        document.querySelectorAll('.carousel-image').forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
        document.querySelectorAll('.carrossel-dot').forEach((dot, i) => {
            dot.classList.toggle('ativo', i === index);
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
    const productsDisplayed = document.querySelectorAll('.produto-card').length;
    loadMoreBtn.style.display = productsDisplayed < totalProdutos ? 'flex' : 'none';
}

// Função para exibir erro
function showError(message) {
    errorState.querySelector('h3').textContent = 'Ops! Algo deu errado';
    errorState.querySelector('p').textContent = message;
    errorState.style.display = 'flex';
}

// Função para atualizar visualização (grid/list)
function updateProductGridView() {
    const isListView = productsGrid.classList.contains('list-view');
    document.querySelectorAll('.produto-card').forEach(card => {
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
socket.on('connect', () => {
    updateConnectionStatus(true);
    console.log('Socket.IO conectado');
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
    console.log('Socket.IO desconectado');
});

socket.on('novoProduto', (produto) => {
    console.log('Novo produto recebido via Socket.IO:', produto);
    fetchProducts(1, true);
});

// Atualizar ano no footer
document.getElementById('year').textContent = new Date().getFullYear();

// Carregar produtos e verificar conexão ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página principal carregada');
    checkConnection();
    fetchProducts();
    setInterval(checkConnection, 30000); // Verifica conexão a cada 30s
});
