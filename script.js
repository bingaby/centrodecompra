
  const API_URL = 'https://centrodecompra-backend.onrender.com';
  let produtos = [];
  let currentPage = 1;
  const produtosPorPagina = 10; // Reduzido para evitar 429
  let totalProdutos = 0;
  let currentImages = [];
  let currentImageIndex = 0;

  // Verificar autenticação
  function checkAuth() {
    if (!localStorage.getItem('adminToken')) {
      const tempToken = new URLSearchParams(window.location.search).get('tempToken');
      if (tempToken === 'triple-click-access') {
        localStorage.setItem('adminToken', 'temp-token-' + Date.now());
      } else {
        alert('Acesso não autorizado. Por favor, clique três vezes no logotipo na página inicial para autenticar.');
        window.location.href = '/index.html';
      }
    }
  }

  // Função para escapar HTML e evitar XSS
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (match) => ({
      '&': '&', '<': '<', '>': '>', '"': '"', "'": '''
    }[match]));
  }

  // Função de logout
  function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/index.html';
  }

  // Atualizar ano no footer
  document.getElementById('year').textContent = new Date().getFullYear();

  async function carregarProdutos() {
    const tbody = document.getElementById('lista-produtos');
    const loadingSpinner = document.getElementById('loading-spinner');
    const erro = document.getElementById('erro');
    if (!tbody || !loadingSpinner || !erro) {
      console.error('Elementos essenciais não encontrados');
      erro.textContent = 'Erro: Elementos da página não encontrados.';
      erro.style.display = 'block';
      return;
    }

    loadingSpinner.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Carregando...</td></tr>';
    erro.textContent = '';

    const maxRetries = 3;
    let attempt = 1;
    while (attempt <= maxRetries) {
      try {
        console.log(`Tentativa ${attempt}: Carregando produtos de ${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`);
        const token = localStorage.getItem('adminToken');
        console.log('Token usado:', token);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`, {
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        clearTimeout(timeoutId);

        console.log('Status da resposta:', res.status, res.statusText);
        const data = await res.json();
        console.log('Dados recebidos:', JSON.stringify(data, null, 2));

        if (!res.ok) {
          const errorData = data || {};
          if (res.status === 429) {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
          }
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('adminToken');
            erro.textContent = 'Sessão inválida ou expirada. Clique três vezes no logotipo na página inicial.';
            window.location.href = '/index.html';
            return;
          }
          throw new Error(errorData.error || `Falha ao buscar produtos: ${res.status}`);
        }

        produtos = Array.isArray(data.produtos) ? data.produtos : Array.isArray(data) ? data : [];
        totalProdutos = data.total || produtos.length;
        console.log('Produtos processados:', produtos, 'Total:', totalProdutos);

        if (produtos.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
        } else {
          preencherTabela(produtos);
        }
        atualizarPaginacao();
        return;
      } catch (err) {
        console.error(`Tentativa ${attempt} falhou: ${err.message}`);
        if (attempt === maxRetries) {
          let errorMessage = `Erro após ${maxRetries} tentativas: ${err.message}`;
          if (err.message.includes('Failed to fetch') || err.name === 'AbortError') {
            errorMessage = 'Erro de conexão com o servidor. Verifique sua rede ou a configuração do servidor.';
          }
          tbody.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">${errorMessage}</td></tr>`;
          erro.textContent = errorMessage;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } finally {
        loadingSpinner.style.display = 'none';
      }
    }
  }

  function preencherTabela(produtos) {
    const tbody = document.getElementById('lista-produtos');
    if (!tbody) {
      console.error('Elemento lista-produtos não encontrado');
      document.getElementById('erro').textContent = 'Erro: Elemento da tabela não encontrado.';
      return;
    }
    tbody.innerHTML = '';
    const produtosArray = Array.isArray(produtos) ? produtos : [];
    console.log('Preenchendo tabela com produtos:', produtosArray);
    if (produtosArray.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
      return;
    }
    produtosArray.forEach((produto, index) => {
      const precoFormatado = `R$ ${parseFloat(produto.preco || 0).toFixed(2).replace('.', ',')}`;
      const imagens = Array.isArray(produto.imagens) ? produto.imagens.filter(img => typeof img === 'string' && img) : [];
      const miniaturas = imagens.length > 0
        ? imagens.map((img, i) => `<img src="${escapeHTML(img)}" class="thumbnail" alt="Imagem ${i + 1}" loading="lazy" data-index="${index}-${i}" onerror="handleImageError(this, 'imagens/placeholder.jpg')" />`).join('')
        : 'Sem imagens';

      tbody.innerHTML += `
        <tr>
          <td>${escapeHTML(produto.nome || 'N/A')}</td>
          <td>${escapeHTML(produto.descricao || 'N/A')}</td>
          <td>${escapeHTML(produto.categoria || 'N/A')}</td>
          <td>${escapeHTML(produto.loja || 'N/A')}</td>
          <td><a href="${escapeHTML(produto.link || '#')}" target="_blank" rel="noopener noreferrer">Link</a></td>
          <td>${precoFormatado}</td>
          <td>${miniaturas}</td>
          <td>
            <button class="editar" onclick="editarProduto('${produto._id}')" aria-label="Editar produto ${produto.nome || 'N/A'}">Editar</button>
            <button class="excluir" onclick="excluirProduto('${produto._id}')" aria-label="Excluir produto ${produto.nome || 'N/A'}">Excluir</button>
          </td>
        </tr>
      `;
    });
  }

  // Função para lidar com erro de imagem com retry
  function handleImageError(imgElement, fallbackSrc) {
    if (imgElement.src !== fallbackSrc) {
      setTimeout(() => {
        imgElement.src = fallbackSrc;
        imgElement.onerror = null; // Evita loop infinito
      }, 1000); // Atraso de 1 segundo
    } else {
      imgElement.style.display = 'none'; // Oculta imagem quebrada
      console.error(`Falha ao carregar ${fallbackSrc} para imagem ${imgElement.dataset.index}`);
    }
  }

  async function editarProduto(id) {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        document.getElementById('erro').textContent = 'Sessão expirada. Clique três vezes no logotipo na página inicial.';
        window.location.href = '/index.html';
        return;
      }

      const res = await fetch(`${API_URL}/api/produtos/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          document.getElementById('erro').textContent = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
          return;
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('adminToken');
          document.getElementById('erro').textContent = 'Sessão inválida. Clique três vezes no logotipo na página inicial.';
          window.location.href = '/index.html';
          return;
        }
        throw new Error(errorData.error || 'Erro ao buscar produto para edição');
      }
      const produto = await res.json();
      console.log('Produto para edição:', produto);

      const form = document.getElementById('form-produto');
      form.querySelector('[name="id"]').value = produto._id || '';
      form.querySelector('[name="nome"]').value = produto.nome || '';
      form.querySelector('[name="descricao"]').value = produto.descricao || '';
      form.querySelector('[name="categoria"]').value = produto.categoria || '';
      form.querySelector('[name="loja"]').value = produto.loja || '';
      form.querySelector('[name="link"]').value = produto.link || '';
      form.querySelector('[name="preco"]').value = produto.preco || '';
      document.getElementById('submit-button').textContent = 'Salvar Alterações';
      document.getElementById('cancel-button').style.display = 'inline-block';
      document.getElementById('mensagem').textContent = 'Editando produto. Envie para salvar as alterações.';
    } catch (err) {
      console.error('Erro ao editar produto:', err.message);
      document.getElementById('erro').textContent = err.message;
    }
  }

  function cancelarEdicao() {
    const form = document.getElementById('form-produto');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    document.getElementById('submit-button').textContent = 'Adicionar';
    document.getElementById('cancel-button').style.display = 'none';
    document.getElementById('mensagem').textContent = '';
    document.getElementById('erro').textContent = '';
  }

  async function excluirProduto(id) {
    if (!confirm('Confirma a exclusão deste produto?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        document.getElementById('erro').textContent = 'Sessão expirada. Clique três vezes no logotipo na página inicial.';
        window.location.href = '/index.html';
        return;
      }

      const res = await fetch(`${API_URL}/api/produtos/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 429) {
          document.getElementById('erro').textContent = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
          return;
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('adminToken');
          document.getElementById('erro').textContent = 'Sessão inválida. Clique três vezes no logotipo na página inicial.';
          window.location.href = '/index.html';
          return;
        }
        throw new Error(errorData.error || 'Erro ao excluir produto');
      }
      document.getElementById('mensagem').textContent = 'Produto excluído com sucesso';
      carregarProdutos();
    } catch (err) {
      console.error('Erro ao excluir produto:', err.message);
      document.getElementById('erro').textContent = err.message;
    }
  }

  document.getElementById('form-produto').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const produtoId = formData.get('id');
    const link = formData.get('link');
    const preco = parseFloat(formData.get('preco'));
    const imagens = form.querySelector('input[name="imagens"]').files;

    if (!link.match(/^https?:\/\/.+/)) {
      document.getElementById('erro').textContent = 'Link inválido! Deve começar com http:// ou https://';
      return;
    }
    if (isNaN(preco) || preco <= 0) {
      document.getElementById('erro').textContent = 'O preço deve ser maior que zero!';
      return;
    }
    if (imagens.length > 3) {
      document.getElementById('erro').textContent = 'Máximo de 3 imagens por produto!';
      return;
    }

    document.getElementById('mensagem').textContent = '';
    document.getElementById('erro').textContent = '';

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        document.getElementById('erro').textContent = 'Sessão expirada. Clique três vezes no logotipo na página inicial.';
        window.location.href = '/index.html';
        return;
      }

      let imageUrls = [];
      if (imagens.length > 0) {
        const uploadFormData = new FormData();
        for (let i = 0; i < imagens.length; i++) {
          uploadFormData.append('imagens', imagens[i]);
        }
        const uploadRes = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          if (uploadRes.status === 429) {
            document.getElementById('erro').textContent = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
            return;
          }
          throw new Error(errorData.error || 'Erro ao fazer upload das imagens');
        }
        const uploadData = await uploadRes.json();
        imageUrls = uploadData.urls || [];
      }

      const produto = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'),
        categoria: formData.get('categoria'),
        loja: formData.get('loja'),
        link: formData.get('link'),
        preco: preco,
        imagens: imageUrls
      };

      const res = await fetch(`${API_URL}/api/produtos${produtoId ? `/${produtoId}` : ''}`, {
        method: produtoId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(produto)
      });

      const responseData = await res.json();
      console.log(`Resposta do ${produtoId ? 'PUT' : 'POST'}:`, responseData);

      if (!res.ok) {
        if (res.status === 429) {
          document.getElementById('erro').textContent = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
          return;
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('adminToken');
          document.getElementById('erro').textContent = 'Sessão inválida. Clique três vezes no logotipo na página inicial.';
          window.location.href = '/index.html';
          return;
        }
        throw new Error(responseData?.error || `Erro ao ${produtoId ? 'atualizar' : 'adicionar'} produto`);
      }

      document.getElementById('mensagem').textContent = produtoId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!';
      form.reset();
      form.querySelector('[name="id"]').value = '';
      document.getElementById('submit-button').textContent = 'Adicionar';
      document.getElementById('cancel-button').style.display = 'none';
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao salvar produto:', error.message);
      document.getElementById('erro').textContent = error.message;
    }
  });

  function atualizarPaginacao() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    if (prevButton && nextButton && pageInfo) {
      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage >= Math.ceil(totalProdutos / produtosPorPagina);
      pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(totalProdutos / produtosPorPagina) || 1}`;
    }
  }

  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos();
    }
  });

  document.getElementById('next-page')?.addEventListener('click', () => {
    currentPage++;
    carregarProdutos();
  });

  function openModal(produtoIndex, imageIndex) {
    const modal = document.getElementById('imageModal');
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDots = document.getElementById('modalCarrosselDots');
    currentImages = Array.isArray(produtos[produtoIndex]?.imagens) ? produtos[produtoIndex].imagens : [];
    currentImageIndex = imageIndex;

    if (currentImages.length === 0) {
      document.getElementById('erro').textContent = 'Nenhuma imagem disponível para este produto.';
      return;
    }

    carrosselImagens.innerHTML = currentImages.map(img => `<img src="${escapeHTML(img)}" alt="Imagem ampliada" loading="lazy" onerror="this.src='imagens/placeholder.jpg'; this.onerror=null;">`).join('');
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

    carrosselDots.innerHTML = currentImages.map((_, i) => `<span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})"></span>`).join('');

    modal.style.display = 'flex';
  }

  function moveModalCarrossel(direction) {
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDots = document.getElementById('modalCarrosselDots').children;
    const totalImagens = currentImages.length;

    currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;

    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  }

  function setModalCarrosselImage(index) {
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDots = document.getElementById('modalCarrosselDots').children;
    currentImageIndex = index;
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle('ativo', i === currentImageIndex));
  }

  function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    currentImages = [];
    currentImageIndex = 0;
  }

  document.getElementById('imageModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.addEventListener('DOMContentLoaded', () => {
    console.log('admin-xyz-123.html carregado');
    checkAuth();
    carregarProdutos();
  });
</script>
