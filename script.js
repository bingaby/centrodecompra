let produtos = [];
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';

document.addEventListener('DOMContentLoaded', () => {
  // Configurar três cliques no logo
  const logo = document.getElementById('logo');
  if (!logo) {
    console.error('Erro: Elemento #logo não encontrado no DOM. Verifique o index.html.');
    return;
  }

  let clickCount = 0;
  let clickTimeout;
  logo.addEventListener('click', (event) => {
    event.preventDefault(); // Evita comportamento padrão do <a> ao redor do logo
    clickCount++;
    console.log(`Clique ${clickCount} no logo (id="logo")`);
    if (clickCount === 1) {
      clickTimeout = setTimeout(() => {
        clickCount = 0;
        console.log('Contador de cliques resetado após 1 segundo');
      }, 1000);
    }
    if (clickCount === 3) {
      clearTimeout(clickTimeout);
      clickCount = 0;
      console.log('Tentando redirecionar para admin-xyz-123.html');
      try {
        window.location.href = 'admin-xyz-123.html';
      } catch (error) {
        console.error('Erro ao redirecionar para admin-xyz-123.html:', error);
      }
    }
  });

  // Configurar eventos de filtro
  const categoriaItems = document.querySelectorAll('.categoria-item');
  if (categoriaItems.length === 0) {
    console.warn('Nenhum elemento .categoria-item encontrado.');
  }
  categoriaItems.forEach(item => {
    item.addEventListener('click', () => {
      document.querySelector('.categoria-item.ativa')?.classList.remove('ativa');
      item.classList.add('ativa');
      categoriaSelecionada = item.dataset.categoria;
      filtrarProdutos();
    });
  });

  const lojaItems = document.querySelectorAll('.loja');
  if (lojaItems.length === 0) {
    console.warn('Nenhum elemento .loja encontrado.');
  }
  lojaItems.forEach(item => {
    item.addEventListener('click', () => {
      document.querySelector('.loja.ativa')?.classList.remove('ativa');
      item.classList.add('ativa');
      lojaSelecionada = item.dataset.loja || 'todas';
      filtrarProdutos();
    });
  });

  const buscaInput = document.getElementById('busca');
  if (buscaInput) {
    buscaInput.addEventListener('input', filtrarProdutos);
  } else {
    console.error('Elemento #busca não encontrado.');
  }

  // Carregar produtos
  carregarProdutos();
});

async function carregarProdutos() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/bingaby/centrodecompra/main/produtos.json');
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    produtos = await response.json();
    filtrarProdutos();
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    const mensagemVazia = document.getElementById('mensagem-vazia');
    if (mensagemVazia) {
      mensagemVazia.textContent = 'Erro ao carregar produtos.';
      mensagemVazia.style.display = 'block';
    }
  }
}

function filtrarProdutos() {
  const busca = document.getElementById('busca')?.value.toLowerCase() || '';
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  if (!gridProdutos || !mensagemVazia) {
    console.error('Elementos #grid-produtos ou #mensagem-vazia não encontrados.');
    return;
  }

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
