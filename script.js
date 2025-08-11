document.addEventListener('DOMContentLoaded', () => {
  let produtos = [];
  let currentPage = 1;
  const perPage = 12;
  let categoriaSelecionada = 'todas';
  let lojaSelecionada = 'todas';
  let buscaTermo = '';
  let sortBy = 'relevance';

  // Carregar produtos
  async function loadProdutos() {
    try {
      document.getElementById('loading-spinner').style.display = 'block';
      document.getElementById('mensagem-vazia').style.display = 'none';
      document.getElementById('error-message').style.display = 'none';

      const params = new URLSearchParams({
        page: currentPage,
        limit: perPage,
        categoria: categoriaSelecionada,
        loja: lojaSelecionada,
        busca: buscaTermo,
        sort: sortBy
      });
      console.log('Requisição GET /api/produtos:', params.toString()); // Log para depuração
      const response = await fetch(`/api/produtos?${params}`);
      if (!response.ok) throw new Error(`Erro ao carregar produtos: ${response.statusText}`);
      const { data, total } = await response.json();
      console.log('Produtos recebidos:', data); // Log para depuração
      produtos = data;
      renderProdutos(total);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      document.getElementById('loading-spinner').style.display = 'none';
      document.getElementById('error-message').style.display = 'block';
    }
  }

  // Renderizar produtos
  function renderProdutos(total) {
    const grid = document.getElementById('grid-produtos');
    grid.innerHTML = '';

    if (produtos.length === 0) {
      document.getElementById('loading-spinner').style.display = 'none';
      document.getElementById('mensagem-vazia').style.display = 'block';
      console.log('Nenhum produto encontrado para os filtros:', { categoriaSelecionada, lojaSelecionada, buscaTermo });
      return;
    }

    produtos.forEach(produto => {
      const card = document.createElement('div');
      card.className = 'produto-card';
      card.innerHTML = `
        <div class="carrossel">
          <div class="carrossel-imagens">
            ${produto.imagens.map(img => `<img src="${img.replace('/upload/', '/upload/w_300,h_300,c_fill/')}" alt="${produto.nome}">`).join('')}
          </div>
          <button class="carrossel-prev"><i class="fas fa-chevron-left"></i></button>
          <button class="carrossel-next"><i class="fas fa-chevron-right"></i></button>
          <div class="carrossel-dots">
            ${produto.imagens.map((_, i) => `<div class="carrossel-dot ${i === 0 ? 'ativo' : ''}"></div>`).join('')}
          </div>
        </div>
        <h3 class="produto-nome">${produto.nome}</h3>
        <p class="produto-preco">${parseFloat(produto.preco).toFixed(2)}</p>
        <p class="descricao">${produto.descricao}</p>
        <a href="${produto.link}?utm_source=centrocompras&utm_medium=card&utm_campaign=produto" target="_blank" class="tarja-preco tarja-${produto.loja.toLowerCase()}">
          Clique aqui para ver o preço
        </a>
      `;
      grid.appendChild(card);
    });

    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('load-more').style.display = currentPage * perPage < total ? 'block' : 'none';
    console.log('Produtos renderizados:', produtos.length, 'Total:', total);
    initCarrossel();
  }

  // Inicializar carrossel
  function initCarrossel() {
    document.querySelectorAll('.produto-card').forEach(card => {
      const carrossel = card.querySelector('.carrossel-imagens');
      const prev = card.querySelector('.carrossel-prev');
      const next = card.querySelector('.carrossel-next');
      const dots = card.querySelectorAll('.carrossel-dot');
      let currentIndex = 0;

      prev.addEventListener('click', () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : dots.length - 1;
        updateCarrossel(carrossel, dots, currentIndex);
      });

      next.addEventListener('click', () => {
        currentIndex = currentIndex < dots.length - 1 ? currentIndex + 1 : 0;
        updateCarrossel(carrossel, dots, currentIndex);
      });

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          currentIndex = index;
          updateCarrossel(carrossel, dots, currentIndex);
        });
      });

      card.querySelectorAll('.carrossel-imagens img').forEach(img => {
        img.addEventListener('click', () => openModal(card));
      });
    });
  }

  function updateCarrossel(carrossel, dots, index) {
    carrossel.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove('ativo'));
    dots[index].classList.add('ativo');
  }

  // Modal de imagens
  function openModal(card) {
    const modal = document.getElementById('imageModal');
    const modalCarrossel = document.getElementById('modalCarrosselImagens');
    const modalDots = document.getElementById('modalCarrosselDots');
    const imagens = card.querySelectorAll('.carrossel-imagens img');
    modalCarrossel.innerHTML = Array.from(imagens).map(img => `<img src="${img.src.replace('/w_300,h_300,c_fill/', '/w_600,h_600,c_fill/')}" alt="${img.alt}">`).join('');
    modalDots.innerHTML = Array.from(imagens).map((_, i) => `<div class="carrossel-dot ${i === 0 ? 'ativo' : ''}"></div>`).join('');
    modal.style.display = 'flex';

    let currentIndex = 0;
    const modalImagens = modalCarrossel.querySelectorAll('img');
    const modalDotsItems = modalDots.querySelectorAll('.carrossel-dot');

    document.getElementById('modalPrev').addEventListener('click', () => {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : modalImagens.length - 1;
      modalCarrossel.style.transform = `translateX(-${currentIndex * 100}%)`;
      modalDotsItems.forEach(d => d.classList.remove('ativo'));
      modalDotsItems[currentIndex].classList.add('ativo');
    });

    document.getElementById('modalNext').addEventListener('click', () => {
      currentIndex = currentIndex < modalImagens.length - 1 ? currentIndex + 1 : 0;
      modalCarrossel.style.transform = `translateX(-${currentIndex * 100}%)`;
      modalDotsItems.forEach(d => d.classList.remove('ativo'));
      modalDotsItems[currentIndex].classList.add('ativo');
    });

    modalDotsItems.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        modalCarrossel.style.transform = `translateX(-${currentIndex * 100}%)`;
        modalDotsItems.forEach(d => d.classList.remove('ativo'));
        modalDotsItems[index].classList.add('ativo');
      });
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Filtros e busca
  document.querySelectorAll('.category-item, .nav-link').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.category-item, .nav-link').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      categoriaSelecionada = item.dataset.categoria;
      currentPage = 1;
      document.getElementById('ofertas-titulo').textContent = item.textContent;
      console.log('Categoria selecionada:', categoriaSelecionada); // Log para depuração
      loadProdutos();
    });
  });

  document.querySelectorAll('.store-card').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.store-card').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      lojaSelecionada = item.dataset.loja;
      currentPage = 1;
      console.log('Loja selecionada:', lojaSelecionada); // Log para depuração
      loadProdutos();
    });
  });

  document.getElementById('busca').addEventListener('input', (e) => {
    buscaTermo = e.target.value;
    currentPage = 1;
    console.log('Termo de busca:', buscaTermo); // Log para depuração
    loadProdutos();
  });

  document.getElementById('sort-select').addEventListener('change', (e) => {
    sortBy = e.target.value;
    currentPage = 1;
    console.log('Ordenação selecionada:', sortBy); // Log para depuração
    loadProdutos();
  });

  document.getElementById('load-more').addEventListener('click', () => {
    currentPage++;
    console.log('Carregando mais produtos, página:', currentPage); // Log para depuração
    loadProdutos();
  });

  document.getElementById('categories-toggle').addEventListener('click', () => {
    document.getElementById('categories-sidebar').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  });

  document.getElementById('close-sidebar').addEventListener('click', () => {
    document.getElementById('categories-sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  });

  document.getElementById('overlay').addEventListener('click', () => {
    document.getElementById('categories-sidebar').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  });

  // Atualizar ano no footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Escutar mudanças no localStorage
  window.addEventListener('storage', (event) => {
    if (event.key === 'produtoAtualizado') {
      console.log('Mudança detectada, recarregando produtos...');
      currentPage = 1;
      loadProdutos();
    }
  });

  // Verificar mudanças ao carregar a página
  const checkForUpdates = () => {
    const lastUpdate = localStorage.getItem('produtoAtualizado');
    if (lastUpdate) {
      console.log('Atualização detectada ao carregar, recarregando produtos...');
      loadProdutos();
    }
    setTimeout(checkForUpdates, 5000); // Verificar a cada 5 segundos
  };

  // Carregar produtos ao iniciar
  loadProdutos();
  checkForUpdates();
});
