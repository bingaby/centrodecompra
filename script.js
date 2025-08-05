const API_CONFIG = {
  REAL_API: "https://minha-api-produtos.onrender.com",
  USE_LOCAL_DATA: true,
  TEST_API: "https://jsonplaceholder.typicode.com",
}

let currentPage = 1
let allProducts = []
let isLoading = false

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    nome: "Smartphone Samsung Galaxy A54 128GB",
    descricao:
      "Smartphone com tela de 6.4 polegadas, câmera tripla de 50MP e bateria de 5000mAh. Processador Exynos 1380, Android 13 e design premium.",
    preco: 1299.99,
    categoria: "eletronicos",
    loja: "amazon",
    link: "https://amazon.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/1a1a1a/ffffff?text=Samsung+Galaxy+A54",
      "https://via.placeholder.com/300x300/2a2a2a/ffffff?text=Galaxy+Traseira",
      "https://via.placeholder.com/300x300/3a3a3a/ffffff?text=Galaxy+Lateral",
    ],
  },
  {
    id: 2,
    nome: "Tênis Nike Air Max 270 Masculino",
    descricao:
      "Tênis esportivo com tecnologia Air Max, conforto e estilo para o dia a dia. Solado em borracha e cabedal em mesh respirável.",
    preco: 599.9,
    categoria: "moda",
    loja: "mercadolivre",
    link: "https://mercadolivre.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/ff6b35/ffffff?text=Nike+Air+Max+270",
      "https://via.placeholder.com/300x300/f7931e/ffffff?text=Nike+Lateral",
      "https://via.placeholder.com/300x300/ff4500/ffffff?text=Nike+Solado",
    ],
  },
  {
    id: 3,
    nome: "Fone Bluetooth JBL Tune 510BT",
    descricao:
      "Fone de ouvido sem fio com qualidade de som JBL e bateria de 40 horas. Conexão Bluetooth 5.0 e microfone integrado.",
    preco: 199.99,
    categoria: "eletronicos",
    loja: "shopee",
    link: "https://shopee.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/0066cc/ffffff?text=JBL+Tune+510BT",
      "https://via.placeholder.com/300x300/0052a3/ffffff?text=JBL+Detalhe",
    ],
  },
  {
    id: 4,
    nome: "Vestido Floral Feminino Midi",
    descricao:
      "Vestido midi com estampa floral, tecido leve e confortável para o verão. Modelagem evasê e manga curta.",
    preco: 89.9,
    categoria: "moda",
    loja: "shein",
    link: "https://shein.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/ff69b4/ffffff?text=Vestido+Floral",
      "https://via.placeholder.com/300x300/ff1493/ffffff?text=Vestido+Costas",
      "https://via.placeholder.com/300x300/da70d6/ffffff?text=Vestido+Detalhe",
    ],
  },
  {
    id: 5,
    nome: "Cafeteira Elétrica Mondial 30 Xícaras",
    descricao:
      "Cafeteira elétrica com capacidade para 30 xícaras, filtro permanente e sistema corta-pingos. Potência de 800W.",
    preco: 129.9,
    categoria: "casa",
    loja: "magalu",
    link: "https://magazineluiza.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/8b4513/ffffff?text=Cafeteira+Mondial",
      "https://via.placeholder.com/300x300/a0522d/ffffff?text=Cafeteira+Detalhe",
    ],
  },
  {
    id: 6,
    nome: "Kit Ferramentas 108 Peças Profissional",
    descricao:
      "Kit completo de ferramentas para casa e trabalho, maleta organizadora resistente. Inclui chaves, alicates e bits.",
    preco: 299.99,
    categoria: "automotivo",
    loja: "alibaba",
    link: "https://alibaba.com/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/696969/ffffff?text=Kit+Ferramentas",
      "https://via.placeholder.com/300x300/808080/ffffff?text=Ferramentas+Abertas",
    ],
  },
  {
    id: 7,
    nome: "Creme Hidratante Facial Anti-idade",
    descricao:
      "Creme facial com ácido hialurônico e vitamina C. Hidrata, rejuvenesce e protege a pele contra o envelhecimento.",
    preco: 45.9,
    categoria: "beleza",
    loja: "amazon",
    link: "https://amazon.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/ffc0cb/333333?text=Creme+Anti-idade",
      "https://via.placeholder.com/300x300/ffb6c1/333333?text=Creme+Detalhe",
    ],
  },
  {
    id: 8,
    nome: "Bicicleta Aro 29 Mountain Bike",
    descricao:
      "Bicicleta mountain bike aro 29 com 21 marchas, freios a disco e suspensão dianteira. Ideal para trilhas e cidade.",
    preco: 899.9,
    categoria: "esportes",
    loja: "mercadolivre",
    link: "https://mercadolivre.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/228b22/ffffff?text=Bike+MTB+29",
      "https://via.placeholder.com/300x300/32cd32/ffffff?text=Bike+Lateral",
    ],
  },
  {
    id: 9,
    nome: "Boneca Barbie Dreamhouse Adventures",
    descricao:
      "Boneca Barbie com acessórios e roupas intercambiáveis. Estimula a criatividade e imaginação das crianças.",
    preco: 79.9,
    categoria: "infantil",
    loja: "shopee",
    link: "https://shopee.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/ff69b4/ffffff?text=Barbie+Dreamhouse",
      "https://via.placeholder.com/300x300/ff1493/ffffff?text=Barbie+Acessorios",
    ],
  },
  {
    id: 10,
    nome: "Console PlayStation 5 825GB",
    descricao:
      "Console de videogame PlayStation 5 com SSD de 825GB, ray tracing e áudio 3D. Inclui controle DualSense.",
    preco: 3999.99,
    categoria: "games",
    loja: "magalu",
    link: "https://magazineluiza.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/000080/ffffff?text=PlayStation+5",
      "https://via.placeholder.com/300x300/4169e1/ffffff?text=PS5+Controle",
    ],
  },
  {
    id: 11,
    nome: "Livro 'O Poder do Hábito' - Charles Duhigg",
    descricao:
      "Bestseller sobre como os hábitos funcionam e como podemos transformá-los. Leitura essencial para desenvolvimento pessoal.",
    preco: 29.9,
    categoria: "livros",
    loja: "amazon",
    link: "https://amazon.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/8b4513/ffffff?text=O+Poder+do+Habito",
      "https://via.placeholder.com/300x300/a0522d/ffffff?text=Livro+Contracapa",
    ],
  },
  {
    id: 12,
    nome: "Aspirador de Pó Robô Inteligente",
    descricao:
      "Aspirador robô com navegação inteligente, controle por app e bateria de longa duração. Limpeza automática programável.",
    preco: 799.9,
    categoria: "casa",
    loja: "shein",
    link: "https://shein.com.br/produto-exemplo",
    imagens: [
      "https://via.placeholder.com/300x300/2f4f4f/ffffff?text=Aspirador+Robo",
      "https://via.placeholder.com/300x300/696969/ffffff?text=Robo+Base",
    ],
  },
]

