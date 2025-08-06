const API_CONFIG = {
  REAL_API: "https://minha-api-produtos.onrender.com",
  USE_LOCAL_DATA: false,
  ADMIN_TOKEN: "098457098457",
};

// Dados de exemplo para modo offline
const SAMPLE_PRODUCTS = [
  {
    id: 1,
    nome: "Smartphone Samsung Galaxy A54 128GB",
    descricao: "Smartphone com tela de 6.4 polegadas, câmera tripla de 50MP e bateria de 5000mAh.",
    preco: 1299.99,
    categoria: "eletronicos",
    loja: "amazon",
    link: "https://amazon.com.br/produto-exemplo",
    imagens: ["https://placeholder.co/300x200/f0f0f0/999999?text=Samsung+Galaxy+A54"],
    views: 0,
    sales: 0,
  },
  {
    id: 2,
    nome: "Tênis Nike Air Max 270 Masculino",
    descricao: "Tênis esportivo com tecnologia Air Max, conforto e estilo para o dia a dia.",
    preco: 599.9,
    categoria: "moda",
    loja: "mercadolivre",
    link: "https://mercadolivre.com.br/produto-exemplo",
    imagens: ["https://placeholder.co/300x200/ff6b35/ffffff?text=Nike+Air+Max+270"],
    views: 0,
    sales: 0,
  },
  {
    id: 3,
    nome: "Ração para Cães 10kg",
    descricao: "Ração premium para cães adultos, com nutrientes balanceados e alta digestibilidade.",
    preco: 149.9,
    categoria: "pet",
    loja: "amazon",
    link: "https://amazon.com.br/produto-exemplo",
    imagens: ["https://placeholder.co/300x200/8b4513/ffffff?text=Racao+Cachorro"],
    views: 0,
    sales: 0,
  },
];

let currentPage = 1;
let allProducts = [];
let isLoading = false;
let currentImageIndex = 0;
let currentModalImages = [];

function createImagePlaceholder(width = 300, height = 200, text = "Produto") {
  return `https://placeholder.co/${width}x${height}/f0f0f0/999999?text=${encodeURIComponent(text)}`;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Iniciando Centro de Compras...");
  if (API_CONFIG.USE_LOCAL_DATA) {
    console.log("📱 Modo OFFLINE ativado - usando dados locais");
    showConnectionStatus("offline");
  } else {
    console.log("🌐 Conectando com API:", API_CONFIG.REAL_API);
    testApiConnection();
  }

  initializeHeader();
  initializeSidebar();
  initializeSearch();
  initializeFilters();
  initializeModal();
  loadProducts();
  updateFooterYear();
  setupLazyLoading();
  setupServiceWorker();
});

async function testApiConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${API_CONFIG.REAL_API}/api/health`, {
      method: "GET",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("✅ API conectada com sucesso!");
      showConnectionStatus("online");
    } else {
      throw new Error(`API retornou status ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Erro na conexão com API:", error.message);
    API_CONFIG.USE_LOCAL_DATA = true;
    showConnectionStatus("offline");
  }
}

function showConnectionStatus(status) {
  const existingStatus = document.querySelector(".connection-status");
  if (existingStatus) existingStatus.remove();

  const statusDiv = document.createElement("div");
  statusDiv.className = `connection-status ${status}`;
  statusDiv.innerHTML = `
    <div class="status-content">
      <i class="fas fa-${status === "online" ? "wifi" : "exclamation-triangle"}"></i>
      <span>${status === "online" ? "Conectado ao servidor" : "Modo offline - dados de exemplo"}</span>
      ${status === "offline" ? "<small>Verifique sua conexão com a internet</small>" : ""}
    </div>
  `;
  document.body.appendChild(statusDiv);
  setTimeout(() => statusDiv.remove(), 5000);
}

