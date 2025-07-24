async function carregarProdutos() {
  const spinner = document.getElementById('loading-spinner');
  const grid = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');
  const errorMessage = document.getElementById('error-message');
  const pageInfo = document.getElementById('page-info');
  const prevButton = document.getElementById('prev-page');
  const nextButton = document.getElementById('next-page');

  spinner.style.display = 'block';
  grid.innerHTML = '';
  mensagemVazia.style.display = 'none';
  errorMessage.style.display = 'none';

  try {
    const response = await fetch(`${BACKEND_URL}?page=${currentPage}&limit=${itemsPerPage}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${await response.text()}`);
    }
    const { produtos, total, totalPages } = await response.json();

    let filteredProdutos = produtos;
    if (currentCategoria !== 'todas') {
      filteredProdutos = filteredProdutos.filter(p => p.categoria === currentCategoria);
    }
    if (currentLoja !== 'todas') {
      filteredProdutos = filteredProdutos.filter(p => p.loja === currentLoja);
    }
    if (searchQuery) {
      filteredProdutos = filteredProdutos.filter(p => p.nome.toLowerCase().includes(searchQuery) || p.descricao.toLowerCase().includes(searchQuery));
    }

    if (filteredProdutos.length === 0) {
      mensagemVazia.style.display = 'block';
    } else {
      filteredProdutos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
          <div class="carrossel">
            <div class="carrossel-imagens" id="carrossel-${produto.rowIndex}">
              ${produto.imagens.map(img => `<img src="${img}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/200?text=Imagem+Indisponivel'">`).join('')}
            </div>
            ${produto.imagens.length > 1 ? `
              <button class="carrossel-prev" onclick="moveCarrossel(${produto.rowIndex}, -1)">◄</button>
              <button class="carrossel-next" onclick="moveCarrossel(${produto.rowIndex}, 1)">▶</button>
              <div class="carrossel-dots" id="dots-${produto.rowIndex}">
                ${produto.imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativa' : ''}" onclick="setCarrossel(${produto.rowIndex}, ${i})"></span>`).join('')}
              </div>
            ` : ''}
          </div>
          <span>${produto.nome}</span>
          <span class="descricao">${produto.descricao}</span>
          <span class="preco">R$${produto.preco}</span>
          <a href="${produto.link}" class="ver-na-loja" target="_blank">Ver na Loja</a>
        `;
        grid.appendChild(card);
      });
    }

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;

    prevButton.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        carregarProdutos();
      }
    };
    nextButton.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        carregarProdutos();
      }
    };
  } catch (error) {
    console.error('Erro:', error);
    errorMessage.textContent = `Erro ao carregar produtos: ${error.message}. Verifique se a API está online.`;
    errorMessage.style.display = 'block';
  } finally {
    spinner.style.display = 'none';
  }
}