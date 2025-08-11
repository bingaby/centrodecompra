document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-produto');
  const errorMessage = document.getElementById('error-message');
  const cancelarBtn = document.getElementById('cancelar');
  const imagePreview = document.getElementById('image-preview');

  // Carregar produtos
  async function loadProdutos() {
    try {
      const response = await fetch('/api/produtos');
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      const { data: produtos } = await response.json();
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

      // Eventos de edição e exclusão
      document.querySelectorAll('.editar').forEach(btn => {
        btn.addEventListener('click', () => editProduto(btn.dataset.id));
      });
      document.querySelectorAll('.excluir').forEach(btn => {
        btn.addEventListener('click', () => deleteProduto(btn.dataset.id));
      });
    } catch (err) {
      console.error(err);
      errorMessage.textContent = 'Erro ao carregar produtos';
      errorMessage.style.display = 'block';
    }
  }

  // Pré-visualização de imagens
  document.getElementById('imagens').addEventListener('change', (e) => {
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

    // Validação de comprimento
    if (produto.nome.length > 255) {
      errorMessage.textContent = 'O nome do produto deve ter no máximo 255 caracteres.';
      errorMessage.style.display = 'block';
      return;
    }
    if (produto.descricao.length > 255) {
      errorMessage.textContent = 'A descrição deve ter no máximo 255 caracteres.';
      errorMessage.style.display = 'block';
      return;
    }
    if (produto.link.length > 255) {
      errorMessage.textContent = 'O link deve ter no máximo 255 caracteres.';
      errorMessage.style.display = 'block';
      return;
    }
    if (produto.loja.length > 255) {
      errorMessage.textContent = 'A loja deve ter no máximo 255 caracteres.';
      errorMessage.style.display = 'block';
      return;
    }
    if (produto.categoria.length > 255) {
      errorMessage.textContent = 'A categoria deve ter no máximo 255 caracteres.';
      errorMessage.style.display = 'block';
      return;
    }

    // Validação de preço
    const precoNum = parseFloat(produto.preco);
    if (isNaN(precoNum) || precoNum < 0) {
      errorMessage.textContent = 'O preço deve ser um número válido maior ou igual a zero.';
      errorMessage.style.display = 'block';
      return;
    }

    try {
      const method = produto.id ? 'PUT' : 'POST';
      const url = produto.id ? `/api/produtos/${produto.id}` : '/api/produtos';
      const response = await fetch(url, {
        method,
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar produto');
      }
      alert(produto.id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
      form.reset();
      imagePreview.innerHTML = '';
      cancelarBtn.style.display = 'none';
      loadProdutos();
    } catch (err) {
      console.error(err);
      errorMessage.textContent = err.message;
      errorMessage.style.display = 'block';
    }
  });

  // Editar produto
  async function editProduto(id) {
    try {
      const response = await fetch(`/api/produtos/${id}`);
      if (!response.ok) throw new Error('Erro ao carregar produto');
      const produto = await response.json();
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
      console.error(err);
      errorMessage.textContent = 'Erro ao carregar produto';
      errorMessage.style.display = 'block';
    }
  }

  // Excluir produto
  async function deleteProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const response = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao excluir produto');
      alert('Produto excluído com sucesso!');
      loadProdutos();
    } catch (err) {
      console.error(err);
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
