import React from 'react';

const Filters = ({ categoriaSelecionada, setCategoriaSelecionada, lojaSelecionada, setLojaSelecionada }) => {
  const categorias = [
    'todas', 'eletronicos', 'moda', 'fitness', 'casa', 'beleza', 'esportes',
    'livros', 'infantil', 'celulares', 'eletrodomesticos', 'pet', 'jardinagem',
    'automotivo', 'gastronomia', 'games'
  ];
  const lojas = ['todas', 'amazon', 'magalu', 'shein', 'shopee', 'mercadolivre', 'alibaba'];

  return (
    <>
      <ul>
        {categorias.map((categoria) => (
          <li
            key={categoria}
            className={`categoria-item ${categoria === categoriaSelecionada ? 'ativa' : ''}`}
            data-categoria={categoria}
            onClick={() => setCategoriaSelecionada(categoria)}
          >
            <i className={`fas ${categoria === 'todas' ? 'fa-list' : 
                             categoria === 'eletronicos' ? 'fa-laptop' : 
                             categoria === 'moda' ? 'fa-tshirt' : 
                             categoria === 'fitness' ? 'fa-dumbbell' : 
                             categoria === 'casa' ? 'fa-home' : 
                             categoria === 'beleza' ? 'fa-magic' : 
                             categoria === 'esportes' ? 'fa-futbol' : 
                             categoria === 'livros' ? 'fa-book' : 
                             categoria === 'infantil' ? 'fa-baby' : 
                             categoria === 'celulares' ? 'fa-mobile-alt' : 
                             categoria === 'eletrodomesticos' ? 'fa-blender' : 
                             categoria === 'pet' ? 'fa-paw' : 
                             categoria === 'jardinagem' ? 'fa-leaf' : 
                             categoria === 'automotivo' ? 'fa-car' : 
                             categoria === 'gastronomia' ? 'fa-utensils' : 'fa-gamepad'} mr-2`}></i>
            {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
          </li>
        ))}
      </ul>
      <div className="lojas-parceiras">
        <h3>🌟 Lojas Parceiras</h3>
        <div className="grid-lojas">
          {lojas.map((loja) => (
            <div
              key={loja}
              className={`loja ${loja === lojaSelecionada ? 'ativa' : ''}`}
              data-loja={loja}
              onClick={() => setLojaSelecionada(loja)}
            >
              {loja !== 'todas' && (
                <img
                  src={`/logos/${loja}.png`}
                  alt={loja.charAt(0).toUpperCase() + loja.slice(1)}
                  loading="lazy"
                  width="100"
                  height="40"
                  onError={(e) => (e.target.src = '/imagens/placeholder.jpg')}
                />
              )}
              <span>{loja === 'todas' ? 'Todas as Lojas' : loja.charAt(0).toUpperCase() + loja.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Filters;
