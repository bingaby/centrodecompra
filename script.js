let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';

document.addEventListener('DOMContentLoaded', () => {
  // Configurar três cliques no logo
  let clickCount = 0;
  let clickTimeout;
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', () => {
      clickCount++;
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => {
          clickCount = 0;
        }, 1000);
      }
      if (clickCount === 3) {
        clearTimeout(clickTimeout);
        clickCount = 0;
        window.location.href = 'admin-xyz-123.html';
      }
    });
  }

  // Configurar eventos de filtro
  document.querySelectorAll('.categoria-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelector('.categoria-item.ativa')?.classList.remove('ativa');
      item.classList.add('ativa');
      categoriaSelecionada = item.dataset.categoria;
      filtrarProdutos();
    });
  });

  document.querySelectorAll('.loja').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelector('.loja.ativa')?.classList.remove('ativa');
      item.classList.add('ativa');
      lojaSelecionada = item.dataset.loja || 'todas';
      filtrarProdutos();
    });
  });

  document.getElementById('busca').addEventListener('input', filtrarProdutos);

  // Carregar produtos
  carregarProdutos();
});

async function carregarProdutos() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/bingaby/centrodecompra/main/produtos.json');
    produtos = await response.json();
    filtrarProdutos();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    document.getElementById('mensagem-vazia').textContent = 'Erro ao carregar produtos.';
  }
}

function filtrarProdutos() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter(produto =>
    (categoriaSelecionada === 'todas' || produto.categoria.toLowerCase() === categoriaSelecionada.toLowerCase()) &&
    (lojaSelecionada === 'todas' || produto.loja.toLowerCase() === lojaSelecionada.toLowerCase()) &&
    produto.nome.toLowerCase().includes(busca)
  );

  gridProdutos.innerHTML = '';
  if (!produtosFiltrados.length) {
    mensagemVazia.textContent = 'Nenhum produto encontrado.';
    mensagemVazia.style.display = 'block';
    return;
  }

  mensagemVazia.style.display = 'none';
  produtosFiltrados.forEach(produto => {
    const nomeImagem = produto.imagens?.[0] || 'sem-imagem.jpg';
    const imagemURL = `https://raw.githubusercontent.com/bingaby/centrodecompra/main/upload/${nomeImagem}`;

    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <img src="${imagemURL}" alt="${produto.nome}" loading="lazy">
      <h3>${produto.nome}</h3>
      <p><strong>Loja:</strong> ${produto.loja}</p>
      <p><strong>Preço:</strong> R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</p>
      <a href="${produto.link}" target="_blank" rel="noopener noreferrer" class="botao-comprar">Comprar</a>
    `;
    gridProdutos.appendChild(card);
  });
}
