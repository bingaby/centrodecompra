const API_BASE_URL = 'https://minha-api-produtos.onrender.com';
const socket = io(API_BASE_URL);
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded disparado, iniciando script.js');

  // Manipulador de erro para imagens
  document.querySelectorAll('img').forEach(img => {
    img.onerror = () => {
      console.log(`Erro ao carregar imagem: ${img.src}`);
      img.src = '/imagens/placeholder.jpg';
    };
  });

  // Clique triplo no logo
  const logo = document.getElementById('site-logo');
  if (!logo) {
    console.error("Elemento com ID 'site-logo' não encontrado no DOM. Verifique o index.html.");
  } else {
    let clickCount = 0, clickTimeout = null;
    logo.style.pointerEvents = 'auto';
    logo.addEventListener('click', (e) => {
      console.log('Clique no logo:', clickCount + 1);
      e.stopPropagation();
      clickCount++;
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => { 
          console.log('Timeout do clique triplo atingido, reiniciando contador');
          clickCount = 0; 
        }, 1000);
      } else if (clickCount === 3) {
        console.log('Tentando redirecionar para admin-xyz-123.html');
        clearTimeout(clickTimeout);
        try {
          window.location.href = '/admin-xyz-123.html';
        } catch (error) {
          console.error('Erro ao redirecionar para admin-xyz-123.html:', error);
          alert('Erro ao acessar a página de administração. Veja o console para detalhes.');
        }
        clickCount = 0;
      }
    });
  }

  // Atualizar ano no footer
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  } else {
    console.warn("Elemento com ID 'year' não encontrado");
  }

  // Carregar produtos
  async function carregarProdutos(page = 1) {
    console.log('Iniciando carregarProdutos, página:', page);
    const categoria = document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas';
    const loja = document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas';
    const busca = document.getElementById('busca')?.value || '';
    const url = `${API_BASE_URL}/api/produtos?page=${page}&limit=12` +
                `${categoria !== 'todas' ? `&categoria=${categoria}` : ''}` +
                `${loja !== 'todas' ? `&loja=${loja}` : ''}` +
                `${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`;
    console.log('URL da API:', url);

    const spinner = document.getElementById('loading-spinner');
    const gridProdutos = document.getElementById('grid-produtos');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');

    if (!spinner || !gridProdutos || !mensagemVazia || !errorMessage) {
      console.error('Elementos de interface não encontrados:', { spinner, gridProdutos, mensagemVazia, errorMessage });
      return;
    }

    spinner.style.display = 'block';
    gridProdutos.innerHTML = '';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
      const response = await fetch(url);
      console.log('Resposta da API:', response.status);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const { data, total } = await response.json();
      console.log('Dados recebidos:', data, 'Total:', total);

      if (data.length === 0) {
        console.log('Nenhum produto encontrado, exibindo mensagem vazia');
        mensagemVazia.style.display = 'block';
      } else {
        data.forEach(produto => {
          console.log('Adicionando produto:', produto.nome);
          const div = document.createElement('div');
          div.className = 'produto-card';
          div.innerHTML = `
            <img src="${produto.imagens[0]}" alt="${produto.nome}" loading="lazy">
            <span>${produto.nome}</span>
            <span class="descricao">${produto.descricao || 'Sem descrição'}</span>
            <span class="preco-clique" data-preco="R$ ${parseFloat(produto.preco).toFixed(2)}">Clique aqui para ver o preço</span>
            <a href="${produto.link}" target="_blank" class="ver-na-loja">Ver na Loja</a>
          `;
          // Evento para abrir modal ao clicar no card (excluindo preço e link)
          div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('preco-clique') && !e.target.classList.contains('ver-na-loja')) {
              openModal(produto.imagens);
            }
          });
          // Evento para revelar o preço
          const precoClique = div.querySelector('.preco-clique');
          precoClique.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita abrir o modal
            console.log('Preço clicado:', produto.nome);
            precoClique.textContent = precoClique.dataset.preco;
            precoClique.classList.remove('preco-clique');
            precoClique.classList.add('preco');
          });
          gridProdutos.appendChild(div);
        });
      }

      // Paginação
      const totalPages = Math.ceil(total / 12);
      document.getElementById('page-info').textContent = `Página ${page}`;
      document.getElementById('prev-page').disabled = page === 1;
      document.getElementById('next-page').disabled = page === totalPages;
      document.getElementById('prev-page').onclick = () => carregarProdutos(page - 1);
      document.getElementById('next-page').onclick = () => carregarProdutos(page + 1);
      currentPage = page;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      errorMessage.textContent = 'Erro ao carregar produtos';
      errorMessage.style.display = 'block';
    } finally {
      spinner.style.display = 'none';
    }
  }

  // Filtrar por categoria
  window.filtrarPorCategoria = function(categoria) {
    console.log('Filtrando por categoria:', categoria);
    document.querySelectorAll('.categoria-item').forEach(item => {
      item.classList.toggle('ativa', item.dataset.categoria === categoria);
    });
    carregarProdutos(1);
  };

  // Filtrar por loja
  window.filtrarPorLoja = function(loja) {
    console.log('Filtrando por loja:', loja);
    document.querySelectorAll('.loja, .loja-todas').forEach(item => {
      item.classList.toggle('ativa', item.dataset.loja === loja);
    });
    carregarProdutos(1);
  };

  // Busca
  const buscaInput = document.getElementById('busca');
  if (buscaInput) {
    buscaInput.addEventListener('input', () => {
      console.log('Busca digitada:', buscaInput.value);
      carregarProdutos(1);
    });
  } else {
    console.warn("Elemento com ID 'busca' não encontrado");
  }

  // Modal e carrossel
  let currentImageIndex = 0;
  window.openModal = function(images) {
    console.log('Abrindo modal com imagens:', images);
    const modal = document.getElementById('imageModal');
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDots = document.getElementById('modalCarrosselDots');
    
    if (!modal || !carrosselImagens || !carrosselDots) {
      console.error('Elementos do modal não encontrados:', { modal, carrosselImagens, carrosselDots });
      return;
    }

    carrosselImagens.innerHTML = '';
    carrosselDots.innerHTML = '';
    images.forEach((img, index) => {
      const imgElement = document.createElement('img');
      imgElement.src = img;
      imgElement.className = 'modal-image';
      imgElement.style.display = index === 0 ? 'block' : 'none';
      carrosselImagens.appendChild(imgElement);

      const dot = document.createElement('div');
      dot.className = 'carrossel-dot';
      dot.classList.toggle('ativa', index === 0);
      dot.onclick = () => {
        currentImageIndex = index;
        updateCarrossel();
      };
      carrosselDots.appendChild(dot);
    });

    modal.style.display = 'flex';
    currentImageIndex = 0;
  };

  window.closeModal = function() {
    console.log('Fechando modal');
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.style.display = 'none';
    } else {
      console.error("Elemento com ID 'imageModal' não encontrado");
    }
  };

  window.moveModalCarrossel = function(direction) {
    console.log('Movendo carrossel:', direction);
    const images = document.querySelectorAll('.modal-image');
    currentImageIndex = (currentImageIndex + direction + images.length) % images.length;
    updateCarrossel();
  };

  function updateCarrossel() {
    document.querySelectorAll('.modal-image').forEach((img, index) => {
      img.style.display = index === currentImageIndex ? 'block' : 'none';
    });
    document.querySelectorAll('.carrossel-dot').forEach((dot, index) => {
      dot.classList.toggle('ativa', index === currentImageIndex);
    });
  }

  // Eventos Socket.IO
  socket.on('novoProduto', () => {
    console.log('Evento Socket.IO: novoProduto recebido');
    carregarProdutos(currentPage);
  });
  socket.on('produtoAtualizado', () => {
    console.log('Evento Socket.IO: produtoAtualizado recebido');
    carregarProdutos(currentPage);
  });
  socket.on('produtoExcluido', () => {
    console.log('Evento Socket.IO: produtoExcluido recebido');
    carregarProdutos(currentPage);
  });

  // Carregar produtos iniciais
  console.log('Chamando carregarProdutos inicial');
  carregarProdutos();
});
