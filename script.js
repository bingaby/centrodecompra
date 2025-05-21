let produtos = [];
let currentImages = [];
let currentImageIndex = 0;

function renderizarProdutos(produtosFiltrados) {
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const loadingSpinner = document.getElementById('loading-spinner');

  loadingSpinner.style.display = 'none';
  gridProdutos.innerHTML = '';

  if (produtosFiltrados.length === 0) {
    mensagemVazia.style.display = 'block';
    return;
  }

  mensagemVazia.style.display = 'none';
  produtosFiltrados.forEach(produto => {
    const divProduto = document.createElement('div');
    divProduto.classList.add('produto-card');
    setTimeout(() => divProduto.classList.add('visible'), 10);
    divProduto.innerHTML = `
      <div class="carrossel">
        <div class="carrossel-imagens" id="carrossel-${produto._id}">
          ${produto.imagens.map(img => `<img src="${img}" alt="${produto.nome}" loading="lazy">`).join('')}
        </div>
        ${produto.imagens.length > 1 ? `
          <button class="carrossel-prev" onclick="moveCarrossel('${produto._id}', -1)">◄</button>
          <button class="carrossel-next" onclick="moveCarrossel('${produto._id}', 1)">►</button>
          <div class="carrossel-dots" id="dots-${produto._id}">
            ${produto.imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${produto._id}', ${i})"></span>`).join('')}
          </div>
        ` : ''}
      </div>
      <span>${produto.nome}</span>
      <span class="descricao">${produto.descricao}</span>
      <a href="${produto.link || produto.linkAfiliado}" class="ver-na-loja ${produto.loja}" target="_blank">Ver na Loja</a>
    `;
    gridProdutos.appendChild(divProduto);
  });
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
  renderizarProdutos(produtosFiltrados);
}

function filtrarPorLoja(loja) {
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja || (loja === 'todas' && item.classList.contains('loja-todas')));
  });
  const produtosFiltrados = loja === 'todas' ? produtos : produtos.filter(p => p.loja === loja);
  renderizarProdutos(produtosFiltrados);
}

function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  // Verificar cache local
  const cache = localStorage.getItem('produtos_cache');
  const cacheTime = localStorage.getItem('produtos_cache_time');
  const cacheDuration = 10 * 60 * 1000; // 10 minutos em milissegundos
  const now = Date.now();

  if (cache && cacheTime && (now - cacheTime < cacheDuration)) {
    produtos = JSON.parse(cache);
    produtos = produtos.slice(0, 1000); // Limitar a 1000 itens
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
      produtos = data.slice(0, 1000); // Limitar a 1000 itens
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
      p.descrição.toLowerCase().includes(termo)
    );
    renderizarProdutos(produtosFiltrados);
  });

  // Carregar produtos
  carregarProdutos();
});
