// public/admin.js
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tempToken = urlParams.get('tempToken');

  console.log('Token recebido:', tempToken);

  if (tempToken !== 'triple-click-access') {
    console.error('Acesso não autorizado: token inválido');
    alert('Acesso não autorizado. Você será redirecionado.');
    window.location.href = '/index.html';
    return;
  }

  console.log('Acesso autorizado, carregando página admin');

  const form = document.getElementById('produto-form');
  const feedback = document.getElementById('form-feedback');
  const spinner = document.getElementById('loading-spinner');

  if (!form) {
    console.error('Formulário não encontrado');
    feedback.textContent = 'Erro: Formulário não encontrado';
    feedback.style.color = 'red';
    return;
  }

  // Verificar inicialização do Firebase
  if (!window.firebaseApp || !window.firebaseDb) {
    console.warn('Firebase não inicializado');
    feedback.textContent = 'Aviso: Firebase não inicializado, algumas funcionalidades podem estar limitadas';
    feedback.style.color = 'orange';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = 'Salvando produto...';
    feedback.style.color = 'blue';
    if (spinner) spinner.style.display = 'block';

    const formData = new FormData(form);

    try {
      const response = await fetch('https://api-centro-de-compras.onrender.com/api/produtos', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Resposta do servidor:', errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      feedback.textContent = 'Produto salvo com sucesso!';
      feedback.style.color = 'green';
      form.reset();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      feedback.textContent = `Erro: ${error.message}`;
      feedback.style.color = 'red';
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  });
});
