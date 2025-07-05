import React from 'react';

const Pagination = ({ currentPage, setCurrentPage, totalProdutos, produtosPorPagina }) => {
  const totalPages = Math.ceil(totalProdutos / produtosPorPagina);

  return (
    <div className="paginacao">
      <button
        className="prev-page"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((prev) => prev - 1)}
        aria-label="Página anterior"
      >
        Anterior
      </button>
      <span className="page-info">Página {currentPage} de {totalPages}</span>
      <button
        className="next-page"
        disabled={currentPage >= totalPages}
        onClick={() => setCurrentPage((prev) => prev + 1)}
        aria-label="Próxima página"
      >
        Próxima
      </button>
    </div>
  );
};

export default Pagination;