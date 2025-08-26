// init.js
(function () {
  console.log('Inicializando dependências (init.js)');

  // Inicializar Google Ads
  if (typeof adsbygoogle !== 'undefined') {
    (adsbygoogle = window.adsbygoogle || []).push({});
    console.log('Google Ads inicializado');
  } else {
    console.warn('Google Ads não inicializado. Verifique a inclusão do script adsbygoogle.js.');
  }

  // Configurar gtag para consentimento padrão
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-YOUR_GA_ID', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'personalization_storage': 'denied'
  });
})();
