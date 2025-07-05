import React, { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://centrodecompra-backend.onrender.com';

const Admin = () => {
  const [produtos, setProdutos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const produtosPorPagina = 24;

  const carregarProdutos = useCallback(async () => {
    setIsLoading(true);
    setErro('');
    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        const response = await fetch(
          `${API_URL}/api/produtos?page=${currentPage}&limit=${produtosPorPagina}`,
          { cache: 'no-store' }
        );
        if (!response.ok) throw new Error(`Falha ao buscar produtos: ${response.status}`);
        const data = await response.json();
        setProdutos(Array.isArray(data.produtos) ? data.produtos : []);
        setTotalProdutos(data.total || data.produtos.length);
        setIsLoading(false);
        return;
      } catch (err) {
        console.error(`Tentativa ${attempt} falhou: ${err.message}`);
        if (attempt === maxRetries) {
          setErro(`Erro ao carregar produtos após ${maxRetries} tentativas: ${err.message}`);
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    setIsLoading(false);
  }, [currentPage]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const link = formData.get('link');
    const preco = parseFloat(formData.get('preco'));

    if (!link.match(/^https?:\/\/.+/)) {
      setErro('Link inválido! Deve começar com http:// ou https://');
      return;
    }
    if (isNaN(preco) || preco <= 0) {
      setErro('O preço deve ser maior que zero!');
      return;
    }

    setMensagem('');
    setErro('');

    try {
      let res;
      if (produtoId) {
        res = await fetch(`${API_URL}/api/produtos/${produtoId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/api/produtos`, {
          method: 'POST',
          body: formData,
        });
      }

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData?.error || `Erro ao ${produtoId ? 'atualizar' : 'adicionar'} produto`);
      }

      setMensagem(produtoId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
      e.target.reset();
      setProdutoId('');
      e.target.querySelector('#submit-button').textContent = 'Adicionar';
      e.target.querySelector('#cancel-button').style.display = 'none';
      carregarProdutos();
    } catch (error) {
      setErro(error.message);
    }
  };

  const editarProduto = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/produtos/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar produto para edição');
      const produto = await res.json();
      setProdutoId(produto._id || '');
      document.getElementById('form-produto').nome.value = produto.nome || '';
      document.getElementById('form-produto').descricao.value = produto.descricao || '';
      document.getElementById('form-produto').categoria.value = produto.categoria || '';
      document.getElementById('form-produto').loja.value = produto.loja || '';
      document.getElementById('form-produto').link.value = produto.link || '';
      document.getElementById('form-produto').preco.value = produto.preco || '';
      document.getElementById('submit-button').textContent = 'Salvar Alterações';
      document.getElementById('cancel-button').style.display = 'inline-block';
      setMensagem('Editando produto. Envie para salvar as alterações.');
    } catch (err) {
      setErro(err.message);
    }
  };

  const cancelarEdicao = () => {
    document.getElementById('form-produto').reset();
    setProdutoId('');
    document.getElementById('submit-button').textContent = 'Adicionar';
    document.getElementById('cancel-button').style.display = 'none';
    setMensagem('');
    setErro('');
  };

  const excluirProduto = async (id) => {
    if (!window.confirm('Confirma a exclusão deste produto?')) return;
    try {
      const res = await fetch(`${API_URL}/api/produtos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir produto');
      setMensagem('Produto excluído com sucesso');
      carregarProdutos();
    } catch (err) {
      setErro(err.message);
    }
  };

  const escapeHTML = (str) =>
    str.replace(/[&<>"']/g, (match) => ({
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": ''',
    }[match]));

  return (
    <div>
      <h1>Gerenciar Produtos</h1>
      <form id="form-produto" onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="hidden" name="id" id="produto-id" value={produtoId} />
        <input type="text" name="nome" placeholder="Nome do produto" required aria-label="Nome do produto" />
        <textarea name="descricao" placeholder="Descrição do produto" required aria-label="Descrição do produto"></textarea>
        <select name="categoria" required aria-label="Categoria do produto">
          <option value="" disabled selected>Selecione uma categoria</option>
          <option value="eletronicos">Eletrônicos</option>
          <option value="moda">Moda</option>
          <option value="fitness">Fitness</option>
          <option value="casa">Casa e Decoração</option>
          <option value="beleza">Beleza</option>
          <option value="esportes">Esportes</option>
          <option value="livros">Livros</option>
          <option value="infantil">Infantil</option>
          <option value="celulares">Celulares</option>
          <option value="eletrodomesticos">Eletrodomésticos</option>
          <option value="pet">Pet</option>
          <option value="jardinagem">Jardinagem</option>
          <option value="automotivo">Automotivo</option>
          <option value="gastronomia">Gastronomia</option>
          <option value="games">Games</option>
        </select>
        <select name="loja" required aria-label="Loja do produto">
          <option value="" disabled selected>Selecione uma loja</option>
          <option value="amazon">Amazon</option>
          <option value="magalu">Magalu</option>
          <option value="shein">Shein</option>
          <option value="shopee">Shopee</option>
          <option value="mercadolivre">Mercado Livre</option>
          <option value="alibaba">Alibaba</option>
        </select>
        <input type="url" name="link" placeholder="Link do produto (https://...)" required pattern="https?://.+" aria-label="Link do produto" />
        <input type="number" name="preco" placeholder="Preço do produto (ex.: 99.99)" step="0.01" min="0" required aria-label="Preço do produto" />
        <input type="file" name="imagens" accept="image/*" multiple aria-label="Imagens do produto" />
        <button type="submit" id="submit-button">Adicionar</button>
        <button type="button" id="cancel-button" style={{ display: 'none', backgroundColor: '#6c757d' }} onClick={cancelarEdicao}>
          Cancelar
        </button>
      </form>
      <div id="mensagem">{mensagem}</div>
      <div id="erro">{erro}</div>
      <div id="loading-spinner" style={{ display: isLoading ? 'block' : 'none' }}>
        Carregando...
      </div>
      <div id="produtos-cadastrados">
        <h3>Produtos Cadastrados</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Loja</th>
              <th>Link</th>
              <th>Preço</th>
              <th>Imagens</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 && !isLoading && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>Nenhum produto cadastrado.</td>
              </tr>
            )}
            {produtos.map((produto) => (
              <tr key={produto._id}>
                <td>{escapeHTML(produto.nome || 'N/A')}</td>
                <td>{escapeHTML(produto.descricao || 'N/A')}</td>
                <td>{escapeHTML(produto.categoria || 'N/A')}</td>
                <td>{escapeHTML(produto.loja || 'N/A')}</td>
                <td>
                  <a href={escapeHTML(produto.link || '#')} target="_blank" rel="noopener noreferrer">
                    Link
                  </a>
                </td>
                <td>R$ {parseFloat(produto.preco || 0).toFixed(2).replace('.', ',')}</td>
                <td>
                  {Array.isArray(produto.imagens) && produto.imagens.length > 0
                    ? produto.imagens.map((img, i) => (
                        <img
                          key={i}
                          src={escapeHTML(img)}
                          className="thumbnail"
                          alt={`Imagem ${i + 1}`}
                          loading="lazy"
                          onError={(e) => (e.target.src = '/imagens/placeholder.jpg')}
                        />
                      ))
                    : 'Sem imagens'}
                </td>
                <td>
                  <button className="editar" onClick={() => editarProduto(produto._id)} aria-label={`Editar produto ${produto.nome}`}>
                    Editar
                  </button>
                  <button className="excluir" onClick={() => excluirProduto(produto._id)} aria-label={`Excluir produto ${produto.nome}`}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div id="paginacao">
        <button
          id="prev-page"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </button>
        <span id="page-info">Página {currentPage} de {Math.ceil(totalProdutos / produtosPorPagina)}</span>
        <button
          id="next-page"
          disabled={currentPage >= Math.ceil(totalProdutos / produtosPorPagina)}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          aria-label="Próxima página"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};

export default Admin;