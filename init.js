// init.js
(function() {
  document.addEventListener("DOMContentLoaded", () => {
    console.log('init.js carregado');
    const ads = document.querySelectorAll('ins.adsbygoogle');
    ads.forEach(ad => {
      if (!ad.dataset.adClient || !ad.dataset.adSlot) {
        console.warn('Configuração de anúncio incompleta:', {
          adClient: ad.dataset.adClient,
          adSlot: ad.dataset.adSlot
        });
        return;
      }
      try {
        if (typeof window.adsbygoogle !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('Anúncio AdSense inicializado com sucesso:', ad.dataset.adSlot);
        } else {
          console.warn('adsbygoogle.js não carregado. Tentando recarregar...');
          setTimeout(() => {
            const script = document.createElement('script');
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9781903408224276';
            script.async = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
            script.onload = () => {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              console.log('adsbygoogle.js recarregado e anúncio inicializado:', ad.dataset.adSlot);
            };
            script.onerror = () => console.error('Erro ao recarregar adsbygoogle.js');
          }, 1000);
        }
      } catch (e) {
        console.error('Erro ao inicializar anúncio:', e);
      }
    });
  });
})();
