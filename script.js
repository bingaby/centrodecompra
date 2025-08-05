const API_CONFIG = {
  REAL_API: "https://minha-api-produtos.onrender.com",
  USE_LOCAL_DATA: false,
  TEST_API: "https://jsonplaceholder.typicode.com",
};

let currentPage = 1;
let allProducts = [];
let isLoading = false;

const SAMPLE_PRODUCTS = 
  
function createImagePlaceholder(width = 300, height = 200, text = "Produto") {
  return `https://via.placeholder.com/${width}x${height}/f0f0f0/999999?text=${encodeURIComponent(text)}`;
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
    console.log("🌐 Modo ONLINE - tentando conectar com API");
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
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_CONFIG.REAL_API}/api/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("✅ API conectada com sucesso!");
      showConnectionStatus("online");
    } else {
      throw new Error(`API retornou status ${response.status}`);
    }
  } catch (error) {
    console.warn("⚠️ Falha na conexão com API, usando modo offline:", error.message);
    API_CONFIG.USE_LOCAL_DATA = true;
    showConnectionStatus("offline");
  }
}

function showConnectionStatus(status) {
  const existingStatus = document.querySelector(".connection-status");
  if (existingStatus) {
    existingStatus.remove();
  }

  const statusDiv = document.createElement("div");
  statusDiv.className = `connection-status ${status}`;
  statusDiv.innerHTML = `
    <div class="status-content">
      <i class="fas fa-${status === "online" ? "wifi" : "exclamation-triangle"}"></i>
      <span>${status === "online" ? "Conectado ao servidor" : "Modo offline - dados de exemplo"}</span>
      ${status === "offline" ? "<small>Configure sua API no arquivo script.js</small>" : ""}
    </div>
  `;

  document.body.appendChild(statusDiv);

  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.remove();
    }
  }, 5000);
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
        clickTimeout = setTimeout(() => {
          clickCount = 0;
        }, 1000);
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

    if (closeSidebar) {
      closeSidebar.addEventListener("click", closeSidebarHandler);
    }

    overlay.addEventListener("click", closeSidebarHandler);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("active")) {
        closeSidebarHandler();
      }
    });

    const categoryItems = document.querySelectorAll(".category-item");
    categoryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const categoria = item.dataset.categoria;
        filterByCategory(categoria);
        closeSidebarHandler();
      });
    });
  }
}

function initializeSearch() {
  const searchInput = document.getElementById("busca");
  if (searchInput) {
    const debouncedSearch = debounce(() => {
      loadProducts(1, false);
    }, 500);

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
      const loja = card.dataset.loja;
      filterByStore(loja);
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
    sortSelect.addEventListener("change", () => {
      loadProducts(1, false);
    });
  }

  const loadMoreBtn = document.getElementById("load-more");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      loadProducts(currentPage + 1, true);
    });
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

  if (modalPrev) {
    modalPrev.addEventListener("click", () => window.moveModalCarousel(-1));
  }

  if (modalNext) {
    modalNext.addEventListener("click", () => window.moveModalCarousel(1));
  }
}

async function loadProducts(page = 1, append = false) {
  if (isLoading) return;

  console.log(`📦 Carregando produtos - Página: ${page}, Append: ${append}`);

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      data = result.data || result.produtos || result;
      total = result.total || data.length;
      console.log(`🌐 API: ${data.length} produtos de ${total} total`);

      // Cachear resultados
      localStorage.setItem(`produtos_page_${page}_${categoria}_${loja}_${busca}_${sort}`, JSON.stringify({ data, total, timestamp: Date.now() }));
    }

    if (!append) {
      allProducts = [];
    }

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
  } catch (error) {
    console.error("❌ Erro ao carregar produtos:", error);

    // Tentar carregar do cache
    const cacheKey = `produtos_page_${page}_${categoria}_${loja}_${busca}_${sort}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { data, total } = JSON.parse(cachedData);
      if (!append) allProducts = [];
      allProducts.push(...data);
      renderProducts(data, append);
      updateResultsTitle(categoria, loja, busca, allProducts.length, total);
      showConnectionStatus("offline");
      isLoading = false;
      return;
    }

    if (!API_CONFIG.USE_LOCAL_DATA) {
      console.log("🔄 Tentando fallback para dados locais...");
      API_CONFIG.USE_LOCAL_DATA = true;
      showConnectionStatus("offline");
      loadProducts(page