function createImagePlaceholder(width = 300, height = 200, text = "Produto") {
  return `https://via.placeholder.com/${width}x${height}/f0f0f0/999999?text=${encodeURIComponent(text)}`
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Iniciando Centro de Compras...")

  if (API_CONFIG.USE_LOCAL_DATA) {
    console.log("📱 Modo OFFLINE ativado - usando dados locais")
    showConnectionStatus("offline")
  } else {
    console.log("🌐 Modo ONLINE - tentando conectar com API")
    testApiConnection()
  }

  initializeHeader()
  initializeSidebar()
  initializeSearch()
  initializeFilters()
  initializeModal()
  loadProducts()
  updateFooterYear()
  setupLazyLoading()
  setupServiceWorker()
})

async function testApiConnection() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${API_CONFIG.REAL_API}/api/health`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      console.log("✅ API conectada com sucesso!")
      showConnectionStatus("online")
    } else {
      throw new Error(`API retornou status ${response.status}`)
    }
  } catch (error) {
    console.warn("⚠️ Falha na conexão com API, usando modo offline:", error.message)
    API_CONFIG.USE_LOCAL_DATA = true
    showConnectionStatus("offline")
  }
}

function showConnectionStatus(status) {
  const existingStatus = document.querySelector(".connection-status")
  if (existingStatus) {
    existingStatus.remove()
  }

  const statusDiv = document.createElement("div")
  statusDiv.className = `connection-status ${status}`
  statusDiv.innerHTML = `
    <div class="status-content">
      <i class="fas fa-${status === "online" ? "wifi" : "exclamation-triangle"}"></i>
      <span>${status === "online" ? "Conectado ao servidor" : "Modo offline - dados de exemplo"}</span>
      ${status === "offline" ? "<small>Configure sua API no arquivo script.js</small>" : ""}
    </div>
  `

  document.body.appendChild(statusDiv)

  setTimeout(() => {
    if (statusDiv.parentNode) {
      statusDiv.remove()
    }
  }, 5000)
}

function initializeHeader() {
  const logo = document.getElementById("site-logo")
  if (logo) {
    let clickCount = 0
    let clickTimeout = null

    logo.addEventListener("click", (e) => {
      e.preventDefault()
      clickCount++

      if (clickCount === 1) {
        clickTimeout = setTimeout(() => {
          clickCount = 0
        }, 1000)
      } else if (clickCount === 3) {
        clearTimeout(clickTimeout)
        window.location.href = "/admin-xyz-123.html"
        clickCount = 0
      }
    })
  }

  const searchBtn = document.querySelector(".search-btn")
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchInput = document.getElementById("busca")
      if (searchInput && searchInput.value.trim()) {
        loadProducts(1, false)
      }
    })
  }
}

function initializeSidebar() {
  const categoriesBtn = document.getElementById("categories-toggle")
  const sidebar = document.getElementById("categories-sidebar")
  const overlay = document.getElementById("overlay")
  const closeSidebar = document.getElementById("close-sidebar")

  if (categoriesBtn && sidebar && overlay) {
    categoriesBtn.addEventListener("click", () => {
      sidebar.classList.add("active")
      overlay.classList.add("active")
      document.body.style.overflow = "hidden"
    })

    const closeSidebarHandler = () => {
      sidebar.classList.remove("active")
      overlay.classList.remove("active")
      document.body.style.overflow = ""
    }

    if (closeSidebar) {
      closeSidebar.addEventListener("click", closeSidebarHandler)
    }

    overlay.addEventListener("click", closeSidebarHandler)

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidebar.classList.contains("active")) {
        closeSidebarHandler()
      }
    })

    const categoryItems = document.querySelectorAll(".category-item")
    categoryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const categoria = item.dataset.categoria
        filterByCategory(categoria)
        closeSidebarHandler()
      })
    })
  }
}

function initializeSearch() {
  const searchInput = document.getElementById("busca")
  if (searchInput) {
    const debouncedSearch = debounce(() => {
      loadProducts(1, false)
    }, 500)

    searchInput.addEventListener("input", debouncedSearch)

    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        loadProducts(1, false)
      }
    })
  }
}

function initializeFilters() {
  const storeCards = document.querySelectorAll(".store-card")
  storeCards.forEach((card) => {
    card.addEventListener("click", () => {
      const loja = card.dataset.loja
      filterByStore(loja)
    })
  })

  const viewBtns = document.querySelectorAll(".view-btn")
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewBtns.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")

      const view = btn.dataset.view
      const productsGrid = document.getElementById("grid-produtos")
      if (productsGrid) {
        productsGrid.className = view === "list" ? "products-list" : "products-grid"
      }
    })
  })

  const sortSelect = document.getElementById("sort-select")
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      loadProducts(1, false)
    })
  }

  const loadMoreBtn = document.getElementById("load-more")
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      loadProducts(currentPage + 1, true)
    })
  }
}

function initializeModal() {
  const modal = document.getElementById("imageModal")
  const modalClose = document.getElementById("modal-close")
  const modalBackdrop = document.querySelector(".modal-backdrop")

  if (modal && modalClose && modalBackdrop) {
    const closeModal = () => {
      modal.style.display = "none"
      document.body.style.overflow = ""
    }

    modalClose.addEventListener("click", closeModal)
    modalBackdrop.addEventListener("click", closeModal)

    document.addEventListener("keydown", (e) => {
      if (modal.style.display === "flex") {
        switch (e.key) {
          case "Escape":
            closeModal()
            break
          case "ArrowLeft":
            window.moveModalCarousel(-1)
            break
          case "ArrowRight":
            window.moveModalCarousel(1)
            break
        }
      }
    })
  }

  const modalPrev = document.getElementById("modalPrev")
  const modalNext = document.getElementById("modalNext")

  if (modalPrev) {
    modalPrev.addEventListener("click", () => window.moveModalCarousel(-1))
  }

  if (modalNext) {
    modalNext.addEventListener("click", () => window.moveModalCarousel(1))
  }
}

async function loadProducts(page = 1, append = false) {
  if (isLoading) return

  console.log(`📦 Carregando produtos - Página: ${page}, Append: ${append}`)

  isLoading = true

  const categoria = document.querySelector(".category-item.active")?.dataset.categoria || "todas"
  const loja = document.querySelector(".store-card.active")?.dataset.loja || "todas"
  const busca = document.getElementById("busca")?.value.trim() || ""
  const sort = document.getElementById("sort-select")?.value || "relevance"

  const spinner = document.getElementById("loading-spinner")
  const gridProdutos = document.getElementById("grid-produtos")
  const mensagemVazia = document.getElementById("mensagem-vazia")
  const errorMessage = document.getElementById("error-message")
  const loadMoreButton = document.getElementById("load-more")

  if (spinner) spinner.style.display = "block"
  if (!append && gridProdutos) gridProdutos.innerHTML = ""
  if (mensagemVazia) mensagemVazia.style.display = "none"
  if (errorMessage) errorMessage.style.display = "none"
  if (loadMoreButton) loadMoreButton.style.display = "none"

  try {
    let data, total

    if (API_CONFIG.USE_LOCAL_DATA) {
      const result = getLocalProducts(page, categoria, loja, busca, sort)
      data = result.data
      total = result.total
      console.log(`📱 Dados locais: ${data.length} produtos de ${total} total`)
    } else {
      const url = buildApiUrl(page, categoria, loja, busca, sort)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      data = result.data || result.produtos || result
      total = result.total || data.length
      console.log(`🌐 API: ${data.length} produtos de ${total} total`)
    }

    if (!append) {
      allProducts = []
    }

    allProducts.push(...data)

    if (allProducts.length === 0) {
      showEmptyState()
    } else {
      renderProducts(data, append)

      if (loadMoreButton && allProducts.length < total) {
        loadMoreButton.style.display = "flex"
      }
    }

    currentPage = page
    updateResultsTitle(categoria, loja, busca, allProducts.length, total)
  } catch (error) {
    console.error("❌ Erro ao carregar produtos:", error)

    if (!API_CONFIG.USE_LOCAL_DATA) {
      console.log("🔄 Tentando fallback para dados locais...")
      API_CONFIG.USE_LOCAL_DATA = true
      showConnectionStatus("offline")
      loadProducts(page, append)
      return
    }

    showErrorState(error.message)
  } finally {
    if (spinner) spinner.style.display = "none"
    isLoading = false
  }
}

function getLocalProducts(page = 1, categoria = "todas", loja = "todas", busca = "", sort = "relevance") {
  let filteredProducts = [...SAMPLE_PRODUCTS]

  if (categoria !== "todas") {
    filteredProducts = filteredProducts.filter((p) => p.categoria === categoria)
  }

  if (loja !== "todas") {
    filteredProducts = filteredProducts.filter((p) => p.loja === loja)
  }

  if (busca) {
    const searchTerm = busca.toLowerCase()
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm) ||
        p.descricao.toLowerCase().includes(searchTerm) ||
        p.categoria.toLowerCase().includes(searchTerm) ||
        p.loja.toLowerCase().includes(searchTerm),
    )
  }

  switch (sort) {
    case "price-low":
      filteredProducts.sort((a, b) => a.preco - b.preco)
      break
    case "price-high":
      filteredProducts.sort((a, b) => b.preco - a.preco)
      break
    case "newest":
      filteredProducts.sort((a, b) => b.id - a.id)
      break
    case "relevance":
    default:
      break
  }

  const limit = 12
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedProducts = filteredProducts.slice(start, end)

  return {
    data: paginatedProducts,
    total: filteredProducts.length,
    page: page,
    limit: limit,
  }
}

function buildApiUrl(page, categoria, loja, busca, sort) {
  let url = `${API_CONFIG.REAL_API}/api/produtos?page=${page}&limit=12`

  if (categoria !== "todas") url += `&categoria=${categoria}`
  if (loja !== "todas") url += `&loja=${loja}`
  if (busca) url += `&busca=${encodeURIComponent(busca)}`
  if (sort !== "relevance") url += `&sort=${sort}`

  return url
}

function renderProducts(products, append = false) {
  const gridProdutos = document.getElementById("grid-produtos")
  if (!gridProdutos) return

  if (!append) {
    gridProdutos.innerHTML = ""
  }

  products.forEach((produto, index) => {
    const card = createProductCard(produto)
    card.style.animationDelay = `${index * 0.1}s`
    gridProdutos.appendChild(card)
  })

  gridProdutos.style.display = "grid"
}

function createProductCard(produto) {
  const card = document.createElement("div")
  card.className = "produto-card"
  card.setAttribute("data-categoria", produto.categoria.toLowerCase())
  card.setAttribute("data-loja", produto.loja.toLowerCase())

  let imagens = []

  if (Array.isArray(produto.imagens)) {
    imagens = produto.imagens
  } else if (typeof produto.imagens === "string") {
    try {
      imagens = JSON.parse(produto.imagens)
    } catch (e) {
      imagens = [produto.imagens]
    }
  }

  if (imagens.length === 0) {
    imagens = [createImagePlaceholder(300, 200, produto.nome)]
  }

  const carrosselId = `carrossel-${produto.id}`
  const lojaClass = `tarja-${produto.loja.toLowerCase().replace(/\s/g, "")}`

  card.innerHTML = `
    <div class="carrossel" id="${carrosselId}">
      <div class="carrossel-imagens">
        ${imagens
          .map(
            (img, idx) => `
          <img src="${img}" 
               alt="${produto.nome} - Imagem ${idx + 1}" 
               loading="lazy" 
               onclick="openModal('${produto.id}', ${idx})"
               onerror="this.src='${createImagePlaceholder(300, 200, produto.nome)}'">
        `,
          )
          .join("")}
      </div>
      ${
        imagens.length > 1
          ? `
        <button class="carrossel-prev" onclick="window.moveCarousel('${carrosselId}', -1)" aria-label="Imagem anterior">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="carrossel-next" onclick="window.moveCarousel('${carrosselId}', 1)" aria-label="Próxima imagem">
          <i class="fas fa-chevron-right"></i>
        </button>
        <div class="carrossel-dots">
          ${imagens
            .map(
              (_, idx) => `
            <span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" 
                  onclick="window.setCarouselImage('${carrosselId}', ${idx})" 
                  aria-label="Selecionar imagem ${idx + 1}"></span>
          `,
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
    <h3 class="produto-nome">${produto.nome}</h3>
    <div class="preco-link" data-preco="${Number.parseFloat(produto.preco).toFixed(2)}">
      <i class="fas fa-eye"></i>
      <span>Clique para ver o preço</span>
    </div>
    <p class="descricao">${produto.descricao || "Sem descrição disponível"}</p>
    <a href="${produto.link}" 
       target="_blank" 
       class="tarja-preco ${lojaClass}" 
       aria-label="Comprar ${produto.nome} na ${produto.loja}"
       rel="noopener noreferrer">
      <i class="fas fa-shopping-cart"></i>
      <span>Comprar na ${produto.loja}</span>
    </a>
  `

  const precoLink = card.querySelector(".preco-link")
  precoLink.addEventListener("click", () => {
    const preco = precoLink.getAttribute("data-preco")
    precoLink.innerHTML = `
      <i class="fas fa-dollar-sign"></i>
      <span>R$ ${preco}</span>
    `
    precoLink.classList.add("price-revealed")
    precoLink.style.cursor = "default"
  })

  if (imagens.length > 1) {
    addSwipeSupport(card.querySelector(".carrossel-imagens"), (direction) => {
      window.moveCarousel(carrosselId, direction)
    })
  }

  return card
}

