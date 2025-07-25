import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const form = document.getElementById('produto-form');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const spinner = document.getElementById('spinner');
const message = document.getElementById('message');
const productList = document.getElementById('products');
const imagePreview = document.getElementById('imagePreview');

// Função para exibir mensagens
const showMessage = (text, isError = false) => {
  message.textContent = text;
  message.className = isError ? 'error' : 'success';
  setTimeout(() => { message.textContent = ''; message.className = ''; }, 5000);
};

// Função para listar produtos
const listProducts = async () => {
  productList.innerHTML = '';
  try {
    const querySnapshot = await getDocs(collection(window.firebaseDb, 'produtos'));
    querySnapshot.forEach((doc) => {
      const produto = doc.data();
      // Filtrar "produtos pequenos" (exemplo: categoria 'infantil' ou 'beleza')
      if (['infantil', 'beleza'].includes(produto.categoria)) { // Ajuste conforme critério de "produtos pequenos"
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.innerHTML = `
          <div class="product-details">
            <strong>${produto.nome}</strong><br>
            Categoria: ${produto.categoria}<br>
            Preço: R$${produto.preco.toFixed(2)}<br>
            Loja: ${produto.loja}<br>
            ${produto.imagens && produto.imagens.length > 0 ? `<img src="${produto.imagens[0]}" alt="${produto.nome}">` : ''}
          </div>
          <div class="product-actions">
            <button onclick="editProduct('${doc.id}')">Editar</button>
            <button onclick="deleteProduct('${doc.id}')">Excluir</button>
          </div>
        `;
        productList.appendChild(productItem);
      }
    });
  } catch (error) {
    showMessage('Erro ao carregar produtos: ' + error.message, true);
  }
};

// Função para editar produto
window.editProduct = async (id) => {
  try {
    const docRef = doc(window.firebaseDb, 'produtos', id);
    const docSnap = await getDocs(collection(window.firebaseDb, 'produtos'));
    const produto = docSnap.docs.find(d => d.id === id).data();
    
    // Preencher formulário
    document.getElementById('produto-id').value = id;
    document.getElementById('nome').value = produto.nome;
    document.getElementById('descricao').value = produto.descricao;
    document.getElementById('categoria').value = produto.categoria;
    document.getElementById('loja').value = produto.loja;
    document.getElementById('link').value = produto.link;
    document.getElementById('preco').value = produto.preco;
    
    // Mostrar imagens existentes
    imagePreview.innerHTML = produto.imagens ? produto.imagens.map(img => `<img src="${img}" alt="Preview">`).join('') : '';
    
    // Alterar botão para "Atualizar"
    submitBtn.textContent = 'Atualizar Produto';
    cancelBtn.style.display = 'inline-block';
  } catch (error) {
    showMessage('Erro ao carregar produto para edição: ' + error.message, true);
  }
};

// Função para excluir produto
window.deleteProduct = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;
  spinner.style.display = 'block';
  try {
    await deleteDoc(doc(window.firebaseDb, 'produtos', id));
    showMessage('Produto excluído com sucesso!');
    listProducts();
  } catch (error) {
    showMessage('Erro ao excluir produto: ' + error.message, true);
  } finally {
    spinner.style.display = 'none';
  }
};

// Função para limpar formulário
const resetForm = () => {
  form.reset();
  document.getElementById('produto-id').value = '';
  imagePreview.innerHTML = '';
  submitBtn.textContent = 'Cadastrar Produto';
  cancelBtn.style.display = 'none';
};

// Manipular envio do formulário (cadastrar ou atualizar)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  spinner.style.display = 'block';
  
  const produtoId = document.getElementById('produto-id').value;
  const produto = {
    nome: form.nome.value,
    descricao: form.descricao.value,
    categoria: form.categoria.value,
    loja: form.loja.value,
    link: form.link.value,
    preco: parseFloat(form.preco.value),
    imagens: [], // Adicione lógica para upload de imagens
    criadoEm: new Date()
  };

  try {
    if (produtoId) {
      // Atualizar produto
      await updateDoc(doc(window.firebaseDb, 'produtos', produtoId), produto);
      showMessage('Produto atualizado com sucesso!');
    } else {
      // Cadastrar novo produto
      await addDoc(collection(window.firebaseDb, 'produtos'), produto);
      showMessage('Produto cadastrado com sucesso!');
    }
    resetForm();
    listProducts();
  } catch (error) {
    showMessage('Erro ao salvar produto: ' + error.message, true);
  } finally {
    spinner.style.display = 'none';
  }
});

// Cancelar edição
cancelBtn.addEventListener('click', resetForm);

// Verificar autenticação
onAuthStateChanged(window.firebaseAuth, (user) => {
  if (user) {
    // Usuário logado, carregar produtos
    listProducts();
  } else {
    // Redirecionar para login
    window.location.href = '/login.html';
  }
});
