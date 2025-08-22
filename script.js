const VERSION = "1.0.16"; // Atualizado para nova funcionalidade
const API_URL = 'https://minha-api-produtos.onrender.com';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 18;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";

// Conectar ao Socket.IO
const socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 5 });

// Função para embaralhar array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Troca elementos
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

// Função para carregar produtos
async function carregarProdutos(categoria = "todas", loja = "todas", page = 1, busca = currentSearch) {
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
    if (page === 1) {
        gridProdutos.innerHTML = "";
        allProducts = [];
    }
    mensagemVazia.style.display = "none";
    errorMessage.style.display = "none";
    loadMoreButton.style.display = "none";

    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
        try {
            let url = `${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}`;
            if (categoria !== 'todas') url += `&categoria=${encodeURIComponent(categoria)}`;
            if (loja !== 'todas') url += `&loja=${encodeURIComponent(loja)}`;
            if (busca) url += `&busca=${encodeURIComponent(busca)}`;
            console.log(`Tentativa ${attempt}: Carregando de ${url}`);
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

            // Embaralhar os produtos
            const shuffledProducts = shuffleArray([...data.data]);
            allProducts = [...allProducts, ...shuffledProducts];

            if (allProducts.length === 0) {
                mensagemVazia.style.display = "flex";
                gridProdutos.style.display = "none";
            } else {
                mensagemVazia.style.display = "none";
                gridProdutos.style.display = "grid";

                shuffledProducts.forEach((produto, index) => {
                    if (!produto || typeof produto.nome !== 'string' || !Array.isArray(produto.imagens)) {
                        console.warn('Produto inválido ignorado:', produto);
                        return;
                    }
                    console.log('Renderizando produto:', produto);
                    const card = document.createElement("div");
                    card.classList.add("produto-card", "visible");
                    card.setAttribute("data-categoria", produto.categoria.toLowerCase());
                    card.setAttribute("data-loja", produto.loja.toLowerCase());
                    const globalIndex = allProducts.indexOf(produto);

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
                        <span class="descricao">Loja: ${produto.loja}</span>
                        <a href="${produto.link}" target="_blank" class="tarja-preco tarja-${lojaClass}" aria-label="Clique para ver o preço de ${produto.nome} na loja">
                            <i class="fas fa-shopping-cart"></i> Ver Preço
                        </a>
                    `;
                    gridProdutos.appendChild(card);
                    console.log('Card adicionado:', card.outerHTML);
                });
            }

            console.log('Total de produtos no grid:', allProducts.length);
            loadMoreButton.style.display = data.total > allProducts.length ? "flex" : "none";
            isLoading = false;
            return;
        } catch (error) {
            console.error(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
            if (attempt === maxRetries) {
                errorMessage.style.display = "flex";
                mensagemVazia.style.display = "none";
                gridProdutos.style.display = "none";
                errorMessage.querySelector("p").textContent = `Erro ao carregar os produtos: ${error.message}. Tente novamente mais tarde.`;
            }
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } finally {
            loadingSpinner.style.display = "none";
            isLoading = false;
        }
    }
}

// Função para carregar produtos no admin
async function carregarProdutosAdmin() {
    const tableBody = document.querySelector('.products-table tbody');
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
                <td>${produto.id}</td>
                <td><img src="${produto.imagens[0] || 'https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'}" alt="${produto.nome}" style="width: 50px; height: 50px;" /></td>
                <td>${produto.nome}</td>
                <td>${produto.categoria}</td>
                <td>${produto.loja}</td>
                <td><a href="${produto.link}" target="_blank">Ver</a></td>
                <td class="actions">
                    <button class="btn btn-edit" onclick="editarProduto(${produto.id})"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-delete" onclick="excluirProduto(${produto.id})"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar produtos admin:', error.message, error.stack);
        tableBody.innerHTML = `<tr><td colspan="7">Erro ao carregar produtos: ${error.message}</td></tr>`;
    }
}

// Função para salvar/editar produto
async function salvarProduto(event) {
    event.preventDefault();
    const form = document.getElementById('product-form');
    if (!form) return;

    const formData = new FormData(form);
    const id = form.dataset.id;
    const url = id ? `${API_URL}/api/produtos/${id}` : `${API_URL}/api/produtos`;
    const method = id ? 'PUT' : 'POST';

    const formDataObj = {
        nome: formData.get('nome'),
        preco: formData.get('preco'),
        categoria: formData.get('categoria'),
        loja: formData.get('loja'),
        link: formData.get('link'),
        imagensCount: formData.getAll('imagens').length,
        imagens: formData.getAll('imagens').map(f => f.name)
    };
    console.log('Dados do formulário:', JSON.stringify(formDataObj, null, 2));

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
        feedback.textContent = data.message;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);

        if (data.status === 'success') {
            form.reset();
            delete form.dataset.id;
            carregarProdutosAdmin();
            carregarProdutos('todas', 'todas'); // Forçar atualização no index
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
        const form = document.getElementById('product-form');
        form.dataset.id = id;
        form.querySelector('#nome').value = produto.nome;
        form.querySelector('#categoria').value = produto.categoria;
        form.querySelector('#loja').value = produto.loja;
        form.querySelector('#link').value = produto.link;
        form.querySelector('#preco').value = produto.preco;
    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error.message, error.stack);
        alert('Erro ao carregar produto para edição: ' + error.message);
    }
}

// Função para excluir produto
async function excluirProduto(id) {
    if (!confirm('Deseja realmente excluir este produto?')) return;

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
        feedback.textContent = data.message;
        document.body.appendChild(feedback);
        feedback.style.display = 'block';
        setTimeout(() => feedback.remove(), 3000);

        if (data.status === 'success') {
            carregarProdutosAdmin();
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error.message, error.stack);
        alert('Erro ao excluir produto: ' + error.message);
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

    const produto = allProducts[index];
    if (!produto || !produto.imagens || produto.imagens.length === 0) {
        alert("Nenhuma imagem disponível para este produto.");
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
        alert("Erro ao carregar as imagens. Tente novamente.");
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
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        console.log(`Busca automática disparada: ${currentSearch}`);
        carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    }, 300); // Reduzido para 300ms para maior responsividade

    searchInput.addEventListener("input", debouncedSearch);

    // Suporte ao Enter para busca imediata
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            console.log(`Busca via Enter: ${currentSearch}`);
            carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
        }
    });

    // Limpar resultados quando o campo de busca estiver vazio
    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim() === "") {
            currentSearch = "";
            currentPage = 1;
            console.log("Campo de busca vazio, recarregando todos os produtos");
            carregarProdutos(currentCategory, currentStore, currentPage, "");
        }
    });
}

// Filtros de categoria
document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelector(".category-item.active")?.classList.remove("active");
        item.classList.add("active");
        currentCategory = item.dataset.categoria;
        currentPage = 1;
        currentSearch = ""; // Limpar busca ao mudar categoria
        searchInput.value = ""; // Limpar input de busca
        carregarProdutos(currentCategory, currentStore, currentPage, "");
    });
});

// Filtros de loja
document.querySelectorAll(".store-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelector(".store-card.active")?.classList.remove("active");
        card.classList.add("active");
        currentStore = card.dataset.loja;
        currentPage = 1;
        currentSearch = ""; // Limpar busca ao mudar loja
        searchInput.value = ""; // Limpar input de busca
        carregarProdutos(currentCategory, currentStore, currentPage, "");
    });
});

// Carregar mais produtos
document.getElementById("load-more")?.addEventListener("click", () => {
    currentPage++;
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
});

// Fechar modal
document.getElementById("modal-close")?.addEventListener("click", closeModal);
document.getElementById("modalPrev")?.addEventListener("click", () => moveModalCarrossel(-1));
document.getElementById("modalNext")?.addEventListener("click", () => moveModalCarrossel(1));

// Socket.IO eventos
socket.on('connect', () => console.log('Conectado ao Socket.IO'));
socket.on('disconnect', () => console.log('Desconectado do Socket.IO'));
socket.on('novoProduto', (produto) => {
    console.log('Novo produto detectado:', produto);
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    if (window.location.pathname.includes('admin-xyz-123.html')) {
        carregarProdutosAdmin();
    }
});
socket.on('produtoAtualizado', () => {
    console.log('Produto atualizado, recarregando lista');
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    if (window.location.pathname.includes('admin-xyz-123.html')) {
        carregarProdutosAdmin();
    }
});
socket.on('produtoExcluido', () => {
    console.log('Produto excluído, recarregando lista');
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    if (window.location.pathname.includes('admin-xyz-123.html')) {
        carregarProdutosAdmin();
    }
});

// Função de teste para renderização
async function testarRenderizacao() {
    console.log('Executando teste de renderização');
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '';
    try {
        const response = await fetch('https://minha-api-produtos.onrender.com/api/produtos?page=1&limit=12', {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Dados da API:', data);
        const shuffledData = shuffleArray([...data.data]); // Embaralhar no teste
        shuffledData.forEach(produto => {
            const card = document.createElement('div');
            card.classList.add('produto-card', 'visible');
            card.innerHTML = `
                <img src="${produto.imagens[0]}" alt="${produto.nome}">
                <span>${produto.nome}</span>
                <span>Loja: ${produto.loja}</span>
            `;
            grid.appendChild(card);
            console.log('Card de teste:', card.outerHTML);
        });
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

// Carregar produtos iniciais e verificar conexão
document.addEventListener("DOMContentLoaded", () => {
    console.log(`Iniciando carregamento de produtos - Versão ${VERSION}`);
    checkConnectionStatus();
    currentCategory = 'todas';
    currentStore = 'todas';
    currentSearch = '';
    carregarProdutos('todas', 'todas', 1, '');
    if (window.location.pathname.includes('admin-xyz-123.html')) {
        carregarProdutosAdmin();
        document.getElementById('product-form')?.addEventListener('submit', salvarProduto);
    }
});