window.moveCarousel = (id, direction) => {
  const carousel = document.getElementById(id)
  if (!carousel) return

  const images = carousel.querySelector(".carrossel-imagens")
  const dots = carousel.querySelectorAll(".carrossel-dot")
  let index = Number.parseInt(images.dataset.index || 0)
  const total = images.children.length

  index = (index + direction + total) % total
  images.style.transform = `translateX(-${index * 100}%)`
  images.dataset.index = index

  dots.forEach((dot, i) => {
    dot.classList.toggle("ativo", i === index)
  })
}

window.setCarouselImage = (id, index) => {
  const carousel = document.getElementById(id)
  if (!carousel) return

  const images = carousel.querySelector(".carrossel-imagens")
  const dots = carousel.querySelectorAll(".carrossel-dot")

  images.style.transform = `translateX(-${index * 100}%)`
  images.dataset.index = index

  dots.forEach((dot, i) => {
    dot.classList.toggle("ativo", i === index)
  })
}

let currentImageIndex = 0
let currentModalImages = []

window.openModal = (id, imageIndex) => {
  const produto = allProducts.find((p) => p.id == id)
  if (!produto) {
    console.error("Produto não encontrado:", id)
    return
  }

  const modal = document.getElementById("imageModal")
  const carouselImages = document.getElementById("modalCarrosselImagens")
  const carouselDots = document.getElementById("modalCarrosselDots")
  const prevButton = document.getElementById("modalPrev")
  const nextButton = document.getElementById("modalNext")

  if (!modal || !carouselImages) return

  if (Array.isArray(produto.imagens)) {
    currentModalImages = produto.imagens
  } else if (typeof produto.imagens === "string") {
    try {
      currentModalImages = JSON.parse(produto.imagens)
    } catch (e) {
      currentModalImages = [produto.imagens]
    }
  } else {
    currentModalImages = []
  }

  if (currentModalImages.length === 0) {
    currentModalImages = [createImagePlaceholder(800, 600, produto.nome)]
  }

  currentImageIndex = Math.max(0, Math.min(imageIndex, currentModalImages.length - 1))

  carouselImages.innerHTML = currentModalImages
    .map(
      (img, idx) => `
      <img src="${img}" 
           alt="${produto.nome} - Imagem ${idx + 1}" 
           loading="lazy"
           onerror="this.src='${createImagePlaceholder(800, 600, produto.nome)}'">
    `,
    )
    .join("")

  carouselImages.style.transform = `translateX(-${currentImageIndex * 100}%)`

  if (carouselDots && currentModalImages.length > 1) {
    carouselDots.innerHTML = currentModalImages
      .map(
        (_, i) => `
        <span class="carrossel-dot ${i === currentImageIndex ? "ativo" : ""}" 
              onclick="window.setModalCarouselImage(${i})"></span>
      `,
      )
      .join("")
  }

  if (prevButton && nextButton) {
    const showNav = currentModalImages.length > 1
    prevButton.style.display = showNav ? "flex" : "none"
    nextButton.style.display = showNav ? "flex" : "none"
  }

  modal.style.display = "flex"
  document.body.style.overflow = "hidden"

  if (currentModalImages.length > 1) {
    addSwipeSupport(carouselImages, window.moveModalCarousel)
  }
}

