import { db, storage, app, auth } from './firebase.js';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword } from 'firebase/auth';

const formProduto = document.getElementById('form-produto');
const mensagem = document.getElementById('mensagem');
const erro = document.getElementById('erro');
const listaProdutos = document.getElementById('lista-produtos');
const loginForm = document.getElementById('login-form');
const formContainer = document.getElementById('form-container');

// Verificar elementos DOM
if (!formProduto || !mensagem || !erro || !listaProdutos || !loginForm || !formContainer) {
  console.error('Elementos essenciais não encontrados:', {
    formProduto: !!formProduto,
    mensagem: !!mensagem,
    erro: !!erro,
    listaProdutos: !!listaProdutos,
    loginForm: !!loginForm,
    formContainer: !!formContainer
  });
}

window.login = async () => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  if (!emailInput || !passwordInput) {
    console.error('Campos de email e senha não encontrados');
    alert('Erro: Campos de email ou senha não encontrados');
    return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    console.log('Tentando login com email);
    await signInWithEmailAndPassword(auth, email, email);
    console.log('Login bem-sucedido');
    loginForm.style.display = 'none';
    formContainer.style.display = 'block';
    carregarProdutos();
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    alert('Erro no login: ${error.message}');
  }
};

async function carregarProdutos() {
  try {
    console.log('Carregando produtos do Firestore...');
    if (!listaProdutos) throw new Error('Elemento lista-produtos não encontrado');
    listaProdutos.innerHTML = '<tr><td colspan="8" style="text-align: center;">Carregando produtos...</td></tr>';
    const querySnapshot = await getDocs(collection(db, 'produtos'));
    const produtos = [];
    querySnapshot.forEach((doc) => {
      produtos.push({ id: doc.id, ...doc.data() });
    });
    console.log('Produtos carregados: ${produtos.length}');
    preencherTabela(produtos);
  } catch (err) {
    console.error('Erro ao carregar produtos:', err.message);
    if (listaProdutos) {
      listaProdutos.innerHTML = '<tr><td colspan="8" style="color:red;text-align:center;">Erro ao carregar produtos: ${err.message}</td></tr>';
    }
    if (erro) {
      erro.textContent = 'Erro ao carregar produtos: ${err.message}';
    }
  }
}

function preencherTabela(produtos) {
  console.log('Preenchendo tabela com produtos:', produtos.length);
  if (!listaProdutos) {
    console.error('Elemento lista-produtos não encontrado');
    return;
  }
  listaProdutos.innerHTML = '';
  if (produtos.length === 0) {
    listaProdutos.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
    console.log('Nenhum produto para exibir');
    return;
  }
  produtos.forEach((produto) => {
    const precoFormatado = 'R$ ${parseFloat(produto.preco || 0).toFixed(2).replace('.', ',')}';
    const imagens = Array.isArray(produto.imagens) ? produto.imagens : [];
    const miniaturas = imagens.length > 0
      ? imagens.map((img, i) => '<img src="${img}" class="thumbnail" alt="Imagem ${i + 1}" width="50" height="50" onerror="this.src='imagens/placeholder.jpg'" />').join('')
      : 'Sem imagens';

    listaProdutos.innerHTML += '
      <tr>
        <td>${produto.nome || 'N/A'}</td>
        <td>${produto.descricao || 'N/A'}</td>
        <td>${produto.categoria || 'N/A'}</td>
        <td>${produto.loja || 'N/A'}</td>
        <td><a href="${produto.link || '#'}" target="_blank" rel="noopener noreferrer">Link</a></td>
        <td>${precoFormatado}</td>
        <td>${miniaturas}</td>
        <td><button class="excluir" onclick="excluirProduto('${produto.id}')">Excluir</button></td>
      </tr>
    ';
  });
  console.log('Tabela preenchida com sucesso');
}

window.excluirProduto = async (id) => {
  if (!confirm('Confirma a exclusão deste produto?')) return;
  try {
    console.log('Excluindo produto com ID:', id);
    await deleteDoc(doc(db, 'produtos', id));
    console.log('Produto excluído com sucesso');
    alert('Produto excluído com sucesso');
    carregarProdutos();
  } catch (err) {
    console.error('Erro ao excluir produto:', err.message);
    alert('Erro ao excluir produto: ${err.message}');
  }
};

async function uploadImagens(files) {
  const imageUrls = [];
  for (const file of files) {
    console.log('Fazendo upload da imagem:', file.name);
    const storageRef = ref(storage, 'imagens/${Date.now()}_${file.name}');
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    imageUrls.push(url);
    console.log('Imagem carregada:', url);
  }
  return imageUrls;
}

if (formProduto) {
  formProduto.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    if (mensagem) mensagem.textContent = '';
    if (erro) erro.textContent = '';

    try {
      console.log('Processando envio do formulário');
      const imagens = formData.getAll('imagens').filter(file => file.size > 0);
      let imageUrls = [];
      if (imagens.length > 0) {
        imageUrls = await uploadImagens(imagens);
      } else {
        console.warn('Nenhuma imagem selecionada');
      }

      const produto = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'),
        categoria: formData.get('categoria'),
        loja: formData.get('loja'),
        link: formData.get('link'),
        preco: parseFloat(formData.get('preco')),
        imagens: imageUrls,
        criadoEm: new Date().toISOString()
      };

      console.log('Adicionando produto:', produto);
      await addDoc(collection(db, 'produtos'), produto);

      if (mensagem) mensagem.textContent = 'Produto adicionado com sucesso!';
      formProduto.reset();
      carregarProdutos();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error.message);
      if (erro) erro.textContent = 'Erro ao adicionar produto: ${error.message}';
    }
  });
}

auth.onAuthStateChanged((user) => {
  console.log('Estado de autenticação alterado:', user ? 'Logado' : 'Não logado');
  if (user) {
    loginForm.style.display = 'none';
    formContainer.style.display = 'block';
    carregarProdutos();
  } else {
    loginForm.style.display = 'block';
    formContainer.style.display = 'none';
  }
});
