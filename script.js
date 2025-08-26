const VERSION = "1.0.29";
const API_URL = 'https://minha-api-produtos.onrender.com'; // SUBSTITUA PELO URL REAL DA API
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200?text=Placeholder';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 21;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";
const socket = io(API_URL, { transports: ['websocket'], path: '/socket.io' });

// Lista de vendors TCF
const vendors = [
  { name: "Google Ads", id: "googleads", cookieDuration: 365, data: ["IP addresses", "Device identifiers"], consentRequired: true, privacyPolicy: "https://policies.google.com/privacy", usesOtherStorage: true },
  { name: "Quantcast", id: "quantcast", cookieDuration: 1825, data: ["IP addresses", "Device characteristics", "Device identifiers"], consentRequired: true, privacyPolicy: "https://www.quantcast.com/privacy/", usesOtherStorage: true }
];

// Função para verificar se o consentimento expirou
function isConsentExpired(consentDate) {
  if (!consentDate) return true;
  const date = new Date(consentDate);
  const now = new Date();
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  return (now - date) > oneYearInMs;
}

// Função para definir cookies
function setCookie(name, value, days) {
  const expires = days ? `expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; Secure; SameSite=Strict`;
}

// Função para obter cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

// Função para carregar e aplicar consentimentos
function loadConsent() {
  const consent = localStorage.getItem('cookie-consent');
  if (consent) {
    const { analytics, ads, vendors: vendorConsents, timestamp } = JSON.parse(consent);
    if (!isConsentExpired(timestamp)) {
      updateConsentStatus({ analytics, ads, vendors: vendorConsents });
      return true;
    }
  }
  return false;
}

// Função para atualizar status de consentimento no gtag
function updateConsentStatus({ analytics, ads, vendors }) {
  const consentStatus = {
    'ad_storage': ads ? 'granted' : 'denied',
    'analytics_storage': analytics ? 'granted' : 'denied',
    'personalization_storage': ads ? 'granted' : 'denied'
  };
  if (typeof gtag === 'function') {
    gtag('consent', 'update', consentStatus);
    console.log('Status de consentimento atualizado:', consentStatus);
  } else {
    console.warn('gtag não definido. Verifique a inclusão do Google Tag Manager.');
  }
  loadVendorScripts(vendors);
}

// Função para carregar scripts de vendors
function loadVendorScripts(vendorConsents) {
  vendors.forEach(vendor => {
    if (vendor.consentRequired && vendorConsents[vendor.id]) {
      if (vendor.id === 'googleads' && document.querySelector('ins.adsbygoogle')) {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`Script do vendor ${vendor.name} carregado`);
      }
    }
    if (vendor.usesOtherStorage && vendorConsents[vendor.id]) {
      localStorage.setItem(`vendor_${vendor.id}_consent`, 'true');
    } else if (vendor.usesOtherStorage) {
      localStorage.removeItem(`vendor_${vendor.id}_consent`);
    }
  });
}

// Função para preencher a lista de vendors no modal
function populateVendorsList() {
  const vendorsList = document.querySelector('.vendors-list');
  if (!vendorsList) {
    console.error('Lista de vendors não encontrada no DOM');
    return;
  }
  vendorsList.innerHTML = vendors.map(vendor => `
    <div class="vendor-item">
      <label>
        <input type="checkbox" data-vendor-id="${vendor.id}" ${vendor.consentRequired ? '' : 'checked disabled'}>
        ${vendor.name}
        <a href="${vendor.privacyPolicy}" target="_blank" rel="noopener" aria-label="Política de privacidade de ${vendor.name}"> (Política de Privacidade)</a>
      </label>
    </div>
  `).join('');
}

