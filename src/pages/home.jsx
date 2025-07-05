import React, { useState, useEffect, useCallback } from 'react';
import ProdutoCard from '../components/ProdutoCard';
import ImageModal from '../components/ImageModal';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const API_URL = process.env.REACT_APP_API_URL || 'https://centrodecompra-backend.onrender.com';

const Home = () => {
  const [produtos, setProdutos] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
  const [lojaSelecionada, setLojaSelecionada] = useState('todas');
  const [termoBusca, setTermoBusca] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProdutos, setTotalProdutos] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const produtosPorPagina = 24;

  const carregarProdutos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        const response = await fetch(
          `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
          { cache: 'no-store' }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || `Erro ${response.status}`);
        }
        const data = await response.json();
        setProdutos(Array.isArray(data.produtos) ? data.produtos.slice(0, produtosPorPagina) : []);
        setTotalProdutos(data.total || data.produtos.length);
        setIsLoading(false);
        return;
      } catch (err) {
        console.error(`Tentativa ${attempt} falhou: ${err.message}`);
        if (attempt === maxRetries) {
          setError(`Erro ao carregar produtos após ${maxRetries} tentativas: ${err.message}`);
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    setIsLoading(false);
  }, [currentPage]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos, categoriaSelecionada, lojaSelecionada, termoBusca]);

  const produtosFiltrados = produtos
    .filter((produto) => {
      const matchCategoria =
        categoriaSelecionada === 'todas' ||
        produto.categoria?.toLowerCase() === categoriaSelecionada.toLowerCase();
      const matchLoja =
        lojaSelecionada === 'todas' ||
        produto.loja?.toLowerCase() === lojaSelecionada.toLowerCase();
      const matchBusca =
        !termoBusca || produto.nome?.toLowerCase().includes(termoBusca.toLowerCase());
      return matchCategoria && matchLoja && matchBusca;
    })
    .slice(0, produtosPorPagina);

  const anoAtual = new Date().getFullYear();

  const handleLogoClick = () => {
    let clickCount = 0;
    let clickTimer;

    return () => {
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 500);
      } else if (clickCount === 3) {
        clearTimeout(clickTimer);
        window.location.href = '/admin-xyz-123';
        clickCount = 0;
      }
    };
  };

  return (
    <div>
      <header className="site-header">
        <div className="logo-container">
          <a href="/">
            <img
              src="/logos/logoscentrodecompras.jpeg"
              alt="Centro de Compras"
              className="site-logo-img"
              width="150"
              height="50"
              onClick={handleLogoClick()}
            />
          </a>
        </div>
        <div className="header-text">
          <h1>Centro de Compra</h1>
          <p>O maior portal de compras do Brasil! Encontre as melhores ofertas.</p>
        </div>
      </header>
      <nav>
        <a href="/">Promoções</a>
        <a href="/cupom">Cupons de Descontos</a>
        <a href="/sobre">Sobre</a>
        <a href="/contato">Contato</a>
      </nav>
      <div className="container">
        <aside className="sidebar">
          <h3>Categorias</h3>
          <Filters
            categoriaSelecionada={categoriaSelecionada}
            setCategoriaSelecionada={setCategoriaSelecionada}
            lojaSelecionada={lojaSelecionada}
            setLojaSelecionada={setLojaSelecionada}
          />
        </aside>
        <main>
          <section>
            <h2>🛍️ Ofertas do Dia</h2>
            <ins
              className="adsbygoogle"
              style={{ display: 'inline-block', width: '728px', height: '90px' }}
              data-ad-client="ca-pub-4531749081462125"
              data-ad-slot="5690664546"
            ></ins>
            <SearchBar termoBusca={termoBusca} setTermoBusca={setTermoBusca} />
            {isLoading && <div className="loading-spinner">Carregando...</div>}
            {error && <div className="error-message">{error}</div>}
            {produtosFiltrados.length === 0 && !isLoading && (
              <div className="mensagem-vazia">Nenhum produto encontrado</div>
            )}
            <div className="grid-produtos">
              {produtosFiltrados.map((produto, index) => (
                <ProdutoCard key={produto._id || index} produto={produto} index={index} />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalProdutos={totalProdutos}
              produtosPorPagina={produtosPorPagina}
            />
          </section>
          <div className="social-links">
            <a href="https://www.tiktok.com/@cdc.centraldecompras" target="_blank" rel="noopener noreferrer">
              <div className="icon"><img src="/logos/tiktok.png" alt="TikTok" loading="lazy" width="40" height="40" /></div>
              <span>TikTok</span>
            </a>
            <a href="https://www.instagram.com/cdccentrodecompras/" target="_blank" rel="noopener noreferrer">
              <div className="icon"><img src="/logos/Instagram.png" alt="Instagram" loading="lazy" width="40" height="40" /></div>
              <span>Instagram</span>
            </a>
            <a href="https://x.com/ComprasCdc" target="_blank" rel="noopener noreferrer">
              <div className="icon"><img src="/logos/X.png" alt="X" loading="lazy" width="40" height="40" /></div>
              <span>X</span>
            </a>
            <a href="https://www.youtube.com/channel/UCaKHlI-hWqwdAXS6Xsv3ZzA" target="_blank" rel="noopener noreferrer">
              <div className="icon"><img src="/logos/youtube.png" alt="YouTube" loading="lazy" width="40" height="40" /></div>
              <span>YouTube</span>
            </a>
          </div>
          <a href="https://api.whatsapp.com/send?phone=5521975179737" className="whatsapp" target="_blank" rel="noopener noreferrer">📲 WhatsApp</a>
          <a href="https://t.me/centraldecomprascdc" className="telegram" target="_blank" rel="noopener noreferrer">📢 Telegram</a>
        </main>
      </div>
      <div className="robo-assistente">
        <a href="https://api.whatsapp.com/send?phone=5521975179737" target="_blank" rel="noopener noreferrer">
          <img src="/imagens/robo.jpg" alt="Robô Assistente" className="robo-imagem" loading="lazy" width="60" height="60" />
          <div className="robo-texto">Posso ajudar?</div>
        </a>
      </div>
      <div className="credibilidade-nota">
        <p><strong>Sobre credibilidade:</strong> É importante notar que esse site é apenas um portal de descontos e afiliado, não uma loja direta. Ele redireciona para plataformas terceiras. Verifique sempre se o cupom é válido diretamente na loja original, pois promoções podem expirar ou não se aplicar a certos produtos.</p>
      </div>
      <footer>
        <p>🔧 Todos os direitos reservados <strong>Grupo Centro de Compra "CdC"</strong> © {anoAtual}</p>
      </footer>
      <ImageModal produtos={produtos} />
    </div>
  );
};

export default Home;