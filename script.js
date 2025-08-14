console.log("Script do index carregado");

// --- Configurações ---
const PRODUTOS_POR_PAGINA = 12; // quantidade de produtos por página
let todosProdutos = [];
let paginaAtual = 1;

// --- Captura elementos do DOM ---
const grid = document.getElementById("grid-produtos");
const errorMessage = document.getElementById("error-message");
const loadingSpinner = document.getElementById("loading-spinner");
const emptyState = document.getElementById("mensagem-vazia");
const loadMoreBtn = document.getElementById("load-more");

if (!grid || !errorMessage || !loadingSpinner || !emptyState || !loadMoreBtn) {
  console.error("Elementos do DOM não encontrados");
}

// --- Função para embaralhar array (Fisher-Yates) ---
function embaralhar(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Renderiza produtos na tela ---
function renderizarProdutos() {
  grid.innerHTML = "";

  // Embaralhar todos os produtos sempre que renderizar
  const produtosEmbaralhados = embaralhar(todosProdutos);

  const inicio = (paginaAtual - 1) * PRODUTOS_POR_PAGINA;
  const fim = inicio + PRODUTOS_POR_PAGINA;
  const produtosPagina = produtosEmbaralhados.slice(inicio, fim);

  if (produtosPagina.length === 0) {
    emptyState.style.display = "block";
    loadMoreBtn.style.display = "none";
    return;
  } else {
    emptyState.style.display = "none";
  }

  produtosPagina.forEach(prod => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${prod.imagem}" alt="${prod.nome}" />
      <h3>${prod.nome}</h3>
      <p>R$ ${prod.preco}</p>
      <a href="${prod.link}" target="_blank" class="btn-primary">Comprar</a>
    `;
    grid.appendChild(card);
  });

  // Esconder botão se não houver mais produtos
  if (fim >= todosProdutos.length) {
    loadMoreBtn.style.display = "none";
  } else {
    loadMoreBtn.style.display = "block";
  }
}

// --- Carregar produtos da API ---
async function carregarProdutos() {
  loadingSpinner.style.display = "block";
  errorMessage.style.display = "none";
  emptyState.style.display = "none";

  try {
    const res = await fetch("/api/produtos"); // substitua pela sua rota real
    if (!res.ok) throw new Error("Erro ao carregar produtos");

    const data = await res.json();
    todosProdutos = Array.isArray(data) ? data : data.data;

    paginaAtual = 1;
    renderizarProdutos();
  } catch (err) {
    console.error(err);
    errorMessage.style.display = "block";
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// --- Evento do botão "Ver Mais" ---
loadMoreBtn.addEventListener("click", () => {
  paginaAtual++;
  renderizarProdutos();
});

// --- Socket.IO para atualizações em tempo real ---
const socket = io(); // ajusta o endereço se for outro
socket.on("connect", () => console.log("Conectado ao Socket.IO"));
socket.on("novoProduto", produto => {
  todosProdutos.push(produto);
  renderizarProdutos();
});

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
});