function initializeHeader() {
  const logo = document.getElementById("site-logo");
  if (logo) {
    let clickCount = 0;
    let clickTimeout = null;
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      clickCount++;
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => clickCount = 0, 1000);
      } else if (clickCount === 3) {
        clearTimeout(clickTimeout);
        window.location.href = "/admin-xyz-123.html";
        clickCount = 0;
      }
    });
  }

  const searchBtn = document.querySelector(".search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchInput = document.getElementById("busca");
      if (searchInput && searchInput.value.trim()) {
        loadProducts(1, false);
      }
    });
  }
}

function initializeSidebar() {
  const categoriesBtn = document.getElementById("categories-toggle");
  const sidebar = document.getElementById("categories-sidebar");
  const overlay = document.getElementById("overlay");
  const closeSidebar = document.getElementById("close-sidebar");

  if (categoriesBtn && sidebar && overlay) {
    categoriesBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    const closeSidebarHandler = () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    };

    if (closeSidebar) closeSidebar.addEventListener("click", closeSidebarHandler);
    overlay.addEventListener("click", closeSidebarHandler);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("active")) {
        closeSidebarHandler();
      }
    });

    const categoryItems = document.querySelectorAll(".category-item");
    categoryItems.forEach((item) => {
      item.addEventListener("click", () => {
        categoryItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        filterByCategory(item.dataset.categoria);
        closeSidebarHandler();
      });
    });
  }
}

function initializeSearch() {
  const searchInput = document.getElementById("busca");
  if (searchInput) {
    const debouncedSearch = debounce(() => loadProducts(1, false), 500);
    searchInput.addEventListener("input", debouncedSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loadProducts(1, false);
      }
    });
  }
}

function initializeFilters() {
  const storeCards = document.querySelectorAll(".store-card");
  storeCards.forEach((card) => {
    card.addEventListener("click", () => {
      storeCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      filterByStore(card.dataset.loja);
    });
  });

  const viewBtns = document.querySelectorAll(".view-btn");
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      const productsGrid = document.getElementById("grid-produtos");
      if (productsGrid) {
        productsGrid.className = view === "list" ? "products-list" : "products-grid";
      }
    });
  });

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => loadProducts(1, false));
  }

  const loadMoreBtn = document.getElementById("load-more");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => loadProducts(currentPage + 1, true));
  }
}

function initializeModal() {
  const modal = document.getElementById("imageModal");
  const modalClose = document.getElementById("modal-close");
  const modalBackdrop = document.querySelector(".modal-backdrop");

  if (modal && modalClose && modalBackdrop) {
    const closeModal = () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    };

    modalClose.addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
      if (modal.style.display === "flex") {
        switch (e.key) {
          case "Escape":
            closeModal();
            break;
          case "ArrowLeft":
            window.moveModalCarousel(-1);
            break;
          case "ArrowRight":
            window.moveModalCarousel(1);
            break;
        }
      }
    });
  }

  const modalPrev = document.getElementById("modalPrev");
  const modalNext = document.getElementById("modalNext");
  if (modalPrev) modalPrev.addEventListener("click", () => window.moveModalCarousel(-1));
  if (modalNext) modalNext.addEventListener("click", () => window.moveModalCarousel(1));
}

async function incrementProductView(productId) {
  if (API_CONFIG.USE_LOCAL_DATA) return;
  try {
    await fetch(`${API_CONFIG.REAL_API}/api/produtos/${productId}/view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_CONFIG.ADMIN_TOKEN}`,
      },
    });
    console.log(`👁️ Visualização incrementada para produto ${productId}`);
  } catch (error) {
    console.error("Erro ao incrementar visualização:", error);
  }
}

