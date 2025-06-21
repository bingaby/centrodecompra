// admin.js
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

window.login = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.style.display = 'none';
    formContainer.style.display = 'block';
    carregarProdutos();
  } catch (error) {
    alert(`Erro no login: ${error.message}`);
  }
};

async function carregarProdutos() {
  try {
    listaProdutos.innerHTML = '<tr><td colspan="8" style="text-align:center;">Carregando produtos...</td></tr>';
    const querySnapshot = await getDocs(collection(db, 'produtos'));
    const produtos = [];
    querySnapshot.forEach((doc) => {
      produtos.push({ id: doc.id, ...doc.data() });
    });
    preencherTabela(produtos);
  } catch (err) {
    listaProdutos.innerHTML = `<tr><td colspan="8" style="color:red;text-align:center;">Erro ao carregar produtos: ${err.message}</td></tr>`;
  }
}

function preencherTabela(produtos) {
  listaProdutos.innerHTML = '';
  if (produtos.length === 0) {
    listaProdutos.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
    return;
  }
  produtos.forEach((produto) => {
    const precoFormatado = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;
    const imagens = produto.imagens || [];
    const miniaturas = imagens.length > 0
      ? imagens.map((img, i) => `<img src="${img}" class="thumbnail" alt="Imagem ${i + 1}" />`).join('')
      : 'Sem imagens';

    listaProdutos.innerHTML += `
      <tr>
        <td>${produto.nome}</td>
        <td>${produto.descricao || 'N/A'}</td>
        <td>${produto.categoria}</td>
        <td>${produto.loja}</td>
        <td><a href="${produto.link}" target="_blank" rel="noopener noreferrer">Link</a></td>
        <td>${precoFormatado}</td>
        <td>${miniaturas}</td>
        <td><button class="excluir" onclick="excluirProduto('${produto.id}')">Excluir</button></td>
      </tr>
    `;
  });
}

window.excluirProduto = async (id) => {
  if (!confirm('Confirma a exclusão deste produto?')) return;
  try {
    await deleteDoc(doc(db, 'produtos', id));
    alert('Produto excluído com sucesso');
    carregarProdutos();
  } catch (err) {
    alert(`Erro ao excluir produto: ${err.message}`);
  }
};

async function uploadImagens(files) {
  const imageUrls = [];
  for (const file of files) {
    const storageRef = ref(storage, `imagens/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    imageUrls.push(url);
  }
  return imageUrls;
}

formProduto.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  mensagem.textContent = '';
  erro.textContent = '';

  try {
    const imagens = formData.getAll('imagens');
    const imageUrls = await uploadImagens(imagens);

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

    await addDoc(collection(db, 'produtos'), produto);

    mensagem.textContent = 'Produto adicionado com sucesso!';
    formProduto.reset();
    carregarProdutos();
  } catch (error) {
    erro.textContent = `Erro ao adicionar produto: ${error.message}`;
  }
});

auth.onAuthStateChanged((user) => {
  if (user) {
    loginForm.style.display = 'none';
    formContainer.style.display = 'block';
    carregarProdutos();
  } else {
    loginForm.style.display = 'block';
    formContainer.style.display = 'none';
  }
});
