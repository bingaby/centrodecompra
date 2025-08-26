const VERSION = "1.0.26"; // Mantida a versão anterior
const API_URL = 'https://minha-api-produtos.onrender.com';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150'; // Substitua por uma URL válida, se necessário
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 21;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";
const socket = io(API_URL, { 
  transports: ['websocket'], 
  path: '/socket.io',
  reconnectionAttempts: 3, // Tenta reconectar 3 vezes
  reconnectionDelay: 1000 // Aguarda 1s entre tentativas
});

function isValidImageUrl(url) {
  return typeof url === 'string' && url.trim() !== '' && url.includes('cloudinary.com') && url.startsWith('https://res.cloudinary.com');
}

// Função para embaralhar array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Função para carregar produtos
async function carregarProdutos(categoria = "todas", loja = "todas", page = 1, busca = currentSearch) {
  console.log('Iniciando carregarProdutos:', { categoria, loja, page, busca });
  const gridProdutos = document.getElementById("grid-produtos");
  const mensagemVazia = document.getElementById("mensagem-vazia");
  const errorMessage = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading-spinner");

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error("Elementos do DOM não encontrados:", {
      gridProdutos: !!gridProdutos,
      mensagemVazia: !!mensagemVazia,
      errorMessage: !!errorMessage,
      loadingSpinner: !!loadingSpinner
    });
    return;
  }

  if (isLoading) return;
  isLoading = true;

  loadingSpinner.classList.add("active");
  gridProdutos.innerHTML = "";
  allProducts = [];
  mensagemVazia.classList.remove("active");
  errorMessage.classList.remove("active");

  try {
    let url = `${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}`;
    if (categoria !== 'todas') url += `&categoria=${encodeURIComponent(categoria)}`;
    if (loja !== 'todas') url += `&loja=${encodeURIComponent(loja)}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;

    console.log(`Carregando de ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      cache: "no-store",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Necessário para enviar cookies, se o servidor usar credentials
    });

    console.log('Resposta HTTP:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);

    if (!data || !Array.isArray(data.data)) throw new Error('Resposta inválida da API');
    allProducts = shuffleArray([...data.data]);

    if (allProducts.length === 0) {
      mensagemVazia.classList.add("active");
      gridProdutos.style.display = "none";
    } else {
      mensagemVazia.classList.remove("active");
      gridProdutos.style.display = "grid";

      allProducts.forEach((produto, index) => {
        if (!produto || !produto.nome || !produto.categoria || !produto.loja) {
          console.warn('Produto inválido ignorado:', produto);
          return;
        }
        const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0 && produto.imagens.some(isValidImageUrl)
          ? produto.imagens.filter(isValidImageUrl)
          : [PLACEHOLDER_IMAGE];
        const carrosselId = `carrossel-${(page - 1) * productsPerPage + index}`;
        const lojaClass = produto.loja.toLowerCase();

        const card = document.createElement("div");
        card.classList.add("produto-card", "visible");
        card.setAttribute("data-categoria", produto.categoria.toLowerCase());
        card.setAttribute("data-loja", produto.loja.toLowerCase());
        card.innerHTML = `
          <div class="carrossel" id="${carrosselId}">
            <div class="carrossel-imagens">
              ${imagens.map((img, idx) => `
                <img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" data-index="${index}" data-image-index="${idx}">
              `).join("")}
            </div>
            ${imagens.length > 1 ? `
              <button class="carrossel-prev" aria-label="Imagem anterior"><i class="fas fa-chevron-left"></i></button>
              <button class="carrossel-next" aria-label="Próxima imagem"><i class="fas fa-chevron-right"></i></button>
              <div class="carrossel-dots">
                ${imagens.map((_, idx) => `<span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" data-carrossel-id="${carrosselId}" data-image-index="${idx}" aria-label="Selecionar imagem ${idx + 1}"></span>`).join("")}
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

      document.querySelectorAll('.carrossel-imagens img').forEach(img => {
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(img.dataset.index);
          const imageIndex = parseInt(img.dataset.imageIndex);
          console.log('Imagem clicada:', { index, imageIndex, produto: allProducts[index] });
          if (allProducts[index]) openModal(index, imageIndex);
        });
      });

      document.querySelectorAll('.carrossel-prev').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const carrosselId = button.parentElement.id;
          moveCarrossel(carrosselId, -1);
        });
      });

      document.querySelectorAll('.carrossel-next').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const carrosselId = button.parentElement.id;
          moveCarrossel(carrosselId, 1);
        });
      });

      document.querySelectorAll('.carrossel-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const carrosselId = dot.dataset.carrosselId;
          const index = parseInt(dot.dataset.imageIndex);
          setCarrosselImage(carrosselId, index);
        });
      });
    }

    updatePaginationControls(data.total);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    errorMessage.classList.add("active");
    gridProdutos.style.display = "none";
    errorMessage.querySelector("p").textContent = `Erro ao carregar os produtos: ${error.message}`;
  } finally {
    loadingSpinner.classList.remove("active");
    isLoading = false;
  }
}

