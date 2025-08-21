// init.js
document.addEventListener("DOMContentLoaded", () => {
  // Atualizar o ano no footer
  document.getElementById("year").textContent = new Date().getFullYear();

  // Verificar se o CSS foi carregado
  const cssLink = document.querySelector('link[href="style.css"]');
  if (cssLink && cssLink.sheet) {
    console.log("CSS carregado com sucesso.");
  } else {
    console.warn("CSS não carregado. Verifique o caminho do arquivo style.css.");
  }

  // Inicializar anúncios do Google AdSense
  const ads = document.querySelectorAll('.adsbygoogle');
  ads.forEach(ad => {
    const container = ad.closest('.ad-container');
    if (!ad.getAttribute('data-ad-slot') || ad.getAttribute('data-ad-slot') === 'YOUR_AD_SLOT_ID') {
      console.warn('Anúncio com data-ad-slot inválido ou não configurado.');
      if (container) {
        container.innerHTML = '<p>Anúncio não configurado corretamente.</p>';
      }
    } else {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Erro ao inicializar anúncio:', e);
        if (container) {
          container.innerHTML = '<p>Erro ao carregar anúncio.</p>';
        }
      }
    }
  });

  // Adicionar eventos para botões de reset e retry
  document.querySelectorAll('.reset-filters, .retry-load').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.reload();
    });
  });
});
