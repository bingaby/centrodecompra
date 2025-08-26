(function() {
  document.addEventListener("DOMContentLoaded", () => {
    console.log('init.js carregado');
    const ads = document.querySelectorAll('ins.adsbygoogle');
    const MAX_ADS = 3;
    let adCount = 0;
    let isScriptLoading = false;

    ads.forEach(ad => {
      if (adCount >= MAX_ADS) {
        console.warn('Limite de anúncios atingido:', MAX_ADS);
        return;
      }

      if (!ad.dataset.adClient || !ad.dataset.adSlot || ad.dataset.adClient !== 'ca-pub-9781903408224276') {
        console.warn('Configuração de anúncio incompleta ou inválida:', {
          adClient: ad.dataset.adClient,
          adSlot: ad.dataset.adSlot
        });
        return;
      }

      adCount++;

      const tryLoadAd = (ad, delay = 500, retryCount = 0, maxRetries = 3) => {
        if (typeof window.adsbygoogle !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          console.log('Anúncio AdSense inicializado com sucesso:', ad.dataset.adSlot);
          return;
        }

        if (retryCount >= maxRetries) {
          console.error('Falha ao carregar adsbygoogle.js após várias tentativas');
          return;
        }

        if (!isScriptLoading) {
          isScriptLoading = true;
          setTimeout(() => {
            const script = document.createElement('script');
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ad.dataset.adClient}`;
            script.async = true;
            script.crossOrigin = 'anonymous';
            document.head.appendChild(script);
            script.onload = () => {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              console.log('adsbygoogle.js recarregado e anúncio inicializado:', ad.dataset.adSlot);
              isScriptLoading = false;
            };
            script.onerror = () => {
              console.error('Erro ao recarregar adsbygoogle.js');
              isScriptLoading = false;
              tryLoadAd(ad, delay * 2, retryCount + 1, maxRetries);
            };
          }, delay);
        }
      };

      try {
        tryLoadAd(ad);
      } catch (e) {
        console.error('Erro ao inicializar anúncio:', e);
      }
    });
  });
})();
