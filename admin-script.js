document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = 'https://minha-api-produtos.onrender.com/api';
    const productContainer = document.getElementById('admin-product-container');
    const errorMessage = document.getElementById('admin-error-message');
    const productForm = document.getElementById('product-form');

    // Função para buscar e exibir produtos
    const fetchProdutos = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/produtos`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP! Status: ${response.status}, Mensagem: ${errorText}`);
            }
            const produtos = await response.json();
            // Verifica se a resposta é um array ou tem a propriedade 'data'
            if (!Array.isArray(produtos) && (!produtos.data || !Array.isArray(produtos.data))) {
                throw new Error('Formato de dados inválido: a resposta deve ser um array ou um objeto com propriedade "data"');
            }
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
                <button onclick="deleteProduct(${produto.id})">Excluir</button>
            `;
            productContainer.appendChild(card);
        });
    };

    // Função para cadastrar um novo produto
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
            const response = await fetch(`${apiBaseUrl}/produtos`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP! Status: ${response.status}`);
            }
            const novoProduto = await response.json();
            alert('Produto cadastrado com sucesso!');
            productForm.reset();
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao cadastrar produto:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = error.message || 'Erro ao cadastrar produto.';
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
