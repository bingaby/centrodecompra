const API_BASE_URL = 'https://minha-api-produtos.onrender.com';
const socket = io(API_BASE_URL);
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
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
    let clickCount = 0;
    let clickTimeout = null;
    logo.style.pointerEvents = 'auto'; // Garante que o elemento receba cliques
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clickCount++;
      console.log(`Clique no logo detectado: ${clickCount}/3`);
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => {
          console.log('Timeout do clique triplo atingido, reiniciando contador');
          clickCount = 0;
        }, 1000);
      } else if (clickCount === 3) {
        console.log('Clique triplo detectado, tentando redirecionar para /admin-xyz-123.html');
        clearTimeout(clickTimeout);
        try {
          // Verificar se a página existe antes de redirecionar
          fetch('/admin-xyz-123.html', { method: 'HEAD' })
            .then(response => {
              if (response.ok) {
                console.log('Página admin-xyz-123.html encontrada, redirecionando...');
                window.location.href = '/admin-xyz-123.html';
              } else {
                console.error('Página admin-xyz-123.html não encontrada no servidor (status: ' + response.status + ')');
                alert('Erro: Página de administração não encontrada. Verifique o servidor.');
              }
            })
            .catch(error => {
              console.error('Erro ao verificar admin-xyz-123.html:', error);
              alert('Erro ao acessar a página de administração.');
            });
        } catch (error) {
          console.error('Erro ao redirecionar para admin-xyz-123.html:', error);
          alert('Erro ao redirecionar. Veja o console para detalhes.');
        }
        clickCount = 0;
      }
    });

    // Fallback: Clique duplo (opcional, descomente se desejar testar)
    /*
    logo.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Clique duplo detectado como fallback, redirecionando para /admin-xyz-123.html');
      window.location.href = '/admin-xyz-123.html';
    });
    */
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
    const categoria = document.querySelector('.categoria-item.ativa')?.dataset.categoria || 'todas';
    const loja = document.querySelector('.loja.ativa, .loja-todas.ativa')?.dataset.loja || 'todas';
    const busca = document.getElementById('busca').value;
    const url = `${API_BASE_URL}/api/produtos?page=${page}&limit=12` +
                `${categoria !== 'todas' ? `&categoria=${categoria}` : ''}` +
                `${loja !== 'todas' ? `&loja=${loja}` : ''}` +
                `${busca ? `&busca=${encodeURIComponent(busca)}` : ''}`;

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
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const { data, total } = await response.json();

      if (data.length === 0) {
        mensagemVazia.style.display = 'block';
      } else {
        data.forEach(produto => {
          const div = document.createElement('div');
          div.className = 'produto-card';
          div.innerHTML = `
            <img src="${produto.imagens[0]}" alt="${produto.nome}" loading="lazy">
            <span>${produto.nome}</span>
            <span class="descricao">${produto.descricao || 'Sem descrição'}</span>
            <span class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</span>
            <a href="${produto.link}" target="_blank" class="ver-na-loja">Ver na Loja</a>
          `;
          div.addEventListener('click', () => openModal(produto.imagens));
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
    document.querySelectorAll('.categoria-item').forEach(item => {
      item.classList.toggle('ativa', item.dataset.categoria === categoria);
    });
    carregarProdutos(1);
  };

  // Filtrar por loja
  window.filtrarPorLoja = function(loja) {
    document.querySelectorAll('.loja, .loja-todas').forEach(item => {
      item.classList.toggle('ativa', item.dataset.loja === loja);
    });
    carregarProdutos(1);
  };

  // Busca
  const buscaInput = document.getElementById('busca');
  if (buscaInput) {
    buscaInput.addEventListener('input', () => {
      carregarProdutos(1);
    });
  } else {
    console.warn("Elemento com ID 'busca' não encontrado");
  }

  // Modal e carrossel
  let currentImageIndex = 0;
  window.openModal = function(images) {
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
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.style.display = 'none';
    } else {
      console.error("Elemento com ID 'imageModal' não encontrado");
    }
  };

  window.moveModalCarrossel = function(direction) {
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
  carregarProdutos();
});
