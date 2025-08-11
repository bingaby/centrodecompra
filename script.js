// URL da API para buscar produtos
const API_URL = 'https://minha-api-produtos.onrender.com'; // Use 'http://localhost:10000' para testes locais

// Variáveis globais
let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const produtosPorPagina = 24; // Definido como 24 itens por página
let totalProdutos = 1000; // Será atualizado dinamicamente

/**
 * Atualiza o ano no footer com o ano atual.
 */
function atualizarAnoFooter() {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  } else {
    console.error('Elemento #year não encontrado');
  }
}

/**
 * Configura o evento de triplo clique no logotipo para redirecionar à página admin.
 */
function configurarCliqueLogo() {
  const logo = document.getElementById('site-logo-img');
  if (!logo) {
    console.error('ID site-logo-img não encontrado no DOM');
    return;
  }
  let clickCount = 0;
  let clickTimer;
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    clickCount++;
    console.log(`Clique detectado: ${clickCount}`);
    if (clickCount === 1) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        console.log('Contagem de cliques resetada');
      }, 500);
    } else if (clickCount === 3) {
      clearTimeout(clickTimer);
      console.log('Triplo clique detectado, redirecionando para admin-xyz-123.html');
      window.location.href = '/admin-xyz-123.html';
      clickCount = 0;
    }
  }, { once: false });
}

/**
 * Carrega produtos da API com retentativas.
 * @returns {Promise<void>}
 */
async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const gridProdutos = document.getElementById('grid-produtos');

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos essenciais (grid-produtos, mensagem-vazia, error-message, loading-spinner) não encontrados');
    return;
  }

  const maxRetries = 3;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      loadingSpinner.style.display = 'block';
      mensagemVazia.style.display = 'none';
      errorMessage.style.display = 'none';
      gridProdutos.innerHTML = '';

      console.log(`Tentativa ${attempt}: Carregando produtos de ${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`);
      const response = await fetch(
        `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Erro ${response.status}`);
      }
      const data = await response.json();
      produtos = Array.isArray(data.produtos) ? data.produtos.filter(produto => 
        produto && 
        typeof produto.nome === 'string' && 
        typeof produto.categoria === 'string' && 
        typeof produto.loja === 'string' && 
        Array.isArray(produto.imagens)
      ) : [];
      totalProdutos = data.total || produtos.length;
      console.log(`Produtos recebidos da API: ${produtos.length}, Total: ${totalProdutos}`);

      if (!Array.isArray(produtos)) {
        throw new Error('Resposta inválida da API: produtos não é um array');
      }

      filtrarProdutos();
      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`⚠️ Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt === maxRetries) {
        errorMessage.textContent = 'Não foi possível carregar os produtos. Tente novamente mais tarde.';
        errorMessage.style.display = 'block';
        mensagemVazia.style.display = 'none';
        gridProdutos.style.display = 'none';
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }
}

/**
 * Filtra e exibe os produtos no grid com base nos filtros selecionados.
 */
function filtrarProdutos() {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  if (!gridProdutos || !mensagemVazia) {
    console.error('grid-produtos ou mensagem-vazia não encontrados');
    return;
  }

  const produtosFiltrados = produtos
    .filter(produto => {
      const matchCategoria =
        categoriaSelecionada === 'todas' ||
        produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
      const matchLoja =
        lojaSelecionada === 'todas' ||
        produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
      const matchBusca =
        !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
      return matchCategoria && matchLoja && matchBusca;
    })
    .slice(0, produtosPorPagina);

  console.log(`Produtos filtrados: ${produtosFiltrados.length} (limitado a ${produtosPorPagina})`);

  gridProdutos.innerHTML = '';
  if (produtosFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    gridProdutos.style.display = 'none';
    console.log('Nenhum produto filtrado encontrado');
    return;
  }

  mensagemVazia.style.display = 'none';
  gridProdutos.style.display = 'grid';

  produtosFiltrados.forEach((produto, produtoIndex) => {
    const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
      ? produto.imagens.filter(img => typeof img === 'string' && img.trim() && /^https?:\/\//.test(img))
      : ['https://via.placeholder.com/200'];
    const carrosselId = `carrossel-${produtoIndex}-${produto._id || Date.now()}`;

    const produtoDiv = document.createElement('div');
    produtoDiv.classList.add('produto-card', 'visible');
    produtoDiv.setAttribute('data-categoria', produto.categoria?.toLowerCase() || 'todas');
    produtoDiv.setAttribute('data-loja', produto.loja?.toLowerCase() || 'todas');

    const carrosselDiv = document.createElement('div');
    carrosselDiv.classList.add('carrossel');
    carrosselDiv.id = carrosselId;

    const imagensDiv = document.createElement('div');
    imagensDiv.classList.add('carrossel-imagens');
    imagens.forEach((img, i) => {
      const imgElement = document.createElement('img');
      imgElement.src = img;
      imgElement.alt = `${produto.nome || 'Produto'} ${i + 1}`;
      imgElement.loading = 'lazy';
      imgElement.width = 200;
      imgElement.height = 200;
      imgElement.onerror = () => { imgElement.src = 'https://via.placeholder.com/200'; };
      imgElement.addEventListener('click', () => openModal(produtoIndex, i));
      imagensDiv.appendChild(imgElement);
    });
    carrosselDiv.appendChild(imagensDiv);

    if (imagens.length > 1) {
      const prevButton = document.createElement('button');
      prevButton.classList.add('carrossel-prev');
      prevButton.setAttribute('aria-label', 'Imagem anterior');
      prevButton.textContent = '◄';
      prevButton.addEventListener('click', () => moveCarrossel(carrosselId, -1));
      carrosselDiv.appendChild(prevButton);

      const nextButton = document.createElement('button');
      nextButton.classList.add('carrossel-next');
      nextButton.setAttribute('aria-label', 'Próxima imagem');
      nextButton.textContent = '▶';
      nextButton.addEventListener('click', () => moveCarrossel(carrosselId, 1));
      carrosselDiv.appendChild(nextButton);

      const dotsDiv = document.createElement('div');
      dotsDiv.classList.add('carrossel-dots');
      imagens.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.classList.add('carrossel-dot');
        if (i === 0) dot.classList.add('ativo');
        dot.setAttribute('aria-label', `Imagem ${i + 1}`);
        dot.addEventListener('click', () => setCarrosselImage(carrosselId, i));
        dotsDiv.appendChild(dot);
      });
      carrosselDiv.appendChild(dotsDiv);
    }

    const nome = document.createElement('span');
    nome.textContent = produto.nome || 'Produto sem nome';

    const loja = document.createElement('span');
    loja.classList.add('descricao');
    loja.textContent = `Loja: ${produto.loja || 'Desconhecida'}`;

    const preco = document.createElement('p');
    preco.classList.add('preco');
    const precoLink = document.createElement('a');
    precoLink.href = produto.link || '#';
    precoLink.target = '_blank';
    precoLink.classList.add('ver-preco');
    precoLink.textContent = 'Clique aqui para ver o preço';
    preco.appendChild(precoLink);

    const comprarLink = document.createElement('a');
    comprarLink.href = produto.link || '#';
    comprarLink.target = '_blank';
    comprarLink.classList.add('ver-na-loja', produto.loja?.toLowerCase() || 'default');
    comprarLink.textContent = 'Comprar';

    produtoDiv.appendChild(carrosselDiv);
    produtoDiv.appendChild(nome);
    produtoDiv.appendChild(loja);
    produtoDiv.appendChild(preco);
    produtoDiv.appendChild(comprarLink);
    gridProdutos.appendChild(produtoDiv);
  });

  console.log(`Exibidos ${produtosFiltrados.length} produtos no #grid-produtos`);
}

