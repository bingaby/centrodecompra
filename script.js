const productGrid = document.getElementById('grid-produtos');
const loadingSpinner = document.getElementById('loading-spinner');
const mensagemVazia = document.getElementById('mensagem-vazia');
const errorMessage = document.getElementById('error-message');

const showError = (message) => {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }, 5000);
};

const loadProducts = async () => {
  loadingSpinner.style.display = 'block';
  mensagemVazia.style.display = 'none';
  productGrid.innerHTML = '';

  try {
    const response = await fetch('SUA_URL_DO_APPS_SCRIPT'); // Substitua pela URL do Apps Script
    const produtos = await response.json();
    console.log('Produtos encontrados:', produtos); // Depuração

    if (produtos.length === 0) {
      mensagemVazia.style.display = 'block';
      return;
    }

    produtos.forEach(produto => {
      const productItem = document.createElement('div');
      productItem.className = 'produto';
      productItem.innerHTML = `
        <h3>${produto.nome}</h3>
        ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" loading="lazy" style="max-width: 100px;">` : ''}
        <p>Preço: R$${produto.preco.toFixed(2)}</p>
        <p>Tamanho: ${produto.tamanho}</p>
      `;
      productGrid.appendChild(productItem);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    showError('Erro ao carregar produtos: ' + error.message);
  } finally {
    loadingSpinner.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Carregando produtos...'); // Depuração
  loadProducts();
  document.getElementById('year').textContent = new Date().getFullYear();
});
