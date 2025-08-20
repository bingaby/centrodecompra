// Configurações iniciais
const API_URL = 'https://minha-api-produtos.onrender.com/api/produtos';
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let currentCategoria = 'todas';
let currentLoja = 'todas';
let currentBusca = '';
let totalItems = 0;

// Mapeamento de categorias para exibição
const categoriaMap = {
    'todas': 'Todas',
    'eletronicos': 'Eletrônicos',
    'moda': 'Moda',
    'casa-e-decoracao': 'Casa e Decoração',
    'esportes': 'Esportes',
    'beleza': 'Beleza',
    'livros': 'Livros',
    'brinquedos': 'Brinquedos',
    'saude': 'Saúde',
    'automotivo': 'Automotivo',
    'alimentos': 'Alimentos',
    'pet-shop': 'Pet Shop',
    'celulares': 'Celulares',
    'eletrodomesticos': 'Eletrodomésticos',
    'infantil': 'Infantil'
};

// Função para carregar produtos da API
async function carregarProdutos(page = 1, reset = false) {
    console.log('Iniciando carregamento de produtos...');
    const loadingSpinner = document.getElementById('loading-spinner');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    const gridProdutos = document.getElementById('grid-produtos');

    loadingSpinner.style.display = 'flex';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';
    if (reset) gridProdutos.innerHTML = '';

    try {
        const params = new URLSearchParams({
            page,
            limit: ITEMS_PER_PAGE,
            categoria: currentCategoria !== 'todas' ? currentCategoria : '',
            loja: currentLoja !== 'todas' ? currentLoja : '',
            busca: currentBusca
        });
        const response = await fetch(`${API_URL}?${params}`);
        if (!response.ok) throw new Error('Erro na API');
        const { data, total } = await response.json();
        totalItems = total;

        if (data.length === 0) {
            mensagemVazia.style.display = 'flex';
            return;
        }

        data.forEach(produto => {
            adicionarProduto(produto);
        });

        atualizarPaginacao();
        atualizarBotaoCarregarMais();
        console.log('Produtos carregados com sucesso.');
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        errorMessage.style.display = 'flex';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Função para adicionar um produto ao grid
function adicionarProduto(produto) {
    const gridProdutos = document.getElementById('grid-produtos');
    const card = document.createElement('div');
    card.classList.add('produto-card');
    card.dataset.imagens = JSON.stringify(produto.imagens || []);

    const imagens = produto.imagens && produto.imagens.length > 0 ? produto.imagens : ['logos/placeholder.png'];
    const carrossel = `
        <div class="carrossel">
            <div class="carrossel-imagens">
                ${imagens.map(img => `<img src="${img}" alt="${produto.nome}" loading="lazy">`).join('')}
            </div>
            ${imagens.length > 1 ? `
                <button class="carrossel-prev"><i class="fas fa-chevron-left"></i></button>
                <button class="carrossel-next"><i class="fas fa-chevron-right"></i></button>
                <div class="carrossel-dots">
                    ${imagens.map((_, index) => `<span class="carrossel-dot ${index === 0 ? 'ativo' : ''}"></span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    card.innerHTML = `
        ${carrossel}
        <a href="${produto.link}" target="_blank" class="produto-nome">${produto.nome}</a>
        <span class="descricao">Loja: ${produto.loja.charAt(0).toUpperCase() + produto.loja.slice(1)}</span>
        <a href="${produto.link}" target="_blank" class="tarja-preco tarja-${produto.loja}">Clique para ver o preço</a>
    `;
    gridProdutos.appendChild(card);
    console.log('Card adicionado:', produto.nome);

    if (imagens.length > 1) {
        inicializarCarrossel(card);
    }
}

// Função para inicializar o carrossel de imagens no cartão
function inicializarCarrossel(card) {
    const carrosselImagens = card.querySelector('.carrossel-imagens');
    const prevBtn = card.querySelector('.carrossel-prev');
    const nextBtn = card.querySelector('.carrossel-next');
    const dots = card.querySelectorAll('.carrossel-dot');
    let currentIndex = 0;

    function atualizarCarrossel() {
        carrosselImagens.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach(d => d.classList.remove('ativo'));
        dots[currentIndex].classList.add('ativo');
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            atualizarCarrossel();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < dots.length - 1) {
            currentIndex++;
            atualizarCarrossel();
        }
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            atualizarCarrossel();
        });
    });
}

// Função para abrir o modal de imagens
function abrirModal(imagens) {
    const modal = document.getElementById('imageModal');
    const modalImagens = document.getElementById('modalCarrosselImagens');
    const modalDots = document.getElementById('modalCarrosselDots');
    modalImagens.innerHTML = '';
    modalDots.innerHTML = '';
    let currentIndex = 0;

    imagens.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = img || 'logos/placeholder.png';
        imgElement.alt = 'Imagem do produto';
        imgElement.loading = 'lazy';
        modalImagens.appendChild(imgElement);

        const dot = document.createElement('span');
        dot.classList.add('carousel-dot');
        if (index === 0) dot.classList.add('ativo');
        dot.addEventListener('click', () => {
            currentIndex = index;
            modalImagens.style.transform = `translateX(-${currentIndex * 100}%)`;
            modalDots.querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('ativo'));
            dot.classList.add('ativo');
        });
        modalDots.appendChild(dot);
    });

    modal.classList.add('active');
    modalImagens.style.transform = `translateX(0%)`;

    document.getElementById('modalPrev').onclick = () => {
        if (currentIndex > 0) {
            currentIndex--;
            modalImagens.style.transform = `translateX(-${currentIndex * 100}%)`;
            modalDots.querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('ativo'));
            modalDots.children[currentIndex].classList.add('ativo');
        }
    };

    document.getElementById('modalNext').onclick = () => {
        if (currentIndex < modalImagens.children.length - 1) {
            currentIndex++;
            modalImagens.style.transform = `translateX(-${currentIndex * 100}%)`;
            modalDots.querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('ativo'));
            modalDots.children[currentIndex].classList.add('ativo');
        }
    };
}

// Função para fechar o modal
function fecharModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
}

// Função para atualizar a paginação
function atualizarPaginacao() {
    const paginationControls = document.getElementById('pagination-controls');
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.classList.add('pagination-button');
        if (i === currentPage) button.classList.add('active');
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage = i;
            carregarProdutos(currentPage, true);
        });
        paginationControls.appendChild(button);
    }
}

// Função para atualizar o botão "Carregar Mais"
function atualizarBotaoCarregarMais() {
    const loadMoreBtn = document.getElementById('load-more');
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    loadMoreBtn.style.display = currentPage < totalPages ? 'inline-flex' : 'none';
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script inicializado.');

    // Carregar produtos iniciais
    carregarProdutos();

    // Sidebar
    const categoriesToggle = document.getElementById('categories-toggle');
    const categoriesSidebar = document.getElementById('categories-sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');

    categoriesToggle.addEventListener('click', () => {
        categoriesSidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        categoriesSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
        categoriesSidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Filtros de categoria
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            currentCategoria = item.dataset.categoria;
            currentPage = 1;
            carregarProdutos(currentPage, true);
            categoriesSidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.getElementById('ofertas-titulo').textContent = `Ofertas em ${categoriaMap[currentCategoria]}`;
        });
    });

    // Filtros de loja
    document.querySelectorAll('.store-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentLoja = card.dataset.loja;
            currentPage = 1;
            carregarProdutos(currentPage, true);
        });
    });

    // Busca
    document.getElementById('busca').addEventListener('input', (e) => {
        currentBusca = e.target.value.trim();
        currentPage = 1;
        carregarProdutos(currentPage, true);
    });

    // Carregar mais produtos
    document.getElementById('load-more').addEventListener('click', () => {
        currentPage++;
        carregarProdutos(currentPage);
    });

    // Abrir modal ao clicar na imagem
    document.addEventListener('click', (event) => {
        if (event.target.closest('.carrossel-imagens img')) {
            const card = event.target.closest('.produto-card');
            const imagens = JSON.parse(card.dataset.imagens || '[]');
            abrirModal(imagens);
        }
    });

    // Fechar modal
    document.getElementById('modal-close').addEventListener('click', fecharModal);
    document.querySelector('.modal-backdrop').addEventListener('click', fecharModal);

    // Fechar modal com Esc
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            fecharModal();
        }
    });
});
