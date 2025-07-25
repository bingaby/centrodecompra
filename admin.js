import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const form = document.getElementById('produto-form');
const spinner = document.getElementById('spinner');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  spinner.style.display = 'block';
  message.textContent = '';

  try {
    const produto = {
      nome: form.nome.value,
      descricao: form.descricao.value,
      categoria: form.categoria.value,
      loja: form.loja.value,
      link: form.link.value,
      preco: parseFloat(form.preco.value),
      imagens: [], // Adicione lógica para upload de imagens, se necessário
      criadoEm: new Date()
    };

    await addDoc(collection(window.firebaseDb, 'produtos'), produto);
    message.textContent = 'Produto cadastrado com sucesso!';
    message.className = 'success';
    form.reset();
  } catch (error) {
    message.textContent = 'Erro ao cadastrar produto: ' + error.message;
    message.className = 'error';
  } finally {
    spinner.style.display = 'none';
  }
});
