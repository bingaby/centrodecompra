const VERSION = "1.0.22"; // Atualizado após correções de conformidade com AdSense
const API_URL = 'https://minha-api-produtos.onrender.com';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 18;
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";
let totalPages = 1;
let shuffledProducts = [];

// Conectar ao Socket.IO
const socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 5 });

// Mapeamento de categorias para exibição
const categoriaMap = {
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

// Mapeamento de lojas para exibição
const lojaMap = {
    'amazon': 'Amazon',
    'shein': 'Shein',
    'shopee': 'Shopee',
    'magalu': 'Magalu',
    'mercadolivre': 'Mercado Livre',
    'alibaba': 'Alibaba',
    'aliexpress': 'AliExpress'
};

// Função para validar URLs
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Função para embaralhar array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Atualiza o ano no footer
document.getElementById("year").textContent = new Date().getFullYear();

// Alternar sidebar de categorias
const categoriesToggle = document.getElementById("categories-toggle");
const categoriesSidebar = document.getElementById("categories-sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const overlay = document.getElementById("overlay");

if (categoriesToggle && categoriesSidebar && closeSidebar && overlay) {
    categoriesToggle.addEventListener("click", () => {
        categoriesSidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    });

    closeSidebar.addEventListener("click", () => {
        categoriesSidebar.classList.remove("active");
        overlay.classList.remove("active");
    });

    overlay.addEventListener("click", () => {
        categoriesSidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
}

// Debounce para busca
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Função para verificar conexão com a API
function checkConnectionStatus() {
    const statusElement = document.querySelector('.connection-status');
    if (!statusElement) return;

    fetch(`${API_URL}/api/produtos`, { cache: 'no-store' })
        .then(response => {
            statusElement.classList.toggle('online', response.ok);
            statusElement.classList.toggle('offline', !response.ok);
            statusElement.innerHTML = `
                <div class="status-content">
                    <i class="fas fa-${response.ok ? 'check-circle' : 'exclamation-circle'}"></i>
                    <span>API ${response.ok ? 'Online' : 'Offline'}</span>
                    <small>${response.ok ? 'Conectado ao servidor' : 'Verifique sua conexão'}</small>
                </div>`;
        })
        .catch(() => {
            statusElement.classList.add('offline');
            statusElement.classList.remove('online');
            statusElement.innerHTML = `
                <div class="status-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>API Offline</span>
                    <small>Verifique sua conexão</small>
                </div>`;
        });
}

// Função para renderizar controles de paginação
function renderPaginationControls(total) {
    const paginationControls = document.getElementById("pagination-controls");
    if (!paginationControls) return;

    totalPages = Math.ceil(total / productsPerPage);
    paginationControls.innerHTML = "";

    // Botão "Anterior"
    const prevButton = document.createElement("button");
    prevButton.classList.add("pagination-button");
    prevButton.textContent = "Anterior";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
        }
    });
    paginationControls.appendChild(prevButton);

    // Botões de página
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.classList.add("pagination-button");
        pageButton.classList.toggle("active", i === currentPage);
        pageButton.textContent = i;
        pageButton.addEventListener("click", () => {
            currentPage = i;
            carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
        });
        paginationControls.appendChild(pageButton);
    }

    // Botão "Próxima"
    const nextButton = document.createElement("button");
    nextButton.classList.add("pagination-button");
    nextButton.textContent = "Próxima";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
        }
    });
    paginationControls.appendChild(nextButton);
}