// Função para abrir o modal
function openModal(index, imageIndex) {
  console.log('Abrindo modal:', { index, imageIndex });
  const modal = document.getElementById("imageModal");
  const carrosselImagens = document.getElementById("modalCarrosselImagens");
  const carrosselDots = document.getElementById("modalCarrosselDots");
  const prevButton = document.getElementById("modalPrev");
  const nextButton = document.getElementById("modalNext");
  const modalClose = document.getElementById("modal-close");

  if (!modal || !carrosselImagens || !carrosselDots || !prevButton || !nextButton || !modalClose) {
    console.error("Elementos do modal não encontrados:", {
      modal: !!modal,
      carrosselImagens: !!carrosselImagens,
      carrosselDots: !!carrosselDots,
      prevButton: !!prevButton,
      nextButton: !!nextButton,
      modalClose: !!modalClose
    });
    return;
  }

  const produto = allProducts[index];
  if (!produto) {
    console.warn(`Produto no índice ${index} não encontrado`);
    return;
  }

  currentImages = Array.isArray(produto.imagens) && produto.imagens.length > 0 && produto.imagens.some(isValidImageUrl)
    ? produto.imagens.filter(isValidImageUrl)
    : [PLACEHOLDER_IMAGE];
  currentImageIndex = imageIndex >= 0 && imageIndex < currentImages.length ? imageIndex : 0;

  console.log('Imagens no modal:', currentImages);
  carrosselImagens.innerHTML = currentImages.map((img, idx) =>
    `<img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">`
  ).join("");
  carrosselDots.innerHTML = currentImages.map((_, idx) =>
    `<span class="carrossel-dot ${idx === currentImageIndex ? "ativo" : ""}" data-modal-image-index="${idx}" role="button" aria-label="Selecionar imagem ${idx + 1}"></span>`
  ).join("");

  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  modal.classList.add("active");

  const prevClone = prevButton.cloneNode(true);
  const nextClone = nextButton.cloneNode(true);
  const closeClone = modalClose.cloneNode(true);
  prevButton.replaceWith(prevClone);
  nextButton.replaceWith(nextClone);
  modalClose.replaceWith(closeClone);

  prevClone.addEventListener('click', () => moveModalCarrossel(-1));
  nextClone.addEventListener('click', () => moveModalCarrossel(1));
  closeClone.addEventListener('click', () => {
    console.log('Fechando modal');
    modal.classList.remove("active");
  });

  carrosselDots.querySelectorAll('.carrossel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.modalImageIndex);
      setModalImage(idx);
    });
  });

  document.addEventListener('keydown', handleEscape, { once: true });
}

function handleEscape(event) {
  const modal = document.getElementById("imageModal");
  if (event.key === 'Escape' && modal.classList.contains('active')) {
    console.log('Modal fechado via ESC');
    modal.classList.remove('active');
  }
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

function moveModalCarrossel(direction) {
  currentImageIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
  const carrosselImagens = document.getElementById("modalCarrosselImagens");
  const carrosselDots = document.getElementById("modalCarrosselDots");
  if (carrosselImagens && carrosselDots) {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    carrosselDots.querySelectorAll(".carrossel-dot").forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
  }
}

function setModalImage(index) {
  currentImageIndex = index;
  const carrosselImagens = document.getElementById("modalCarrosselImagens");
  const carrosselDots = document.getElementById("modalCarrosselDots");
  if (carrosselImagens && carrosselDots) {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    carrosselDots.querySelectorAll(".carrossel-dot").forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
  }
}

function updatePaginationControls(total) {
  const paginationControls = document.getElementById("pagination-controls");
  if (!paginationControls) return;

  const totalPages = Math.ceil(total / productsPerPage);
  paginationControls.innerHTML = '';

  if (totalPages <= 1) return;

  // Botão "Anterior"
  const prevButton = document.createElement("button");
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.classList.add("pagination-btn");
  prevButton.disabled = currentPage === 1;
  prevButton.setAttribute("aria-label", "Página anterior");
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos(currentCategory, currentStore, currentPage);
    }
  });

  // Botões numerados
  const maxButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  const pageButtons = [];
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("pagination-number");
    if (i === currentPage) {
      pageButton.classList.add("active");
      pageButton.setAttribute("aria-current", "page");
    }
    pageButton.setAttribute("aria-label", `Ir para página ${i}`);
    pageButton.addEventListener("click", () => {
      currentPage = i;
      carregarProdutos(currentCategory, currentStore, currentPage);
    });
    pageButtons.push(pageButton);
  }

  // Botão "Próximo"
  const nextButton = document.createElement("button");
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.classList.add("pagination-btn");
  nextButton.disabled = currentPage === totalPages;
  nextButton.setAttribute("aria-label", "Próxima página");
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      carregarProdutos(currentCategory, currentStore, currentPage);
    }
  });

  // Informação da página
  const pageInfo = document.createElement("span");
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  pageInfo.classList.add("pagination-info");
  pageInfo.setAttribute("aria-live", "polite");

  // Montar controles
  paginationControls.appendChild(prevButton);
  pageButtons.forEach(button => paginationControls.appendChild(button));
  paginationControls.appendChild(pageInfo);
  paginationControls.appendChild(nextButton);
}

