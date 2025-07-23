<script>
  const BACKEND_URL = 'https://api-centro-de-compras.onrender.com';

  // Verificar autenticação
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tempToken') !== 'triple-click-access') {
    alert('Acesso não autorizado.');
    window.location.href = '/index.html';
  }

  // Visualizar imagens
  document.getElementById('imagens').addEventListener('change', (e) => {
    const preview = document.getElementById('imagens-preview');
    preview.innerHTML = '';
    Array.from(e.target.files).forEach(file => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'Prévia do produto';
      img.style.maxWidth = '100px';
      img.style.margin = '5px';
      img.onerror = () => { img.src = 'https://via.placeholder.com/100?text=Imagem+Indisponivel'; };
      preview.appendChild(img);
    });
  });

  // Enviar formulário
  document.getElementById('produto-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Enviando...';
    feedback.style.color = '#333';
    try {
      const formData = new FormData(e.target);
      const imagens = formData.getAll('imagens');
      const imagensBase64 = await Promise.all(
        Array.from(imagens).map(file => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );
      const data = {
        nome: formData.get('nome'),
        descricao: formData.get('descricao'),
        categoria: formData.get('categoria'),
        loja: formData.get('loja'),
        link: formData.get('link'),
        preco: formData.get('preco'),
        imagensBase64: imagensBase64,
        rowIndex: formData.get('rowIndex') || undefined
      };
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${await response.text()}`);
      }
      const result = await response.json();
      if (result.success) {
        feedback.textContent = 'Produto salvo com sucesso!';
        feedback.style.color = '#2E8B57';
        e.target.reset();
        document.getElementById('imagens-preview').innerHTML = '';
      } else {
        throw new Error(result.error || 'Erro ao salvar produto');
      }
    } catch (error) {
      console.error('Erro:', error);
      feedback.textContent = `Erro: ${error.message}`;
      feedback.style.color = '#d32f2f';
    }
  });
</script>
