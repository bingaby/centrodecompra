const API_BASE_URL = 'https://minha-api-produtos.onrender.com';
let currentPage = 1;
let allProducts = [];

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
        console.error("Elemento com ID 'site-logo' não encontrado");
    } else {
        let clickCount = 0, clickTimeout = null;
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
                window.location.href = '/admin-xyz-123.html';
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

    // Função para detectar gestos de deslizar
    function addSwipeSupport(element, moveCallback) {
        let touchStartX = 0;
        let touchEndX = 0;
        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const deltaX = touchEndX - touchStartX;
            if (deltaX > 50) {
                moveCallback(-1); // Deslizar para a direita
            } else if (deltaX < -50) {
                moveCallback(1); // Deslizar para a esquerda
            }
        });
    }

    // Carregar produtos
    async function carregarProdutos(page = 1, append = false) {
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
        const loadMoreButton = document.getElementById('load-more');

        if (!spinner || !gridProdutos || !mensagemVazia || !errorMessage || !loadMoreButton) {
            console.error('Elementos de interface não encontrados.');
            return;
        }

        spinner.style.display = 'block';
        if (!append) {
            gridProdutos.innerHTML = '';
            allProducts = [];
        }
        mensagemVazia.style.display = 'none';
        errorMessage.style.display = 'none';
        loadMoreButton.style.display = 'none';

        try {
            const response = await fetch(url);
            console.log('Resposta da API:', response.status);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            const { data, total } = await response.json();
            console.log('Dados recebidos:', data, 'Total:', total);
            
            allProducts.push(...data);

            if (allProducts.length === 0) {
                console.log('Nenhum produto encontrado, exibindo mensagem vazia');
                mensagemVazia.style.display = 'block';
                gridProdutos.style.display = 'none';
            } else {
                gridProdutos.style.display = 'grid';
                data.forEach(produto => {
                    console.log('Adicionando produto:', produto.nome);
                    const card = document.createElement('div');
                    card.classList.add('produto-card', 'visible');
                    card.setAttribute('data-categoria', produto.categoria.toLowerCase());
                    card.setAttribute('data-loja', produto.loja.toLowerCase());
                    
                    let imagens = [];
                    try {
                        imagens = produto.imagens ? JSON.parse(produto.imagens) : ['/imagens/placeholder.jpg'];
                    } catch (e) {
                        console.error(`Erro ao parsear imagens para o produto ${produto.nome}:`, e);
                        imagens = ['/imagens/placeholder.jpg'];
                    }
                    
                    const carrosselId = `carrossel-${produto.id}`;
                    const lojaClass = `tarja-${produto.loja.toLowerCase().replace(/\s/g, '')}`;
                    
                    card.innerHTML = `
                        <div class="carrossel" id="${carrosselId}">
                            <div class="carrossel-imagens">
                                ${imagens.map((img, idx) => `<img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onclick="openModal('${produto.id}', ${idx})">`).join("")}
                            </div>
                            ${imagens.length > 1 ? `
                                <button class="carrossel-prev" onclick="moveCarrossel('${carrosselId}', -1)" aria-label="Imagem anterior">◄</button>
                                <button class="carrossel-next" onclick="moveCarrossel('${carrosselId}', 1)" aria-label="Próxima imagem">►</button>
                                <div class="carrossel-dots">
                                    ${imagens.map((_, idx) => `<span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" onclick="setCarrosselImage('${carrosselId}', ${idx})" aria-label="Selecionar imagem ${idx + 1}"></span>`).join("")}
                                </div>
                            ` : ""}
                        </div>
                        <span class="produto-nome">${produto.nome}</span>
                        <span class="preco-link" data-preco="${parseFloat(produto.preco).toFixed(2)}">Clique aqui para ver o preço</span>
                        <p class="descricao">${produto.descricao || 'Sem descrição'}</p>
                        <a href="${produto.link}" target="_blank" class="tarja-preco ${lojaClass}" aria-label="Comprar ${produto.nome} na ${produto.loja}">Comprar na ${produto.loja}</a>
                    `;
                    gridProdutos.appendChild(card);

                    // Adicionar evento para revelar preço
                    const precoLink = card.querySelector('.preco-link');
                    precoLink.addEventListener('click', () => {
                        const preco = precoLink.getAttribute('data-preco');
                        precoLink.textContent = `R$ ${preco}`;
                        precoLink.classList.remove('preco-link');
                    });

                    // Adicionar suporte a deslizar no carrossel do card
                    if (imagens.length > 1) {
                        const carrosselImagens = card.querySelector('.carrossel-imagens');
                        addSwipeSupport(carrosselImagens, (direction) => moveCarrossel(carrosselId, direction));
                    }
                });
            }
            
            if (allProducts.length < total) {
                loadMoreButton.style.display = 'block';
            } else {
                loadMoreButton.style.display = 'none';
            }

            currentPage = page;
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            errorMessage.textContent = 'Erro ao carregar produtos. Por favor, tente novamente mais tarde.';
            errorMessage.style.display = 'block';
            gridProdutos.style.display = 'none';
        } finally {
            spinner.style.display = 'none';
        }
    }

    // Funções para os carrosséis menores nos cards
    window.moveCarrossel = function(id, direction) {
        const carrossel = document.getElementById(id);
        if (!carrossel) return;
        const imagens = carrossel.querySelector(".carrossel-imagens");
        const dots = carrossel.querySelectorAll(".carrossel-dot");
        let index = parseInt(imagens.dataset.index || 0);
        const total = imagens.children.length;
        index = (index + direction + total) % total;
        imagens.style.transform = `translateX(-${index * 100}%)`;
        imagens.dataset.index = index;
        dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
    }

    window.setCarrosselImage = function(id, index) {
        const carrossel = document.getElementById(id);
        if (!carrossel) return;
        const imagens = carrossel.querySelector(".carrossel-imagens");
        const dots = carrossel.querySelectorAll(".carrossel-dot");
        imagens.style.transform = `translateX(-${index * 100}%)`;
        imagens.dataset.index = index;
        dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
    }

    // Funções para o modal de imagem
    let currentImageIndex = 0;
    let currentModalImages = [];
    window.openModal = function(id, imageIndex) {
        const produto = allProducts.find(p => p.id == id);
        if (!produto) {
            console.error("Produto não encontrado para o ID:", id);
            return;
        }

        const modal = document.getElementById("imageModal");
        const carrosselImagens = document.getElementById("modalCarrosselImagens");
        const carrosselDots = document.getElementById("modalCarrosselDots");
        const prevButton = document.getElementById("modalPrev");
        const nextButton = document.getElementById("modalNext");
        
        modal.style.display = "flex";
        carrosselImagens.innerHTML = "";
        carrosselDots.innerHTML = "";
        
        try {
            currentModalImages = produto.imagens ? JSON.parse(produto.imagens) : ['/imagens/placeholder.jpg'];
        } catch (e) {
            console.error(`Erro ao parsear imagens para o modal do produto ${produto.nome}:`, e);
            currentModalImages = ['/imagens/placeholder.jpg'];
        }
        currentImageIndex = Math.max(0, Math.min(imageIndex, currentModalImages.length - 1));
        
        carrosselImagens.innerHTML = currentModalImages.map((img, idx) => `<img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy">`).join("");
        carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        
        if (currentModalImages.length > 1) {
            carrosselDots.innerHTML = currentModalImages.map((_, i) => `<span class="carrossel-dot ${i === currentImageIndex ? "ativo" : ""}" onclick="setModalCarrosselImage(${i})"></span>`).join("");
            prevButton.classList.add("visible");
            nextButton.classList.add("visible");
            addSwipeSupport(carrosselImagens, (direction) => moveModalCarrossel(direction));
        } else {
            prevButton.classList.remove("visible");
            nextButton.classList.remove("visible");
        }
    };
    
    window.moveModalCarrossel = function(direction) {
        const carrosselImagens = document.getElementById("modalCarrosselImagens");
        const carrosselDots = document.getElementById("modalCarrosselDots")?.children;
        const total = currentModalImages.length;
        
        currentImageIndex = (currentImageIndex + direction + total) % total;
        
        carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
    };
    
    window.setModalCarrosselImage = function(index) {
        const carrosselImagens = document.getElementById("modalCarrosselImagens");
        const carrosselDots = document.getElementById("modalCarrosselDots")?.children;
        
        currentImageIndex = index;
        
        carrosselImagens.style.transform = `translateX(-${index * 100}%)`;
        Array.from(carrosselDots).forEach((dot, i) => dot.classList.toggle("ativo", i === index));
    };

    window.closeModal = function() {
        console.log('Fechando modal');
        document.getElementById('imageModal').style.display = 'none';
    };

    // Ações de filtro e busca
    window.filtrarPorCategoria = function(categoria) {
        console.log('Filtrando por categoria:', categoria);
        document.querySelectorAll('.categoria-item').forEach(item => item.classList.toggle('ativa', item.dataset.categoria === categoria));
        carregarProdutos(1);
    };

    window.filtrarPorLoja = function(loja) {
        console.log('Filtrando por loja:', loja);
        document.querySelectorAll('.loja, .loja-todas').forEach(item => item.classList.toggle('ativa', item.dataset.loja === loja));
        carregarProdutos(1);
    };

    const buscaInput = document.getElementById('busca');
    if (buscaInput) {
        let timeout;
        buscaInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                console.log('Busca digitada:', buscaInput.value);
                carregarProdutos(1);
            }, 500);
        });
    }

    window.carregarMaisProdutos = function() {
        currentPage++;
        carregarProdutos(currentPage, true);
    }

    // Carregar produtos iniciais
    console.log('Chamando carregarProdutos inicial');
    carregarProdutos();
});
