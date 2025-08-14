const VERSION = "1.0.13"; // Atualizado para nova versão
const API_URL = 'https://minha-api-produtos.onrender.com';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 12;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";

// Conectar ao Socket.IO
 const API_URL = 'https://minha-api-produtos.onrender.com';
    const socket = io(API_URL, { transports: ['websocket'], reconnectionAttempts: 5 });

    async function carregarProdutos() {
      const lista = document.getElementById('produtos-lista');
      const errorMessage = document.getElementById('error-message');
      const loadingSpinner = document.getElementById('loading-spinner');
      if (!lista || !errorMessage || !loadingSpinner) {
        console.error('Elementos do DOM não encontrados');
        return;
      }

      try {
        loadingSpinner.style.display = 'block';
        errorMessage.style.display = 'none';
        const response = await fetch(`${API_URL}/api/produtos?page=1&limit=1000`, { cache: 'no-store' });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Resposta vazia'}`);
        }
        const data = await response.json();
        console.log('Resposta da API:', JSON.stringify(data, null, 2));

        if (data.status !== 'success' || !Array.isArray(data.data)) {
          throw new Error(data.message || 'Resposta inválida');
        }

        const produtos = data.data;
        lista.innerHTML = '';

        if (produtos.length === 0) {
          lista.innerHTML = '<tr><td colspan="7">Nenhum produto cadastrado.</td></tr>';
          return;
        }

        produtos.forEach(produto => {
          const tr = document.createElement('tr');
          const imagem = produto.imagens && produto.imagens[0] 
            ? produto.imagens[0] 
            : 'https://minha-api-produtos.onrender.com/imagens/placeholder.jpg';
          tr.innerHTML = `
            <td><img src="${imagem}" class="produto-imagem" alt="${produto.nome}" onerror="this.src='https://minha-api-produtos.onrender.com/imagens/placeholder.jpg'"></td>
            <td>${produto.nome || 'Sem nome'}</td>
            <td>R$ ${produto.preco || '0.00'}</td>
            <td>${produto.categoria || 'Sem categoria'}</td>
            <td>${produto.loja || 'Sem loja'}</td>
            <td><a href="${produto.link || '#'}" target="_blank">Link</a></td>
            <td>
              <button class="btn-editar" onclick="editarProduto('${produto.id}')">Editar</button>
              <button class="btn-excluir" onclick="excluirProduto('${produto.id}')">Excluir</button>
            </td>
          `;
          lista.appendChild(tr);
        });
      } catch (error) {
        console.error('Erro ao carregar produtos:', error.message, error.stack);
        errorMessage.textContent = `Erro ao carregar produtos: ${error.message}`;
        errorMessage.style.display = 'block';
      } finally {
        loadingSpinner.style.display = 'none';
      }
    }

    async function cadastrarProduto(event) {
      event.preventDefault();
      const form = document.getElementById('cadastro-produto');
      const errorMessage = document.getElementById('error-message');
      const successMessage = document.getElementById('success-message');
      const submitBtn = document.getElementById('submit-btn');
      const produtoId = document.getElementById('produto-id').value;

      if (!form || !errorMessage || !successMessage || !submitBtn) {
        console.error('Elementos do formulário não encontrados');
        errorMessage.textContent = 'Erro interno. Tente novamente.';
        errorMessage.style.display = 'block';
        return;
      }

      const formData = new FormData(form);
      const imagens = formData.getAll('imagens');
      console.log('Dados do formulário:', {
        nome: formData.get('nome'),
        preco: formData.get('preco'),
        categoria: formData.get('categoria'),
        loja: formData.get('loja'),
        link: formData.get('link'),
        imagensCount: imagens.length,
        imagens: imagens.map(f => f.name)
      });

      if (imagens.length > 5) {
        errorMessage.textContent = 'Máximo de 5 imagens permitido.';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return;
      }
      if (!produtoId && imagens.length === 0) {
        errorMessage.textContent = 'Selecione pelo menos uma imagem para novos produtos.';
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
        return;
      }

      try {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        const url = produtoId ? `${API_URL}/api/produtos/${produtoId}` : `${API_URL}/api/produtos`;
        const method = produtoId ? 'PUT' : 'POST';

        console.log(`Enviando para ${url} com método ${method}`);
        const response = await fetch(url, { method, body: formData });
        console.log('Resposta:', response.status);
        const data = await response.json();
        console.log('Dados da API:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          throw new Error(data.message || `Erro ${response.status}`);
        }

        successMessage.textContent = data.message || (produtoId ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        successMessage.style.display = 'block';
        form.reset();
        submitBtn.textContent = 'Cadastrar Produto';
        document.getElementById('produto-id').value = '';
        carregarProdutos();
      } catch (error) {
        console.error('Erro:', error.message, error.stack);
        errorMessage.textContent = `Erro ao ${produtoId ? 'atualizar' : 'cadastrar'}: ${error.message}`;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
      }
    }

    async function editarProduto(id) {
      try {
        const response = await fetch(`${API_URL}/api/produtos/${id}`, { cache: 'no-store' });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro HTTP ${response.status}: ${errorText || 'Resposta vazia'}`);
        }
        const data = await response.json();
        console.log('Resposta da API:', JSON.stringify(data, null, 2));

        if (data.status !== 'success' || !data.data) {
          throw new Error(data.message || 'Produto não encontrado');
        }

        const produto = data.data;
        document.getElementById('nome').value = produto.nome || '';
        document.getElementById('preco').value = produto.preco || '0';
        document.getElementById('categoria').value = produto.categoria || 'todas';
        document.getElementById('loja').value = produto.loja || 'todas';
        document.getElementById('link').value = produto.link || '';
        document.getElementById('produto-id').value = produto.id;
        document.getElementById('submit-btn').textContent = 'Atualizar Produto';
        window.scrollTo(0, 0);
      } catch (error) {
        console.error('Erro ao carregar produto para edição:', error.message, error.stack);
        document.getElementById('error-message').textContent = `Erro ao carregar produto: ${error.message}`;
        document.getElementById('error-message').style.display = 'block';
      }
    }

    async function excluirProduto(id) {
      if (!confirm('Tem certeza que deseja excluir este produto?')) return;

      try {
        const response = await fetch(`${API_URL}/api/produtos/${id}`, { method: 'DELETE' });
        const data = await response.json();
        console.log('Resposta:', response.status, JSON.stringify(data, null, 2));

        if (!response.ok) {
          throw new Error(data.message || `Erro ${response.status}`);
        }

        document.getElementById('success-message').textContent = data.message || 'Produto excluído com sucesso!';
        document.getElementById('success-message').style.display = 'block';
        carregarProdutos();
      } catch (error) {
        console.error('Erro ao excluir produto:', error.message, error.stack);
        document.getElementById('error-message').textContent = `Erro ao excluir: ${error.message}`;
        document.getElementById('error-message').style.display = 'block';
      }
    }

    socket.on('connect', () => console.log('Conectado ao Socket.IO'));
    socket.on('novoProduto', () => carregarProdutos());
    socket.on('produtoAtualizado', () => carregarProdutos());
    socket.on('produtoExcluido', () => carregarProdutos());

    document.addEventListener('DOMContentLoaded', () => {
      console.log('Script do admin carregado');
      const form = document.getElementById('cadastro-produto');
      if (form) {
        form.addEventListener('submit', cadastrarProduto);
      } else {
        console.error('Formulário não encontrado');
      }
      carregarProdutos();
    });
