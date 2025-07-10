// Variáveis de Configuração
const API_URL = 'https://centrodecompra-backend.onrender.com'; // Use 'http://localhost:10000' para testes locais
const PRODUTOS_POR_PAGINA = 24; // Constante para o número de produtos por página
const MAX_RETRIES_API = 3; // Número máximo de tentativas para chamadas à API
const RETRY_DELAY_MS = 1000; // Atraso inicial para retries em milissegundos
const DEBOUNCE_DELAY_MS = 300; // Atraso para debounce da busca em milissegundos
const TRIPLE_CLICK_INTERVAL_MS = 500; // Intervalo para detecção de triplo clique

// Variáveis de Estado Global
let produtosAtuais = []; // Armazena os produtos da página atual para manipulação
let categoriaSelecionada = 'todas';
let lojaSelecionada = 'todas';
let termoBusca = '';
let currentImages = []; // Imagens do produto atualmente no modal
let currentImageIndex = 0; // Índice da imagem atual no modal
let currentPage = 1;
let totalProdutosDisponiveis = 0; // Total de produtos no backend para paginação

// --- Funções Utilitárias ---

/**
 * Escapa caracteres HTML para prevenir ataques XSS.
 * @param {string} str A string a ser escapada.
 * @returns {string} A string com caracteres HTML escapados.
 */
function escapeHTML(str) {
    if (typeof str !== 'string') {
        // Se não for string, retorna como está ou uma string vazia
        console.warn('escapeHTML recebeu um valor não-string:', str);
        return String(str || '');
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;' // ou &apos; para HTML5
    };
    return str.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Atualiza o ano no rodapé da página.
 */
function atualizarAnoFooter() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    } else {
        console.warn('Elemento com ID "year" não encontrado para atualizar o rodapé.');
    }
}

/**
 * Configura a detecção de triplo clique no logotipo para redirecionamento.
 */
function configurarCliqueLogo() {
    const logo = document.getElementById('site-logo-img');
    if (!logo) {
        console.error('Elemento com ID "site-logo-img" não encontrado no DOM.');
        return;
    }

    let clickCount = 0;
    let clickTimer;

    logo.addEventListener('click', (e) => {
        e.preventDefault(); // Previne o comportamento padrão do link

        clickCount++;
        // console.log(`Clique detectado: ${clickCount}`); // Para debug

        clearTimeout(clickTimer); // Limpa o timer anterior para cada novo clique

        if (clickCount === 3) {
            // Triplo clique detectado
            console.log('Triplo clique detectado, redirecionando para /admin-xyz-123.html');
            window.location.href = '/admin-xyz-123.html';
            clickCount = 0; // Reseta a contagem após o redirecionamento
        } else {
            // Inicia um novo timer para resetar a contagem se não houver mais cliques
            clickTimer = setTimeout(() => {
                clickCount = 0;
                // console.log('Contagem de cliques resetada'); // Para debug
            }, TRIPLE_CLICK_INTERVAL_MS);
        }
    }, { once: false });
}

// --- Funções de Carregamento e Exibição de Produtos ---

/**
 * Carrega produtos da API com um mecanismo de retry.
 * Atualiza o estado global de produtos e o total de produtos.
 */
