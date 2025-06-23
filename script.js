const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais

const formProduto = document.getElementById('form-produto');
const mensagem = document.getElementById('mensagem');
const erro = document.getElementById('erro');
const listaProdutos = document.getElementById('lista-produtos');

// Verificar elementos DOM
if (!formProduto || !mensagem || !erro || !listaProdutos) {
  console.error('Elementos essenciais não encontrados:', {
    formProduto: !!formProduto,
    mensagem: !!mensagem,
    erro: !!erro,
    listaProdutos: !!listaProdutos
  });
}

async function carregarProdutos() {
  try {
    console.log(`Carregando produtos de ${API_URL}/api/produtos`);
    if (!listaProdutos) throw new Error('Elemento lista-produtos não encontrado');
    listaProdutos.innerHTML = '<tr><td colspan="8" style="text-align:center;">Carregando produtos...</td></tr>';

    const response = await fetch(`${API_URL}/api/produtos`, { cache: 'no-store' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || `Erro ${response.status}`);
    }
    const data = await response.json();
    const produtos = Array.isArray(data.produtos) ? data.produtos : [];
    console.log(`Produtos carregados: ${produtos.length}, Total: ${data.total || 0}`);
    preencherTabela(produtos);
  } catch (err) {
    console.error('Erro ao carregar produtos:', err.message);
    if (listaProdutos) {
      listaProdutos.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">Erro ao carregar produtos: ${err.message}</td></tr>`;
    }
    if (erro) erro.textContent = `Erro ao carregar produtos: ${err.message}`;
  }
}

function preencherTabela(produtos) {
  console.log('Preenchendo tabela com produtos:', produtos.length);
  if (!listaProdutos) {
    console.error('Elemento lista-produtos não encontrado');
    return;
  }
  listaProdutos.innerHTML = '';
  if (!Array.isArray(produtos) || produtos.length === 0) {
    listaProdutos.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
    console.log('Nenhum produto para exibir');
    return;
  }
  produtos.forEach((produto) => {
    const precoFormatado = `R$ ${(parseFloat(produto.preco || 0).toFixed(2)).replace('.', ',')}`;
    const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
    const miniaturas = imagens.length > 0
      ? imagens.map((img, i) => `<img src="${img}" class="thumbnail" alt="Imagem ${i + 1}" width="50" height="50" onerror="this.src='imagens/placeholder.jpg'" />`).join('')
      : 'Sem imagens';

    listaProdutos.innerHTML += `
      <tr>
        <td>${produto.nome || 'N/A'}</td>
        <td>${produto.descricao || 'N/A'}</td>
        <td>${produto.categoria || 'N/A'}</td>
        <td>${produto.loja || 'N/A'}</td>
        <td><a href="${produto.link || '#'}" target="_blank" rel="noopener noreferrer">Link</a></td>
        <td>${precoFormatado}</td>
        <td>${miniaturas}</td>
        <td><button class="excluir" onclick="excluirProduto('${produto._id}')">Excluir</button></td>
      </tr>
    `;
  });
  console.log('Tabela preenchida com sucesso');
}

window.excluirProduto = async (id) => {
  if (!confirm('Confirma a exclusão deste produto?')) return;
  try {
    console.log(`Excluindo produto com ID: ${id}`);
    const response = await fetch(`${API_URL}/api/produtos/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao excluir produto');
    }
    console.log('Produto excluído com sucesso');
    alert('Produto excluído com sucesso');
    carregarProdutos();
  } catch (err) {
    console.error('Erro ao excluir produto:', err.message);
    alert(`Erro ao excluir produto: ${err.message}`);
  }
};

if (formProduto) {
  formProduto.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (mensagem) mensagem.textContent = '';
    if (erro) erro.textContent = '';

    try {
      console.log('Enviando novo produto via formulário');
      const imagens = formData.getAll('imagens').filter(file => file.size > 0);
      if (imagens.length === 0) {
        throw new Error('Pelo menos uma imagem é necessária');
      }

      const produto = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'),
        categoria: formData.get('categoria'),
        loja: formData.get('loja'),
        link: formData.get('link'),
        preco: formData.get('preco')
      };

      const formDataToSend = new FormData();
      for (const [key, value] of Object.entries(produto)) {
        formDataToSend.append(key, value);
      }
      imagens.forEach((img) => formDataToSend.append('imagens', img));

      const response = await fetch(`${API_URL}/api/produtos`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar produto');
      }

      const data = await response.json();
      console.log('Produto adicionado:', data.produto);
      if (mensagem) mensagem.textContent = 'Produto adicionado com sucesso!';
      formProduto.reset();
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error.message);
      if (erro) erro.textContent = `Erro ao adicionar produto: ${error.message}`;
    }
  });
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('Inicializando página de administração');
  carregarProdutos();
});