window.moveModalCarousel = (direction) => {
  const carouselImages = document.getElementById("modalCarrosselImagens")
  const carouselDots = document.getElementById("modalCarrosselDots")

  if (!carouselImages) return

  const total = currentModalImages.length
  currentImageIndex = (currentImageIndex + direction + total) % total

  carouselImages.style.transform = `translateX(-${currentImageIndex * 100}%)`

  if (carouselDots) {
    const dots = carouselDots.children
    Array.from(dots).forEach((dot, i) => {
      dot.classList.toggle("ativo", i === currentImageIndex)
    })
  }
}

window.setModalCarouselImage = (index) => {
  const carouselImages = document.getElementById("modalCarrosselImagens")
  const carouselDots = document.getElementById("modalCarrosselDots")

  if (!carouselImages) return

  currentImageIndex = index
  carouselImages.style.transform = `translateX(-${index * 100}%)`

  if (carouselDots) {
    const dots = carouselDots.children
    Array.from(dots).forEach((dot, i) => {
      dot.classList.toggle("ativo", i === index)
    })
  }
}

function filterByCategory(categoria) {
  console.log("🔍 Filtrando por categoria:", categoria)

  document.querySelectorAll(".category-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.categoria === categoria)
  })

  currentPage = 1
  loadProducts(1, false)
}