async function loadProducts(page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;

  const categoria = document.querySelector(".category-item.active")?.dataset.categoria || "todas";
  const loja = document.querySelector(".store-card.active")?.dataset.loja || "todas";
  const busca = document.getElementById("busca")?.value.trim() || "";
  const sort = document.getElementById("sort-select")?.value || "relevance";

  const spinner = document.getElementById("loading-spinner");
  const gridProdutos = document.getElementById("grid-produtos");
  const mensagemVazia = document.getElementById("mensagem-vazia");
  const errorMessage = document.getElementById("error-message");
  const loadMoreButton = document.getElementById("load-more");

  if (spinner) spinner.style.display = "block";
  if (!append && gridProdutos) gridProdutos.innerHTML = "";
  if (mensagemVazia) mensagemVazia.style.display = "none";
  if (errorMessage) errorMessage.style.display = "none";
  if (loadMoreButton) loadMoreButton.style.display = "none";

  try {
    let data, total;

    if (API_CONFIG.USE_LOCAL_DATA) {
      const result = getLocalProducts(page, categoria, loja, busca, sort);
      data = result.data;
      total = result.total;
      console.log(`📱 Dados locais: ${data.length} produtos de ${total} total`);
    } else {
      const url = buildApiUrl(page, categoria, loja, busca, sort);
      console.log("🌐 Fazendo requisição para:", url);

      const cacheKey = `produtos_page_${page}_${categoria}_${loja}_${busca}_${sort}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { data: cachedProducts, total: cachedTotal, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) { // Cache válido por 24 horas
          data = cachedProducts;
          total = cachedTotal;
          console.log(`🗃️ Usando cache para página ${page}`);
        }
      }

      if (!data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status} - ${await response.text()}`);
        const result = await response.json();
        if (result.status !== "success") throw new Error(result.message || "Erro na resposta da API");

        data = result.data || [];
        total = result.total || data.length;
        console.log(`🌐 API: ${data.length} produtos de ${total} total`);

        localStorage.setItem(cacheKey, JSON.stringify({ data, total, timestamp: Date.now() }));
      }
    }

    if (!append) allProducts = [];
    allProducts.push(...data);

    if (allProducts.length === 0) {
      showEmptyState();
    } else {
      renderProducts(data, append);
      if (loadMoreButton && allProducts.length < total) {
        loadMoreButton.style.display = "flex";
      }
    }

    currentPage = page;
    updateResultsTitle(categoria, loja, busca, allProducts.length, total);
    console.log(`✅ Carregados ${data.length} produtos (${allProducts.length} de ${total} total)`);
  } catch (error) {
    console.error("❌ Erro ao carregar produtos:", error);
    if (!API_CONFIG.USE_LOCAL_DATA) {
      console.log("🔄 Tentando fallback para dados locais...");
      API_CONFIG.USE_LOCAL_DATA = true;
      showConnectionStatus("offline");
      loadProducts(page, append);
      return;
    }
    showErrorState(error.message);
  } finally {
    if (spinner) spinner.style.display = "none";
    isLoading = false;
  }
}

