const API_URL = 'https://minha-api-produtos.onrender.com';

async function carregarProdutos(categoria = "todas", loja = "todas", busca = "", page = 1) {
  const gridProdutos = document.getElementById("grid-produtos");
  const mensagemVazia = document.getElementById("mensagem-vazia");
  const errorMessage = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading-spinner");

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error("Elementos DOM não encontrados");
    return;
  }

  loadingSpinner.style.display = "block";
  gridProdutos.innerHTML = page === 1 ? "" : gridProdutos.innerHTML;
  mensagemVazia.style.display = "none";
  errorMessage.style.display = "none";

  try {
    const response = await fetch(`${API_URL}/api/produtos?page=${page}&limit=24`, { cache: "no-store" });
    console.log('Status da resposta:', response.status);
    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const data = await response.json();
    const allProducts = data.produtos || [];

    const filteredProducts = allProducts.filter(p =>
      p &&
      typeof p.nome === 'string' &&
      typeof p.categoria === 'string' &&
      typeof p.loja === 'string' &&
      Array.isArray(p.imagens) &&
      (categoria === "todas" || p.categoria.toLowerCase() === categoria.toLowerCase()) &&
      (loja === "todas" || p.loja.toLowerCase() === loja.toLowerCase()) &&
      (!busca || p.nome.toLowerCase().includes(busca.toLowerCase()))
    );

    const start = (page - 1) * 24;
    const end = start + 24;
    const paginatedProducts = filteredProducts.slice(start, end);

    if (paginatedProducts.length === 0 && page === 1) {
      mensagemVazia.style.display = "block";
      gridProdutos.style.display = "none";
    } else {
      mensagemVazia.style.display = "none";
      gridProdutos.style.display = "grid";
      paginatedProducts.forEach((produto, index) => {
        const globalIndex = start + index;
        const card = document.createElement("div");
        card.classList.add("produto-card", "visible");
        card.setAttribute("data-categoria", produto.categoria.toLowerCase());
        card.setAttribute("data-loja", produto.loja.toLowerCase());
        const imagens = produto.imagens && produto.imagens.length > 0
          ? produto.imagens
          : ["https://www.centrodecompra.com.br/imagens/placeholder.jpg"];
        const carrosselId = `carrossel-${globalIndex}`;
        card.innerHTML = `
          <div class="carrossel" id="${carrosselId}">
            <div class="carrossel-imagens">
              ${imagens.map((img, idx) => `<img src="${img}" alt="${produto.nome}" loading="lazy" onerror="this.src='https://www.centrodecompra.com.br/imagens/placeholder.jpg'" onclick="openModal(${globalIndex}, ${idx})">`).join("")}
            </div>
            ${imagens.length > 1 ? `
              <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior">◄</button>
              <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem">►</button>
              <div class="carrossel-dots">
                ${imagens.map((_, idx) => `<span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" onclick="setCarrosselImage('${carrosselId}', ${idx})" aria-label="Selecionar imagem ${idx + 1}"></span>`).join("")}
              </div>
            ` : ""}
          </div>
          <span>${produto.nome}</span>
          <span class="descricao">Loja: ${produto.loja}</span>
          <a href="${produto.link}" target="_blank" class="ver-na-loja ${produto.loja.toLowerCase()}" aria-label="Ver ${produto.nome} na loja">Ver na Loja</a>
        `;
        gridProdutos.appendChild(card);
      });
    }
    document.getElementById("load-more").style.display = data.total > end ? "block" : "none";
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    errorMessage.textContent = 'Erro ao carregar produtos. Tente novamente.';
    errorMessage.style.display = 'block';
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Funções do carrossel (mantenha as existentes ou adicione se necessário)
function moveCarrossel(carrosselId, direction) {
  const carrossel = document.getElementById(carrosselId);
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');
  let index = parseInt(imagens.dataset.index || 0);
  index = (index + direction + dots.length) % dots.length;
  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}

function setCarrosselImage(carrosselId, index) {
  const carrossel = document.getElementById(carrosselId);
  const imagens = carrossel.querySelector('.carrossel-imagens');
  const dots = carrossel.querySelectorAll('.carrossel-dot');
  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle('ativo', i === index));
}
