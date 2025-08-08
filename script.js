<script>
  const PLANILHA_ID = '1cQOP4Tpu-9lq1aG6FPNFTmO4C1E1WixGKlMXx_ybzR0';
  const ABA = 'Produtos';

  function parseDateBR(dataStr) {
    const partes = dataStr.split('/');
    if (partes.length !== 3) return null;
    return new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
  }

  async function carregarCupons() {
    const container = document.getElementById('cupons-container');
    if (!container) {
      console.error('Elemento #cupons-container não encontrado no HTML!');
      return;
    }

    container.innerHTML = 'Carregando cupons...';

    try {
      const res = await fetch(`https://opensheet.vercel.app/${PLANILHA_ID}/${ABA}`);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();
      console.log('Dados recebidos da planilha:', data);

      const hoje = new Date();
      container.innerHTML = '';

      let count = 0;
      data.forEach(cupom => {
        const validade = parseDateBR(cupom.validade);
        if (validade && validade >= hoje) {
          count++;
          const div = document.createElement('div');
          div.className = 'cupom';
          div.innerHTML = `
            <strong>${cupom.nome} (${cupom.loja})</strong><br/>
            Código: <code>${cupom.codigo}</code><br/>
            Válido até: ${cupom.validade}<br/>
            <a href="${cupom.link}" target="_blank" rel="noopener">Usar cupom</a>
          `;
          container.appendChild(div);
        }
      });

      if (count === 0) {
        container.innerHTML = '<p>Não há cupons válidos no momento.</p>';
      }
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
      container.innerHTML = '<p>Erro ao carregar cupons.</p>';
    }
  }

  carregarCupons();
</script>
