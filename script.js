document.addEventListener('DOMContentLoaded', () => {
  let produtos = [];
  let currentPage = 1;
  const perPage = 12;
  let categoriaSelecionada = 'todas';
  let lojaSelecionada = 'todas';
  let buscaTermo = '';
  let sortBy = 'relevance';
  const BASE_URL = 'https://centro-de-compras-backend.onrender.com'; // URL do backend

  // Carregar produtos
  async function loadProdutos() {
    try {
      document.getElementById('loading-spinner').style.display = 'block';
      document.getElementById('mensagem-vazia').style.display = 'none';
      document.getElementById('error-message').style.display = 'none';

      const params = new URLSearchParams({
        page: currentPage,
        limit: perPage,
        categoria: categoriaSelecionada,
        loja: lojaSelecionada,
        busca: buscaTermo,
        sort: sortBy
      });
      console.log('Requisição GET:', `${BASE_URL}/api/produtos?${params}`);
      const response = await fetch(`${BASE_URL}/api/produtos?${params}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('Resposta não-JSON:', text);
        throw new Error(`Erro ao carregar produtos: ${response.statusText}`);
      }
      const { data, total } = await response.json();
      console.log('Produtos recebidos:', data);
      produtos = data;
      renderProdutos(total);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      document.getElementById('loading-spinner').style.display = 'none';
      document.getElementById('error-message').style.display = 'block';
    }
  }

  // ... (restante do código de script.js, como renderProdutos, initCarrossel, etc., permanece igual)
});