// Função para carregar produtos
async function carregarProdutos(categoria = "todas", loja = "todas", page = 1, busca = "") {
    console.log('Iniciando carregarProdutos:', { categoria, loja, page, busca });
    const gridProdutos = document.getElementById("grid-produtos");
    const mensagemVazia = document.getElementById("mensagem-vazia");
    const errorMessage = document.getElementById("error-message");
    const loadingSpinner = document.getElementById("loading-spinner");
    const loadMoreButton = document.getElementById("load-more");

    if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner || !loadMoreButton) {
        console.error("Elementos do DOM não encontrados");
        return;
    }

    if (isLoading) {
        console.log("Carregamento em andamento, ignorando nova requisição.");
        return;
    }
    isLoading = true;

    loadingSpinner.style.display = "block";
    gridProdutos.innerHTML = "";
    mensagemVazia.style.display = "none";
    errorMessage.style.display = "none";
    loadMoreButton.style.display = "none";

    try {
        let url = `${API_URL}/api/produtos?page=1&limit=1000`;
        if (categoria !== 'todas') url = `${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}&categoria=${encodeURIComponent(categoria)}`;
        if (loja !== 'todas') url += `&loja=${encodeURIComponent(loja)}`;
        if (busca) url += `&busca=${encodeURIComponent(busca)}`;
        console.log(`Carregando de ${url}`);

        const response = await fetch(url, {
            cache: "no-store",
            headers: {
                'Accept': 'application/json'
            }
        });
        console.log('Status da resposta:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Resposta vazia'}`);
        }
        const data = await response.json();
        console.log('Resposta da API:', JSON.stringify(data, null, 2));

        if (data.status !== 'success' || !Array.isArray(data.data)) {
            throw new Error(`Resposta inválida: ${data.message || 'Dados não são um array'}`);
        }

        let products = data.data;
        let total = data.total || products.length;

        // Validar links de produtos
        products = products.filter(produto => {
            if (!produto.link || !isValidUrl(produto.link)) {
                console.warn(`Link inválido para o produto: ${produto.nome}`);
                return false;
            }
            return true;
        });

        if (categoria === 'todas' && loja === 'todas' && !busca) {
            shuffledProducts = shuffleArray([...products]);
            total = shuffledProducts.length;
            products = shuffledProducts.slice((page - 1) * productsPerPage, page * productsPerPage);
        } else {
            if (busca) {
                products = products.filter(produto =>
                    produto.nome && produto.nome.toLowerCase().includes(busca.toLowerCase())
                );
                total = products.length;
            }
            products = shuffleArray([...products]).slice(0, productsPerPage);
        }

        if (products.length === 0) {
            mensagemVazia.style.display = "flex";
            gridProdutos.style.display = "none";
            mensagemVazia.querySelector("h3").textContent = busca ? `Nenhum produto encontrado para "${busca}"` : "Nenhum produto disponível no momento";
            mensagemVazia.querySelector("p").textContent = "Tente ajustar os filtros, verificar a conexão ou explorar outras categorias.";
        } else {
            mensagemVazia.style.display = "none";
            gridProdutos.style.display = "grid";

            products.forEach((produto, index) => {
                if (!produto || typeof produto.nome !== 'string' || !Array.isArray(produto.imagens)) {
                    console.warn('Produto inválido ignorado:', produto);
                    return;
                }
                console.log('Renderizando produto:', produto);
                const card = document.createElement("div");
                card.classList.add("produto-card", "visible");
                card.setAttribute("data-categoria", produto.categoria.toLowerCase());
                card.setAttribute("data-loja", produto.loja.toLowerCase());
                const globalIndex = (categoria === 'todas' && loja === 'todas' && !busca)
                    ? (page - 1) * productsPerPage + index
                    : index;

                const imagens = produto.imagens.length > 0
                    ? produto.imagens
                    : ["https://minha-api-produtos.onrender.com/imagens/placeholder.jpg"];
                const carrosselId = `carrossel-${globalIndex}`;
                const lojaClass = produto.loja.toLowerCase();
                card.innerHTML = `
                    <div class="carrossel" id="${carrosselId}">
                        <div class="carrossel-imagens">
                            ${imagens.map((img, idx) => `<img src="${img}" alt="${produto.nome}" loading="lazy" onerror="this.src='https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'" onclick="event.stopPropagation(); openModal(${globalIndex}, ${idx})">`).join("")}
                        </div>
                        ${imagens.length > 1 ? `
                            <button class="carrossel-prev" onclick="event.stopPropagation(); moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior"><i class="fas fa-chevron-left"></i></button>
                            <button class="carrossel-next" onclick="event.stopPropagation(); moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem"><i class="fas fa-chevron-right"></i></button>
                            <div class="carrossel-dots">
                                ${imagens.map((_, idx) => `<span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" onclick="event.stopPropagation(); setCarrosselImage('${carrosselId}', ${idx})" aria-label="Selecionar imagem ${idx + 1}"></span>`).join("")}
                            </div>
                        ` : ""}
                    </div>
                    <span class="produto-nome">${produto.nome}</span>
                    <span class="descricao">Loja: ${lojaMap[produto.loja] || produto.loja}</span>
                    <a href="${produto.link}" target="_blank" class="tarja-preco tarja-${lojaClass}" aria-label="Clique para ver o preço de ${produto.nome} na loja">
                        <i class="fas fa-shopping-cart"></i> Ver Oferta
                    </a>
                `;
                gridProdutos.appendChild(card);
                console.log('Card adicionado:', card.outerHTML);
            });
        }

        renderPaginationControls(total);
        loadMoreButton.style.display = total > page * productsPerPage ? "flex" : "none";
        isLoading = false;
    } catch (error) {
        console.error('Erro ao carregar produtos:', error.message, error.stack);
        errorMessage.style.display = "flex";
        mensagemVazia.style.display = "none";
        gridProdutos.style.display = "none";
        errorMessage.querySelector("p").textContent = `Não foi possível carregar os produtos: ${error.message}.`;
        isLoading = false;
    } finally {
        loadingSpinner.style.display = "none";
    }
}