async function carregarProdutos() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const mensagemVazia = document.getElementById('mensagem-vazia');
    const errorMessage = document.getElementById('error-message');
    const gridProdutos = document.getElementById('grid-produtos');
    const buscaFeedback = document.getElementById('busca-feedback');

    // Validação inicial dos elementos do DOM
    if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner || !buscaFeedback) {
        console.error('Um ou mais elementos essenciais do DOM não foram encontrados.');
        if (errorMessage) {
            errorMessage.textContent = 'Erro: Componentes da página não carregados corretamente.';
            errorMessage.style.display = 'block';
        }
        return;
    }

    // Esconde mensagens de erro e vazias, mostra o spinner
    loadingSpinner.style.display = 'block';
    mensagemVazia.style.display = 'none';
    errorMessage.style.display = 'none';
    gridProdutos.innerHTML = ''; // Limpa os produtos antes de carregar novos

    for (let attempt = 1; attempt <= MAX_RETRIES_API; attempt++) {
        try {
            // Constrói a URL da API com todos os parâmetros de filtro e paginação
            const url = new URL(`${API_URL}/api/produtos`);
            url.searchParams.append('page', currentPage);
            url.searchParams.append('limit', PRODUTOS_POR_PAGINA);
            if (categoriaSelecionada !== 'todas') {
                url.searchParams.append('categoria', categoriaSelecionada);
            }
            if (lojaSelecionada !== 'todas') {
                url.searchParams.append('loja', lojaSelecionada);
            }
            if (termoBusca) {
                url.searchParams.append('termoBusca', termoBusca);
            }

            const response = await fetch(url.toString(), { cache: 'no-store' }); // Garante que a requisição não use cache antigo

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || `Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            // Garante que `data.produtos` é um array antes de atribuir
            produtosAtuais = Array.isArray(data.produtos) ? data.produtos : [];
            totalProdutosDisponiveis = data.total || 0;

            console.log(`Dados da API recebidos (tentativa ${attempt}): Produtos=${produtosAtuais.length}, Total=${totalProdutosDisponiveis}`);

            // Se produtosAtuais não for um array, ainda indica um problema
            if (!Array.isArray(produtosAtuais)) {
                throw new Error('Resposta inválida da API: "produtos" não é um array.');
            }

            // Exibe os produtos logo após o carregamento bem-sucedido e atualização
            exibirProdutos();
            atualizarPaginacao();
            return; // Sai da função se o carregamento for bem-sucedido

        } catch (error) {
            console.error(`Falha ao carregar produtos (tentativa ${attempt}/${MAX_RETRIES_API}):`, error.message);
            if (attempt === MAX_RETRIES_API) {
                errorMessage.textContent = `Erro ao carregar produtos após ${MAX_RETRIES_API} tentativas: ${error.message}. Por favor, tente novamente mais tarde.`;
                errorMessage.style.display = 'block';
                mensagemVazia.style.display = 'none';
                gridProdutos.style.display = 'none';
                buscaFeedback.style.display = 'none'; // Esconde feedback de busca em caso de erro fatal
            } else {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt)); // Atraso exponencial
            }
        } finally {
            loadingSpinner.style.display = 'none'; // Sempre esconde o spinner no final de cada tentativa
        }
    }
}

/**
 * Exibe os produtos no grid com base nos `produtosAtuais` (já filtrados pela API).
 */
function exibirProdutos() {
    const gridProdutos = document.getElementById('grid-produtos');
    const mensagemVazia = document.getElementById('mensagem-vazia');

    if (!gridProdutos || !mensagemVazia) {
        console.error('grid-produtos ou mensagem-vazia não encontrados para exibição.');
        return;
    }

    gridProdutos.innerHTML = ''; // Limpa o grid antes de adicionar novos produtos

    if (produtosAtuais.length === 0) {
        mensagemVazia.style.display = 'block';
        gridProdutos.style.display = 'none';
        console.log('Nenhum produto encontrado com os critérios atuais.');
        return;
    }

    mensagemVazia.style.display = 'none';
    gridProdutos.style.display = 'grid'; // Garante que o grid esteja visível

    produtosAtuais.forEach((produto, index) => {
        // Validação e fallback para imagens
        const imagens = (Array.isArray(produto.imagens) && produto.imagens.length > 0)
            ? produto.imagens.filter(img => typeof img === 'string' && img.trim() !== '')
            : ['imagens/placeholder.jpg']; // Fallback para imagem padrão

        const carrosselId = `carrossel-${produto._id || `temp-${index}-${Date.now()}`}`; // ID único e fallback

        const produtoDiv = document.createElement('div');
        produtoDiv.classList.add('produto-card', 'visible');
        produtoDiv.setAttribute('data-categoria', escapeHTML(produto.categoria?.toLowerCase() || 'todas'));
        produtoDiv.setAttribute('data-loja', escapeHTML(produto.loja?.toLowerCase() || 'todas'));

        // HTML do card de produto otimizado
        produtoDiv.innerHTML = `
            <div class="carrossel" id="${carrosselId}" role="region" aria-label="Carrossel de imagens do produto ${escapeHTML(produto.nome || 'sem nome')}">
                <div class="carrossel-imagens">
                    ${imagens.map((img, i) => `
                        <img src="${escapeHTML(img)}" alt="${escapeHTML(produto.nome || 'Produto')} ${i + 1}" loading="lazy" width="200" height="200" onerror="this.src='imagens/placeholder.jpg'" onclick="openModal(${index}, ${i})" tabindex="0">
                    `).join('')}
                </div>
                ${imagens.length > 1 ? `
                    <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior" type="button">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem" type="button">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div class="carrossel-dots" role="tablist">
                        ${imagens.map((_, i) => `<span class="carrossel-dot ${i === 0 ? 'ativo' : ''}" onclick="setCarrosselImage('${carrosselId}', ${i})" aria-label="Selecionar imagem ${i + 1}" role="tab" tabindex="0"></span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <span class="nome-produto">${escapeHTML(produto.nome || 'Produto sem nome')}</span>
            <span class="descricao">Loja: ${escapeHTML(produto.loja || 'Desconhecida')}</span>
            <p class="preco">
                <a href="${escapeHTML(produto.link || '#')}" target="_blank" class="ver-preco" rel="noopener noreferrer" aria-label="Ver preço de ${escapeHTML(produto.nome || 'produto')} na loja">Clique aqui para ver o preço</a>
            </p>
            <a href="${escapeHTML(produto.link || '#')}" target="_blank" class="ver-na-loja ${escapeHTML(produto.loja?.toLowerCase() || 'default')}" rel="noopener noreferrer">Comprar</a>
        `;
        gridProdutos.appendChild(produtoDiv);
    });

    console.log(`Exibidos ${produtosAtuais.length} produtos`);
}

// --- Funções do Carrossel (para cards de produto) ---

/**
 * Move o carrossel de imagens de um produto na direção especificada.
 * @param {string} carrosselId O ID do carrossel.
 * @param {number} direction A direção do movimento (-1 para anterior, 1 para próximo).
 */
function moveCarrossel(carrosselId, direction) {
    const carrossel = document.getElementById(carrosselId);
    if (!carrossel) return;

    const imagensWrapper = carrossel.querySelector('.carrossel-imagens');
    const dots = carrossel.querySelectorAll('.carrossel-dot');

    let currentIndex = parseInt(imagensWrapper.dataset.index || 0);
    const totalImagens = imagensWrapper.children.length;

    currentIndex = (currentIndex + direction + totalImagens) % totalImagens;

    // Usar requestAnimationFrame para performance de animação
    requestAnimationFrame(() => {
        imagensWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        imagensWrapper.dataset.index = currentIndex; // Atualiza o índice no dataset

        dots.forEach((dot, i) => {
            dot.classList.toggle('ativo', i === currentIndex);
            dot.setAttribute('aria-selected', i === currentIndex); // Acessibilidade
        });
    });
}

/**
 * Define a imagem ativa do carrossel para um índice específico.
 * @param {string} carrosselId O ID do carrossel.
 * @param {number} index O índice da imagem a ser exibida.
 */
function setCarrosselImage(carrosselId, index) {
    const carrossel = document.getElementById(carrosselId);
    if (!carrossel) return;

    const imagensWrapper = carrossel.querySelector('.carrossel-imagens');
    const dots = carrossel.querySelectorAll('.carrossel-dot');

    requestAnimationFrame(() => {
        imagensWrapper.style.transform = `translateX(-${index * 100}%)`;
        imagensWrapper.dataset.index = index; // Atualiza o índice no dataset

        dots.forEach((dot, i) => {
            dot.classList.toggle('ativo', i === index);
            dot.setAttribute('aria-selected', i === index); // Acessibilidade
        });
    });
}

// --- Funções do Modal de Imagem ---

/**
 * Abre o modal de imagem, carregando as imagens do produto selecionado.
 * @param {number} produtoIndex O índice do produto na array `produtosAtuais`.
 * @param {number} imageIndex O índice da imagem inicial a ser exibida no modal.
 */
async function openModal(produtoIndex, imageIndex) {
    const modal = document.getElementById('imageModal');
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDots = document.getElementById('modalCarrosselDots');

    if (!modal || !carrosselImagens || !carrosselDots) {
        console.error('Elementos do modal não encontrados.');
        return;
    }

    try {
        // Validação e filtro de imagens, garantindo que sejam strings não vazias
        currentImages = Array.isArray(produtosAtuais[produtoIndex]?.imagens) && produtosAtuais[produtoIndex].imagens.length > 0
            ? produtosAtuais[produtoIndex].imagens.filter(img => typeof img === 'string' && img.trim() !== '')
            : ['imagens/placeholder.jpg'];

        currentImageIndex = imageIndex; // Define o índice da imagem inicial

        console.log('Abrindo modal:', { produtoIndex, imageIndex, imagens: currentImages.length });

        // Valida as URLs das imagens antes de carregar no modal
        const validImages = await Promise.all(currentImages.map(img => {
            return new Promise(resolve => {
                const testImg = new Image();
                testImg.src = img;
                testImg.onload = () => resolve(img);
                testImg.onerror = () => {
                    console.warn(`Erro ao carregar imagem: ${img}. Usando placeholder.`);
                    resolve('imagens/placeholder.jpg'); // Fallback em caso de erro de carregamento
                };
            });
        }));
        currentImages = validImages; // Atualiza com as URLs validadas/substituídas

        carrosselImagens.innerHTML = currentImages.map((img, i) => `
            <img src="${escapeHTML(img)}" alt="Imagem ${i + 1} do produto" class="modal-image" loading="eager" width="600" height="600" onerror="this.src='imagens/placeholder.jpg'">
        `).join('');

        requestAnimationFrame(() => {
            // Assegura que o transform é aplicado após o innerHTML para correta renderização
            carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
            // Removido width/display/flex para evitar sobrescrever CSS, mas mantido transform
        });

        carrosselDots.innerHTML = currentImages.map((_, i) => `
            <span class="carrossel-dot ${i === currentImageIndex ? 'ativo' : ''}" onclick="setModalCarrosselImage(${i})" aria-label="Selecionar imagem ${i + 1}" role="tab" tabindex="0" aria-selected="${i === currentImageIndex}"></span>
        `).join('');

        modal.style.display = 'flex'; // Exibe o modal
        modal.setAttribute('aria-hidden', 'false'); // Torna o modal visível para leitores de tela
        modal.focus(); // Coloca o foco no modal para acessibilidade

        // Adiciona listener para fechar com a tecla ESC
        document.addEventListener('keydown', handleModalKeydown);

    } catch (error) {
        console.error('Erro ao abrir modal:', error);
    }
}

/**
 * Move o carrossel de imagens do modal na direção especificada.
 * @param {number} direction A direção do movimento (-1 para anterior, 1 para próximo).
 */
function moveModalCarrossel(direction) {
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDotsContainer = document.getElementById('modalCarrosselDots');
    const carrosselDots = carrosselDotsContainer ? Array.from(carrosselDotsContainer.children) : [];

    const totalImagens = currentImages.length;
    if (totalImagens === 0) return;

    currentImageIndex = (currentImageIndex + direction + totalImagens) % totalImagens;

    requestAnimationFrame(() => {
        carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        carrosselDots.forEach((dot, i) => {
            dot.classList.toggle('ativo', i === currentImageIndex);
            dot.setAttribute('aria-selected', i === currentImageIndex);
            dot.tabIndex = i === currentImageIndex ? 0 : -1; // Torna o dot ativo focável
        });
        // Foca no dot atual para acessibilidade no carrossel
        if (carrosselDots[currentImageIndex]) {
            carrosselDots[currentImageIndex].focus();
        }
    });
}

/**
 * Define a imagem ativa do carrossel do modal para um índice específico.
 * @param {number} index O índice da imagem a ser exibida.
 */
function setModalCarrosselImage(index) {
    const carrosselImagens = document.getElementById('modalCarrosselImagens');
    const carrosselDotsContainer = document.getElementById('modalCarrosselDots');
    const carrosselDots = carrosselDotsContainer ? Array.from(carrosselDotsContainer.children) : [];

    if (index < 0 || index >= currentImages.length) return; // Validação de índice

    currentImageIndex = index;

    requestAnimationFrame(() => {
        carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
        carrosselDots.forEach((dot, i) => {
            dot.classList.toggle('ativo', i === currentImageIndex);
            dot.setAttribute('aria-selected', i === currentImageIndex);
            dot.tabIndex = i === currentImageIndex ? 0 : -1;
        });
        if (carrosselDots[currentImageIndex]) {
            carrosselDots[currentImageIndex].focus();
        }
    });
}

/**
 * Fecha o modal de imagem.
 */
function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        currentImages = [];
        currentImageIndex = 0;
        document.removeEventListener('keydown', handleModalKeydown); // Remove listener ao fechar
    }
}

/**
 * Manipula eventos de teclado no modal para fechar com ESC.
 * @param {KeyboardEvent} event O evento de teclado.
 */
function handleModalKeydown(event) {
    if (event.key === 'Escape') {
        closeModal();
    } else if (event.key === 'ArrowLeft') {
        moveModalCarrossel(-1);
    } else if (event.key === 'ArrowRight') {
        moveModalCarrossel(1);
    }
}

// --- Funções de Busca e Paginação ---

/**
 * Configura o campo de busca com debounce para evitar múltiplas requisições.
 */
function configurarBusca() {
    const inputBusca = document.getElementById('busca');
    const buscaFeedback = document.getElementById('busca-feedback');
    let debounceTimer;

    if (!inputBusca || !buscaFeedback) {
        console.error('Elementos de busca (input ou feedback) não encontrados.');
        return;
    }

    inputBusca.addEventListener('input', () => {
        clearTimeout(debounceTimer); // Limpa o timer anterior
        termoBusca = inputBusca.value.trim(); // Atualiza o termo de busca

        if (termoBusca) {
            buscaFeedback.style.display = 'block';
            buscaFeedback.textContent = `Buscando por "${escapeHTML(termoBusca)}"...`;
        } else {
            buscaFeedback.style.display = 'none';
            buscaFeedback.textContent = ''; // Limpa o texto quando a busca está vazia
        }

        currentPage = 1; // Sempre volta para a primeira página ao mudar o termo de busca
        debounceTimer = setTimeout(() => {
            console.log(`Iniciando busca para: "${termoBusca}"`);
            carregarProdutos(); // Chama a função de carregamento após o debounce
        }, DEBOUNCE_DELAY_MS);
    });
}

/**
 * Configura os botões de paginação.
 */
function configurarPaginacao() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (!prevButton || !nextButton) {
        console.error('Botões de paginação não encontrados.');
        return;
    }

    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo da página
            carregarProdutos();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < Math.ceil(totalProdutosDisponiveis / PRODUTOS_POR_PAGINA)) {
            currentPage++;
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo da página
            carregarProdutos();
        }
    });
}

/**
 * Atualiza o estado visual dos botões de paginação e a informação da página.
 */
function atualizarPaginacao() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    if (!prevButton || !nextButton || !pageInfo) {
        console.error('Elementos de paginação (botões ou info) não encontrados para atualização.');
        return;
    }

    const totalPages = Math.ceil(totalProdutosDisponiveis / PRODUTOS_POR_PAGINA);

    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage >= totalPages || totalPages === 0;

    pageInfo.textContent = `Página ${currentPage} de ${totalPages > 0 ? totalPages : 1}`;
    pageInfo.setAttribute('aria-live', 'polite'); // Anuncia a mudança da página para leitores de tela
}

// --- Funções de Filtragem (Categoria e Loja) ---

/**
 * Filtra produtos por categoria.
 * @param {string} categoria A categoria selecionada.
 */
function filtrarPorCategoria(categoria) {
    categoriaSelecionada = categoria;
    currentPage = 1; // Reseta para a primeira página ao mudar o filtro

    document.querySelectorAll('.categoria-item').forEach(item => {
        item.classList.toggle('ativa', item.dataset.categoria?.toLowerCase() === categoria.toLowerCase());
        item.setAttribute('aria-selected', item.dataset.categoria?.toLowerCase() === categoria.toLowerCase());
        item.setAttribute('tabindex', 0); // Torna focável para navegação por teclado
    });

    carregarProdutos(); // Recarrega produtos com o novo filtro
}

/**
 * Filtra produtos por loja.
 * @param {string} loja A loja selecionada.
 */
function filtrarPorLoja(loja) {
    lojaSelecionada = loja;
    currentPage = 1; // Reseta para a primeira página ao mudar o filtro

    // Seleciona tanto os cards de loja individuais quanto o "Todas as Lojas"
    document.querySelectorAll('.loja, .loja-todas').forEach(item => {
        item.classList.toggle('ativa', item.dataset.loja?.toLowerCase() === loja.toLowerCase());
        item.setAttribute('aria-selected', item.dataset.loja?.toLowerCase() === loja.toLowerCase());
        item.setAttribute('tabindex', 0); // Torna focável
    });

    carregarProdutos(); // Recarrega produtos com o novo filtro
}

// --- Inicialização e Event Listeners ---

/**
 * Adiciona event listeners para cliques nas categorias e lojas.
 */
function adicionarFiltroListeners() {
    document.querySelectorAll('.categoria-item').forEach(item => {
        item.addEventListener('click', () => {
            filtrarPorCategoria(item.dataset.categoria);
        });
        // Adiciona suporte a Enter/Espaço para acessibilidade
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Previne rolagem da página ao usar espaço
                filtrarPorCategoria(item.dataset.categoria);
            }
        });
    });

    document.querySelectorAll('.loja, .loja-todas').forEach(item => {
        item.addEventListener('click', () => {
            filtrarPorLoja(item.dataset.loja);
        });
        // Adiciona suporte a Enter/Espaço para acessibilidade
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                filtrarPorLoja(item.dataset.loja);
            }
        });
    });
}

// Evento principal que é disparado quando o DOM está completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM completamente carregado. Inicializando página...');

    atualizarAnoFooter(); // Atualiza o ano no rodapé
    configurarCliqueLogo(); // Configura o triplo clique no logo
    configurarBusca(); // Configura a barra de busca
    configurarPaginacao(); // Configura os botões de paginação
    adicionarFiltroListeners(); // Adiciona listeners para os filtros de categoria e loja

    // Carrega os produtos iniciais
    carregarProdutos();

    // Configura o fechamento do modal ao clicar fora do conteúdo
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget || e.target.classList.contains('close-button')) {
                closeModal();
            }
        });
    }
    console.log('Página inicializada.');
});