/**
 * Move o carrossel de imagens em uma direção específica.
 * @param {string} carrosselId - ID do carrossel.
 * @param {number} direction - Direção do movimento (-1 para anterior, 1 para próximo).
 */
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');
  let currentIndex = parseInt(imagens.dataset.index || 0);
  const totalImagens = imagens.children.length;

  currentIndex = (currentIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    imagens.style.transform = `translateX(-${currentIndex * 100}%)`;
    imagens.dataset.index = currentIndex;
    dots.forEach((dot, i) => dot.classList.toggle('ativo', i === currentIndex));
  });
}

/**
 * Define a imagem atual do carrossel.
 * @param {string} carrosselId - ID do carrossel.
 * @param {number} index - Índice da imagem a ser exibida.
 */
function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  if (!carrossel) return;
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');

  requestAnimationFrame(() => {
    imagens.style.transform = `translateX(-${index * 100}%)`;
    imagens.dataset.index = index;
    dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
  });
}

/**
 * Abre o modal com as imagens do produto.
 * @param {number} produtoIndex - Índice do produto na lista.
 * @param {number} imageIndex - Índice da imagem inicial.
 */
async function openModal(produtoIndex, imageIndex) {
  const modal = document.getElementById('imageModal');
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots');

  if (!modal || !carrosselImagens || !carrosselDots) {
    console.error('Elementos do modal não encontrados');
    return;
  }

  try {
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) && produtos[produtoIndex].imagens.length > 0
      ? produtos[produtoIndex].imagens.filter(img => typeof img === 'string' && img.trim() && /^https?:\/\//.test(img))
      : ['https://via.placeholder.com/200'];
    currentImageIndex = imageIndex;

    console.log('🔍 Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages });

    const validImages = await Promise.all(currentImages.map(img => {
      return new Promise(resolve => {
        const testImg = new Image();
        testImg.src = img;
        testImg.onload = () => resolve(img);
        testImg.onerror = () => resolve('https://via.placeholder.com/200');
      });
    }));
    currentImages = validImages;

    carrosselImagens.innerHTML = '';
    currentImages.forEach((img, i) => {
      const imgElement = document.createElement('img');
      imgElement.src = img;
      imgElement.alt = `Imagem ${i + 1}`;
      imgElement.classList.add('modal-image');
      imgElement.loading = 'lazy';
      imgElement.width = 600;
      imgElement.height = 600;
      imgElement.onerror = () => { imgElement.src = 'https://via.placeholder.com/200'; };
      carrosselImagens.appendChild(imgElement);
    });

    requestAnimationFrame(() => {
      carrosselImagens.style.width = '100%';
      carrosselImagens.style.display = 'flex';
      carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

      const imagens = carrosselImagens.querySelectorAll('img');
      imagens.forEach(img => {
        img.style.width = '100%';
        img.style.flex = '0 0 100%';
        img.style.objectFit = 'contain';
      });
    });

    carrosselDots.innerHTML = currentImages.map((_, i) => `
      <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" aria-label="Imagem ${i + 1}" onclick="setModalCarrosselImage(${i})"></span>
    `).join('');

    modal.style.display = 'flex';
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
    carrosselImagens.innerHTML = '<p>Erro ao carregar imagens. Tente novamente.</p>';
    modal.style.display = 'flex';
  }
}

/**
 * Move o carrossel do modal.
 * @param {number} direction - Direção do movimento (-1 para anterior, 1 para próximo).
 */
function moveModalCarrossel(direction) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  const totalImagens = currentImages.length;

  currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  });
}

