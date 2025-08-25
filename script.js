const VERSION = "1.0.21"; // Atualizado para correção de imagens da Cloudinary
const API_URL = 'https://minha-api-produtos.onrender.com';
const PLACEHOLDER_IMAGE = 'https://www.centrodecompra.com/logos/placeholder.png';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 18;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";

// Conectar ao Socket.IO com verificação
let socket;
if (typeof io !== 'undefined') {
  socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 5 });
  socket.on('connect', () => console.log('Conectado ao Socket.IO'));
  socket.on('disconnect', () => console.warn('Desconectado do Socket.IO'));
  socket.on('connect_error', (error) => console.error('Erro de conexão Socket.IO:', error.message));
} else {
  console.warn('Socket.IO não carregado. Funcionalidade em tempo real desativada.');
}

// Função para embaralhar array (algoritmo Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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
  fetch(`${API_URL}/api/produtos`, { cache: 'no-store' })
    .then(response => {
      if (response.ok) {
        console.log('API Online: Conectado ao servidor');
      } else {
        console.warn('API Offline: Resposta não OK', response.status);
      }
    })
    .catch(error => {
      console.error('API Offline: Erro na conexão', error.message);
    });
}

// Função para validar URLs de imagens da Cloudinary
function isValidImageUrl(url) {
  return typeof url === 'string' && url.trim() !== '' && url.includes('cloudinary.com') && url.startsWith('https://res.cloudinary.com');
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

  if (isLoading) {
    console.log("Carregamento em andamento, ignorando nova requisição.");
    return;
  }
  isLoading = true;

  loadingSpinner.classList.add("active");
  gridProdutos.innerHTML = "";
  allProducts = [];
  mensagemVazia.classList.remove("active");
  errorMessage.classList.remove("active");

  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      let url = `${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}`;
      if (categoria !== 'todas') url += `&categoria=${encodeURIComponent(categoria)}`;
      if (loja !== 'todas') url += `&loja=${encodeURIComponent(loja)}`;
      if (busca) url += `&busca=${encodeURIComponent(busca)}`;
      console.log(`Tentativa ${attempt}: Carregando de ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      console.log('Status da resposta:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Resposta vazia'}`);
      }
      const data = await response.json();
      console.log('Resposta da API:', JSON.stringify(data, null, 2));

      if (!data || typeof data !== 'object' || data.status !== 'success' || !Array.isArray(data.data)) {
        throw new Error(`Resposta inválida: ${data?.message || 'Formato inesperado'}`);
      }

      const shuffledProducts = shuffleArray([...data.data]);
      allProducts = shuffledProducts;

      if (allProducts.length === 0) {
        mensagemVazia.classList.add("active");
        gridProdutos.style.display = "none";
      } else {
        mensagemVazia.classList.remove("active");
        gridProdutos.style.display = "grid";

        shuffledProducts.forEach((produto, index) => {
          if (!produto || typeof produto.nome !== 'string' || !produto.categoria || !produto.loja) {
            console.warn('Produto inválido ignorado:', produto);
            return;
          }
          console.log('Renderizando produto:', {
            nome: produto.nome,
            imagens: produto.imagens,
            loja: produto.loja,
            categoria: produto.categoria
          });

          const card = document.createElement("div");
          card.classList.add("produto-card", "visible");
          card.setAttribute("data-categoria", produto.categoria.toLowerCase());
          card.setAttribute("data-loja", produto.loja.toLowerCase());
          const globalIndex = index;

          const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0 && produto.imagens.some(isValidImageUrl)
            ? produto.imagens.filter(isValidImageUrl)
            : [PLACEHOLDER_IMAGE];
          const carrosselId = `carrossel-${(page - 1) * productsPerPage + index}`;
          const lojaClass = produto.loja.toLowerCase();

          card.innerHTML = `
            <div class="carrossel" id="${carrosselId}">
              <div class="carrossel-imagens">
                ${imagens.map((img, idx) => `
                  <img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" onclick="event.stopPropagation(); openModal(${globalIndex}, ${idx})">
                `).join("")}
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
      updatePaginationControls(data.total);
      isLoading = false;
      return;
    } catch (error) {
      console.error(`⚠️ Erro ao carregar produtos (Tentativa ${attempt}):`, error.message, error.stack);
      console.error('Detalhes da requisição:', { url });
      if (attempt === maxRetries) {
        errorMessage.classList.add("active");
        mensagemVazia.classList.remove("active");
        gridProdutos.style.display = "none";
        errorMessage.querySelector("p").textContent = `Erro ao carregar os produtos: ${error.message}. Verifique sua conexão ou tente novamente mais tarde.`;
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
    } finally {
      loadingSpinner.classList.remove("active");
      isLoading = false;
    }
  }
}

// Função para atualizar controles de paginação
function updatePaginationControls(totalItems) {
  const paginationControls = document.getElementById("pagination-controls");
  if (!paginationControls) return;

  const totalPages = Math.ceil(totalItems / productsPerPage);
  paginationControls.innerHTML = '';

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.classList.add("pagination-button");
    button.textContent = i;
    if (i === currentPage) button.classList.add("active");
    button.addEventListener("click", () => {
      currentPage = i;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });
    paginationControls.appendChild(button);
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
function openModal(index, imageIndex) {
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

  const produto = allProducts[index];
  if (!produto) {
    console.warn(`Produto no índice ${index} não encontrado`);
    return;
  }

  currentImages = Array.isArray(produto.imagens) && produto.imagens.length > 0 && produto.imagens.some(isValidImageUrl)
    ? produto.imagens.filter(isValidImageUrl)
    : [PLACEHOLDER_IMAGE];
  currentImageIndex = imageIndex >= 0 && imageIndex < currentImages.length ? imageIndex : 0;

  carrosselImagens.innerHTML = currentImages.map((img, idx) => `
    <img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
  `).join("");

  carrosselDots.innerHTML = currentImages.map((_, idx) => `
    <span class="carrossel-dot ${idx === currentImageIndex ? "ativo" : ""}" onclick="setModalImage(${idx})" role="button" aria-label="Selecionar imagem ${idx + 1}"></span>
  `).join("");

  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  modal.classList.add("active");

  prevButton.onclick = null;
  nextButton.onclick = null;
  modalClose.onclick = null;

  prevButton.onclick = () => moveModalCarrossel(-1);
  nextButton.onclick = () => moveModalCarrossel(1);
  modalClose.onclick = () => modal.classList.remove("active");

  const closeModalOnEsc = (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.removeEventListener('keydown', closeModalOnEsc);
    }
  };
  document.removeEventListener('keydown', closeModalOnEsc);
  document.addEventListener('keydown', closeModalOnEsc);
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

// Event listeners para filtros e busca
document.addEventListener("DOMContentLoaded", () => {
  console.log(`Script.js versão ${VERSION} carregado`);

  // Inicializar verificação de conexão
  checkConnectionStatus();
  setInterval(checkConnectionStatus, 60000);

  // Carregar produtos iniciais com atraso
  setTimeout(() => carregarProdutos(), 100);

  // Filtros de categoria
  document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      currentCategory = item.dataset.categoria || "todas";
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
      categoriesSidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  });

  // Filtros de loja
  document.querySelectorAll(".store-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".store-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      currentStore = card.dataset.loja || "todas";
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });
  });

  // Busca
  const buscaInput = document.getElementById("busca");
  const searchButton = document.querySelector(".search-btn");
  if (buscaInput && searchButton) {
    const debouncedSearch = debounce(() => {
      currentSearch = buscaInput.value.trim();
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    }, 500);

    buscaInput.addEventListener("input", debouncedSearch);
    searchButton.addEventListener("click", () => {
      currentSearch = buscaInput.value.trim();
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });
  }

  // Botões de reset e retry
  const resetFilters = document.querySelector(".reset-filters");
  const retryLoad = document.querySelector(".retry-load");
  if (resetFilters) {
    resetFilters.addEventListener("click", (e) => {
      e.preventDefault();
      currentCategory = "todas";
      currentStore = "todas";
      currentSearch = "";
      currentPage = 1;
      document.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"));
      document.querySelectorAll(".store-card").forEach(c => c.classList.remove("active"));
      document.querySelector(".category-item[data-categoria='todas']").classList.add("active");
      document.querySelector(".store-card[data-loja='todas']").classList.add("active");
      buscaInput.value = "";
      carregarProdutos();
    });
  }
  if (retryLoad) {
    retryLoad.addEventListener("click", (e) => {
      e.preventDefault();
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });
  }

  // Socket.IO listeners
  if (socket) {
    socket.on('novoProduto', (produto) => {
      console.log('Novo produto recebido:', produto);
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });

    socket.on('produtoAtualizado', (produto) => {
      console.log('Produto atualizado:', produto);
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });

    socket.on('produtoExcluido', (id) => {
      console.log('Produto excluído:', id);
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    });
  }
});
