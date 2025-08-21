// init.js
document.addEventListener("DOMContentLoaded", () => {
  // Atualizar o ano no footer
  document.getElementById("year").textContent = new Date().getFullYear();

  // Verificar carregamento do CSS
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
    if (!ad.getAttribute('data-ad-slot') || ad.getAttribute('data-ad-slot').includes('YOUR_AD_SLOT_ID')) {
      container.querySelector('.ad-fallback').style.display = 'block';
      ad.style.display = 'none';
      console.warn('Anúncio com data-ad-slot inválido ou não configurado.');
    } else {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Erro ao inicializar anúncio:', e);
        container.querySelector('.ad-fallback').style.display = 'block';
        ad.style.display = 'none';
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
