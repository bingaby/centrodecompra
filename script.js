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
    divProduto.innerHTML = `
      <div class="carrossel">
        <div class="carrossel-imagens" id="carrossel-${produto._id}">
          ${produto.imagens && produto.imagens.length > 0 ?
            produto.imagens.map(img => `<img src="${img}" alt="${produto.nome}" loading="lazy">`).join('') :
            '<p>Sem imagem</p>'}
        </div>
        ${produto.imagens && produto.imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${produto._id}', -1)" aria-label="Imagem anterior">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${produto._id}', 1)" aria-label="Próxima imagem">►</button>
          <div class="carrossel-dots" id="dots-${produto._id}">
            ${produto.imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${produto._id}', ${i})" aria-label="Ir para imagem ${i + 1}"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome}</span>
      <span class="descricao">${produto.descrição || produto.descricao}</span>
      <a href="${produto.link || produto.linkAfiliado}" class="ver-na-loja ${produto.loja}" target="_blank">Ver na Loja</a>
    `;
    gridProdutos.appendChild(divProduto);
  });

  // Adicionar controles de paginação
  const paginacao = document.createElement('div');
  paginacao.className = 'paginacao';
  paginacao.innerHTML = `
    <button onclick="mudarPagina(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''} aria-label="Página anterior">◄ Anterior</button>
    <span>Página ${paginaAtual} de ${Math.ceil(produtosFiltrados.length / itensPorPagina)}</span>
    <button onclick="mudarPagina(${paginaAtual + 1})" ${fim >= produtosFiltrados.length ? 'disabled' : ''} aria-label="Próxima página">Próxima ►</button>
  `;
  gridProdutos.appendChild(paginacao);
}

function moveCarrossel(produtoId, direction) {
  const carrossel = document.getElementById(`carrossel-${produtoId}`);
  const dots = document.getElementById(`dots-${produtoId}`).children;
  const totalImagens = carrossel.children.length;
  let index = parseInt(carrossel.dataset.index || 0);
  index = (index + direction + totalImagens) % totalImagens;
  carrossel.style.transform = `translateX(-${index * 100}%)`;
  carrossel.dataset.index = index;
  Array.from(dots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function setCarrosselImage(produtoId, index) {
  const carrossel = document.getElementById(`carrossel-${produtoId}`);
  const dots = document.getElementById(`dots-${produtoId}`).children;
  carrossel.style.transform = `translateX(-${index * 100}%)`;
  carrossel.dataset.index = index;
  Array.from(dots).forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function filtrarPorCategoria(categoria) {
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });
  const produtosFiltrados = categoria === 'todas' ? produtos : produtos.filter(p => p.categoria === categoria);
  paginaAtual = 1; // Resetar página ao filtrar
  renderizarProdutos(produtosFiltrados);
}

function filtrarPorLoja(loja) {
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja || (loja === 'todas' && item.classList.contains('loja-todas')));
  });
  const produtosFiltrados = loja === 'todas' ? produtos : produtos.filter(p => p.loja === loja);
  paginaAtual = 1; // Resetar página ao filtrar
  renderizarProdutos(produtosFiltrados);
}

function mudarPagina(pagina) {
  paginaAtual = pagina;
  const termo = document.getElementById('busca').value.toLowerCase();
  const produtosFiltrados = termo ?
    produtos.filter(p => p.nome.toLowerCase().includes(termo) || (p.descrição || p.descricao).toLowerCase().includes(termo)) :
    produtos;
  renderizarProdutos(produtosFiltrados);
}

function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  // Verificar cache local
  const cache = localStorage.getItem('produtos_cache');
  const cacheTime = localStorage.getItem('produtos_cache_time');
  const cacheDuration = 10 * 60 * 1000; // 10 minutos
  const now = Date.now();

  if (cache && cacheTime && (now - cacheTime < cacheDuration)) {
    produtos = JSON.parse(cache).slice(0, 1000); // Limitar a 1000 itens
    renderizarProdutos(produtos);
    return;
  }

  loadingSpinner.style.display = 'block';
  fetch('https://raw.githubusercontent.com/bingaby/centrodecompra/main/produtos.json')
    .then(response => {
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return response.json();
    })
    .then(data => {
      produtos = data
        .filter(p => p.nome && (p.descrição || p.descricao) && p.categoria && p.loja && (p.link || p.linkAfiliado))
        .slice(0, 1000); // Limitar a 1000 itens
      localStorage.setItem('produtos_cache', JSON.stringify(produtos));
      localStorage.setItem('produtos_cache_time', Date.now());
      renderizarProdutos(produtos);
    })
    .catch(error => {
      console.error('Erro ao carregar produtos:', error);
      mensagemVazia.textContent = 'Erro ao carregar produtos. Tente novamente mais tarde.';
      mensagemVazia.style.display = 'block';
    })
    .finally(() => {
      loadingSpinner.style.display = 'none';
    });
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
      (p.descrição || p.descricao).toLowerCase().includes(termo)
    );
    paginaAtual = 1; // Resetar página ao buscar
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
