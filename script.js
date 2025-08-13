const VERSION = "1.0.11";
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

// Atualiza o ano no footer
document.getElementById("year").textContent = new Date().getFullYear();

// Alternar sidebar de categorias
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

// Debounce para busca
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Função para carregar produtos
async function carregarProdutos(categoria = "todas", loja = "todas", busca = "", page = 1) {
    const gridProdutos = document.getElementById("grid-produtos");
    const mensagemVazia = document.getElementById("mensagem-vazia");
    const errorMessage = document.getElementById("error-message");
    const loadingSpinner = document.getElementById("loading-spinner");
    const loadMoreButton = document.getElementById("load-more");

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
            console.log('Resposta da API:', data);

            if (!data || !Array.isArray(data.produtos)) {
                throw new Error('Resposta inválida: produtos não é um array');
            }

            const filteredProducts = data.produtos.filter(p => {
                if (!p || typeof p.nome !== 'string' || typeof p.categoria !== 'string' || typeof p.loja !== 'string' || !Array.isArray(p.imagens)) {
                    console.warn('Produto inválido ignorado:', p);
                    return false;
                }
                return (
                    (categoria === "todas" || p.categoria.toLowerCase() === categoria.toLowerCase()) &&
                    (loja === "todas" || p.loja.toLowerCase() === loja.toLowerCase()) &&
                    (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
                );
            });
            console.log('Produtos filtrados:', filteredProducts);

            allProducts = [...allProducts, ...filteredProducts];

            if (allProducts.length === 0) {
                mensagemVazia.style.display = "flex";
                gridProdutos.style.display = "none";
            } else {
                mensagemVazia.style.display = "none";
                gridProdutos.style.display = "grid";

                filteredProducts.forEach((produto, index) => {
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

// Carregar mais produtos
function carregarMaisProdutos() {
    currentPage++;
    carregarProdutos(currentCategory, currentStore, currentSearch, currentPage);
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
        modal.querySelector(".modal-close").focus();
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
const searchButton = document.querySelector(".search-btn");
const debouncedSearch = debounce(() => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentSearch);
}, 500);

searchInput.addEventListener("input", debouncedSearch);
searchButton.addEventListener("click", () => {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentSearch);
});

// Filtros de categoria
document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelector(".category-item.active")?.classList.remove("active");
        item.classList.add("active");
        currentCategory = item.dataset.categoria;
        currentPage = 1;
        carregarProdutos(currentCategory, currentStore, currentSearch);
        categoriesSidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
});

// Filtros de loja
document.querySelectorAll(".store-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelector(".store-card.active")?.classList.remove("active");
        card.classList.add("active");
        currentStore = card.dataset.loja;
        currentPage = 1;
        carregarProdutos(currentCategory, currentStore, currentSearch);
    });
});

// Carregar mais produtos
document.getElementById("load-more").addEventListener("click", carregarMaisProdutos);

// Fechar modal
document.getElementById("modal-close")?.addEventListener("click", closeModal);
document.getElementById("modalPrev")?.addEventListener("click", () => moveModalCarrossel(-1));
document.getElementById("modalNext")?.addEventListener("click", () => moveModalCarrossel(1));

// Carregar produtos iniciais
document.addEventListener("DOMContentLoaded", () => {
    console.log(`Iniciando carregamento de produtos - Versão ${VERSION}`);
    carregarProdutos();
});