// Função para carregar produtos no admin
async function carregarProdutosAdmin() {
    const tableBody = document.querySelector('.produtos-table tbody');
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_URL}/api/produtos?page=1&limit=1000`, {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const data = await response.json();
        console.log('Resposta da API (admin):', JSON.stringify(data, null, 2));
        if (data.status !== 'success' || !Array.isArray(data.data)) throw new Error(data.message || 'Resposta inválida');

        tableBody.innerHTML = data.data.map(produto => `
            <tr>
                <td><img src="${produto.imagens[0] || 'https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'}" alt="${produto.nome}" class="produto-imagem" onerror="this.src='https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'" /></td>
                <td>${produto.nome}</td>
                <td>R$ ${produto.preco || '0.00'}</td>
                <td>${categoriaMap[produto.categoria] || produto.categoria}</td>
                <td>${lojaMap[produto.loja] || produto.loja}</td>
                <td><a href="${produto.link}" target="_blank">Link</a></td>
                <td>
                    <button class="btn-editar" onclick="editarProduto('${produto.id}')">Editar</button>
                    <button class="btn-excluir" onclick="excluirProduto('${produto.id}')">Excluir</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar produtos admin:', error.message, error.stack);
        tableBody.innerHTML = `<tr><td colspan="7">Erro ao carregar produtos: ${error.message}</td></tr>`;
    }
}

// Função para salvar/editar produto
const validCategories = [
    'eletronicos',
    'moda',
    'casa-e-decoracao',
    'esportes',
    'beleza',
    'livros',
    'brinquedos',
    'saude',
    'automotivo',
    'alimentos',
    'pet-shop',
    'celulares',
    'eletrodomesticos',
    'infantil'
];

const validStores = [
    'amazon',
    'shein',
    'shopee',
    'magalu',
    'mercadolivre',
    'alibaba',
    'aliexpress'
];

