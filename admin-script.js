document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-produto');
  const errorMessage = document.getElementById('error-message');
  const cancelarBtn = document.getElementById('cancelar');
  const imagePreview = document.getElementById('image-preview');
  const imagensInput = document.getElementById('imagens');
  const BASE_URL = 'https://centro-de-compras-backend.onrender.com'; // URL do backend

  // Carregar produtos
  async function loadProdutos() {
    try {
      const response = await fetch(`${BASE_URL}/api/produtos`);
      console.log('Requisição GET:', response.status, response.statusText);
      if (!response.ok) {
        const text = await response.text();
        console.error('Resposta não-JSON:', text);
        throw new Error('Erro ao carregar produtos');
      }
      const { data: produtos } = await response.json();
      console.log('Produtos carregados no admin:', produtos);
      const container = document.getElementById('admin-produtos');
      container.innerHTML = '';
      produtos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        card.innerHTML = `
          <img src="${produto.imagens[0] || 'https://via.placeholder.com/100'}" alt="${produto.nome}">
          <h3>${produto.nome}</h3>
          <p>${produto.descricao}</p>
          <p><strong>Preço:</strong> R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p><strong>Loja:</strong> ${produto.loja}</p>
          <p><strong>Categoria:</strong> ${produto.categoria}</p>
          <button class="editar" data-id="${produto.id}"><i class="fas fa-edit"></i> Editar</button>
          <button class="excluir" data-id="${produto.id}"><i class="fas fa-trash"></i> Excluir</button>
        `;
        container.appendChild(card);
      });

      document.querySelectorAll('.editar').forEach(btn => {
        btn.addEventListener('click', () => editProduto(btn.dataset.id));
      });
      document.querySelectorAll('.excluir').forEach(btn => {
        btn.addEventListener('click', () => deleteProduto(btn.dataset.id));
      });
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      errorMessage.textContent = 'Erro ao carregar produtos';
      errorMessage.style.display = 'block';
    }
  }

  // Pré-visualização de imagens
  if (imagensInput) {
    imagensInput.addEventListener('change', (e) => {
      imagePreview.innerHTML = '';
      Array.from(e.target.files).forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.margin = '4px';
        imagePreview.appendChild(img);
      });
    });
  } else {
    console.error('Elemento #imagens não encontrado no DOM');
  }

  // Enviar formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';

    const formData = new FormData(form);
    const produto = {
      id: formData.get('id'),
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      preco: formData.get('preco'),
      link: formData.get('link'),
      loja: formData.get('loja'),
      categoria: formData.get('categoria')
    };

    if (produto.nome.length > 255 || produto.descricao.length > 255 || produto.link.length > 255 || produto.loja.length > 255 || produto.categoria.length > 255) {
      errorMessage.textContent = 'Os campos devem ter no máximo 255 caracteres.';
      errorMessage.style.display = 'block';
      return;
    }

    const precoNum = parseFloat(produto.preco);
    if (isNaN(precoNum) || precoNum < 0) {
      errorMessage.textContent = 'O preço deve ser um número válido maior ou igual a zero.';
      errorMessage.style.display = 'block';
      return;
    }

    try {
      const method = produto.id ? 'PUT' : 'POST';
      const url = produto.id ? `${BASE_URL}/api/produtos/${produto.id}` : `${BASE_URL}/api/produtos`;
      console.log('Enviando requisição:', { method, url, produto });
      const response = await fetch(url, {
        method,
        body: formData
      });
      console.log('Resposta recebida:', response.status, response.statusText);
      if (!response.ok) {
        const text = await response.text();
        console.error('Resposta não-JSON:', text);
        throw new Error(`Erro ao salvar produto: ${text}`);
      }
      const data = await response.json();
      alert(produto.id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      form.reset();
      imagePreview.innerHTML = '';
      cancelarBtn.style.display = 'none';
      loadProdutos();
      localStorage.setItem('produtoAtualizado', Date.now());
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      errorMessage.textContent = err.message;
      errorMessage.style.display = 'block';
    }
  });

  // Editar produto
  async function editProduto(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/produtos/${id}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('Resposta não-JSON:', text);
        throw new Error('Erro ao carregar produto');
      }
      const produto = await response.json();
      console.log('Carregando produto para edição:', produto);
      document.getElementById('id').value = produto.id;
      document.getElementById('nome').value = produto.nome;
      document.getElementById('descricao').value = produto.descricao;
      document.getElementById('preco').value = produto.preco;
      document.getElementById('link').value = produto.link;
      document.getElementById('loja').value = produto.loja;
      document.getElementById('categoria').value = produto.categoria;
      imagePreview.innerHTML = produto.imagens.map(img => `
        <img src="${img}" style="width: 100px; height: 100px; margin: 4px;">
      `).join('');
      cancelarBtn.style.display = 'inline-flex';
    } catch (err) {
      console.error('Erro ao carregar produto:', err);
      errorMessage.textContent = 'Erro ao carregar produto';
      errorMessage.style.display = 'block';
    }
  }

  // Excluir produto
  async function deleteProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const response = await fetch(`${BASE_URL}/api/produtos/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const text = await response.text();
        console.error('Resposta não-JSON:', text);
        throw new Error('Erro ao excluir produto');
      }
      alert('Produto excluído com sucesso!');
      loadProdutos();
      localStorage.setItem('produtoAtualizado', Date.now());
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      errorMessage.textContent = 'Erro ao excluir produto';
      errorMessage.style.display = 'block';
    }
  }

  // Cancelar edição
  cancelarBtn.addEventListener('click', () => {
    form.reset();
    imagePreview.innerHTML = '';
    cancelarBtn.style.display = 'none';
    errorMessage.style.display = 'none';
  });

  // Carregar produtos ao iniciar
  loadProdutos();
});
