document.addEventListener('DOMContentLoaded', () => {
    // === Configuração e Seletores do DOM ===
    const apiBaseUrl = 'https://minha-api-produtos.onrender.com/api';
    const gridProdutos = document.getElementById('grid-produtos');
    const loadingSpinner = document.getElementById('loading-spinner');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    const buscaInput = document.getElementById('busca');
    const paginacaoDiv = document.getElementById('paginacao');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfoSpan = document.getElementById('page-info');

    // === Estado da Aplicação ===
    let currentPage = 1;
    const produtosPorPagina = 12;
    let totalProdutos = 0;
    let termoBusca = '';
    let categoriaAtual = 'todas';
    let lojaAtual = 'todas';
    let isLoading = false;

    // === Funções de API e Renderização ===

    /**
     * Busca os produtos na API com base nos filtros e paginação atuais.
     */
    const fetchProdutos = async () => {
        if (isLoading) return;

        isLoading = true;
        loadingSpinner.style.display = 'block';
        gridProdutos.innerHTML = ''; // Limpa a grade de produtos para a nova busca

        // Resetar mensagens de erro/vazio
        mensagemVazia.style.display = 'none';
        errorMessage.style.display = 'none';
        paginacaoDiv.style.display = 'none';

        try {
            const url = new URL(`${apiBaseUrl}/produtos`);
            url.searchParams.append('page', currentPage);
            url.searchParams.append('limit', produtosPorPagina);
            if (categoriaAtual !== 'todas') url.searchParams.append('categoria', categoriaAtual);
            if (lojaAtual !== 'todas') url.searchParams.append('loja', lojaAtual);
            if (termoBusca) url.searchParams.append('busca', termoBusca);

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                totalProdutos = data.total;
                renderizarProdutos(data.data);
                atualizarPaginacao();
            } else {
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            errorMessage.style.display = 'block';
        } finally {
            isLoading = false;
            loadingSpinner.style.display = 'none';
        }
    };

    /**
     * Renderiza os produtos na grade.
     * @param {Array} produtos - A lista de produtos a ser renderizada.
     */
    const renderizarProdutos = (produtos) => {
        if (produtos.length === 0) {
            mensagemVazia.style.display = 'block';
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            // Usamos o primeiro link da array de imagens
            const imagemUrl = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0] : 'https://via.placeholder.com/200?text=Sem+Imagem';
            
            card.innerHTML = `
                <div class="carrossel" data-imagens='${JSON.stringify(produto.imagens)}'>
                    <div class="carrossel-imagens">
                        <img src="${imagemUrl}" alt="${produto.nome}" loading="lazy">
                    </div>
                </div>
                <div class="produto-card-info">
                    <h3>${produto.nome}</h3>
                    <p class="descricao">${produto.descricao.substring(0, 70)}...</p>
                    <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
                    <a href="${produto.link}" target="_blank" rel="noopener noreferrer" class="ver-na-loja">Ver na Loja</a>
                </div>
            `;
            gridProdutos.appendChild(card);
        });
    };

    /**
     * Atualiza a UI da paginação.
     */
    const atualizarPaginacao = () => {
        const totalPaginas = Math.ceil(totalProdutos / produtosPorPagina);
        if (totalProdutos > 0) {
            paginacaoDiv.style.display = 'flex';
        }

        pageInfoSpan.textContent = `Página ${currentPage} de ${totalPaginas}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPaginas;
    };

    // === Funções de Eventos ===

    /**
     * Altera a categoria de filtro e busca novos produtos.
     * @param {string} categoria - A categoria selecionada.
     */
    const filtrarPorCategoria = (categoria) => {
        categoriaAtual = categoria;
        lojaAtual = 'todas'; // Reseta a loja ao mudar a categoria
        currentPage = 1;
        
        document.querySelectorAll('.categoria-item').forEach(item => {
            item.classList.toggle('ativa', item.dataset.categoria === categoria);
        });
        document.querySelectorAll('.loja').forEach(item => {
            item.classList.remove('ativa');
        });
        document.querySelector('.loja-todas').classList.add('ativa');

        fetchProdutos();
    };

    /**
     * Altera a loja de filtro e busca novos produtos.
     * @param {string} loja - A loja selecionada.
     */
    const filtrarPorLoja = (loja) => {
        lojaAtual = loja;
        categoriaAtual = 'todas'; // Reseta a categoria ao mudar a loja
        currentPage = 1;

        document.querySelectorAll('.loja').forEach(item => {
            item.classList.toggle('ativa', item.dataset.loja === loja);
        });
        document.querySelectorAll('.categoria-item').forEach(item => {
            item.classList.remove('ativa');
        });
        document.querySelector('.categoria-item[data-categoria="todas"]').classList.add('ativa');

        fetchProdutos();
    };

    /**
     * Lida com a busca de produtos.
     */
    const handleBusca = () => {
        termoBusca = buscaInput.value;
        currentPage = 1;
        fetchProdutos();
    };

    // === Configuração de Event Listeners ===
    const setupEventListeners = () => {
        // Eventos para navegação da paginação
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchProdutos();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPaginas = Math.ceil(totalProdutos / produtosPorPagina);
            if (currentPage < totalPaginas) {
                currentPage++;
                fetchProdutos();
            }
        });

        // Eventos para filtros de Categoria e Loja
        document.querySelectorAll('.categoria-item').forEach(item => {
            item.addEventListener('click', () => filtrarPorCategoria(item.dataset.categoria));
        });

        document.querySelectorAll('.loja').forEach(item => {
            item.addEventListener('click', () => filtrarPorLoja(item.dataset.loja));
        });

        document.querySelector('.loja-todas').addEventListener('click', () => filtrarPorLoja('todas'));

        // Evento para a barra de busca
        buscaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleBusca();
            }
        });
    };

    // === Inicialização ===
    const init = () => {
        setupEventListeners();
        fetchProdutos();
        // Atualiza o ano no footer
        document.getElementById('year').textContent = new Date().getFullYear();
    };

    init();
});