async function salvarProduto(event) {
    event.preventDefault();
    const form = document.getElementById('cadastro-produto');
    if (!form) return;

    const formData = new FormData(form);
    const id = form.dataset.id;
    const url = id ? `${API_URL}/api/produtos/${id}` : `${API_URL}/api/produtos`;
    const method = id ? 'PUT' : 'POST';

    // Validar categoria e loja
    let categoria = formData.get('categoria');
    let loja = formData.get('loja');
    let link = formData.get('link');

    if (!validCategories.includes(categoria)) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = `Categoria inválida: ${categoria}. Escolha uma categoria válida.`;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
        return;
    }

    if (!validStores.includes(loja)) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = `Loja inválida: ${loja}. Escolha uma loja válida.`;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
        return;
    }

    // Validar link
    if (!isValidUrl(link)) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = `Link inválido: ${link}. Insira um URL válido.`;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
        return;
    }

    // Validar imagens
    const imagens = formData.getAll('imagens');
    if (!id && imagens.length === 0) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = 'Selecione pelo menos uma imagem para novos produtos.';
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
        return;
    }
    if (imagens.length > 5) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = 'Máximo de 5 imagens permitido.';
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
        return;
    }

    try {
        console.log(`Enviando para ${url} com método ${method}`);
        const response = await fetch(url, {
            method,
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Resposta:', response.status, JSON.stringify(data, null, 2));

        const feedback = document.createElement('div');
        feedback.className = `feedback-message feedback-${data.status}`;
        feedback.textContent = data.message || (id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);

        if (data.status === 'success') {
            form.reset();
            delete form.dataset.id;
            document.getElementById('submit-btn').textContent = 'Cadastrar Produto';
            carregarProdutosAdmin();
            shuffledProducts = [];
            carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error.message, error.stack);
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = 'Erro ao salvar produto: ' + error.message;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
    }
}

// Função para editar produto
async function editarProduto(id) {
    try {
        const response = await fetch(`${API_URL}/api/produtos/${id}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const data = await response.json();
        console.log('Produto para edição:', JSON.stringify(data, null, 2));
        if (data.status !== 'success' || !data.data) throw new Error('Produto não encontrado');

        const produto = data.data;
        const form = document.getElementById('cadastro-produto');
        form.dataset.id = id;
        form.querySelector('#nome').value = produto.nome || '';
        form.querySelector('#categoria').value = produto.categoria || '';
        form.querySelector('#loja').value = produto.loja || '';
        form.querySelector('#link').value = produto.link || '';
        form.querySelector('#preco').value = produto.preco || '0';
        form.querySelector('#submit-btn').textContent = 'Atualizar Produto';
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error.message, error.stack);
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = 'Erro ao carregar produto: ' + error.message;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
    }
}

// Função para excluir produto
async function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        const response = await fetch(`${API_URL}/api/produtos/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Resposta:', response.status, JSON.stringify(data, null, 2));

        const feedback = document.createElement('div');
        feedback.className = `feedback-message feedback-${data.status}`;
        feedback.textContent = data.message || 'Produto excluído com sucesso!';
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);

        if (data.status === 'success') {
            carregarProdutosAdmin();
            shuffledProducts = [];
            carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error.message, error.stack);
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = 'Erro ao excluir: ' + error.message;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
    }
}

// Funções do carrossel
function moveCarrossel(id, direction) {
    const carrossel = document.getElementById(id);
    if (!carrossel) {
        console.warn(`Carrossel com ID ${id} não encontrado`);
        return;
    }
    const imagens = carrossel.querySelector(".carrossel-imagens");
    const dots = carrossel.querySelectorAll(".carrossel-dot");
    let index = parseInt(imagens.dataset.index || 0);
    const total = imagens.children.length;
    index = (index + direction + total) % total;
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
}

function setCarrosselImage(id, index) {
    const carrossel = document.getElementById(id);
    if (!carrossel) {
        console.warn(`Carrossel com ID ${id} não encontrado`);
        return;
    }
    const imagens = carrossel.querySelector(".carrossel-imagens");
    const dots = carrossel.querySelectorAll(".carrossel-dot");
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
}

// Modal de imagens
async function openModal(index, imageIndex) {
    const modal = document.getElementById("imageModal");
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots");
    const prevButton = document.getElementById("modalPrev");
    const nextButton = document.getElementById("modalNext");
    const modalClose = document.getElementById("modal-close");

    if (!modal || !carrosselImagens || !carrosselDots || !prevButton || !nextButton || !modalClose) {
        console.error("Elementos do modal não encontrados");
        return;
    }

    carrosselImagens.innerHTML = "";
    carrosselDots.innerHTML = "";
    prevButton.classList.remove("visible");
    nextButton.classList.remove("visible");

    const produto = shuffledProducts[index] || (await fetch(`${API_URL}/api/produtos?page=${currentPage}&limit=${productsPerPage}`)
        .then(res => res.json())
        .then(data => data.data[index]));
    if (!produto || !produto.imagens || produto.imagens.length === 0) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = "Nenhuma imagem disponível para este produto.";
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
        return;
    }

    try {
        currentImages = produto.imagens;
        currentImageIndex = Math.max(0, Math.min(imageIndex, currentImages.length - 1));

        const validImages = await Promise.all(currentImages.map(async (img, idx) => {
            try {
                const response = await fetch(img, { method: 'HEAD' });
                return response.ok ? img : 'https://minha-api-produtos.onrender.com/imagens/placeholder.jpg';
            } catch {
                return 'https://minha-api-produtos.onrender.com/imagens/placeholder.jpg';
            }
        }));

        carrosselImagens.innerHTML = validImages.map((img, idx) => 
            `<img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'">`
        ).join("");
        carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

        carrosselDots.innerHTML = validImages.map((_, i) => 
            `<span class="carrossel-dot ${i === currentImageIndex ? "ativo" : ""}" onclick="setModalCarrosselImage(${i})" aria-label="Selecionar imagem ${i + 1}" role="button" tabindex="0"></span>`
        ).join("");

        prevButton.classList.toggle("visible", validImages.length > 1);
        nextButton.classList.toggle("visible", validImages.length > 1);
        modal.style.display = "flex";
        modalClose.focus();
    } catch (error) {
        console.error("Erro ao abrir modal:", error.message, error.stack);
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message feedback-error';
        feedback.textContent = "Erro ao carregar as imagens. Tente novamente.";
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);
    }
}

function moveModalCarrossel(direction) {
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots")?.children;
    if (!carrosselImagens || !carrosselDots || !currentImages.length) return;

    const total = currentImages.length;
    currentImageIndex = (currentImageIndex + direction + total) % total;
    
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
}

function setModalCarrosselImage(index) {
    if (index < 0 || index >= currentImages.length) return;
    
    currentImageIndex = index;
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots")?.children;
    if (!carrosselImagens || !carrosselDots) return;
    
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === index));
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
        modal.style.display = "none";
    }
}

// Eventos de busca
const searchInput = document.getElementById("busca");
if (searchInput) {
    const debouncedSearch = debounce(() => {
        current