function filterByStore(loja) {
  console.log("🏪 Filtrando por loja:", loja)

  document.querySelectorAll(".store-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.loja === loja)
  })

  currentPage = 1
  loadProducts(1, false)
}

function showEmptyState() {
  const gridProdutos = document.getElementById("grid-produtos")
  const mensagemVazia = document.getElementById("mensagem-vazia")

  if (gridProdutos) gridProdutos.style.display = "none"
  if (mensagemVazia) mensagemVazia.style.display = "flex"
}

function showErrorState(errorMessage = "Erro desconhecido") {
  const gridProdutos = document.getElementById("grid-produtos")
  const errorDiv = document.getElementById("error-message")

  if (gridProdutos) gridProdutos.style.display = "none"
  if (errorDiv) {
    errorDiv.style.display = "flex"
    const errorText = errorDiv.querySelector("p")
    if (errorText) {
      errorText.textContent = `Erro: ${errorMessage}. Verifique sua conexão ou configuração da API.`
    }
  }
}

function updateResultsTitle(categoria, loja, busca, showing, total) {
  const titulo = document.getElementById("ofertas-titulo")
  if (!titulo) return

  let text = "🔥 Ofertas do Dia"

  if (busca) {
    text = `🔍 Resultados para "${busca}"`
  } else if (categoria !== "todas") {
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
    }
    text = `📂 ${categoryNames[categoria] || categoria}`
  } else if (loja !== "todas") {
    const storeNames = {
      amazon: "Amazon",
      mercadolivre: "Mercado Livre",
      shopee: "Shopee",
      magalu: "Magalu",
      shein: "Shein",
      alibaba: "Alibaba",
    }
    text = `🏪 ${storeNames[loja] || loja}`
  }

  titulo.innerHTML = `${text} <small>(${showing} de ${total})</small>`
}

