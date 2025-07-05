import React, { useState, useEffect } from 'react';

const ImageModal = ({ produtos }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImages, setCurrentImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const handleOpenModal = async (event) => {
      const { index, imageIndex } = event.detail;
      const produto = produtos[index];
      const imagens = Array.isArray(produto?.imagens) && produto.imagens.length > 0
        ? produto.imagens.filter(img => typeof img === 'string' && img)
        : ['/imagens/placeholder.jpg'];

      const validImages = await Promise.all(
        imagens.map(img =>
          new Promise(resolve => {
            const testImg = new Image();
            testImg.src = img;
            testImg.onload = () => resolve(img);
            testImg.onerror = () => resolve('/imagens/placeholder.jpg');
          })
        )
      );

      setCurrentImages(validImages);
      setCurrentImageIndex(imageIndex);
      setIsOpen(true);
    };

    window.addEventListener('openModal', handleOpenModal);
    return () => window.removeEventListener('openModal', handleOpenModal);
  }, [produtos]);

  const moveModalCarrossel = (direction) => {
    const totalImagens = currentImages.length;
    setCurrentImageIndex((prev) => (prev + direction + totalImagens) % totalImagens);
  };

  const setModalCarrosselImage = (index) => {
    setCurrentImageIndex(index);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={closeModal} aria-hidden={!isOpen}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>✕</button>
        <div className="carrossel-imagens" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
          {currentImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Imagem ${i + 1}`}
              className="modal-image"
              loading="lazy"
              width="600"
              height="600"
              onError={(e) => (e.target.src = '/imagens/placeholder.jpg')}
            />
          ))}
        </div>
        {currentImages.length > 1 && (
          <>
            <button className="carrossel-prev" onClick={() => moveModalCarrossel(-1)} aria-label="Imagem anterior">
              ◄
            </button>
            <button className="carrossel-next" onClick={() => moveModalCarrossel(1)} aria-label="Próxima imagem">
              ▶
            </button>
            <div className="carrossel-dots">
              {currentImages.map((_, i) => (
                <span
                  key={i}
                  className={`carrossel-dot ${i === currentImageIndex ? 'ativa' : ''}`}
                  onClick={() => setModalCarrosselImage(i)}
                  aria-label={`Selecionar imagem ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageModal;