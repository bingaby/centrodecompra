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
      const response = await fetch('/api/produtos', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        feedback.textContent = 'Produto salvo com sucesso!';
        feedback.style.color = 'green';
        form.reset();
      } else {
        feedback.textContent = `Erro: ${result.error}`;
        feedback.style.color = 'red';
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      feedback.textContent = `Erro: ${error.message}`;
      feedback.style.color = 'red';
    } finally {
      if (spinner) spinner.style.display = 'none';
    }
  });
});
