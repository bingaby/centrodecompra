// Configuração da API
const API_CONFIG = {
    BASE_URL: 'https://minha-api-produtos.onrender.com',
    TOKEN: '098457098457',
    TIMEOUT: 15000
};

// Elementos do DOM
const productsGrid = document.getElementById('admin-products-grid');
const loadingSpinner = document.getElementById('admin-loading-spinner');
const emptyState = document.getElementById('admin-mensagem-vazia');
const errorState = document.getElementById('admin-error-message');
const productForm = document.getElementById('admin-product-form');
const formFeedback = document.getElementById('admin-form-feedback');
const connectionStatus = document.querySelector('.connection-status');
const statusMessage = document.getElementById('status-message');

// Estado da página
let currentPage = 1;
let totalProdutos = 0;

// Inicializar Socket.IO
const socket = io(API_CONFIG.BASE_URL);

// Atualizar status de conexão
function updateConnectionStatus(isOnline) {
    if (connectionStatus) {
        connectionStatus.classList.toggle('online', isOnline);
        connectionStatus.classList.toggle('offline', !isOnline);
        statusMessage.textContent = isOnline ? 'Conectado ao servidor' : 'Sem conexão com o servidor';
        connectionStatus.classList.remove('hidden');
    }
}

// Verificar conexão com a API
async function checkConnection() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
            method: 'GET',
            timeout: 5000
        });
        const result = await response.json();
        updateConnectionStatus(result.status === 'success');
    } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        updateConnectionStatus(false);
    }
}

// Função para buscar produtos
async function fetchProducts(page = 1, reset = false) {
    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (reset) {
            currentPage = 1;
            productsGrid.innerHTML = '';
        }

        const params = new URLSearchParams({ page, limit: 12 });
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/produtos?${params}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: API_CONFIG.TIMEOUT
        });

        const result = await response.json();
        if (result.status === 'success') {
            totalProdutos = result.total;
            displayProducts(result.data, reset);
        } else {
            showError('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        showError('Não foi possível carregar os produtos. Verifique sua conexão.');
        updateConnectionStatus(false);
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Função para exibir produtos
function displayProducts(produtos, reset = false) {
    if (reset) {
        productsGrid.innerHTML = '';
    }

    if (produtos.length === 0 && currentPage === 1) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        card.innerHTML = `
            <img src="${produto.imagens[0] || 'https://via.placeholder.com/300'}" alt="${produto.nome}" class="admin-product-image">
            <div class="admin-product-info">
                <h3>${produto.nome}</h3>
                <p>R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                <p>Categoria: ${produto.categoria}</p>
                <p>Loja: ${produto.loja}</p>
                <p>Visualizações: ${produto.views} | Vendas: ${produto.sales}</p>
                <button class="edit-btn" data-id="${produto.id}">Editar</button>
                <button class="delete-btn" data-id="${produto.id}">Excluir</button>
            </div>
        `;
        productsGrid.appendChild(card);

        card.querySelector('.edit-btn').addEventListener('click', () => populateForm(produto));
        card.querySelector('.delete-btn').addEventListener('click', () => deleteProduct(produto.id));
    });
}

// Função para adicionar/editar produto
async function saveProduct(event) {
    event.preventDefault();
    const formData = new FormData(productForm);
    const id = formData.get('id');
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_CONFIG.BASE_URL}/api/produtos/${id}` : `${API_CONFIG.BASE_URL}/api/produtos`;

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${API_CONFIG.TOKEN}`
            },
            body: formData,
            timeout: API_CONFIG.TIMEOUT
        });

        const result = await response.json();
        if (result.status === 'success') {
            showFeedback(`Produto ${id ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            productForm.reset();
            fetchProducts(1, true);
        } else {
            showFeedback(result.message || 'Erro ao salvar produto', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showFeedback('Não foi possível salvar o produto. Verifique sua conexão.', 'error');
        updateConnectionStatus(false);
    }
}

// Função para excluir produto
async function deleteProduct(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/produtos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${API_CONFIG.TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: API_CONFIG.TIMEOUT
        });

        const result = await response.json();
        if (result.status === 'success') {
            showFeedback('Produto excluído com sucesso!', 'success');
            fetchProducts(1, true);
        } else {
            showFeedback(result.message || 'Erro ao excluir produto', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showFeedback('Não foi possível excluir o produto. Verifique sua conexão.', 'error');
        updateConnectionStatus(false);
    }
}

// Função para preencher formulário ao editar
function populateForm(produto) {
    productForm.querySelector('#id').value = produto.id;
    productForm.querySelector('#nome').value = produto.nome;
    productForm.querySelector('#preco').value = produto.preco;
    productForm.querySelector('#categoria').value = produto.categoria;
    productForm.querySelector('#loja').value = produto.loja;
    productForm.querySelector('#link').value = produto.link;
    productForm.querySelector('#descricao').value = produto.descricao || '';
}

// Função para exibir feedback
function showFeedback(message, type) {
    if (formFeedback) {
        formFeedback.textContent = message;
        formFeedback.className = `feedback ${type}`;
        formFeedback.classList.remove('hidden');
        setTimeout(() => {
            formFeedback.classList.add('hidden');
        }, 3000);
    }
}

// Função para exibir erro
function showError(message) {
    if (errorState) {
        errorState.querySelector('p').textContent = message;
        errorState.style.display = 'flex';
    }
    updateConnectionStatus(false);
}

// Eventos
if (productForm) {
    productForm.addEventListener('submit', saveProduct);
}

// Atualizações em tempo real via Socket.IO
socket.on('connect', () => updateConnectionStatus(true));
socket.on('disconnect', () => updateConnectionStatus(false));

socket.on('novoProduto', () => {
    fetchProducts(1, true);
    showFeedback('Novo produto adicionado!', 'success');
});

socket.on('produtoAtualizado', () => {
    fetchProducts(1, true);
    showFeedback('Produto atualizado!', 'success');
});

socket.on('produtoExcluido', () => {
    fetchProducts(1, true);
    showFeedback('Produto excluído!', 'success');
});

// Carregar produtos e verificar conexão ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    checkConnection();
    fetchProducts();
    setInterval(checkConnection, 30000); // Verifica conexão a cada 30s
});