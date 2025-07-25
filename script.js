import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// 🔥 Configuração do Firebase (substitua pelos seus dados)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para otimizar URLs do Cloudinary
function optimizeCloudinaryUrl(url) {
  const urlParts = url.split('/upload/');
  return `${urlParts[0]}/upload/f_auto,q_auto,w_300/${urlParts[1]}`;
}

// Carrega e exibe produtos
async function loadProducts() {
  try {
    const gridProdutos = document.getElementById('grid-produtos');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    gridProdutos.innerHTML = '';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';

    const querySnapshot = await getDocs(collection(db, 'produtos'));

    if (querySnapshot.empty) {
      mensagemVazia.style.display = 'block';
      return;
    }

    querySnapshot.forEach((doc) => {
      const produto = doc.data();
      const div = document.createElement('div');
      div.className = 'produto';
      const optimizedImages = produto.imagensUrls.map(url => optimizeCloudinaryUrl(url));
      div.innerHTML = `
        <h3>${produto.nome}</h3>
        <p>${produto.descricao}</p>
        <p>R$ ${produto.preco.toFixed(2)}</p>
        <p>Categoria: ${produto.categoria}</p>
        <p>Loja: ${produto.loja}</p>
        <a href="${produto.link}" target="_blank">Comprar</a>
        <div class="imagens">
          ${optimizedImages.map(img => `<img src="${img}" alt="${produto.nome}" loading="lazy">`).join('')}
        </div>
      `;
      gridProdutos.appendChild(div);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = 'Erro ao carregar produtos. Tente novamente.';
      errorMessage.style.display = 'block';
    }
  }
}

window.addEventListener('load', loadProducts);
