const API_URL = 'https://minha-api-produtos.onrender.com';

async function cadastrarProduto(event) {
  event.preventDefault();
  const form = document.getElementById('cadastro-produto');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  if (!form || !errorMessage || !successMessage) {
    console.error('Elementos do formulário não encontrados');
    return;
  }

  const formData = new FormData(form);
  const imagens = formData.getAll('imagens');
  if (imagens.length > 5) {
    errorMessage.textContent = 'Máximo de 5 imagens permitido.';
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    return;
  }
  if (imagens.length === 0) {
    errorMessage.textContent = 'Selecione pelo menos uma imagem.';
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    return;
  }

  try {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    console.log('Enviando dados para:', `${API_URL}/api/produtos`);
    const response = await fetch(`${API_URL}/api/produtos`, {
      method: 'POST',
      body: formData,
    });

    console.log('Status da resposta:', response.status);
    const text = await response.text();
    console.log('Resposta bruta:', text);

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${text}`);
    }

    const data = JSON.parse(text);
    successMessage.textContent = 'Produto cadastrado com sucesso! Redirecionando...';
    successMessage.style.display = 'block';
    form.reset();
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    errorMessage.textContent = `Erro ao cadastrar produto: ${error.message}`;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('admin.js carregado com sucesso');
  const form = document.getElementById('cadastro-produto');
  if (form) {
    form.addEventListener('submit', cadastrarProduto);
  } else {
    console.error('Formulário cadastro-produto não encontrado');
  }
});
