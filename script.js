<script>
  const PLANILHA_URL = 'https://opensheet.vercel.app/1SMpUcrobcuWVGq4F_3N59rhs2_GpDo2531_2blpwEhs/Produtos';
  let produtos = [];
  let categoriaSelecionada = 'todas';
  let lojaSelecionada = 'todas';
  let termoBusca = '';
  let currentImages = [];
  let currentImageIndex = 0;
  let currentPage = 1;
  const produtosPorPagina = 28;
  let totalProdutos = 0;

  function normalizarString(str) {
    return str?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function atualizarAnoFooter() {
    const yearElement = document.getElementById('year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
  }

  function configurarCliqueLogo() {
    const logo = document.getElementById('site-logo-img');
    if (!logo) return console.error('ID site-logo-img não encontrado');
    let clickCount = 0;
    let clickTimer;
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => clickCount = 0, 500);
      } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        window.location.href = `admin-xyz-123.html?tempToken=triple-click-access`;
        clickCount = 0;
      }
    });
  }

  async function carregarProdutos() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    const gridProdutos = document.getElementById('grid-produtos');

    if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
      console.error('Elementos essenciais não encontrados');
      errorMessage.textContent = 'Erro: Elementos da página não encontrados. Contate o suporte.';
      errorMessage.style.display = 'block';
      return;
    }

    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';
    gridProdutos.innerHTML = '';

    try {
      console.log('Carregando produtos de:', PLANILHA_URL);
      const response = await fetch(PLANILHA_URL, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      console.log('Status da resposta:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: Falha ao carregar produtos - ${errorText}`);
      }
      produtos = await response.json();
      if (!Array.isArray(produtos)) throw new Error('Resposta inválida: produtos não é um array');
      totalProdutos = produtos.length;
      console.log('Dados recebidos:', produtos);
      filtrarProdutos();
      atualizarPaginacao();
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      errorMessage.textContent = `Erro: Não foi possível carregar os produtos. Verifique se a planilha está pública e a aba "Produtos" está correta. Detalhes: ${error.message}`;
      errorMessage.style.display = 'block';
      mensagemVazia.style.display = 'none';
      gridProdutos.style.display = 'none';
    } finally {
      loadingSpinner.style.display = 'none';
    }
  }

  // ... (demais funções: filtrarProdutos, moveCarrossel, openModal, etc., mantidas como no código original) ...

  document.addEventListener('DOMContentLoaded', () => {
    console.log('Script carregado');
    carregarProdutos();
    configurarBusca();
    configurarPaginacao();
    atualizarAnoFooter();
    configurarCliqueLogo();
    document.getElementById('imageModal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  });
</script>