function updateFooterYear() {
  const yearElement = document.getElementById("year")
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear()
  }
}

function addSwipeSupport(element, callback) {
  let touchStartX = 0
  let touchEndX = 0
  let touchStartY = 0
  let touchEndY = 0

  element.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX
      touchStartY = e.changedTouches[0].screenY
    },
    { passive: true },
  )

  element.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX
      touchEndY = e.changedTouches[0].screenY

      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        callback(deltaX > 0 ? -1 : 1)
      }
    },
    { passive: true },
  )
}

document.addEventListener(
  "error",
  (e) => {
    if (e.target.tagName === "IMG") {
      console.log("⚠️ Erro ao carregar imagem:", e.target.src)
      e.target.src = createImagePlaceholder(300, 200, "Imagem não encontrada")
    }
  },
  true,
)

function setupLazyLoading() {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.classList.remove("lazy")
            observer.unobserve(img)
          }
        }
      })
    })

    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img)
    })
  }
}

function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registrado:", registration)
        })
        .catch((registrationError) => {
          console.log("❌ Falha no Service Worker:", registrationError)
        })
    })
  }
}

window.loadProducts = loadProducts
window.filterByCategory = filterByCategory
window.filterByStore = filterByStore

console.log("📋 Script carregado com sucesso!")
console.log("🔧 Configuração atual:", API_CONFIG)
console.log("📦 Produtos de exemplo:", SAMPLE_PRODUCTS.length)
