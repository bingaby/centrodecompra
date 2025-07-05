import React, { useEffect, useRef } from 'react';

const SearchBar = ({ termoBusca, setTermoBusca }) => {
  const debounceTimer = useRef(null);

  const handleInput = (e) => {
    clearTimeout(debounceTimer.current);
    const value = e.target.value.trim();
    setTermoBusca(value);
  };

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  return (
    <div className="search-bar">
      <input
        className="barra-busca"
        type="text"
        placeholder="Busque por produtos..."
        value={termoBusca}
        onChange={handleInput}
        aria-label="Busca por produtos"
      />
      {termoBusca && (
        <div className="busca-feedback">Buscando por "{termoBusca}"...</div>
      )}
    </div>
  );
};

export default SearchBar;