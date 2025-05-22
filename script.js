function filtrarProdutos() {
  const busca = document.getElementById('busca').value.toLowerCase();
  const gridProdutos = document.getElementById('grid-produtos');
  const mensagemVazia = document.getElementById('mensagem-vazia');

  const produtosFiltrados = produtos.filter(produto =>
    (categoriaSelecionada === 'todas' || produto.categoria.toLowerCase() === categoriaSelecionada.toLowerCase()) &&
    (lojaSelecionada === 'todas' || produto.loja.toLowerCase() === lojaSelecionada.toLowerCase()) &&
    (produto.nome.toLowerCase().includes(busca) || produto.descricao.toLowerCase().includes(busca))
  );

  gridProdutos.innerHTML = '';
  if (!produtosFiltrados.length) {
    mensagemVazia.textContent = 'Nenhum produto encontrado.';
    mensagemVazia.style.display = 'block';
    return;
  }

  mensagemVazia.style.display = 'none';
  produtosFiltrados.forEach(produto => {
    const nomeImagem = produto.imagens?.[0] || 'sem-imagem.jpg';
    const imagemURL = `https://raw.githubusercontent.com/seuusuario/seurepositorio/main/uplor/${nomeImagem}`;

    const card = document.createElement('div');
    card.className = 'produto-card';
    card.innerHTML = `
      <img src="${imagemURL}" alt="${produto.nome}" loading="lazy">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <p><strong>Loja:</strong> ${produto.loja}</p>
      <p><strong>Preço:</strong> R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}</p>
      <a href="${produto.link}" target="_blank" rel="noopener noreferrer" class="botao-comprar">Comprar</a>
    `;
    gridProdutos.appendChild(card);
  });
}
