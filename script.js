// script.js
const gridProdutos = document.getElementById('grid-produtos');
const mensagemVazia = document.getElementById('mensagem-vazia');
const buscaInput = document.getElementById('busca');
const buscaFeedback = document.getElementById('busca-feedback');
const loadingSpinner = document.querySelector('.loading-spinner');
const categorias = document.querySelectorAll('.categoria-item');
const lojas = document.querySelectorAll('.loja, .loja-todas');
const repoUrl = 'https://bingaby.github.io/centrodecompra/data/produtos.json';
let produtos = [];
let filtroCategoria = 'todas';
let filtroLoja = 'todas';
let filtroBusca = '';

// Função para carregar produtos
async function loadProdutos() {
    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    try {
        const response = await fetch(repoUrl);
        if (!response.ok) throw new Error(`Erro ao carregar produtos: ${response.status}`);
        produtos = await response.json();
        renderProdutos();
    } catch (error) {
        console.error('Erro:', error);
        mensagemVazia.textContent = 'Erro ao carregar produtos. Tente novamente.';
        mensagemVazia.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Função para renderizar produtos
function renderProdutos() {
    let filteredProdutos = produtos.filter(p => {
        const matchCategoria = filtroCategoria === 'todas' || p.category.toLowerCase() === filtroCategoria;
        const matchLoja = filtroLoja === 'todas' || p.store.toLowerCase() === filtroLoja;
        const matchBusca = !filtroBusca || p.name.toLowerCase().includes(filtroBusca.toLowerCase()) || p.description?.toLowerCase().includes(filtroBusca.toLowerCase());
        return matchCategoria && matchLoja && matchBusca;
    });

    gridProdutos.innerHTML = filteredProdutos.length > 0 ? filteredProdutos.map(p => `
        <div class="produto" data-categoria="${p.category.toLowerCase()}" data-loja="${p.store.toLowerCase()}">
            <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='imagens/placeholder.jpg'">
            <h3>${p.name}</h3>
            ${p.price ? `<p>R$${parseFloat(p.price).toFixed(2)}</p>` : ''}
            <a href="${p.link}" target="_blank" rel="noopener">Comprar na ${p.store}</a>
        </div>
    `).join('') : '';

    mensagemVazia.style.display = filteredProdutos.length === 0 ? 'block' : 'none';
}

// Função para filtrar por categoria
window.filtrarPorCategoria = function (categoria) {
    filtroCategoria = categoria.toLowerCase();
    categorias.forEach(item => item.classList.toggle('ativa', item.dataset.categoria === categoria));
    renderProdutos();
};

// Função para filtrar por loja
window.filtrarPorLoja = function (loja) {
    filtroLoja = loja.toLowerCase();
    lojas.forEach(item => item.classList.toggle('ativa', item.dataset.loja === loja));
    renderProdutos();
};

// Função para busca com debounce
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

buscaInput.addEventListener('input', debounce((e) => {
    filtroBusca = e.target.value.trim();
    buscaFeedback.style.display = filtroBusca ? 'block' : 'none';
    buscaFeedback.textContent = filtroBusca ? `Buscando "${filtroBusca}"...` : '';
    renderProdutos();
    if (filtroBusca) buscaFeedback.style.display = 'none';
}, 500));

// Atualizar ano no footer
document.getElementById('year').textContent = new Date().getFullYear();

// Carregar produtos ao iniciar
loadProdutos();
