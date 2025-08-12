const VERSION = "1.0.8";
const API_URL = 'https://minha-api-produtos.onrender.com';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 12;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";

document.getElementById("year").textContent = new Date().getFullYear();

// Admin Access
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

// Categories Sidebar Toggle
const categoriesToggle = document.getElementById("categories-toggle");
const categoriesSidebar = document.getElementById("categories-sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const overlay = document.getElementById("overlay");

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

// Função para embaralhar array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load Products
async function carregarProdutos(categoria = "todas", loja = "todas", busca = "", page = 1) {
    const gridProdutos = document.getElementById("grid-produtos");
    const mensagemVazia = document.getElementById("mensagem-vazia");
    const errorMessage = document.getElementById("error-message");
    const loadingSpinner = document.getElementById("loading-spinner");
    const loadMoreButton = document.getElementById("load-more");

    if (isLoading) return;
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
            console.log(`Tentativa ${attempt}: Carregando de ${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}`);
            const response = await fetch(
                `${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}`,
                { cache: "no-store" }
            );
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Resposta vazia'}`);
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.produtos)) {
                throw new Error('Resposta inválida: produtos não é um array');
            }

            const filteredProducts = data.produtos.filter(p =>
                p &&
                typeof p.nome === 'string' &&
                typeof p.categoria === 'string' &&
                typeof p.loja === 'string' &&
                Array.isArray(p.imagens) &&
                (categoria === "todas" || p.categoria.toLowerCase() === categoria.toLowerCase()) &&
                (loja === "todas" || p.loja.toLowerCase() === loja.toLowerCase()) &&
                (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
            );

            // Embaralhar produtos apenas na primeira página
            const productsToRender = page === 1 ? shuffleArray([...filteredProducts]) : filteredProducts;
            allProducts = [...allProducts, ...productsToRender];

            if (allProducts.length === 0) {
                mensagemVazia.style.display = "flex";
                gridProdutos.style.display = "none";
            } else {
                mensagemVazia.style.display = "none";
                gridProdutos.style.display = "grid";
                
                productsToRender.forEach((produto, index) => {
                    const card = document.createElement("div");
                    card.classList.add("produto-card", "visible");
                    card.setAttribute("data-categoria", produto.categoria.toLowerCase());
                    card.setAttribute("data-loja", produto.loja.toLowerCase());
                    const globalIndex = allProducts.indexOf(produto);
                    
                    const imagens = produto.imagens && produto.imagens.length > 0
                        ? produto.imagens.map(img => img.startsWith('http') ? img : `${API_URL}${img}`)
                        : ["https://minha-api-produtos.onrender.com/imagens/placeholder.jpg"];
                    const carrosselId = `carrossel-${globalIndex}`;
                    const lojaClass = produto.loja.toLowerCase();
                    card.innerHTML = `
                        <div class="carrossel" id="${carrosselId}">
                            <div class="carrossel-imagens">
                                ${imagens.map((img, idx) => `<img src="${img}" alt="${produto.nome}" loading="lazy" onerror="this.src='https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'" onclick="event.stopPropagation(); openModal(${globalIndex}, ${idx})">`).join("")}
                            </div>
                            ${imagens.length > 1 ? `
                                <button class="carrossel-prev" onclick="event.stopPropagation(); moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior">◄</button>
                                <button class="carrossel-next" onclick="event.stopPropagation(); moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem">►</button>
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
                });
            }
            
            loadMoreButton.style.display = data.total > allProducts.length ? "flex" : "none";
            isLoading = false;
            return;
        } catch (error) {
            console.error(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
            if (attempt === maxRetries) {
                errorMessage.style.display = "flex";
                mensagemVazia.style.display = "none";
                gridProdutos.style.display = "none";
                errorMessage.querySelector("p").textContent = "Erro ao carregar os produtos. Tente novamente mais tarde.";
            }
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        } finally {
            loadingSpinner.style.display = "none";
            isLoading = false;
        }
    }
}

function carregarMaisProdutos() {
    currentPage++;
    carregarProdutos(currentCategory, currentStore, currentSearch, currentPage);
}

function moveCarrossel(id, direction) {
    const carrossel = document.getElementById(id);
    if (!carrossel) return;
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
    if (!carrossel) return;
    const imagens = carrossel.querySelector(".carrossel-imagens");
    const dots = carrossel.querySelectorAll(".carrossel-dot");
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
}

async function openModal(index, imageIndex) {
    const modal = document.getElementById("imageModal");
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots");
    const prevButton = document.getElementById("modalPrev");
    const nextButton = document.getElementById("modalNext");
    const modalClose = document.getElementById("modal-close");

    if (!modal || !carrosselImagens || !carrosselDots || !prevButton || !nextButton) {
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
        currentImages = produto.imagens.map(img => img.startsWith('http') ? img : `${API_URL}${img}`);
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
        modal.focus();
    } catch (error) {
        console.error("Erro ao abrir modal:", error);
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
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots")?.children;
    if (!carrosselImagens || !carrosselDots) return;

    currentImageIndex = index;
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
}

document.getElementById("modal-close")?.addEventListener("click", () => {
    const modal = document.getElementById("imageModal");
    if (modal) modal.style.display = "none";
});

document.getElementById("modalPrev")?.addEventListener("click", () => moveModalCarrossel(-1));
document.getElementById("modalNext")?.addEventListener("click", () => moveModalCarrossel(1));

function filtrarPorCategoria(categoria) {
    currentCategory = categoria;
    currentPage = 1;
    document.querySelectorAll(".category-item").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-categoria") === categoria);
    });
    carregarProdutos(currentCategory, currentStore, currentSearch);
}

function filtrarPorLoja(loja) {
    currentStore = loja;
    currentPage = 1;
    document.querySelectorAll(".store-card").forEach(item => {
        item.classList.toggle("active", item.getAttribute("data-loja") === loja);
    });
    carregarProdutos(currentCategory, currentStore, currentSearch);
}

document.getElementById("busca").addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentSearch);
});

document.getElementById("sort-select")?.addEventListener("change", (e) => {
    const sortValue = e.target.value;
    allProducts.sort((a, b) => {
        if (sortValue === "price-low") return (a.preco || 0) - (b.preco || 0);
        if (sortValue === "price-high") return (b.preco || 0) - (a.preco || 0);
        if (sortValue === "newest") return new Date(b.data || 0) - new Date(a.data || 0);
        return 0;
    });
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentSearch);
});

document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".view-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const view = btn.getAttribute("data-view");
        const grid = document.getElementById("grid-produtos");
        grid.classList.toggle("list-view", view === "list");
    });
});

function checkConnection() {
    const statusElement = document.createElement("div");
    statusElement.classList.add("connection-status");
    document.body.appendChild(statusElement);

    function updateStatus() {
        const isOnline = navigator.onLine;
        statusElement.classList.toggle("online", isOnline);
        statusElement.classList.toggle("offline", !isOnline);
        statusElement.innerHTML = `
            <div class="status-content">
                <span><i class="fas ${isOnline ? "fa-check-circle" : "fa-exclamation-circle"}"></i> 
                ${isOnline ? "Conectado à Internet" : "Sem conexão com a Internet"}</span>
                <small>${isOnline ? "Você está online!" : "Verifique sua conexão."}</small>
            </div>
        `;
        setTimeout(() => statusElement.remove(), 3000);
    }

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
}

document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();
    checkConnection();
});