function getLocalProducts(page = 1, categoria = "todas", loja = "todas", busca = "", sort = "relevance") {
  let filteredProducts = [...SAMPLE_PRODUCTS];

  if (categoria !== "todas") {
    filteredProducts = filteredProducts.filter((p) => p.categoria === categoria);
  }

  if (loja !== "todas") {
    filteredProducts = filteredProducts.filter((p) => p.loja === loja);
  }

  if (busca) {
    filteredProducts = filteredProducts.filter((p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao.toLowerCase().includes(busca.toLowerCase())
    );
  }

  if (sort === "price-low") {
    filteredProducts.sort((a, b) => a.preco - b.preco);
  } else if (sort === "price-high") {
    filteredProducts.sort((a, b) => b.preco - a.preco);
  } else if (sort === "newest") {
    filteredProducts.sort((a, b) => b.id - a.id);
  }

  const start = (page - 1) * 12;
  const end = start + 12;
  return {
    data: filteredProducts.slice(start, end),
    total: filteredProducts.length,
  };
}

function buildApiUrl(page, categoria, loja, busca, sort) {
  let url = `${API_CONFIG.REAL_API}/api/produtos?page=${page}&limit=12`;
  if (categoria && categoria !== "todas") url += `&categoria=${encodeURIComponent(categoria)}`;
  if (loja && loja !== "todas") url += `&loja=${encodeURIComponent(loja)}`;
  if (busca) url += `&busca=${encodeURIComponent(busca)}`;
  if (sort && sort !== "relevance") url += `&sort=${sort}`;
  return url;
}

function renderProducts(products, append = false) {
  const gridProdutos = document.getElementById("grid-produtos");
  if (!gridProdutos) return;

  const viewType = document.querySelector(".view-btn.active")?.dataset.view || "grid";
  if (!append) gridProdutos.innerHTML = "";

  products.forEach((produto, index) => {
    const card = createProductCard(produto);
    card.style.animationDelay = `${index * 0.1}s`;
    card.className = viewType === "grid" ? "product-card" : "product-card list-view";
    gridProdutos.appendChild(card);
  });

  gridProdutos.style.display = viewType === "list" ? "block" : "grid";
}

function createProductCard(produto) {
  const card = document.createElement("div");
  card.setAttribute("data-categoria", produto.categoria.toLowerCase());
  card.setAttribute("data-loja", produto.loja.toLowerCase());

  let imagens = [];
  if (Array.isArray(produto.imagens)) {
    imagens = produto.imagens;
  } else if (typeof produto.imagens === "string") {
    try {
      imagens = JSON.parse(produto.imagens);
    } catch (e) {
      imagens = [produto.imagens];
    }
  }
  if (imagens.length === 0) {
    imagens = [createImagePlaceholder(300, 200, produto.nome)];
  }

  const carrosselId = `carrossel-${produto.id}`;
  const lojaClass = `tarja-${produto.loja.toLowerCase().replace(/\s/g, "")}`;

  card.innerHTML = `
    <div class="product-image">
      <div class="image-carousel" id="${carrosselId}">
        <div class="carousel-images" data-id="${produto.id}" data-index="0">
          ${imagens
            .map(
              (img, idx) => `
            <img src="${img}" 
                 alt="${produto.nome} - Imagem ${idx + 1}" 
                 class="${idx === 0 ? 'active' : ''}" 
                 loading="lazy" 
                 onerror="this.src='${createImagePlaceholder(300, 200, produto.nome)}'"
                 onclick="window.openModal('${produto.id}', ${idx})">
          `,
            )
            .join("")}
        </div>
        ${
          imagens.length > 1
            ? `
            <button class="carousel-btn prev" data-id="${produto.id}" aria-label="Imagem anterior">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="carousel-btn next" data-id="${produto.id}" aria-label="Próxima imagem">
              <i class="fas fa-chevron-right"></i>
            </button>
            <div class="carousel-dots">
              ${imagens
                .map(
                  (_, idx) => `
                <span class="dot ${idx === 0 ? 'active' : ''}" 
                      data-index="${idx}" 
                      aria-label="Selecionar imagem ${idx + 1}"></span>
              `,
                )
                .join("")}
            </div>
          `
            : ""
        }
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-title">${produto.nome}</h3>
      <p class="product-description">${produto.descricao.slice(0, 100)}${produto.descricao.length > 100 ? "..." : ""}</p>
      <div class="product-price preco-link" data-preco="${Number.parseFloat(produto.preco).toFixed(2)}">
        <i class="fas fa-eye"></i>
        <span>Clique para ver o preço</span>
      </div>
      <div class="product-meta">
        <span class="store">${produto.loja.charAt(0).toUpperCase() + produto.loja.slice(1)}</span>
        <span class="category">${produto.categoria.charAt(0).toUpperCase() + produto.categoria.slice(1)}</span>
      </div>
      <a href="${produto.link}" 
         target="_blank" 
         class="btn-primary buy-btn ${lojaClass}" 
         aria-label="Comprar ${produto.nome} na ${produto.loja}"
         rel="noopener noreferrer">
        <i class="fas fa-shopping-cart"></i>
        Comprar Agora
      </a>
    </div>
  `;

  const precoLink = card.querySelector(".preco-link");
  precoLink.addEventListener("click", () => {
    const preco = precoLink.getAttribute("data-preco");
    precoLink.innerHTML = `
      <i class="fas fa-dollar-sign"></i>
      <span>R$ ${preco}</span>
    `;
    precoLink.classList.add("price-revealed");
    precoLink.style.cursor = "default";
  });

  if (imagens.length > 1) {
    const carousel = card.querySelector(`.carousel-images[data-id="${produto.id}"]`);
    const prevBtn = card.querySelector(`.carousel-btn.prev[data-id="${produto.id}"]`);
    const nextBtn = card.querySelector(`.carousel-btn.next[data-id="${produto.id}"]`);
    const dots = card.querySelectorAll(`.carousel-dots .dot`);

    let currentIndex = 0;

    const updateCarousel = (index) => {
      const images = carousel.querySelectorAll("img");
      images.forEach((img, i) => img.classList.toggle("active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
      carousel.style.transform = `translateX(-${index * 100}%)`;
      carousel.dataset.index = index;
    };

    if (prevBtn) prevBtn.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + imagens.length) % imagens.length;
      updateCarousel(currentIndex);
    });

    if (nextBtn) nextBtn.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % imagens.length;
      updateCarousel(currentIndex);
    });

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        currentIndex = parseInt(dot.dataset.index);
        updateCarousel(currentIndex);
      });
    });

    addSwipeSupport(carousel, (direction) => {
      window.moveCarousel(carrosselId, direction);
    });
  }

  const imageContainer = card.querySelector(".product-image");
  imageContainer.addEventListener("click", () => {
    window.openModal(produto.id, 0);
    incrementProductView(produto.id);
  });

  return card;
}