document.addEventListener("DOMContentLoaded", () => {
  // Elementos do DOM
  const categoriesToggle = document.getElementById("categories-toggle");
  const categoriesSidebar = document.getElementById("categories-sidebar");
  const closeSidebar = document.getElementById("close-sidebar");
  const overlay = document.getElementById("overlay");
  const buscaInput = document.getElementById("busca");
  const buscaBtn = document.querySelector(".search-btn");
  const resetFilters = document.querySelector(".reset-filters");
  const retryLoad = document.querySelector(".retry-load");
  const cookieBanner = document.getElementById("cookie-banner");
  const acceptCookies = document.getElementById("accept-cookies");
  const rejectCookies = document.getElementById("reject-cookies");
  const manageCookies = document.getElementById("manage-cookies");
  const cookieModal = document.getElementById("cookie-modal");
  const saveCookies = document.getElementById("save-cookies");
  const cancelCookies = document.getElementById("cancel-cookies");

  // Função para ocultar o banner de cookies
  function hideCookieBanner() {
    if (cookieBanner) {
      cookieBanner.style.display = "none";
    }
  }

  // Manipuladores para cookies
  if (acceptCookies) {
    acceptCookies.addEventListener("click", () => {
      console.log("Cookies aceitos");
      hideCookieBanner();
      localStorage.setItem("cookieConsent", "accepted");
    });
  }

  if (rejectCookies) {
    rejectCookies.addEventListener("click", () => {
      console.log("Cookies recusados");
      hideCookieBanner();
      localStorage.setItem("cookieConsent", "rejected");
    });
  }

  if (manageCookies) {
    manageCookies.addEventListener("click", () => {
      console.log("Gerenciar opções clicado");
      if (cookieModal) {
        cookieModal.style.display = "flex";
      }
    });
  }

  if (saveCookies) {
    saveCookies.addEventListener("click", () => {
      console.log("Preferências de cookies salvas");
      hideCookieBanner();
      if (cookieModal) {
        cookieModal.style.display = "none";
      }
      const analyticsCookies = document.getElementById("analytics-cookies").checked;
      const adCookies = document.getElementById("ad-cookies").checked;
      localStorage.setItem("cookiePreferences", JSON.stringify({
        analytics: analyticsCookies,
        ads: adCookies
      }));
    });
  }

  if (cancelCookies) {
    cancelCookies.addEventListener("click", () => {
      console.log("Gerenciamento de cookies cancelado");
      if (cookieModal) {
        cookieModal.style.display = "none";
      }
    });
  }

  // Verificar consentimento salvo
  if (localStorage.getItem("cookieConsent") || localStorage.getItem("cookiePreferences")) {
    hideCookieBanner();
  }

  // Manipuladores de eventos existentes
  if (categoriesToggle && categoriesSidebar && closeSidebar && overlay) {
    categoriesToggle.addEventListener("click", () => {
      categoriesSidebar.classList.add("active");
      overlay.classList.add("active");
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

  document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentCategory = item.dataset.categoria;
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage);
      categoriesSidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  });

  document.querySelectorAll(".store-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".store-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      currentStore = card.dataset.loja;
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage);
    });
  });

  if (buscaInput && buscaBtn) {
    buscaBtn.addEventListener("click", () => {
      currentSearch = buscaInput.value.trim();
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });

    buscaInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        currentSearch = buscaInput.value.trim();
        currentPage = 1;
        carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
      }
    });
  }

  if (resetFilters) {
    resetFilters.addEventListener("click", (e) => {
      e.preventDefault();
      currentCategory = "todas";
      currentStore = "todas";
      currentSearch = "";
      currentPage = 1;
      document.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"));
      document.querySelector(".category-item[data-categoria='todas']").classList.add("active");
      document.querySelectorAll(".store-card").forEach(c => c.classList.remove("active"));
      document.querySelector(".store-card[data-loja='todas']").classList.add("active");
      buscaInput.value = "";
      carregarProdutos(currentCategory, currentStore, currentPage);
    });
  }

  if (retryLoad) {
    retryLoad.addEventListener("click", (e) => {
      e.preventDefault();
      carregarProdutos(currentCategory, currentStore, currentPage);
    });
  }

  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  carregarProdutos();

  socket.on('connect', () => {
    console.log('Conectado ao WebSocket');
  });

  socket.on('produto_atualizado', () => {
    console.log('Produto atualizado via WebSocket');
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
  });

  socket.on('disconnect', () => {
    console.log('Desconectado do WebSocket');
  });

  socket.on('connect_error', (error) => {
    console.error('Erro de conexão com WebSocket:', error.message);
  });

  socket.on('novoProduto', (produto) => {
    console.log('Novo produto recebido via WebSocket:', produto);
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
  });

  socket.on('produtoAtualizado', (produto) => {
    console.log('Produto atualizado recebido via WebSocket:', produto);
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
  });

  socket.on('produtoExcluido', (produto) => {
    console.log('Produto excluído recebido via WebSocket:', produto);
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
  });
});
