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
    const adClient = ad.getAttribute('data-ad-client');
    const adSlot = ad.getAttribute('data-ad-slot');
    if (!adClient || adClient !== 'ca-pub-9781903408224276') {
      console.warn('data-ad-client inválido ou não configurado:', adClient);
      if (container) {
        container.innerHTML = '<p>Anúncio com client inválido.</p>';
      }
    } else if (!adSlot || adSlot === 'YOUR_AD_SLOT_ID' || adSlot === '1234567890' || adSlot === '9876543210') {
      console.warn('Anúncio com data-ad-slot inválido ou não configurado:', adSlot);
      if (container) {
        container.innerHTML = '<p>Anúncio não configurado corretamente.</p>';
      }
    } else {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error('Erro ao inicializar anúncio:', e);
        if (container) {
          container.innerHTML = '<p>Erro ao carregar anúncio.</p>';
        }
      }
    }
  });

  // Adicionar eventos para botões de reset e retry
  const resetFilters = document.querySelector(".reset-filters");
  const retryLoad = document.querySelector(".retry-load");
  if (resetFilters) {
    resetFilters.addEventListener("click", (e) => {
      e.preventDefault();
      window.currentCategory = "todas";
      window.currentStore = "todas";
      window.currentSearch = "";
      window.currentPage = 1;
      document.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"));
      document.querySelectorAll(".store-card").forEach(c => c.classList.remove("active"));
      document.querySelector(".category-item[data-categoria='todas']").classList.add("active");
      document.querySelector(".store-card[data-loja='todas']").classList.add("active");
      document.getElementById("busca").value = "";
      window.carregarProdutos();
    });
  }
  if (retryLoad) {
    retryLoad.addEventListener("click", (e) => {
      e.preventDefault();
      window.carregarProdutos(window.currentCategory, window.currentStore, window.currentPage, window.currentSearch);
    });
  }
});
