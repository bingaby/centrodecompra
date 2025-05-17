// Função para carregar e exibir produtos
async function loadProducts() {
  try {
    // Exibir spinner de carregamento
    document.querySelector('.loading-spinner').style.display = 'block';
    document.getElementById('mensagem-vazia').style.display = 'none';

    // Carregar o JSON
    const response = await fetch('data/produtos.json'); // Ajuste o caminho se necessário
    if (!response.ok) {
      throw new Error('Erro ao carregar produtos.json');
    }
    const products = await response.json();

    // Armazenar produtos globalmente para filtros
    window.allProducts = products;

    // Exibir todos os produtos inicialmente
    displayProducts(products);

    // Esconder spinner
    document.querySelector('.loading-spinner').style.display = 'none';
  } catch (error) {
    console.error('Erro:', error);
    document.querySelector('.loading-spinner').style.display = 'none';
    document.getElementById('mensagem-vazia').style.display = 'block';
    document.getElementById('mensagem-vazia').textContent = 'Erro ao carregar produtos.';
  }
}

// Função para exibir produtos no grid
function displayProducts(products) {
  const gridProdutos = document.getElementById('grid-produtos');
  gridProdutos.innerHTML = ''; // Limpar o grid

  if (products.length === 0) {
    document.getElementById('mensagem-vazia').style.display = 'block';
    document.getElementById('mensagem-vazia').textContent = 'Nenhum produto encontrado.';
    return;
  }

  products.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.className = 'produto';
    productDiv.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='imagens/placeholder.jpg'" />
      <h3>${product.name}</h3>
      <p class="preco">R$${product.price.toFixed(2)}</p>
      <p class="loja">${product.store}</p>
      <a href="${product.link}" target="_blank" class="botao-comprar">Comprar</a>
    `;
    gridProdutos.appendChild(productDiv);
  });
}

// Função para filtrar por categoria
function filtrarPorCategoria(categoria) {
  // Atualizar estilo dos itens de categoria
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.classList.toggle('ativa', item.dataset.categoria === categoria);
  });

  // Filtrar produtos
  let filteredProducts = window.allProducts || [];
  if (categoria !== 'todas') {
    filteredProducts = filteredProducts.filter(product => product.category.toLowerCase() === categoria.toLowerCase());
  }

  // Aplicar filtro de loja ativo (se houver)
  const lojaAtiva = document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas';
  if (lojaAtiva !== 'todas') {
    filteredProducts = filteredProducts.filter(product => product.store.toLowerCase() === lojaAtiva.toLowerCase());
  }

  // Aplicar busca (se houver)
  const busca = document.getElementById('busca').value.trim().toLowerCase();
  if (busca) {
    filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(busca));
  }

  displayProducts(filteredProducts);
}

// Função para filtrar por loja
function filtrarPorLoja(loja) {
  // Atualizar estilo dos itens de loja
  document.querySelectorAll('.loja, .loja-todas').forEach(item => {
    item.classList.toggle('ativa', item.dataset.loja === loja);
  });

  // Filtrar produtos
  let filteredProducts = window.allProducts || [];
  if (loja !== 'todas') {
    filteredProducts = filteredProducts.filter(product => product.store.toLowerCase() === loja.toLowerCase());
  }

  // Aplicar filtro de categoria ativo (se houver)
  const categoriaAtiva = document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas';
  if (categoriaAtiva !== 'todas') {
    filteredProducts = filteredProducts.filter(product => product.category.toLowerCase() === categoriaAtiva.toLowerCase());
  }

  // Aplicar busca (se houver)
  const busca = document.getElementById('busca').value.trim().toLowerCase();
  if (busca) {
    filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(busca));
  }

  displayProducts(filteredProducts);
}

// Função para busca
function buscarProdutos() {
  const busca = document.getElementById('busca').value.trim().toLowerCase();
  let filteredProducts = window.allProducts || [];

  // Aplicar filtro de categoria ativo
  const categoriaAtiva = document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas';
  if (categoriaAtiva !== 'todas') {
    filteredProducts = filteredProducts.filter(product => product.category.toLowerCase() === categoriaAtiva.toLowerCase());
  }

  // Aplicar filtro de loja ativo
  const lojaAtiva = document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas';
  if (lojaAtiva !== 'todas') {
    filteredProducts = filteredProducts.filter(product => product.store.toLowerCase() === lojaAtiva.toLowerCase());
  }

  // Aplicar busca
  if (busca) {
    filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(busca));
    document.getElementById('busca-feedback').style.display = 'block';
    document.getElementById('busca-feedback').textContent = `Resultados para "${busca}"`;
  } else {
    document.getElementById('busca-feedback').style.display = 'none';
  }

  displayProducts(filteredProducts);
}

// Configurar eventos
document.addEventListener('DOMContentLoaded', () => {
  // Carregar produtos ao iniciar
  loadProducts();

  // Evento de busca
  document.getElementById('busca').addEventListener('input', buscarProdutos);

  // Atualizar ano no footer
  document.getElementById('year').textContent = new Date().getFullYear();
});
