// script.js para index.html
let produtos = [];
let currentImages = [];
let currentImageIndex = 0;
const itensPorPagina = 20; // Exibir 20 produtos por página
let paginaAtual = 1;

function renderizarProdutos(produtosFiltrados) {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const loadingSpinner = document.getElementById('loading-spinner');

  loadingSpinner.style.display = 'none';
  gridProdutos.innerHTML = '';

  // Paginação
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(inicio, fim);

  if (produtosPaginados.length === 0 && produtosFiltrados.length > 0) {
    mensagemVazia.textContent = 'Nenhuma oferta nesta página.';
    mensagemVazia.style.display = 'block';
    return;
  }

  if (produtosFiltrados.length === 0) {
    mensagemVazia.textContent = 'Nenhum produto encontrado.';
    mensagemVazia.style.display = 'block';
    return;
  }

  mensagemVazia.style.display = 'none';
  produtosPaginados.forEach(produto => {
    const divProduto = document.createElement('div');
    divProduto.classList.add('produto-card');
    setTimeout(() => divProduto.classList.add('visible'), 10);
    const imagens = Array.isArray(produto.imagens) ? produto.imagens.filter(img => img && (img.startsWith('http') || img.startsWith('data:image'))) : [];
    divProduto.innerHTML = `
      <div class="carrossel">
        <div class="carrossel-imagens" id="carrossel-${produto._id}">
          ${imagens.length > 0 ?
            imagens.map(img => `<img src="${img}" alt="${produto.nome}" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=Sem+Imagem';">`).join('') :
            '<p>Sem imagem</p>'}
        </div>
        ${imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${produto._id}', -1)" aria-label="Imagem anterior">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${produto._id}', 1)" aria-label="Próxima imagem">►</button>
          <div class="carrossel-dots" id="dots-${produto._id}">
            ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${produto._id}', ${i})" aria-label="Ir para imagem ${i + 1}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome}</span>
      <span class="descricao">${produto.descricao || produto.descrição || 'Sem descrição'}</span>
      <a href="${produto.link || produto.linkAfiliado}" class="ver-na-loja ${produto.loja}" target="_blank">Ver na Loja</a>
    `;
    gridProdutos.appendChild(divProduto);
  });

  // Controles de paginação
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
  const paginacao = document.createElement('div');
  paginacao.className = 'paginacao';
  paginacao.innerHTML = `
    <button onclick="mudarPagina(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''} aria-label="Página anterior">◄ Anterior</button>
    <span>Página ${paginaAtual} de ${totalPaginas || 1}</span>
    <button onclick="mudarPagina(${paginaAtual + 1})" ${paginaAtual >= totalPaginas ? 'disabled' : ''} aria-label="Próxima página">Próxima ►</button>
  `;
  gridProdutos.appendChild(paginacao);
}

function moveCarrossel(produtoId, direction) {
  const carrossel = document.getElementById(`carrossel-${produtoId}`);
  if (!carrossel) return;
  const dots = document.getElementById(`dots-${produtoId}`)?.children;
  const totalImagens = carrossel.children.length;
  let index = parseInt(carrossel.dataset.index || 0);
  index = (index + direction + totalImagens) % totalImagens;
  carrossel.style.transform = `translateX(-${index * 100}%)`;
  carrossel.dataset.index = index;
  if (dots) Array.from(dots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function setCarrosselImage(produtoId, index) {
  const carrossel = document.getElementById(`carrossel-${produtoId}`);
  if (!carrossel) return;
  const dots = document.getElementById(`dots-${produtoId}`)?.children;
  carrossel.style.transform = `translateX(-${index * 100}%)`;
  carrossel.dataset.index = index;
  if (dots) Array.from(dots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function filtrarPorCategoria(categoria) {
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  const produtosFiltrados = categoria === 'todas' ? produtos : produtos.filter(p => p.categoria === categoria);
  paginaAtual = 1;
  renderizarProdutos(produtosFiltrados);
}

function filtrarPorLoja(loja) {
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja || (loja === 'todas' && item.classList.contains('loja-todas')));
  });
  const produtosFiltrados = loja === 'todas' ? produtos : produtos.filter(p => p.loja === loja);
  paginaAtual = 1;
  renderizarProdutos(produtosFiltrados);
}

function mudarPagina(pagina) {
  if (pagina < 1) return;
  paginaAtual = pagina;
  const termo = document.getElementById('busca').value.toLowerCase();
  const produtosFiltrados = termo ?
    produtos.filter(p => p.nome.toLowerCase().includes(termo) || (p.descricao || p.descrição || '').toLowerCase().includes(termo)) :
    produtos;
  renderizarProdutos(produtosFiltrados);
}

async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const urls = [
    'https://raw.githubusercontent.com/bingaby/centrodecompra/main/produtos.json',
    'https://bingaby.github.io/centrodecompra/produtos.json'
  ];

  // Verificar cache local
  const cache = localStorage.getItem('produtos_cache');
  const cacheTime = localStorage.getItem('produtos_cache_time');
  const cacheDuration = 10 * 60 * 1000; // 10 minutos
  const now = Date.now();

  if (cache && cacheTime && (now - cacheTime < cacheDuration)) {
    produtos = JSON.parse(cache).slice(0, 1000);
    renderizarProdutos(produtos);
    return;
  }

  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  try {
    let response;
    for (const url of urls) {
      try {
        response = await fetch(url);
        if (response.ok) break;
      } catch (e) {
        console.warn(`Falha ao tentar URL ${url}:`, e);
      }
    }
    if (!response || !response.ok) {
      if (response?.status === 404) {
        produtos = [];
        localStorage.setItem('produtos_cache', JSON.stringify(produtos));
        localStorage.setItem('produtos_cache_time', now);
        renderizarProdutos(produtos);
        mensagemVazia.textContent = 'Nenhum produto disponível. Adicione produtos no painel administrativo.';
        mensagemVazia.style.display = 'block';
        return;
      }
      throw new Error(`Erro HTTP: ${response?.status || 'Desconhecido'}`);
    }
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Resposta recebida:', text);
      throw new Error('Resposta não é JSON. Verifique produtos.json em https://github.com/bingaby/centrodecompra/blob/main/produtos.json.');
    }
    produtos = await response.json();
    produtos = produtos
      .filter(p => p.nome && (p.descricao || p.descrição) && p.categoria && p.loja && (p.link || p.linkAfiliado))
      .slice(0, 1000);
    localStorage.setItem('produtos_cache', JSON.stringify(produtos));
    localStorage.setItem('produtos_cache_time', now);
    renderizarProdutos(produtos);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    mensagemVazia.textContent = `Erro ao carregar produtos: ${error.message}. Corrija produtos.json ou contate o administrador.`;
    mensagemVazia.style.display = 'block';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('logo').addEventListener('dblclick', () => {
    const senha = prompt('Digite a senha de administrador:');
    if (senha === 'admin123') {
      window.location.href = 'admin-xyz-123.html';
    } else {
      alert('Senha incorreta!');
    }
  });

  // Adicionar busca
  document.getElementById('busca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const produtosFiltrados = produtos.filter(p =>
      p.nome.toLowerCase().includes(termo) ||
      (p.descricao || p.descrição || '').toLowerCase().includes(termo)
    );
    paginaAtual = 1;
    renderizarProdutos(produtosFiltrados);
  });

  // Adicionar botão de atualização
  const atualizarButton = document.createElement('button');
  atualizarButton.id = 'atualizar';
  atualizarButton.textContent = 'Atualizar Ofertas';
  atualizarButton.style.margin = '10px auto';
  atualizarButton.style.display = 'block';
  document.getElementById('ofertas-section').insertBefore(atualizarButton, document.getElementById('grid-produtos'));
  atualizarButton.addEventListener('click', () => {
    localStorage.removeItem('produtos_cache');
    localStorage.removeItem('produtos_cache_time');
    carregarProdutos();
  });

  // Carregar produtos
  carregarProdutos();
});
