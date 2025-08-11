const API_URL = 'https://minha-api-produtos.onrender.com'; // Ajuste conforme necessário

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

    const response = await fetch(`${API_URL}/api/produtos`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || 'Erro ao cadastrar produto');
    }

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
  const form = document.getElementById('cadastro-produto');
  if (form) {
    form.addEventListener('submit', cadastrarProduto);
  } else {
    console.error('Formulário cadastro-produto não encontrado');
  }
});