// Função para inicializar o banner de cookies
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const modal = document.getElementById('cookie-modal');
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const rejectAllBtn = document.getElementById('reject-all-cookies');
  const manageBtn = document.getElementById('manage-cookies');
  const saveBtn = document.getElementById('save-cookies');
  const cancelBtn = document.getElementById('cancel-cookies');

  if (!banner || !modal || !acceptAllBtn || !rejectAllBtn || !manageBtn || !saveBtn || !cancelBtn) {
    console.error('Elementos do banner de cookies não encontrados:', {
      banner: !!banner,
      modal: !!modal,
      acceptAllBtn: !!acceptAllBtn,
      rejectAllBtn: !!rejectAllBtn,
      manageBtn: !!manageBtn,
      saveBtn: !!saveBtn,
      cancelBtn: !!cancelBtn
    });
    return;
  }

  if (loadConsent()) {
    console.log('Consentimento válido encontrado, ocultando banner');
    banner.classList.add('hidden');
    banner.style.display = 'none';
    return;
  }

  console.log('Exibindo banner de cookies');
  banner.classList.remove('hidden');
  banner.style.display = 'flex';

  acceptAllBtn.addEventListener('click', () => {
    console.log('Botão "Aceitar Tudo" clicado');
    const consent = {
      analytics: true,
      ads: true,
      vendors: vendors.reduce((acc, vendor) => ({ ...acc, [vendor.id]: !vendor.consentRequired || true }), {}),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    updateConsentStatus(consent);
    banner.classList.add('hidden');
    banner.style.display = 'none';
    console.log('Consentimento salvo:', consent);
    console.log('Banner de cookies ocultado');
    // Recarregar anúncios
    if (typeof adsbygoogle !== 'undefined') {
      (adsbygoogle = window.adsbygoogle || []).push({});
    }
  });

  rejectAllBtn.addEventListener('click', () => {
    console.log('Botão "Recusar Tudo" clicado');
    const consent = {
      analytics: false,
      ads: false,
      vendors: vendors.reduce((acc, vendor) => ({ ...acc, [vendor.id]: !vendor.consentRequired }), {}),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    updateConsentStatus(consent);
    banner.classList.add('hidden');
    banner.style.display = 'none';
    console.log('Consentimento salvo:', consent);
    console.log('Banner de cookies ocultado');
  });

  manageBtn.addEventListener('click', () => {
    console.log('Botão "Personalizar" clicado');
    modal.classList.add('active');
    modal.style.display = 'flex';
    populateVendorsList();
  });

  saveBtn.addEventListener('click', () => {
    console.log('Botão "Salvar Preferências" clicado');
    const consent = {
      analytics: document.getElementById('analytics-cookies').checked,
      ads: document.getElementById('ad-cookies').checked,
      vendors: Array.from(document.querySelectorAll('.vendors-list input[type="checkbox"]')).reduce((acc, input) => {
        const vendorId = input.dataset.vendorId;
        acc[vendorId] = input.checked || !vendors.find(v => v.id === vendorId).consentRequired;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    updateConsentStatus(consent);
    modal.classList.remove('active');
    modal.style.display = 'none';
    banner.classList.add('hidden');
    banner.style.display = 'none';
    console.log('Consentimento salvo:', consent);
    console.log('Banner e modal de cookies ocultados');
    // Recarregar anúncios se consentimento de ads for dado
    if (consent.ads && typeof adsbygoogle !== 'undefined') {
      (adsbygoogle = window.adsbygoogle || []).push({});
    }
  });

  cancelBtn.addEventListener('click', () => {
    console.log('Botão "Cancelar" clicado');
    modal.classList.remove('active');
    modal.style.display = 'none';
  });
}

// Função para verificar e substituir imagens quebradas
function handleBrokenImages() {
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
    img.onerror = () => {
      console.warn(`Imagem não carregada: ${img.src}`);
      img.src = PLACEHOLDER_IMAGE;
    };
  });
}

// Função para carregar produtos
async function loadProducts(page = 1, category = currentCategory, store = currentStore, search = currentSearch) {
  if (isLoading) {
    console.log('Carregamento de produtos em andamento, ignorando nova requisição');
    return;
  }
  isLoading = true;

  const grid = document.getElementById('grid-produtos');
  const loadingSpinner = document.getElementById('loading-spinner');
  const errorMessage = document.getElementById('error-message');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  if (!grid || !loadingSpinner || !errorMessage || !mensagemVazia) {
    console.error('Elementos do DOM não encontrados:', {
      grid: !!grid,
      loadingSpinner: !!loadingSpinner,
      errorMessage: !!errorMessage,
      mensagemVazia: !!mensagemVazia
    });
    isLoading = false;
    return;
  }

  grid.innerHTML = '';
  loadingSpinner.classList.add('active');
  errorMessage.classList.remove('active');
  mensagemVazia.classList.remove('active');

  try {
    // Dados de teste (mock) para verificar renderização
    const mockData = {
      products: [
        {
          id: "test-1",
          nome: "Produto de Teste",
          descricao: "Descrição de teste",
          preco: 99.99,
          loja: "amazon",
          imagens: ["https://via.placeholder.com/200"],
          link: "https://exemplo.com"
        }
      ],
      total: 1
    };

    // Comentar a linha abaixo para testar com dados reais
    const data = mockData;
    console.log('Usando dados de teste:', data);

    // Descomentar as linhas abaixo para usar a API real
    /*
    const params = new URLSearchParams({
      page: page.toString(),
      limit: productsPerPage.toString(),
      category: category !== 'todas' ? category : '',
      store: store !== 'todas' ? store : '',
      search
    });
    console.log('Enviando requisição para:', `${API_URL}/produtos?${params}`);
    const response = await fetch(`${API_URL}/produtos?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // Adicione headers de autenticação, se necessário
        // 'Authorization': 'Bearer SEU_TOKEN'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);
    */

    if (!data || typeof data !== 'object') {
      throw new Error('Resposta inválida: formato inesperado');
    }

    allProducts = Array.isArray(data.products) ? data.products : [];
    const totalPages = Math.ceil((data.total || 0) / productsPerPage);

    if (allProducts.length === 0) {
      console.warn('Nenhum produto retornado');
      mensagemVazia.classList.add('active');
    } else {
      allProducts.forEach(produto => {
        if (!produto.id || !produto.nome || !produto.preco) {
          console.warn('Produto inválido:', produto);
          return;
        }
        renderProduct(produto);
      });
      renderPagination(totalPages, page);
    }
  } catch (error) {
    console.error('Erro ao carregar produtos:', error.message);
    errorMessage.classList.add('active');
    errorMessage.querySelector('p').textContent = `Não foi possível carregar os produtos: ${error.message}`;
  } finally {
    loadingSpinner.classList.remove('active');
    isLoading = false;
  }
}

// Função para renderizar um produto
function renderProduct(produto) {
  const grid = document.getElementById('grid-produtos');
  const images = Array.isArray(produto.imagens) && produto.imagens.length > 0 ? produto.imagens : [PLACEHOLDER_IMAGE];
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="carousel">
      <div class="carousel-images">
        ${images.map(img => `<img src="${img}" alt="${produto.nome}" loading="lazy">`).join('')}
      </div>
      ${images.length > 1 ? `
        <button class="carousel-btn prev" aria-label="Imagem anterior"><i class="fas fa-chevron-left"></i></button>
        <button class="carousel-btn next" aria-label="Próxima imagem"><i class="fas fa-chevron-right"></i></button>
        <div class="carousel-dots">
          ${images.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
        </div>
      ` : ''}
    </div>
    <h3 class="product-title">${produto.nome}</h3>
    <p class="product-description">${produto.descricao || 'Descrição não disponível'}</p>
    <a href="${produto.link}" target="_blank" class="product-price price-${produto.loja}" rel="sponsored">R$ ${produto.preco.toFixed(2)}</a>
  `;
  grid.appendChild(card);

  if (images.length > 1) {
    initializeCarousel(card, images);
  }

  card.querySelectorAll('.carousel-images img').forEach(img => {
    img.addEventListener('click', () => openImageModal(images));
  });
}

// Função para inicializar carrossel de imagens
function initializeCarousel(card, images) {
  let currentIndex = 0;
  const carouselImages = card.querySelector('.carousel-images');
  const dots = card.querySelectorAll('.carousel-dot');
  const prevBtn = card.querySelector('.carousel-btn.prev');
  const nextBtn = card.querySelector('.carousel-btn.next');

  function updateCarousel() {
    carouselImages.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
  }

  prevBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex === 0) ? images.length - 1 : currentIndex - 1;
    updateCarousel();
  });

  nextBtn?.addEventListener('click', () => {
    currentIndex = (currentIndex === images.length - 1) ? 0 : currentIndex + 1;
    updateCarousel();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentIndex = i;
      updateCarousel();
    });
  });
}

// Função para abrir modal de imagens
function openImageModal(images) {
  const modal = document.getElementById('imageModal');
  const carouselImages = document.getElementById('modalCarrosselImagens');
  const dotsContainer = document.getElementById('modalCarrosselDots');
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');
  const closeBtn = document.getElementById('modal-close');

  if (!modal || !carouselImages || !dotsContainer || !prevBtn || !nextBtn || !closeBtn) {
    console.error('Elementos do modal de imagens não encontrados');
    return;
  }

  currentImages = images;
  currentImageIndex = 0;

  carouselImages.innerHTML = images.map(img => `<img src="${img}" alt="Imagem do produto" loading="lazy">`).join('');
  dotsContainer.innerHTML = images.map((_, i) => `<span class="carousel-dot ${i === 0 ? 'active' : ''}"></span>`).join('');
  modal.classList.add('active');

  const dots = dotsContainer.querySelectorAll('.carousel-dot');

  function updateModalCarousel() {
    carouselImages.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentImageIndex));
  }

  prevBtn.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex === 0) ? images.length - 1 : currentImageIndex - 1;
    updateModalCarousel();
  });

  nextBtn.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex === images.length - 1) ? 0 : currentImageIndex + 1;
    updateModalCarousel();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      currentImageIndex = i;
      updateModalCarousel();
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.classList.remove('active');
  });
}

// Função para renderizar paginação
function renderPagination(totalPages, currentPage) {
  const paginationControls = document.getElementById('pagination-controls');
  if (!paginationControls) {
    console.error('Elemento de paginação não encontrado');
    return;
  }
  paginationControls.innerHTML = `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Anterior</button>
    <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Próxima</button>
  `;

  paginationControls.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page);
      loadProducts(page);
    });
  });
}

// Função para inicializar filtros e eventos
function initFilters() {
  const categoriesToggle = document.getElementById('categories-toggle');
  const sidebar = document.getElementById('categories-sidebar');
  const closeSidebar = document.getElementById('close-sidebar');
  const overlay = document.getElementById('overlay');
  const searchInput = document.getElementById('busca');
  const searchBtn = document.querySelector('.search-btn');
  const resetFilters = document.querySelectorAll('.reset-filters');

  if (!categoriesToggle || !sidebar || !closeSidebar || !overlay || !searchInput || !searchBtn || !resetFilters.length) {
    console.error('Elementos de filtros não encontrados:', {
      categoriesToggle: !!categoriesToggle,
      sidebar: !!sidebar,
      closeSidebar: !!closeSidebar,
      overlay: !!overlay,
      searchInput: !!searchInput,
      searchBtn: !!searchBtn,
      resetFilters: !!resetFilters.length
    });
    return;
  }

  categoriesToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  document.querySelectorAll('.category-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = link.dataset.categoria;
      currentPage = 1;
      document.querySelectorAll('.category-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      loadProducts();
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  });

  document.querySelectorAll('.store-card').forEach(card => {
    card.addEventListener('click', () => {
      currentStore = card.dataset.loja;
      currentPage = 1;
      document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      loadProducts();
    });
  });

  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadProducts();
  });

  searchBtn.addEventListener('click', () => {
    currentPage = 1;
    loadProducts();
  });

  resetFilters.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = 'todas';
      currentStore = 'todas';
      currentSearch = '';
      currentPage = 1;
      searchInput.value = '';
      document.querySelectorAll('.category-item').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
      document.querySelector('.category-item[data-categoria="todas"]').classList.add('active');
      document.querySelector('.store-card[data-loja="todas"]').classList.add('active');
      loadProducts();
    });
  });

  document.querySelector('.retry-load')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadProducts();
  });
}

// WebSocket para atualizações em tempo real
socket.on('connect', () => {
  console.log('Conectado ao WebSocket');
});

socket.on('product-update', (produto) => {
  console.log('Produto atualizado:', produto);
  const index = allProducts.findIndex(p => p.id === produto.id);
  if (index !== -1) {
    allProducts[index] = produto;
    loadProducts(currentPage);
  }
});

socket.on('product-added', (produto) => {
  console.log('Produto adicionado:', produto);
  allProducts.push(produto);
  loadProducts(currentPage);
});

socket.on('product-deleted', (id) => {
  console.log('Produto deletado:', id);
  allProducts = allProducts.filter(p => p.id !== id);
  loadProducts(currentPage);
});

socket.on('error', (error) => {
  console.error('Erro no WebSocket:', error);
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log(`Versão do script: ${VERSION}`);
  initCookieBanner();
  loadProducts();
  initFilters();
  handleBrokenImages();
  document.getElementById('year').textContent = new Date().getFullYear();
});
