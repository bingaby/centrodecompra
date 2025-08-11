document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://minha-api-produtos.onrender.com/api';

    // Variáveis do DOM
    const adminPanelContent = document.getElementById('admin-panel-content');
    const adminProductForm = document.getElementById('admin-product-form');
    const adminFormFeedback = document.getElementById('admin-form-feedback');
    const productsGrid = document.getElementById('admin-products-grid');
    const loadingSpinner = document.getElementById('admin-loading-spinner');
    const emptyMessage = document.getElementById('admin-mensagem-vazia');
    const errorMessage = document.getElementById('admin-error-message');

    // Buscar produtos
    const fetchProducts = async () => {
        loadingSpinner.style.display = 'block';
        productsGrid.innerHTML = '';
        emptyMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        try {
            const response = await fetch(`${apiBaseUrl}/produtos`);
            if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

            const data = await response.json();

            if (Array.isArray(data)) {
                if (data.length === 0) {
                    emptyMessage.style.display = 'block';
                } else {
                    renderProducts(data);
                }
            } else {
                throw new Error('Formato de dados inválido');
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error.message);
            errorMessage.style.display = 'block';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    };

    // Salvar produto (novo ou edição)
    const saveProduct = async (formData, isEditing) => {
        const url = isEditing ? `${apiBaseUrl}/produtos/${formData.get('id')}` : `${apiBaseUrl}/produtos`;
        const method = isEditing ? 'PUT' : 'POST';

        const formBody = new FormData();
        formData.forEach((value, key) => {
            if (!isEditing && key === 'id') return;
            formBody.append(key, value);
        });

        try {
            const response = await fetch(url, { method, body: formBody });
            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || 'Erro ao salvar produto');
            }

            adminFormFeedback.textContent = isEditing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!';
            adminFormFeedback.classList.remove('error');
            adminFormFeedback.classList.add('success');
            adminProductForm.reset();
            adminProductForm.querySelector('button').textContent = 'Salvar Produto';
            document.getElementById('id').value = '';
            fetchProducts();
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            adminFormFeedback.textContent = error.message;
            adminFormFeedback.classList.remove('success');
            adminFormFeedback.classList.add('error');
        } finally {
            adminFormFeedback.style.display = 'block';
        }
    };

    // Excluir produto
    const deleteProduct = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            const response = await fetch(`${apiBaseUrl}/produtos/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const msg = await response.text();
                alert(`Erro ao excluir produto: ${msg}`);
            } else {
                fetchProducts();
            }
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao conectar com o servidor.');
        }
    };

    // Renderizar produtos
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
            button.addEventListener('click', e => {
                const id = e.target.dataset.id;
                const product = products.find(p => p.id == id);
                if (product) fillFormForEdit(product);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', e => {
                deleteProduct(e.target.dataset.id);
            });
        });
    };

    // Preencher formulário para edição
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

    // Evento do formulário
    adminProductForm.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('id').value;
        const isEditing = !!id;
        const formData = new FormData(adminProductForm);
        saveProduct(formData, isEditing);
    });

    // Exibir painel e carregar produtos
    adminPanelContent.style.display = 'block';
    fetchProducts();
});

