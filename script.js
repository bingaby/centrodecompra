const BACKEND_URL = 'https://api-centro-de-compras.onrender.com/api/produtos';
let currentPage = 1;
const itemsPerPage = 25;
let currentCategoria = 'todas';
let currentLoja = 'todas';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  carregarProdutos();
  document.getElementById('busca').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    currentPage = 1;
    carregarProdutos();
  });
});

function filtrarPorCategoria(categoria) {
  currentCategoria = categoria;
  currentPage = 1;
  document.querySelectorAll('.categoria-item').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`.categoria-item[data-categoria="${categoria}"]`).classList.add('ativa');
  carregarProdutos();
}

function filtrarPorLoja(loja) {
  currentLoja = loja;
  currentPage = 1;
  document.querySelectorAll('.loja, .loja-todas').forEach(item => item.classList.remove('ativa'));
  document.querySelector(`[data-loja="${loja}"], .loja-todas`).classList.add('ativa');
  carregarProdutos();
}

async function carregarProdutos() {
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const pageInfo = document.getElementById('page-info');
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  spinner.style.display = 'block';
  grid.innerHTML = '';
  mensagemVazia.style.display = 'none';
  errorMessage.style.display = 'none';

  try {
    const response = await fetch(`${BACKEND_URL}?page=${currentPage}&limit=${itemsPerPage}`);
    if (!response.ok) throw new Error(`Erro ${response.status}: ${await response.text()}`);
    const { produtos, total, totalPages } = await response.json();

    let filteredProdutos = produtos;
    if (currentCategoria !== 'todas') {
      filteredProdutos = filteredProdutos.filter(p => p.categoria === currentCategoria);
    }
    if (currentLoja !== 'todas') {
      filteredProdutos = filteredProdutos.filter(p => p.loja === currentLoja);
    }
    if (searchQuery) {
      filteredProdutos = filteredProdutos.filter(p => p.nome.toLowerCase().includes(searchQuery) || p.descricao.toLowerCase().includes(searchQuery));
    }

    if (filteredProdutos.length === 0) {
      mensagemVazia.style.display = 'block';
    } else {
      filteredProdutos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
          <div class="carrossel">
            <div class="carrossel-imagens" id="carrossel-${produto.rowIndex}">
              ${produto.imagens.map(img => `<img src="${img}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/200?text=Imagem+Indisponivel'">`).join('')}
            </div>
            ${produto.imagens.length > 1 ? `
              <button class="carrossel-prev" onclick="moveCarrossel(${produto.rowIndex}, -1)">◄</button>
              <button class="carrossel-next" onclick="moveCarrossel(${produto.rowIndex}, 1)">▶</button>
              <div class="carrossel-dots" id="dots-${produto.rowIndex}">
                ${produto.imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrossel(${produto.rowIndex}, ${i})"></span>`).join('')}
              </div>
            ` : ''}
          </div>
          <span>${produto.nome}</span>
          <span class="descricao">${produto.descricao}</span>
          <span class="preco">R$${produto.preco}</span>
          <a href="${produto.link}" class="ver-na-loja" target="_blank">Ver na Loja</a>
        `;
        grid.appendChild(card);
      });
    }

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    prevButton.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        carregarProdutos();
      }
    };
    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        carregarProdutos();
      }
    };
  } catch (error) {
    console.error('Erro:', error);
    errorMessage.textContent = `Erro ao carregar produtos: ${error.message}`;
    errorMessage.style.display = 'block';
  } finally {
    spinner.style.display = 'none';
  }
}

function moveCarrossel(rowIndex, direction) {
  const carrossel = document.getElementById(`carrossel-${rowIndex}`);
  const images = carrossel.querySelectorAll('img');
  const dots = document.getElementById(`dots-${rowIndex}`).querySelectorAll('.carrossel-dot');
  let current = parseInt(carrossel.dataset.current || 0);
  current = (current + direction + images.length) % images.length;
  carrossel.dataset.current = current;
  carrossel.style.transform = `translateX(-${current * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === current));
}

function setCarrossel(rowIndex, index) {
  const carrossel = document.getElementById(`carrossel-${rowIndex}`);
  const dots = document.getElementById(`dots-${rowIndex}`).querySelectorAll('.carrossel-dot');
  carrossel.dataset.current = index;
  carrossel.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((dot, i) => dot.classList.toggle('ativa', i === index));
}