window.moveCarousel = (id, direction) => {
  const carousel = document.getElementById(id);
  if (!carousel) return;

  const images = carousel.querySelector(".carousel-images");
  const dots = carousel.querySelectorAll(".carousel-dots .dot");
  let index = Number.parseInt(images.dataset.index || 0);
  const total = images.children.length;

  index = (index + direction + total) % total;
  images.style.transform = `translateX(-${index * 100}%)`;
  images.dataset.index = index;

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
};

window.setCarouselImage = (id, index) => {
  const carousel = document.getElementById(id);
  if (!carousel) return;

  const images = carousel.querySelector(".carousel-images");
  const dots = carousel.querySelectorAll(".carousel-dots .dot");

  images.style.transform = `translateX(-${index * 100}%)`;
  images.dataset.index = index;

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
};

window.openModal = (id, imageIndex) => {
  const produto = allProducts.find((p) => p.id == id);
  if (!produto) {
    console.error("Produto não encontrado:", id);
    return;
  }

  const modal = document.getElementById("imageModal");
  const carouselImages = document.getElementById("modalCarrosselImagens");
  const carouselDots = document.getElementById("modalCarrosselDots");
  const prevButton = document.getElementById("modalPrev");
  const nextButton = document.getElementById("modalNext");

  if (!modal || !carouselImages) return;

  if (Array.isArray(produto.imagens)) {
    currentModalImages = produto.imagens;
  } else if (typeof produto.imagens === "string") {
    try {
      currentModalImages = JSON.parse(produto.imagens);
    } catch (e) {
      currentModalImages = [produto.imagens];
    }
  } else {
    currentModalImages = [];
  }

  if (currentModalImages.length === 0) {
    currentModalImages = [createImagePlaceholder(800, 600, produto.nome)];
  }

  currentImageIndex = Math.max(0, Math.min(imageIndex, currentModalImages.length - 1));

  carouselImages.innerHTML = currentModalImages
    .map(
      (img, idx) => `
      <img src="${img}" 
           alt="${produto.nome} - Imagem ${idx + 1}" 
           loading="lazy"
           onerror="this.src='${createImagePlaceholder(800, 600, produto.nome)}'">
    `,
    )
    .join("");

  carouselImages.style.transform = `translateX(-${currentImageIndex * 100}%)`;

  if (carouselDots && currentModalImages.length > 1) {
    carouselDots.innerHTML = currentModalImages
      .map(
        (_, i) => `
        <span class="dot ${i === currentImageIndex ? 'active' : ''}" 
              data-index="${i}" 
              onclick="window.setModalCarouselImage(${i})"></span>
      `,
      )
      .join("");
  } else if (carouselDots) {
    carouselDots.innerHTML = "";
  }

  if (prevButton && nextButton) {
    const showNav = currentModalImages.length > 1;
    prevButton.style.display = showNav ? "flex" : "none";
    nextButton.style.display = showNav ? "flex" : "none";
  }

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  if (currentModalImages.length > 1) {
    addSwipeSupport(carouselImages, window.moveModalCarousel);
  }
};

