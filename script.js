const VERSION = "1.0.24"; // Atualizado para correção do modal
const API_URL = 'https://minha-api-produtos.onrender.com';
const PLACEHOLDER_IMAGE = 'https://www.centrodecompra.com/logos/placeholder.png';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 18; // Mantendo 18 produtos por página
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";

// Função para validar URLs de imagens da Cloudinary
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

    const response = await fetch(url, { cache: "no-store", headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();

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

      // Adicionar eventos de clique às imagens
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

      // Adicionar eventos do carrossel
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

// Função openModal
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
  carrosselImagens.innerHTML = currentImages.map((img, idx) => `
    <img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
  `).join("");
  carrosselDots.innerHTML = currentImages.map((_, idx) => `
    <span class="carrossel-dot ${idx === currentImageIndex ? "ativo" : ""}" data-modal-image-index="${idx}" role="button" aria-label="Selecionar imagem ${idx + 1}"></span>
  `).join("");

  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  modal.classList.add("active");

  // Limpar eventos anteriores
  const prevClone = prevButton.cloneNode(true);
  const nextClone = nextButton.cloneNode(true);
  const closeClone = modalClose.cloneNode(true);
  prevButton.replaceWith(prevClone);
  nextButton.replaceWith(nextClone);
  modalClose.replaceWith(closeClone);

  // Adicionar novos eventos
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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      console.log('Modal fechado via ESC');
      modal.classList.remove('active');
    }
  }, { once: true });
}

// Funções auxiliares do carrossel
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

// (O restante do script.js continua com as funções de filtros, busca, etc., como fornecido anteriormente)