/**
 * Define a imagem atual no carrossel do modal.
 * @param {number} index - Índice da imagem a ser exibida.
 */
function setModalCarrosselImage(index) {
  const carrosselImagens = document.getElementById('modalCarrosselImagens');
  const carrosselDots = document.getElementById('modalCarrosselDots')?.children;
  currentImageIndex = index;
  requestAnimationFrame(() => {
    carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  });
}

/**
 * Fecha o modal de imagens.
 */
function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
    currentImages = [];
    currentImageIndex = 0;
  }
}

/**
 * Configura o campo de busca com debounce.
 */
function configurarBusca() {
  const inputBusca = document.getElementById('busca');
  const buscaFeedback = document.getElementById('busca-feedback');
  let debounceTimer;

  if (!inputBusca || !buscaFeedback) {
    console.error('Elementos de busca não encontrados');
    return;
  }

  inputBusca.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    termoBusca = inputBusca.value.trim();

    if (termoBusca) {
      buscaFeedback.style.display = 'block';
      buscaFeedback.textContent = `Buscando por "${termoBusca}"...`;
    } else {
      buscaFeedback.style.display = 'none';
    }

    currentPage = 1;
    debounceTimer = setTimeout(() => carregarProdutos(), 300);
  });
}

/**
 * Configura os eventos de paginação.
 */
function configurarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  if (!prevButton || !nextButton) {
    console.error('Botões de paginação não encontrados');
    return;
  }

  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentPage < Math.ceil(totalProdutos / produtosPorPagina)) {
      currentPage++;
      carregarProdutos();
    }
  });
}

/**
 * Atualiza os controles de paginação.
 */
function atualizarPaginacao() {
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');

  if (!prevButton || !nextButton || !pageInfo) {
    console.error('Elementos de paginação não encontrados');
    return;
  }

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
  pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina)}`;
  console.log(`Paginação: Página ${currentPage}, Total de produtos: ${totalProdutos}, Itens por página: ${produtosPorPagina}`);
}

/**
 * Filtra produtos por categoria.
 * @param {string} categoria - Categoria selecionada.
 */
function filtrarPorCategoria(categoria) {
  categoriaSelecionada = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria.toLowerCase() === categoria.toLowerCase());
  });
  carregarProdutos();
}

/**
 * Filtra produtos por loja.
 * @param {string} loja - Loja selecionada.
 */
function filtrarPorLoja(loja) {
  lojaSelecionada = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja.toLowerCase() === loja.toLowerCase());
  });
  carregarProdutos();
}

/**
 * Inicializa a página ao carregar o DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando página');
  carregarProdutos();
  configurarBusca();
  configurarPaginacao();
  atualizarAnoFooter();
  configurarCliqueLogo();

  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  } else {
    console.error('Modal imageModal não encontrado');
  }
});