window.moveModalCarousel = (direction) => {
  const carouselImages = document.getElementById("modalCarrosselImagens");
  const carouselDots = document.getElementById("modalCarrosselDots");

  if (!carouselImages) return;

  const total = currentModalImages.length;
  currentImageIndex = (currentImageIndex + direction + total) % total;

  carouselImages.style.transform = `translateX(-${currentImageIndex * 100}%)`;

  if (carouselDots) {
    const dots = carouselDots.querySelectorAll(".dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === currentImageIndex);
    });
  }
};

window.setModalCarouselImage = (index) => {
  const carouselImages = document.getElementById("modalCarrosselImagens");
  const carouselDots = document.getElementById("modalCarrosselDots");

  if (!carouselImages) return;

  currentImageIndex = index;
  carouselImages.style.transform = `translateX(-${index * 100}%)`;

  if (carouselDots) {
    const dots = carouselDots.querySelectorAll(".dot");
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }
};

function filterByCategory(categoria) {
  console.log("🔍 Filtrando por categoria:", categoria);
  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.categoria === categoria);
  });
  currentPage = 1;
  loadProducts(1, false);
}

function filterByStore(loja) {
  console.log("🏪 Filtrando por loja:", loja);
  document.querySelectorAll(".store-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.loja === loja);
  });
  currentPage = 1;
  loadProducts(1, false);
}

function showEmptyState() {
  const gridProdutos = document.getElementById("grid-produtos");
  const mensagemVazia = document.getElementById("mensagem-vazia");
  if (gridProdutos) gridProdutos.style.display = "none";
  if (mensagemVazia) mensagemVazia.style.display = "flex";
}

function showErrorState(errorMessage = "Erro desconhecido") {
  const gridProdutos = document.getElementById("grid-produtos");
  const errorDiv = document.getElementById("error-message");
  if (gridProdutos) gridProdutos.style.display = "none";
  if (errorDiv) {
    errorDiv.style.display = "flex";
    const errorText = errorDiv.querySelector("p");
    if (errorText) {
      errorText.textContent = `Erro: ${errorMessage}. Verifique sua conexão com a internet.`;
    }
  }
}

function updateResultsTitle(categoria, loja, busca, showing, total) {
  const titulo = document.getElementById("ofertas-titulo");
  if (!titulo) return;

  const categoryNames = {
    eletronicos: "Eletrônicos",
    moda: "Moda",
    casa: "Casa e Decoração",
    beleza: "Beleza e Cuidado",
    esportes: "Esportes e Fitness",
    infantil: "Bebês e Crianças",
    automotivo: "Automotivo",
    games: "Games",
    livros: "Livros",
    fitness: "Fitness",
    pet: "Pet Shop",
    jardinagem: "Jardinagem",
    gastronomia: "Gastronomia",
  };

  const storeNames = {
    amazon: "Amazon",
    mercadolivre: "Mercado Livre",
    shopee: "Shopee",
    magalu: "Magalu",
    shein: "Shein",
    alibaba: "Alibaba",
  };

  let text = "🔥 Ofertas do Dia";
  if (busca) {
    text = `🔍 Resultados para "${busca}"`;
  } else if (categoria !== "todas") {
    text = `📂 ${categoryNames[categoria] || categoria}`;
  } else if (loja !== "todas") {
    text = `🏪 ${storeNames[loja] || loja}`;
  }

  titulo.innerHTML = `${text} <small>(${showing} de ${total})</small>`;
}

function updateFooterYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();
}

function addSwipeSupport(element, callback) {
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  element.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    },
    { passive: true },
  );

  element.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        callback(deltaX > 0 ? -1 : 1);
      }
    },
    { passive: true },
  );
}

document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      console.log("⚠️ Erro ao carregar imagem:", e.target.src);
      e.target.src = createImagePlaceholder(300, 200, "Imagem não encontrada");
    }
