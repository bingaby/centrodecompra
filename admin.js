// Acessa objetos Firebase do window
const db = window.firebaseDb;
const storage = window.firebaseStorage;

// Seleciona elementos do formulário
const form = document.getElementById('produto-form');
const submitBtn = document.getElementById('submit-btn');
const spinner = document.getElementById('spinner');
const message = document.getElementById('message');

// Função para exibir mensagens
function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? 'error' : '';
}

// Manipula o envio do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  spinner.style.display = 'block';
  showMessage('');

  try {
    // Coleta dados do formulário
    const nome = form.nome.value;
    const descricao = form.descricao.value;
    const categoria = form.categoria.value;
    const loja = form.loja.value;
    const link = form.link.value;
    const preco = parseFloat(form.preco.value);

    // Valida campos
    if (!nome || !descricao || !categoria || !loja || !link || !preco) {
      throw new Error('Todos os campos são obrigatórios');
    }
    if (isNaN(preco) || preco <= 0) {
      throw new Error('Preço inválido');
    }

    // Faz upload das imagens para o Firebase Storage
    const imagens = form.imagens.files;
    const imagensUrls = [];
    for (const imagem of imagens) {
      const storageRef = window.firebase.storage.ref(storage, `produtos/${nome}/${Date.now()}-${imagem.name}`);
      await window.firebase.storage.uploadBytes(storageRef, imagem);
      const url = await window.firebase.storage.getDownloadURL(storageRef);
      imagensUrls.push(url);
    }

    // Salva os dados no Firestore
    const produto = {
      nome,
      descricao,
      categoria,
      loja,
      link,
      preco,
      imagensUrls,
      createdAt: new Date()
    };
    await window.firebase.firestore.addDoc(window.firebase.firestore.collection(db, 'produtos'), produto);

    // Exibe mensagem de sucesso e limpa o formulário
    showMessage('Produto cadastrado com sucesso!');
    form.reset();
  } catch (error) {
    showMessage(`Erro ao cadastrar produto: ${error.message}`, true);
  } finally {
    submitBtn.disabled = false;
    spinner.style.display = 'none';
  }
});
