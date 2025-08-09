document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://minha-api-produtos.onrender.com/api';
    const socket = io(apiBaseUrl);

    // Variáveis do DOM
    const statusEl = document.querySelector('.connection-status');
    const statusMessageEl = document.getElementById('status-message');
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const loginFeedbackEl = document.getElementById('login-feedback');
    const adminPanelContent = document.getElementById('admin-panel-content');
    const logoutBtn = document.getElementById('logout-btn');
    const adminProductForm = document.getElementById('admin-product-form');
    const adminFormFeedback = document.getElementById('admin-form-feedback');
    const productsGrid = document.getElementById('admin-products-grid');
    const loadingSpinner = document.getElementById('admin-loading-spinner');
    const emptyMessage = document.getElementById('admin-mensagem-vazia');
    const errorMessage = document.getElementById('admin-error-message');

    let token = localStorage.getItem('jwt_token');

    const updateConnectionStatus = (status, message) => {
        statusEl.classList.remove('online', 'offline', 'connecting');
        statusEl.classList.add(status);
        statusMessageEl.textContent = message;
        statusEl.classList.remove('hidden');
    };

    const toggleAdminPanel = (isLoggedIn) => {
        if (isLoggedIn) {
            loginSection.style.display = 'none';
            adminPanelContent.style.display = 'block';
            logoutBtn.style.display = 'block';
        } else {
            loginSection.style.display = 'block';
            adminPanelContent.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    };

    const checkAuthStatus = () => {
        token = localStorage.getItem('jwt_token');
        if (token) {
            toggleAdminPanel(true);
            fetchProducts();
        } else {
            toggleAdminPanel(false);
        }
    };

    // --- Conexão e Status do Servidor ---
    socket.on('connect', () => {
        updateConnectionStatus('online', 'Online');
        console.log('Socket.IO conectado (admin)');
    });

    socket.on('disconnect', () => {
        updateConnectionStatus('offline', 'Desconectado');
    });

    // --- Lógica de Login e Logout ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const response = await fetch(`${apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('jwt_token', result.token);
                loginFeedbackEl.classList.remove('error');
                loginFeedbackEl.classList.add('success');
                loginFeedbackEl.textContent = 'Login bem-sucedido!';
                loginFeedbackEl.style.display = 'block';
                checkAuthStatus();
            } else {
                loginFeedbackEl.classList.remove('success');
                loginFeedbackEl.classList.add('error');
                loginFeedbackEl.textContent = result.message || 'Erro no login.';
                loginFeedbackEl.style.display = 'block';
            }
        } catch (error) {
            loginFeedbackEl.classList.remove('success');
            loginFeedbackEl.classList.add('error');
            loginFeedbackEl.textContent = 'Erro ao conectar com o servidor.';
            loginFeedbackEl.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwt_token');
        checkAuthStatus();
    });

    // --- Funções de API ---
    const fetchProducts = async () => {
        loadingSpinner.style.display = 'block';
        productsGrid.innerHTML = '';
        emptyMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch(`${apiBaseUrl}/produtos`);
            const data = await response.json();
            if (response.ok) {
                renderProducts(data.data);
                if (data.data.length === 0) {
                    emptyMessage.style.display = 'block';
                }
            } else {
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    };

    const saveProduct = async (formData, isEditing) => {
        const url = isEditing ? `${apiBaseUrl}/produtos/${formData.get('id')}` : `${apiBaseUrl}/produtos`;
        const method = isEditing ? 'PUT' : 'POST';

        const formBody = new FormData();
        formData.forEach((value, key) => {
            // Ignora o ID se estiver adicionando um produto
            if (!isEditing && key === 'id') return;
            formBody.append(key, value);
        });

        // Adiciona as imagens ao FormData
        const imageFiles = formData.getAll('imagens');
        imageFiles.forEach(file => {
            if (file instanceof File) {
                formBody.append('imagens', file);
            }
        });

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`, // CORREÇÃO AQUI
                },
                body: formBody,
            });
            const result = await response.json();
            console.log('Resposta ao salvar produto:', result);
            adminFormFeedback.textContent = result.message;
            if (response.ok) {
                adminFormFeedback.classList.remove('error');
                adminFormFeedback.classList.add('success');
                adminProductForm.reset();
                adminProductForm.querySelector('button').textContent = 'Salvar Produto';
                document.getElementById('id').value = '';
            } else {
                adminFormFeedback.classList.remove('success');
                adminFormFeedback.classList.add('error');
            }
            adminFormFeedback.style.display = 'block';
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            adminFormFeedback.textContent = 'Erro ao conectar com o servidor.';
            adminFormFeedback.classList.remove('success');
            adminFormFeedback.classList.add('error');
            adminFormFeedback.style.display = 'block';
        }
    };

    const deleteProduct = async (id) => {
        const userConfirmed = confirm('Tem certeza que deseja excluir este produto?');
        if (!userConfirmed) return;

        try {
            const response = await fetch(`${apiBaseUrl}/produtos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`, // CORREÇÃO AQUI
                },
            });
            if (!response.ok) {
                const result = await response.json();
                alert(`Erro ao excluir produto: ${result.message}`);
            }
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao conectar com o servidor.');
        }
    };

    // --- Renderização e Eventos ---
    const renderProducts = (products) => {
        productsGrid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${product.imagens[0]}" alt="${product.nome}">
                <div class="product-info">
                    <h3>${product.nome}</h3>
                    <p>Preço: R$ ${product.preco}</p>
                    <p>Categoria: ${product.categoria}</p>
                    <p>Loja: ${product.loja}</p>
                </div>
                <div class="product-actions">
                    <button class="btn-edit" data-id="${product.id}">Editar</button>
                    <button class="btn-delete" data-id="${product.id}">Excluir</button>
                </div>
            `;
            productsGrid.appendChild(card);
        });

        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const product = products.find(p => p.id == id);
                if (product) {
                    fillFormForEdit(product);
                }
            });
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                deleteProduct(e.target.dataset.id);
            });
        });
    };

    const fillFormForEdit = (product) => {
        document.getElementById('id').value = product.id;
        document.getElementById('nome').value = product.nome;
        document.getElementById('preco').value = parseFloat(product.preco);
        document.getElementById('categoria').value = product.categoria;
        document.getElementById('loja').value = product.loja;
        document.getElementById('link').value = product.link;
        document.getElementById('descricao').value = product.descricao || '';
        adminProductForm.querySelector('button').textContent = 'Atualizar Produto';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    adminProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('id').value;
        const isEditing = !!id;
        const formData = new FormData(adminProductForm);
        saveProduct(formData, isEditing);
    });

    // --- Escuta de Eventos em Tempo Real ---
    socket.on('novoProduto', (product) => {
        console.log('Novo produto adicionado em tempo real:', product);
        fetchProducts(); // Atualiza a lista completa
    });

    socket.on('produtoAtualizado', (product) => {
        console.log('Produto atualizado em tempo real:', product);
        fetchProducts();
    });

    socket.on('produtoExcluido', (data) => {
        console.log('Produto excluído em tempo real:', data.id);
        fetchProducts();
    });

    // --- Início da Aplicação ---
    checkAuthStatus();
});
