import { API_BASE_URL } from './constants.js';

const socket = io(API_BASE_URL, { transports: ['websocket'] });
let currentPage = 1;
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded disparado, iniciando script.js');

  window.toggleSidebar = function () {
    const sidebar = document.querySelector('.sidebar-categorias');
    sidebar.classList.toggle('active');
    const toggleButton = document.querySelector('.sidebar-toggle');
    toggleButton.textContent = sidebar.classList.contains('active') ? 'Esconder Categorias' : 'Mostrar Categorias';
  };

  document.querySelectorAll('img').forEach(img => {
    img.onerror = () => {
      console.log(`Erro ao carregar imagem: ${img.src}`);
      img.src = 'https://via.placeholder.com/150';
    };
  });

  const logo = document.getElementById('site-logo');
  if (logo) {
    let clickCount = 0, clickTimeout = null;
    logo.addEventListener('click', (e) => {
      e.stopPropagation();
      clickCount++;
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => {
          clickCount = 0;
        }, 1000);
      } else if (clickCount === 3) {
        clearTimeout(clickTimeout);
        window.location.href = '/admin-xyz-123.html';
        clickCount = 0;
      }
    });
  }

  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  function addSwipeSupport(element, moveCallback) {
    let touchStartX = 0;
    let touchEndX = 0;
    element.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    element.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const deltaX = touchEndX - touchStartX;
      if (deltaX > 50) {
        moveCallback(-1);
      } else if (deltaX < -50) {
        moveCallback(1);
      }
    });
  }

  async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Recurso não encontrado');
          if (response.status === 500) throw new Error('Erro no servidor, tente novamente mais tarde');
          throw new Error(`Erro ${response.status}: Falha ao carregar produtos`);
        }
        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, backoff * Math.pow(2, i)));
      }
    }
  }

  async function carregarProdutos(page = 1, append = false) {
    const categoria = document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas';
    const loja = document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas';
    const busca = document.getElementById('busca')?.value || '';
    const url = `${API_BASE_URL}/api/produtos?page=${page}&limit=12` +
      `${categoria !== 'todas' ? `&categoria=${categoria}` : ''}` +
      `${loja !== 'todas' ? `&loja=${loja}` : ''}` +
      `${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`;

    const spinner = document.getElementById('loading-spinner');
    const gridProdutos = document.getElementById('grid-produtos');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    const loadMoreButton = document.getElementById('load-more');

    if (!spinner || !gridProdutos || !mensagemVazia || !errorMessage || !loadMoreButton) return;

    spinner.style.display = 'block';
    if (!append) {
      gridProdutos.innerHTML = '';
      allProducts = [];
    }
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';
    loadMoreButton.style.display = 'none';

    try {
      const { data, total } = await fetchWithRetry(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      allProducts.push(...data);

      if (allProducts.length === 0) {
        mensagemVazia.style.display = 'block';
        gridProdutos.style.display = 'none';
      } else {
        gridProdutos.style.display = 'grid';
        data.forEach(produto => {
          const card = document.createElement('div');
          card.classList.add('produto-card', 'visible');
          card.setAttribute('data-categoria', produto.categoria.toLowerCase());
          card.setAttribute('data-loja', produto.loja.toLowerCase());

          const imagens = produto.imagens || ['https://via.placeholder.com/150'];
          const carrosselId = `carrossel-${produto.id}`;
          const lojaClass = `tarja-${produto.loja.toLowerCase().replace(/\s/g, '')}`;

          card.innerHTML = `
            <div class="carrossel" id="${carrosselId}">
              <div class="carrossel-imagens">
                ${imagens.map((img, idx) => `<img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onclick="openModal('${produto.id}', ${idx})">`).join("")}
              </div>
              ${imagens.length > 1 ? `
                <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior">◄</button>
                <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem">►</button>
                <div class="carrossel-dots">
                  ${imagens.map((_, idx) => `<span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" onclick="setCarrosselImage('${carrosselId}', ${idx})" aria-label="Selecionar imagem ${idx + 1}"></span>`).join("")}
                </div>
              ` : ""}
            </div>
            <span class="produto-nome">${produto.nome}</span>
            <a href="${produto.link}" target="_blank" class="preco-link" aria-label="Ver oferta de ${produto.nome} na ${produto.loja}">Clique aqui para ver o preço</a>
            <p class="descricao">${produto.descricao || 'Sem descrição'}</p>
            <a href="${produto.link}" target="_blank" class="tarja-preco ${lojaClass}" aria-label="Comprar ${produto.nome} na ${produto.loja}">Comprar na ${produto.loja}</a>
          `;
          gridProdutos.appendChild(card);

          if (imagens.length > 1) {
            const carrosselImagens = card.querySelector('.carrossel-imagens');
            addSwipeSupport(carrosselImagens, (direction) => moveCarrossel(carrosselId, direction));
          }
        });
      }

      if (allProducts.length < total) {
        loadMoreButton.style.display = 'block';
      } else {
        loadMoreButton.style.display = 'none';
      }

      currentPage = page;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error.message);
      errorMessage.textContent = `Não foi possível conectar à API: ${error.message}. Verifique sua conexão ou tente novamente.`;
      errorMessage.style.display = 'block';
      gridProdutos.style.display = 'none';
    } finally {
      spinner.style.display = 'none';
    }
  }

  window.moveCarrossel = function (id, direction) {
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
  };

  window.setCarrosselImage = function (id, index) {
    const carrossel = document.getElementById(id);
    if (!carrossel) return;
    const imagens = carrossel.querySelector(".carrossel-imagens");
    const dots = carrossel.querySelectorAll(".carrossel-dot");
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
  };

  let currentImageIndex = 0;
  let currentModalImages = [];
  window.openModal = function (id, imageIndex) {
    const produto = allProducts.find(p => p.id == id);
    if (!produto) {
      console.error("Produto não encontrado para o ID:", id);
      return;
    }

    const modal = document.getElementById("imageModal");
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots");
    const prevButton = document.getElementById("modalPrev");
    const nextButton = document.getElementById("modalNext");

    modal.style.display = "flex";
    carrosselImagens.innerHTML = "";
    carrosselDots.innerHTML = "";

    currentModalImages = produto.imagens || ['https://via.placeholder.com/150'];
    currentImageIndex = Math.max(0, Math.min(imageIndex, currentModalImages.length - 1));

    carrosselImagens.innerHTML = currentModalImages.map((img, idx) => `<img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy">`).join("");
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

    if (currentModalImages.length > 1) {
      carrosselDots.innerHTML = currentModalImages.map((_, i) => `<span class="carrossel-dot ${i === currentImageIndex ? "ativo" : ""}" onclick="setModalCarrosselImage(${i})"></span>`).join("");
      prevButton.classList.add("visible");
      nextButton.classList.add("visible");
      addSwipeSupport(carrosselImagens, (direction) => moveModalCarrossel(direction));
    } else {
      prevButton.classList.remove("visible");
      nextButton.classList.remove("visible");
    }
  };

  window.moveModalCarrossel = function (direction) {
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots")?.children;
    const total = currentModalImages.length;

    currentImageIndex = (currentImageIndex + direction + total) % total;

    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    if (carrosselDots) {
      Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
    }
  };

  window.setModalCarrosselImage = function (index) {
    const carrosselImagens = document.getElementById("modalCarrosselImagens");
    const carrosselDots = document.getElementById("modalCarrosselDots")?.children;

    currentImageIndex = index;

    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    if (carrosselDots) {
      Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === index));
    }
  };

  window.closeModal = function () {
    document.getElementById('imageModal').style.display = 'none';
  };

  window.filtrarPorCategoria = function (categoria) {
    document.querySelectorAll('.categoria-item').forEach(item => item.classList.toggle('ativa', item.dataset.categoria === categoria));
    carregarProdutos(1);
    if (window.innerWidth <= 767) {
      document.querySelector('.sidebar-categorias').classList.remove('active');
      document.querySelector('.sidebar-toggle').textContent = 'Mostrar Categorias';
    }
  };

  window.filtrarPorLoja = function (loja) {
    document.querySelectorAll('.loja, .loja-todas').forEach(item => item.classList.toggle('ativa', item.dataset.loja === loja));
    carregarProdutos(1);
  };

  const buscaInput = document.getElementById('busca');
  if (buscaInput) {
    let timeout;
    buscaInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        carregarProdutos(1);
      }, 500);
    });
  }

  window.carregarMaisProdutos = function () {
    currentPage++;
    carregarProdutos(currentPage, true);
  };

  socket.on('novoProduto', () => {
    carregarProdutos(1);
  });

  socket.on('produtoAtualizado', () => {
    carregarProdutos(currentPage, true);
  });

  socket.on('produtoExcluido', () => {
    carregarProdutos(currentPage, true);
  });

  carregarProdutos();
});
