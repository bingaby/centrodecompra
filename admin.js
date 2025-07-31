<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adicionar Produto - Centro de Compras</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <img src="logos/centrodecompras.jpg" alt="Centro de Compras" loading="lazy">
    <h1>Adicionar Novo Produto</h1>
  </header>
  <div class="container">
    <form id="form-produto">
      <label for="nome">Nome:</label>
      <input type="text" id="nome" name="nome" required>
      <label for="descricao">Descrição:</label>
      <textarea id="descricao" name="descricao"></textarea>
      <label for="preco">Preço:</label>
      <input type="number" id="preco" name="preco" step="0.01" required>
      <label for="imagens">Imagens:</label>
      <input type="file" id="imagens" name="imagens" accept="image/*" multiple required>
      <label for="categoria">Categoria:</label>
      <select id="categoria" name="categoria" required>
        <option value="Eletrônicos">Eletrônicos</option>
        <option value="Roupas">Roupas</option>
        <option value="Casa">Casa</option>
      </select>
      <label for="loja">Loja:</label>
      <select id="loja" name="loja" required>
        <option value="Amazon">Amazon</option>
        <option value="Mercado Livre">Mercado Livre</option>
        <option value="Shopee">Shopee</option>
      </select>
      <label for="link">Link do Produto:</label>
      <input type="url" id="link" name="link" required>
      <button type="submit">Adicionar Produto</button>
    </form>
    <p id="mensagem"></p>
  </div>

  <script>
    const API_BASE_URL = 'https://minha-api-produtos.onrender.com';

    document.addEventListener('DOMContentLoaded', () => {
      // Manipulador de erro para imagens
      document.querySelectorAll('img').forEach(img => {
        img.onerror = () => {
          console.log(`Erro ao carregar imagem: ${img.src}`);
          img.src = '/imagens/placeholder.jpg';
        };
      });

      // Formulário de adição de produto
      const form = document.getElementById('form-produto');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
          const response = await fetch(`${API_BASE_URL}/api/produtos`, {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          if (response.ok) {
            document.getElementById('mensagem').textContent = result.message || 'Produto adicionado com sucesso';
            form.reset();
          } else {
            document.getElementById('mensagem').textContent = result.message || 'Erro ao adicionar produto';
          }
        } catch (error) {
          console.error('Erro ao adicionar produto:', error);
          document.getElementById('mensagem').textContent = 'Erro ao conectar com a API';
        }
      });
    });
  </script>
</body>
</html>
