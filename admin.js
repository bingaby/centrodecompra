// Verifica o token de acesso
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('tempToken');
if (token !== 'triple-click-access') {
  alert('Acesso não autorizado. Redirecionando para a página inicial.');
  window.location.href = '/index.html';
  throw new Error('Acesso não autorizado');
}
console.log('Token recebido: triple-click-access');
console.log('Acesso autorizado, carregando página admin');

// Acessa o Firestore
const db = window.firebaseDb;

// Seleciona elementos do formulário
const form = document.getElementById('produto-form');
const submitBtn = document.getElementById('submit-btn');
const spinner = document.getElementById('spinner');
const message = document.getElementById('message');
const imagePreview = document.getElementById('imagePreview');

// Função para exibir mensagens
function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? 'error' : 'success';
}

// Função para fazer upload de uma imagem para o Cloudinary
formData.append('upload_preset', 'centrodecompra_upload');

const url = 'https://api.cloudinary.com/v1_1/damasyarq/image/upload';
async function uploadImage(file, nome) {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Imagem muito grande. Máximo 2 MB por imagem.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'centrodecompra_upload'); // Usa o preset configurado
  formData.append('folder', `produtos/${nome}`); // Organiza imagens por nome do produto
  formData.append('cloud_name', 'damasyarq'); // Substitua pelo seu cloud_name

  const response = await fetch('https://api.cloudinary.com/v1_1/damasyarq/image/upload', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.secure_url; // Retorna a URL segura da imagem
}

// Pré-visualização das imagens selecionadas
document.getElementById('imagens').addEventListener('change', (e) => {
  imagePreview.innerHTML = '';
  const files = e.target.files;
  if (files.length > 5) {
    showMessage('Máximo de 5 imagens permitidas', true);
    e.target.value = '';
    return;
  }
  for (const file of files) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = 'Pré-visualização';
    img.style.width = '100px';
    imagePreview.appendChild(img);
  }
});

// Manipula o envio do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  spinner.style.display = 'block';
  showMessage('');

  try {
    // Coleta dados do formulário
    const nome = form.nome.value.trim();
    const descricao = form.descricao.value.trim();
    const categoria = form.categoria.value;
    const loja = form.loja.value;
    const link = form.link.value.trim();
    const preco = parseFloat(form.preco.value);

    // Valida campos
    if (!nome || !descricao || !categoria || !loja || !link || !preco) {
      throw new Error('Todos os campos são obrigatórios');
    }
    if (isNaN(preco) || preco <= 0) {
      throw new Error('Preço inválido');
    }

    // Faz upload das imagens para o Cloudinary
    const imagens = form.imagens.files;
    if (imagens.length > 5) {
      throw new Error('Máximo de 5 imagens permitidas');
    }
    const imagensUrls = [];
    for (const imagem of imagens) {
      const url = await uploadImage(imagem, nome);
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
      createdAt: new Date(),
    };
    await window.firebase.firestore.addDoc(window.firebase.firestore.collection(db, 'produtos'), produto);

    // Exibe mensagem de sucesso e limpa o formulário
    showMessage('Produto cadastrado com sucesso!');
    form.reset();
    imagePreview.innerHTML = '';
  } catch (error) {
    console.error('Erro ao enviar formulário:', error);
    showMessage(`Erro ao cadastrar produto: ${error.message}`, true);
  } finally {
    submitBtn.disabled = false;
    spinner.style.display = 'none';
  }
});
