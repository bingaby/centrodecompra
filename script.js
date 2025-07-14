const API_URL = 'https://centrodecompra-backend.onrender.com';
let produtos = [];
let currentPage = 1;
const produtosPorPagina = 25;
let totalProdutos = 0;
let currentImages = [];
let currentImageIndex = 0;

async function carregarProdutos() {
  const loadingSpinner = document.getElementById('loading-spinner');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const tbody = document.getElementById('lista-produtos');

  if (!tbody || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error('Elementos essenciais não encontrados');
    errorMessage.textContent = 'Erro: Elementos da página não encontrados.';
    errorMessage.style.display = 'block';
    return;
  }

  const maxRetries = 3;
  let attempt = 1;
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('tempToken') || localStorage.getItem('adminToken') || '';

  while (attempt <= maxRetries) {
    try {
      loadingSpinner.style.display = 'block';
      mensagemVazia.style.display = 'none';
      errorMessage.style.display = 'none';
      tbody.innerHTML = '';

      console.log(`Tentativa ${attempt}: Carregando produtos de ${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`);
      console.log('Token usado:', token);

      const response = await fetch(`${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log('Status da resposta:', response.status, response.statusText);
      const data = await response.json();
      console.log('Dados recebidos:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.details || `Erro ${response.status}: Falha ao carregar produtos`);
      }

      if (!Array.isArray(data.produtos)) {
        throw new Error('Resposta inválida da API: produtos não é um array');
      }

      produtos = data.produtos;
      totalProdutos = data.total || produtos.length;
      console.log('Produtos processados:', produtos, 'Total:', totalProdutos);

      if (produtos.length === 0) {
        mensagemVazia.style.display = 'block';
        tbody.style.display = 'none';
        return;
      }

      mensagemVazia.style.display = 'none';
      tbody.style.display = 'table-row-group';
      produtos.forEach((produto, index) => {
        const tr = document.createElement('tr');
        const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
          ? produto.imagens
          : ['imagens/placeholder.jpg'];
        tr.innerHTML = `
          <td>${produto.nome || 'Sem nome'}</td>
          <td>${produto.descricao || 'Sem descrição'}</td>
          <td>${produto.categoria || 'Sem categoria'}</td>
          <td>${produto.loja || 'Sem loja'}</td>
          <td><a href="${produto.link || '#'}" target="_blank">Link</a></td>
          <td>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</td>
          <td>
            ${imagens.map(img => `<img src="${img}" alt="Miniatura" width="50" height="50" onclick="openModal(${index}, 0)" onerror="this.src='imagens/placeholder.jpg'">`).join('')}
          </td>
          <td>
            <button onclick="editarProduto('${produto._id}')">Editar</button>
            <button onclick="excluirProduto('${produto._id}')">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      atualizarPaginacao();
      return;
    } catch (error) {
      console.error(`Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt === maxRetries) {
        errorMessage.textContent = `Não foi possível carregar os produtos após ${maxRetries} tentativas: ${error.message}.`;
        errorMessage.style.display = 'block';
        mensagemVazia.style.display = 'none';
        tbody.style.display = 'none';
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }
}

async function adicionarProduto(event) {
  event.preventDefault();
  const form = document.getElementById('form-produto');
  const errorMessage = document.getElementById('error-message');
  const formData = new FormData(form);
  const token = new URLSearchParams(window.location.search).get('tempToken') || localStorage.getItem('adminToken') || '';

  try {
    const response = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao fazer upload`);
    }

    const { urls } = await response.json();
    const produto = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao'),
      categoria: formData.get('categoria'),
      loja: formData.get('loja'),
      link: formData.get('link'),
      preco: parseFloat(formData.get('preco')),
      imagens: urls
    };

    const addResponse = await fetch(`${API_URL}/api/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(produto)
    });

    if (!addResponse.ok) {
      throw new Error(`Erro ${addResponse.status}: Falha ao adicionar produto`);
    }

    alert('Produto adicionado com sucesso!');
    form.reset();
    carregarProdutos();
  } catch (error) {
    errorMessage.textContent = `Erro ao adicionar produto: ${error.message}`;
    errorMessage.style.display = 'block';
  }
}

async function editarProduto(id) {
  const token = new URLSearchParams(window.location.search).get('tempToken') || localStorage.getItem('adminToken') || '';
  try {
    const response = await fetch(`${API_URL}/api/produtos/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Produto não encontrado`);
    }
    const produto = await response.json();
    document.getElementById('produto-id').value = produto._id;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('categoria').value = produto.categoria;
    document.getElementById('loja').value = produto.loja;
    document.getElementById('link').value = produto.link;
    document.getElementById('preco').value = produto.preco;
    document.getElementById('form-title').textContent = 'Editar Produto';
  } catch (error) {
    document.getElementById('error-message').textContent = `Erro ao carregar produto: ${error.message}`;
    document.getElementById('error-message').style.display = 'block';
  }
}

async function excluirProduto(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  const token = new URLSearchParams(window.location.search).get('tempToken') || localStorage.getItem('adminToken') || '';
  try {
    const response = await fetch(`${API_URL}/api/produtos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao excluir produto`);
    }
    alert('Produto excluído com sucesso!');
    carregarProdutos();
  } catch (error) {
    document.getElementById('error-message').textContent = `Erro ao excluir produto: ${error.message}`;
    document.getElementById('error-message').style.display = 'block';
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  console.log('admin.js carregado');
  carregarProdutos();
  const form = document.getElementById('form-produto');
  if (form) form.addEventListener('submit', adicionarProduto);
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');
  if (prevButton) prevButton.addEventListener('click', () => { if (currentPage > 1) { currentPage--; carregarProdutos(); } });
  if (nextButton) nextButton.addEventListener('click', () => { currentPage++; carregarProdutos(); });
});
