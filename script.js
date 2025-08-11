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
        gridProdutos.innerHTML = ''; // Limpa a grade de produtos
        mensagemVazia.style.display = 'none';
        errorMessage.style.display = 'none';
        paginacaoDiv.style.display = 'none';

        try {
            // Como o backend atual não suporta paginação/filtros, buscamos todos os produtos
            // e filtramos no frontend (ajuste no backend será sugerido abaixo)
            const response = await fetch(`${apiBaseUrl}/produtos`);
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            const produtos = await response.json();
            totalProdutos = produtos.length;
            const filteredProdutos = filterProdutos(produtos);
            const paginatedProdutos = filteredProdutos.slice(
                (currentPage - 1) * produtosPorPagina,
                currentPage * produtosPorPagina
            );
            renderizarProdutos(paginatedProdutos);
            atualizarPaginacao();
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Erro ao carregar produtos.';
        } finally {
            isLoading = false;
            loadingSpinner.style.display = 'none';
        }
    };

    /**
     * Filtra produtos no frontend com base em categoria, loja e busca.
     * @param {Array} produtos - Lista completa de produtos.
     * @returns {Array} Produtos filtrados.
     */
    const filterProdutos = (produtos) => {
        return produtos.filter(produto => {
            const matchCategoria = categoriaAtual === 'todas' || produto.categoria.toLowerCase() === categoriaAtual;
            const matchLoja = lojaAtual === 'todas' || produto.loja.toLowerCase() === lojaAtual;
            const matchBusca = !termoBusca || 
                produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
                produto.descricao.toLowerCase().includes(termoBusca.toLowerCase());
            return matchCategoria && matchLoja && matchBusca;
        });
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
            const imagemUrl = produto.imagens && produto.imagens.length > 0 
                ? produto.imagens[0] 
                : 'https://via.placeholder.com/300?text=Sem+Imagem';
            
            card.innerHTML = `
                <div class="carrossel" data-imagens='${JSON.stringify(produto.imagens)}'>
                    <div class="carrossel-imagens">
                        <img src="${imagemUrl}" alt="${produto.nome}" loading="lazy" style="width: 300px; height: 300px; object-fit: cover;">
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

            // Adiciona evento para abrir o modal de imagens
            card.querySelector('.carrossel').addEventListener('click', () => openModal(produto.imagens));
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
        pageInfoSpan.textContent = `Página ${currentPage} de ${totalPaginas || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage >= totalPaginas;
    };

    /**
     * Abre o modal de imagens.
     * @param {Array} imagens - Lista de URLs das imagens.
     */
    const openModal = (imagens) => {
        const modal = document.getElementById('imageModal');
        const carrossel = document.getElementById('modalCarrosselImagens');
        const dotsContainer = document.getElementById('modalCarrosselDots');
        carrossel.innerHTML = '';
        dotsContainer.innerHTML = '';
        let currentImageIndex = 0;

        imagens.forEach((img, index) => {
            const imgElement = document.createElement('img');
            imgElement.src = img;
            imgElement.className = 'carrossel-imagem';
            imgElement.style.display = index === 0 ? 'block' : 'none';
            carrossel.appendChild(imgElement);

            const dot = document.createElement('span');
            dot.className = 'dot' + (index === 0 ? ' active' : '');
            dot.addEventListener('click', () => {
                document.querySelectorAll('.carrossel-imagem').forEach((i, idx) => {
                    i.style.display = idx === index ? 'block' : 'none';
                });
                document.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                currentImageIndex = index;
            });
            dotsContainer.appendChild(dot);
        });

        modal.style.display = 'block';
    };

    /**
     * Move o carrossel do modal.
     * @param {number} direction - Direção do movimento (1 para próxima, -1 para anterior).
     */
    window.moveModalCarrossel = (direction) => {
        const images = document.querySelectorAll('.carrossel-imagem');
        const dots = document.querySelectorAll('.dot');
        let newIndex = currentImageIndex + direction;
        if (newIndex < 0) newIndex = images.length - 1;
        if (newIndex >= images.length) newIndex = 0;
        images[currentImageIndex].style.display = 'none';
        dots[currentImageIndex].classList.remove('active');
        images[newIndex].style.display = 'block';
        dots[newIndex].classList.add('active');
        currentImageIndex = newIndex;
    };

    /**
     * Fecha o modal de imagens.
     */
    window.closeModal = () => {
        document.getElementById('imageModal').style.display = 'none';
    };

    // === Funções de Eventos ===

    /**
     * Altera a categoria de filtro e busca novos produtos.
     * @param {string} categoria - A categoria selecionada.
     */
    const filtrarPorCategoria = (categoria) => {
        categoriaAtual = categoria;
        lojaAtual = 'todas';
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
        categoriaAtual = 'todas';
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

        document.querySelectorAll('.categoria-item').forEach(item => {
            item.addEventListener('click', () => filtrarPorCategoria(item.dataset.categoria));
        });

        document.querySelectorAll('.loja').forEach(item => {
            item.addEventListener('click', () => filtrarPorLoja(item.dataset.loja));
        });

        document.querySelector('.loja-todas').addEventListener('click', () => filtrarPorLoja('todas'));

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
        document.getElementById('year').textContent = new Date().getFullYear();
    };

    init();
});
