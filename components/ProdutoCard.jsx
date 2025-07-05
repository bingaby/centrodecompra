import React, { useState } from 'react';

const escapeHTML = (str) =>
  str.replace(/[&<>"']/g, (match) => ({
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": ''',
  }[match]));

const ProdutoCard = ({ produto, index }) => {
  const [carrosselIndex, setCarrosselIndex] = useState(0);
  const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0
    ? produto.imagens.filter(img => typeof img === 'string' && img)
    : ['/imagens/placeholder.jpg'];
  const carrosselId = `carrossel-${index}-${produto._id || Date.now()}`;

  const moveCarrossel = (direction) => {
    const totalImagens = imagens.length;
    setCarrosselIndex((prev) => (prev + direction + totalImagens) % totalImagens);
  };

  const setCarrosselImage = (newIndex) => {
    setCarrosselIndex(newIndex);
  };

  const openModal = (imageIndex) => {
    window.dispatchEvent(new CustomEvent('openModal', { detail: { index, imageIndex } }));
  };

  return (
    <div className="produto-card visible" data-categoria={produto.categoria?.toLowerCase() || 'todas'} data-loja={produto.loja?.toLowerCase() || 'todas'}>
      <div className="carrossel" id={carrosselId} role="region" aria-label="Carrossel de imagens do produto">
        <div className="carrossel-imagens" style={{ transform: `translateX(-${carrosselIndex * 100}%)` }}>
          {imagens.map((img, i) => (
            <img
              key={i}
              src={escapeHTML(img)}
              alt={`${escapeHTML(produto.nome || 'Produto')} ${i + 1}`}
              loading="lazy"
              width="200"
              height="200"
              onError={(e) => (e.target.src = '/imagens/placeholder.jpg')}
              onClick={() => openModal(i)}
            />
          ))}
        </div>
        {imagens.length > 1 && (
          <>
            <button className="carrossel-prev" onClick={() => moveCarrossel(-1)} aria-label="Imagem anterior">
              ◄
            </button>
            <button className="carrossel-next" onClick={() => moveCarrossel(1)} aria-label="Próxima imagem">
              ▶
            </button>
            <div className="carrossel-dots">
              {imagens.map((_, i) => (
                <span
                  key={i}
                  className={`carrossel-dot ${i === carrosselIndex ? 'ativa' : ''}`}
                  onClick={() => setCarrosselImage(i)}
                  aria-label={`Selecionar imagem ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <span>{escapeHTML(produto.nome || 'Produto sem nome')}</span>
      <span className="descricao">Loja: {escapeHTML(produto.loja || 'Desconhecida')}</span>
      <p className="preco">
        <a href={escapeHTML(produto.link || '#')} target="_blank" className="ver-preco" rel="noopener noreferrer">
          Clique aqui para ver o preço
        </a>
      </p>
      <a
        href={escapeHTML(produto.link || '#')}
        target="_blank"
        className={`ver-na-loja ${produto.loja?.toLowerCase() || 'default'}`}
        rel="noopener noreferrer"
      >
        Comprar
      </a>
    </div>
  );
};

export default ProdutoCard;