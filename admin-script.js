document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://minha-api-produtos.onrender.com/api';
    const productContainer = document.getElementById('admin-product-container');
    const errorMessage = document.getElementById('admin-error-message');
    const productForm = document.getElementById('product-form');
    const formTitle = document.getElementById('form-title');
    const submitButton = document.getElementById('submit-button');
    const cancelButton = document.getElementById('cancel-button');
    let isEditing = false;

    // Função para buscar e exibir produtos
    const fetchProdutos = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/produtos`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP! Status: ${response.status}, Mensagem: ${errorText}`);
            }
            const produtos = await response.json();
            const produtosArray = Array.isArray(produtos) ? produtos : produtos.data;
            renderizarProdutos(produtosArray);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = `Erro ao carregar produtos: ${error.message}`;
        }
    };

    // Função para renderizar produtos com imagens menores
    const renderizarProdutos = (produtos) => {
        productContainer.innerHTML = '';
        if (produtos.length === 0) {
            productContainer.innerHTML = '<p>Nenhum produto cadastrado.</p>';
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'admin-product-card';
            const imagemUrl = produto.imagens && produto.imagens.length > 0 
                ? produto.imagens[0] 
                : 'https://via.placeholder.com/100?text=Sem+Imagem';
            
            card.innerHTML = `
                <img src="${imagemUrl}" alt="${produto.nome}" loading="lazy">
                <h3>${produto.nome}</h3>
                <p>${produto.descricao.substring(0, 50)}...</p>
                <p>R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                <button class="editar" onclick="editProduct(${produto.id})">Editar</button>
                <button onclick="deleteProduct(${produto.id})">Excluir</button>
            `;
            productContainer.appendChild(card);
        });
    };

    // Função para preencher o formulário para edição
    window.editProduct = async (id) => {
        try {
            const response = await fetch(`${apiBaseUrl}/produtos/${id}`);
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            const produto = await response.json();
            document.getElementById('produto-id').value = produto.id;
            document.getElementById('nome').value = produto.nome;
            document.getElementById('descricao').value = produto.descricao;
            document.getElementById('preco').value = produto.preco;
            document.getElementById('link').value = produto.link;
            document.getElementById('categoria').value = produto.categoria;
            document.getElementById('loja').value = produto.loja;
            formTitle.textContent = 'Editar Produto';
            submitButton.textContent = 'Salvar Alterações';
            cancelButton.style.display = 'inline-block';
            isEditing = true;
        } catch (error) {
            console.error('Erro ao carregar produto para edição:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Erro ao carregar produto.';
        }
    };

    // Função para cancelar edição
    cancelButton.addEventListener('click', () => {
        productForm.reset();
        formTitle.textContent = 'Cadastrar Novo Produto';
        submitButton.textContent = 'Cadastrar Produto';
        cancelButton.style.display = 'none';
        isEditing = false;
        document.getElementById('produto-id').value = '';
    });

    // Função para cadastrar ou atualizar um produto
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nome', document.getElementById('nome').value);
        formData.append('descricao', document.getElementById('descricao').value);
        formData.append('preco', document.getElementById('preco').value);
        formData.append('link', document.getElementById('link').value);
        formData.append('categoria', document.getElementById('categoria').value);
        formData.append('loja', document.getElementById('loja').value);
        const imagens = document.getElementById('imagens').files;
        for (let i = 0; i < imagens.length; i++) {
            formData.append('imagens', imagens[i]);
        }

        try {
            const url = isEditing ? `${apiBaseUrl}/produtos/${document.getElementById('produto-id').value}` : `${apiBaseUrl}/produtos`;
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP! Status: ${response.status}`);
            }
            const message = isEditing ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!';
            alert(message);
            productForm.reset();
            formTitle.textContent = 'Cadastrar Novo Produto';
            submitButton.textContent = 'Cadastrar Produto';
            cancelButton.style.display = 'none';
            isEditing = false;
            document.getElementById('produto-id').value = '';
            fetchProdutos();
        } catch (error) {
            console.error(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} produto:`, error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} produto.`;
        }
    });

    // Função para excluir um produto
    window.deleteProduct = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        try {
            const response = await fetch(`${apiBaseUrl}/produtos/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP! Status: ${response.status}`);
            }
            alert('Produto excluído com sucesso!');
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Erro ao excluir produto.';
        }
    };

    // Inicialização
    fetchProdutos();
});
