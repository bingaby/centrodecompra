const VERSION = "1.0.26";
const API_URL = 'https://minha-api-produtos.onrender.com';
const PLACEHOLDER_IMAGE = 'https://www.centrodecompra.com/logos/placeholder.png';
let currentImages = [];
let currentImageIndex = 0;
let currentPage = 1;
const productsPerPage = 21;
let allProducts = [];
let isLoading = false;
let currentCategory = "todas";
let currentStore = "todas";
let currentSearch = "";
const socket = io(API_URL, { transports: ['websocket'], path: '/socket.io' });

// Lista de vendors TCF
const vendors = [
  { name: "Exponential Interactive, Inc d/b/a VDX.tv", id: "exponential", cookieDuration: 90, data: ["IP addresses", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://vdx.tv/privacy-policy/", usesOtherStorage: true },
  { name: "Index Exchange Inc.", id: "indexexchange", cookieDuration: 395, data: ["IP addresses", "Device characteristics", "Device identifiers", "Non-precise location data", "Precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.indexexchange.com/privacy/", usesOtherStorage: true },
  { name: "Quantcast", id: "quantcast", cookieDuration: 1825, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.quantcast.com/privacy/", usesOtherStorage: true },
  { name: "BeeswaxIO Corporation", id: "beeswax", cookieDuration: 395, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.beeswax.com/privacy/", usesOtherStorage: true },
  { name: "Sovrn, Inc.", id: "sovrn", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.sovrn.com/privacy-policy/", usesOtherStorage: true },
  { name: "Adkernel LLC", id: "adkernel", cookieDuration: 180, data: ["IP addresses", "Device identifiers", "Non-precise location data", "Precise location data", "Users’ profiles"], consentRequired: true, privacyPolicy: "https://adkernel.com/privacy-policy/", usesOtherStorage: true },
  { name: "Adikteev", id: "adikteev", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Non-precise location data", "Users’ profiles"], consentRequired: true, privacyPolicy: "https://www.adikteev.com/privacy/", usesOtherStorage: true },
  { name: "RTB House S.A.", id: "rtbhouse", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.rtbhouse.com/privacy/", usesOtherStorage: true },
  { name: "The UK Trade Desk Ltd", id: "tradedesk", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.thetradedesk.com/us/privacy", usesOtherStorage: true },
  { name: "Nexxen Inc.", id: "nexxen", cookieDuration: 180, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.nexxen.com/privacy-policy/", usesOtherStorage: true },
  { name: "Epsilon", id: "epsilon", cookieDuration: 396, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.epsilon.com/us/privacy-policy", usesOtherStorage: true },
  { name: "Yahoo EMEA Limited", id: "yahooemea", cookieDuration: 750, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.yahoo.com/info/privacy/", usesOtherStorage: true },
  { name: "ADventori SAS", id: "adventori", cookieDuration: 90, data: ["IP addresses", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.adventori.com/with-us/legal-notice/", usesOtherStorage: true },
  { name: "TripleLift, Inc.", id: "triplelift", cookieDuration: 90, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://triplelift.com/privacy/", usesOtherStorage: true },
  { name: "Xandr, Inc.", id: "xandr", cookieDuration: 90, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.xandr.com/privacy/", usesOtherStorage: true },
  { name: "Nexxen Group LLC", id: "nexxengroup", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.nexxen.com/privacy-policy/", usesOtherStorage: true },
  { name: "NEURAL.ONE", id: "neuralone", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://web.neural.one/privacy-policy/", usesOtherStorage: true },
  { name: "ADITION (Virtual Minds GmbH)", id: "adition", cookieDuration: 90, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.adition.com/en/privacy/", usesOtherStorage: true },
  { name: "Active Agent (Virtual Minds GmbH)", id: "activeagent", cookieDuration: 90, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.active-agent.com/en/privacy-policy/", usesOtherStorage: true },
  { name: "Equativ", id: "equativ", cookieDuration: 366, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://equativ.com/privacy-policy/", usesOtherStorage: true },
  { name: "Adform A/S", id: "adform", cookieDuration: 3650, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://site.adform.com/privacy-policy-opt-out/", usesOtherStorage: true },
  { name: "Magnite, Inc.", id: "magnite", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.magnite.com/legal/advertising-technology-privacy-policy/", usesOtherStorage: true },
  { name: "RATEGAIN ADARA INC", id: "rategain", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.adara.com/privacy-promise/", usesOtherStorage: true },
  { name: "Sift Media, Inc", id: "siftmedia", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Device identifiers", "Non-precise location data", "Precise location data"], consentRequired: true, privacyPolicy: "https://www.siftmedia.com/privacy-policy/", usesOtherStorage: false },
  { name: "Lumen Research Limited", id: "lumenresearch", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Browsing and interaction data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.lumen-research.com/privacy-policy/", usesOtherStorage: true },
  { name: "OpenX", id: "openx", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.openx.com/privacy-center/ad-exchange-privacy-policy/", usesOtherStorage: true },
  { name: "Yieldlab (Virtual Minds GmbH)", id: "yieldlab", cookieDuration: 90, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.yieldlab.de/privacy/", usesOtherStorage: true },
  { name: "Roku Advertising Services", id: "roku", cookieDuration: 396, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://docs.roku.com/published/userprivacypolicy/en/us", usesOtherStorage: true },
  { name: "Simplifi Holdings LLC", id: "simplifi", cookieDuration: 366, data: ["IP addresses", "Device identifiers", "Precise location data"], consentRequired: true, privacyPolicy: "https://simpli.fi/site-privacy-policy/", usesOtherStorage: true },
  { name: "PubMatic, Inc", id: "pubmatic", cookieDuration: 1827, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://pubmatic.com/legal/privacy-policy/", usesOtherStorage: true },
  { name: "Comscore B.V.", id: "comscore", cookieDuration: 720, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.comscore.com/About/Privacy-Policy", usesOtherStorage: true },
  { name: "Flashtalking", id: "flashtalking", cookieDuration: 730, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.flashtalking.com/privacypolicy/", usesOtherStorage: true },
  { name: "Sharethrough, Inc", id: "sharethrough", cookieDuration: 30, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.sharethrough.com/privacy-policy/", usesOtherStorage: true },
  { name: "PulsePoint, Inc.", id: "pulsepoint", cookieDuration: 1830, data: ["IP addresses", "Device characteristics", "Device identifiers"], consentRequired: true, privacyPolicy: "https://www.pulsepoint.com/privacy-policy", usesOtherStorage: true },
  { name: "Smaato, Inc.", id: "smaato", cookieDuration: 21, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.smaato.com/privacy/", usesOtherStorage: true },
  { name: "Crimtan Holdings Limited", id: "crimtan", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://crimtan.com/privacy/", usesOtherStorage: true },
  { name: "Criteo SA", id: "criteo", cookieDuration: 390, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.criteo.com/privacy/", usesOtherStorage: true },
  { name: "Adloox SA", id: "adloox", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data"], consentRequired: true, privacyPolicy: "https://www.adloox.com/privacy-policy/", usesOtherStorage: true },
  { name: "LiveRamp", id: "liveramp", cookieDuration: 3653, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://liveramp.com/privacy/", usesOtherStorage: true },
  { name: "WPP Media", id: "wppmedia", cookieDuration: 395, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.wpp.com/wpp-media-privacy-policy", usesOtherStorage: true },
  { name: "Sonobi, Inc", id: "sonobi", cookieDuration: 365, data: ["IP addresses", "Device identifiers", "Non-precise location data"], consentRequired: true, privacyPolicy: "https://sonobi.com/privacy-policy/", usesOtherStorage: true },
  { name: "LoopMe Limited", id: "loopme", cookieDuration: 90, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://loopme.com/privacy/", usesOtherStorage: true },
  { name: "Dynata LLC", id: "dynata", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.dynata.com/privacy-policy/", usesOtherStorage: true },
  { name: "Ask Locala", id: "asklocala", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Device identifiers", "Non-precise location data", "Precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.asklocala.com/privacy-policy/", usesOtherStorage: true },
  { name: "Azira", id: "azira", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://azira.io/privacy-center/", usesOtherStorage: true },
  { name: "DoubleVerify Inc.", id: "doubleverify", cookieDuration: 0, data: ["IP addresses", "Device characteristics", "Probabilistic identifiers", "Browsing and interaction data", "Non-precise location data", "Privacy choices"], consentRequired: false, privacyPolicy: "https://doubleverify.com/privacy/", usesOtherStorage: false },
  { name: "BIDSWITCH GmbH", id: "bidswitch", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.bidswitch.com/privacy-policy/", usesOtherStorage: true },
  { name: "IPONWEB GmbH", id: "iponweb", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.iponweb.com/privacy-policy/", usesOtherStorage: true },
  { name: "NextRoll, Inc.", id: "nextroll", cookieDuration: 395, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.nextroll.com/privacy", usesOtherStorage: true },
  { name: "Media.net Advertising FZ-LLC", id: "medianet", cookieDuration: 396, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.media.net/privacy-policy/", usesOtherStorage: true },
  { name: "LiveIntent Inc.", id: "liveintent", cookieDuration: 731, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.liveintent.com/privacy-policy/", usesOtherStorage: true },
  { name: "Basis Global Technologies, Inc.", id: "basisglobal", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.basis.net/privacy-policy/", usesOtherStorage: true },
  { name: "Seedtag Advertising S.L", id: "seedtag", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Browsing and interaction data", "Non-precise location data", "Privacy choices"], consentRequired: true, privacyPolicy: "https://www.seedtag.com/privacy/", usesOtherStorage: true },
  { name: "SMADEX, S.L.U.", id: "smadex", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Probabilistic identifiers", "User-provided data", "Non-precise location data", "Users’ profiles", "Privacy choices"], consentRequired: true, privacyPolicy: "https://smadex.com/privacy-policy/", usesOtherStorage: true },
  { name: "Bombora Inc.", id: "bombora", cookieDuration: 365, data: ["IP addresses", "Device characteristics", "Device identifiers", "Authentication-derived identifiers", "Browsing and interaction data", "Non-precise location data", "Users’ profiles"], consentRequired: true, privacyPolicy: "https://bombora.com/privacy/", usesOtherStorage: true }
];

// Função para verificar se o consentimento expirou (1 ano)
function isConsentExpired(consentDate) {
  if (!consentDate) return true;
  const date = new Date(consentDate);
  const now = new Date();
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  return (now - date) > oneYearInMs;
}

// Função para definir cookies com expiração específica
function setCookie(name, value, days) {
  const expires = days ? `expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; Secure; SameSite=Strict`;
}

// Função para obter cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
  return null;
}

// Função para carregar e aplicar consentimentos
function loadConsent() {
  const consent = localStorage.getItem('cookie-consent');
  if (consent) {
    const { analytics, ads, vendors: vendorConsents, timestamp } = JSON.parse(consent);
    if (!isConsentExpired(timestamp)) {
      updateConsentStatus({ analytics, ads, vendors: vendorConsents });
      return true;
    }
  }
  return false;
}

// Função para atualizar status de consentimento no gtag
function updateConsentStatus({ analytics, ads, vendors }) {
  const consentStatus = {
    'ad_storage': ads ? 'granted' : 'denied',
    'analytics_storage': analytics ? 'granted' : 'denied',
    'personalization_storage': ads ? 'granted' : 'denied'
  };
  gtag('consent', 'update', consentStatus);
  loadVendorScripts(vendors);
  console.log('Status de consentimento atualizado:', consentStatus);
}

// Função para carregar scripts de vendors apenas se consentidos
function loadVendorScripts(vendorConsents) {
  vendors.forEach(vendor => {
    if (vendor.consentRequired && vendorConsents[vendor.id]) {
      // Exemplo: carregar script do vendor dinamicamente
      if (vendor.id === 'googleads' && document.querySelector('ins.adsbygoogle')) {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log(`Script do vendor ${vendor.name} carregado`);
      }
      // Adicione lógica específica para outros vendors, se necessário
    }
    if (vendor.usesOtherStorage && vendorConsents[vendor.id]) {
      localStorage.setItem(`vendor_${vendor.id}_consent`, 'true');
    } else if (vendor.usesOtherStorage) {
      localStorage.removeItem(`vendor_${vendor.id}_consent`);
    }
  });
}

// Função para preencher a lista de vendors no modal
function populateVendorsList() {
  const vendorsList = document.querySelector('.vendors-list');
  if (!vendorsList) {
    console.error('Lista de vendors não encontrada no DOM');
    return;
  }
  vendorsList.innerHTML = vendors.map(vendor => `
    <div class="vendor-item">
      <label>
        <input type="checkbox" data-vendor-id="${vendor.id}" ${vendor.consentRequired ? '' : 'checked disabled'}>
        ${vendor.name}
        <a href="${vendor.privacyPolicy}" target="_blank" rel="noopener" aria-label="Política de privacidade de ${vendor.name}"> (Política de Privacidade)</a>
      </label>
    </div>
  `).join('');
}

// Função para inicializar o banner de cookies
function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const modal = document.getElementById('cookie-modal');
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const rejectAllBtn = document.getElementById('reject-all-cookies');
  const manageBtn = document.getElementById('manage-cookies');
  const saveBtn = document.getElementById('save-cookies');
  const cancelBtn = document.getElementById('cancel-cookies');

  // Verifica se todos os elementos necessários estão presentes
  if (!banner || !modal || !acceptAllBtn || !rejectAllBtn || !manageBtn || !saveBtn || !cancelBtn) {
    console.error('Elementos do banner de cookies não encontrados:', {
      banner: !!banner,
      modal: !!modal,
      acceptAllBtn: !!acceptAllBtn,
      rejectAllBtn: !!rejectAllBtn,
      manageBtn: !!manageBtn,
      saveBtn: !!saveBtn,
      cancelBtn: !!cancelBtn
    });
    return;
  }

  // Carrega consentimento existente e oculta banner se válido
  if (loadConsent()) {
    console.log('Consentimento válido encontrado, ocultando banner');
    banner.style.display = 'none';
    return;
  }

  // Garante que o banner esteja visível inicialmente
  console.log('Exibindo banner de cookies');
  banner.style.display = 'flex';

  // Evento para "Aceitar Tudo"
  acceptAllBtn.addEventListener('click', () => {
    console.log('Botão "Aceitar Tudo" clicado');
    const consent = {
      analytics: true,
      ads: true,
      vendors: vendors.reduce((acc, vendor) => ({ ...acc, [vendor.id]: !vendor.consentRequired || true }), {}),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    updateConsentStatus(consent);
    banner.style.display = 'none';
    console.log('Consentimento salvo:', consent);
    console.log('Banner de cookies ocultado');
  });

  // Evento para "Recusar Tudo"
  rejectAllBtn.addEventListener('click', () => {
    console.log('Botão "Recusar Tudo" clicado');
    const consent = {
      analytics: false,
      ads: false,
      vendors: vendors.reduce((acc, vendor) => ({ ...acc, [vendor.id]: !vendor.consentRequired }), {}),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    updateConsentStatus(consent);
    banner.style.display = 'none';
    console.log('Consentimento salvo:', consent);
    console.log('Banner de cookies ocultado');
  });

  // Evento para "Gerenciar Opções"
  manageBtn.addEventListener('click', () => {
    console.log('Botão "Gerenciar Opções" clicado');
    modal.style.display = 'flex';
    populateVendorsList();
  });

  // Evento para "Salvar Preferências"
  saveBtn.addEventListener('click', () => {
    console.log('Botão "Salvar Preferências" clicado');
    const consent = {
      analytics: document.getElementById('analytics-cookies').checked,
      ads: document.getElementById('ad-cookies').checked,
      vendors: Array.from(document.querySelectorAll('.vendors-list input[type="checkbox"]')).reduce((acc, input) => {
        const vendorId = input.dataset.vendorId;
        acc[vendorId] = input.checked || !vendors.find(v => v.id === vendorId).consentRequired;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    updateConsentStatus(consent);
    modal.style.display = 'none';
    banner.style.display = 'none';
    console.log('Consentimento salvo:', consent);
    console.log('Banner e modal ocultados');
  });

  // Evento para "Cancelar"
  cancelBtn.addEventListener('click', () => {
    console.log('Botão "Cancelar" clicado');
    modal.style.display = 'none';
  });
}

// Função para verificar se a URL da imagem é válida
function isValidImageUrl(url) {
  return typeof url === 'string' && url.trim() !== '' && url.includes('cloudinary.com') && url.startsWith('https://res.cloudinary.com');
}

// Função para embaralhar array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Função para carregar produtos
async function carregarProdutos(categoria = "todas", loja = "todas", page = 1, busca = currentSearch) {
  console.log('Iniciando carregarProdutos:', { categoria, loja, page, busca });
  const gridProdutos = document.getElementById("grid-produtos");
  const mensagemVazia = document.getElementById("mensagem-vazia");
  const errorMessage = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading-spinner");

  if (!gridProdutos || !mensagemVazia || !errorMessage || !loadingSpinner) {
    console.error("Elementos do DOM não encontrados:", {
      gridProdutos: !!gridProdutos,
      mensagemVazia: !!mensagemVazia,
      errorMessage: !!errorMessage,
      loadingSpinner: !!loadingSpinner
    });
    return;
  }

  if (isLoading) return;
  isLoading = true;

  loadingSpinner.classList.add("active");
  gridProdutos.innerHTML = "";
  allProducts = [];
  mensagemVazia.classList.remove("active");
  errorMessage.classList.remove("active");

  try {
    let url = `${API_URL}/api/produtos?page=${page}&limit=${productsPerPage}`;
    if (categoria !== 'todas') url += `&categoria=${encodeURIComponent(categoria)}`;
    if (loja !== 'todas') url += `&loja=${encodeURIComponent(loja)}`;
    if (busca) url += `&busca=${encodeURIComponent(busca)}`;
    console.log(`Carregando de ${url}`);

    const response = await fetch(url, { cache: "no-store", headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();

    if (!data || !Array.isArray(data.data)) throw new Error('Resposta inválida da API');
    allProducts = shuffleArray([...data.data]);

    if (allProducts.length === 0) {
      mensagemVazia.classList.add("active");
      gridProdutos.style.display = "none";
    } else {
      mensagemVazia.classList.remove("active");
      gridProdutos.style.display = "grid";

      allProducts.forEach((produto, index) => {
        if (!produto || !produto.nome || !produto.categoria || !produto.loja) {
          console.warn('Produto inválido ignorado:', produto);
          return;
        }
        const imagens = Array.isArray(produto.imagens) && produto.imagens.length > 0 && produto.imagens.some(isValidImageUrl)
          ? produto.imagens.filter(isValidImageUrl)
          : [PLACEHOLDER_IMAGE];
        const carrosselId = `carrossel-${(page - 1) * productsPerPage + index}`;
        const lojaClass = produto.loja.toLowerCase();

        const card = document.createElement("div");
        card.classList.add("produto-card", "visible");
        card.setAttribute("data-categoria", produto.categoria.toLowerCase());
        card.setAttribute("data-loja", produto.loja.toLowerCase());
        card.innerHTML = `
          <div class="carrossel" id="${carrosselId}">
            <div class="carrossel-imagens">
              ${imagens.map((img, idx) => `
                <img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'" data-index="${index}" data-image-index="${idx}">
              `).join("")}
            </div>
            ${imagens.length > 1 ? `
              <button class="carrossel-prev" aria-label="Imagem anterior"><i class="fas fa-chevron-left"></i></button>
              <button class="carrossel-next" aria-label="Próxima imagem"><i class="fas fa-chevron-right"></i></button>
              <div class="carrossel-dots">
                ${imagens.map((_, idx) => `<span class="carrossel-dot ${idx === 0 ? "ativo" : ""}" data-carrossel-id="${carrosselId}" data-image-index="${idx}" aria-label="Selecionar imagem ${idx + 1}"></span>`).join("")}
              </div>
            ` : ""}
          </div>
          <span class="produto-nome">${produto.nome}</span>
          <span class="descricao">Loja: ${produto.loja}</span>
          <a href="${produto.link}" target="_blank" class="tarja-preco tarja-${lojaClass}" aria-label="Clique para ver o preço de ${produto.nome} na loja">
            <i class="fas fa-shopping-cart"></i> Ver Preço
          </a>
        `;
        gridProdutos.appendChild(card);
      });

      document.querySelectorAll('.carrossel-imagens img').forEach(img => {
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(img.dataset.index);
          const imageIndex = parseInt(img.dataset.imageIndex);
          console.log('Imagem clicada:', { index, imageIndex, produto: allProducts[index] });
          if (allProducts[index]) openModal(index, imageIndex);
        });
      });

      document.querySelectorAll('.carrossel-prev').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const carrosselId = button.parentElement.id;
          moveCarrossel(carrosselId, -1);
        });
      });
      document.querySelectorAll('.carrossel-next').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const carrosselId = button.parentElement.id;
          moveCarrossel(carrosselId, 1);
        });
      });
      document.querySelectorAll('.carrossel-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const carrosselId = dot.dataset.carrosselId;
          const index = parseInt(dot.dataset.imageIndex);
          setCarrosselImage(carrosselId, index);
        });
      });
    }

    updatePaginationControls(data.total);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    errorMessage.classList.add("active");
    gridProdutos.style.display = "none";
    errorMessage.querySelector("p").textContent = `Erro ao carregar os produtos: ${error.message}`;
  } finally {
    loadingSpinner.classList.remove("active");
    isLoading = false;
  }
}

// Função para abrir o modal de imagens
function openModal(index, imageIndex) {
  console.log('Abrindo modal:', { index, imageIndex });
  const modal = document.getElementById("imageModal");
  const carrosselImagens = document.getElementById("modalCarrosselImagens");
  const carrosselDots = document.getElementById("modalCarrosselDots");
  const prevButton = document.getElementById("modalPrev");
  const nextButton = document.getElementById("modalNext");
  const modalClose = document.getElementById("modal-close");

  if (!modal || !carrosselImagens || !carrosselDots || !prevButton || !nextButton || !modalClose) {
    console.error("Elementos do modal não encontrados:", {
      modal: !!modal,
      carrosselImagens: !!carrosselImagens,
      carrosselDots: !!carrosselDots,
      prevButton: !!prevButton,
      nextButton: !!nextButton,
      modalClose: !!modalClose
    });
    return;
  }

  const produto = allProducts[index];
  if (!produto) {
    console.warn(`Produto no índice ${index} não encontrado`);
    return;
  }

  currentImages = Array.isArray(produto.imagens) && produto.imagens.length > 0 && produto.imagens.some(isValidImageUrl)
    ? produto.imagens.filter(isValidImageUrl)
    : [PLACEHOLDER_IMAGE];
  currentImageIndex = imageIndex >= 0 && imageIndex < currentImages.length ? imageIndex : 0;

  console.log('Imagens no modal:', currentImages);
  carrosselImagens.innerHTML = currentImages.map((img, idx) => `
    <img src="${img}" alt="${produto.nome} - Imagem ${idx + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
  `).join("");
  carrosselDots.innerHTML = currentImages.map((_, idx) => `
    <span class="carrossel-dot ${idx === currentImageIndex ? "ativo" : ""}" data-modal-image-index="${idx}" role="button" aria-label="Selecionar imagem ${idx + 1}"></span>
  `).join("");

  carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
  modal.classList.add("active");

  const prevClone = prevButton.cloneNode(true);
  const nextClone = nextButton.cloneNode(true);
  const closeClone = modalClose.cloneNode(true);
  prevButton.replaceWith(prevClone);
  nextButton.replaceWith(nextClone);
  modalClose.replaceWith(closeClone);

  prevClone.addEventListener('click', () => moveModalCarrossel(-1));
  nextClone.addEventListener('click', () => moveModalCarrossel(1));
  closeClone.addEventListener('click', () => {
    console.log('Fechando modal');
    modal.classList.remove("active");
  });

  carrosselDots.querySelectorAll('.carrossel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.modalImageIndex);
      setModalImage(idx);
    });
  });

  document.addEventListener('keydown', handleEscape, { once: true });
}

// Função para fechar modais com a tecla Escape
function handleEscape(event) {
  const modal = document.getElementById("imageModal");
  const cookieModal = document.getElementById("cookie-modal");
  if (event.key === 'Escape') {
    if (modal && modal.classList.contains('active')) {
      console.log('Modal de imagens fechado via ESC');
      modal.classList.remove('active');
    }
    if (cookieModal && cookieModal.style.display === 'flex') {
      console.log('Modal de cookies fechado via ESC');
      cookieModal.style.display = 'none';
    }
  }
}

// Função para mover o carrossel de produtos
function moveCarrossel(id, direction) {
  const carrossel = document.getElementById(id);
  if (!carrossel) return;
  const imagens = carrossel.querySelector(".carrossel-imagens");
  const dots = carrossel.querySelectorAll(".carrossel-dot");
  let index = parseInt(imagens.dataset.index || 0);
  const total = imagens.children.length;
  index = (index + direction + total) % total;
  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
}

// Função para definir uma imagem específica no carrossel
function setCarrosselImage(id, index) {
  const carrossel = document.getElementById(id);
  if (!carrossel) return;
  const imagens = carrossel.querySelector(".carrossel-imagens");
  const dots = carrossel.querySelectorAll(".carrossel-dot");
  imagens.style.transform = `translateX(-${index * 100}%)`;
  imagens.dataset.index = index;
  dots.forEach((dot, i) => dot.classList.toggle("ativo", i === index));
}

// Função para mover o carrossel do modal
function moveModalCarrossel(direction) {
  currentImageIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
  const carrosselImagens = document.getElementById("modalCarrosselImagens");
  const carrosselDots = document.getElementById("modalCarrosselDots");
  if (carrosselImagens && carrosselDots) {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    carrosselDots.querySelectorAll(".carrossel-dot").forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
  }
}

// Função para definir uma imagem específica no modal
function setModalImage(index) {
  currentImageIndex = index;
  const carrosselImagens = document.getElementById("modalCarrosselImagens");
  const carrosselDots = document.getElementById("modalCarrosselDots");
  if (carrosselImagens && carrosselDots) {
    carrosselImagens.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    carrosselDots.querySelectorAll(".carrossel-dot").forEach((dot, i) => dot.classList.toggle("ativo", i === currentImageIndex));
  }
}

// Função para atualizar controles de paginação
function updatePaginationControls(total) {
  const paginationControls = document.getElementById("pagination-controls");
  if (!paginationControls) return;

  const totalPages = Math.ceil(total / productsPerPage);
  paginationControls.innerHTML = '';

  if (totalPages <= 1) return;

  const prevButton = document.createElement("button");
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.classList.add("pagination-btn");
  prevButton.disabled = currentPage === 1;
  prevButton.setAttribute("aria-label", "Página anterior");
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      carregarProdutos(currentCategory, currentStore, currentPage);
    }
  });

  const maxButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  const pageButtons = [];
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("pagination-number");
    if (i === currentPage) {
      pageButton.classList.add("active");
      pageButton.setAttribute("aria-current", "page");
    }
    pageButton.setAttribute("aria-label", `Ir para página ${i}`);
    pageButton.addEventListener("click", () => {
      currentPage = i;
      carregarProdutos(currentCategory, currentStore, currentPage);
    });
    pageButtons.push(pageButton);
  }

  const nextButton = document.createElement("button");
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.classList.add("pagination-btn");
  nextButton.disabled = currentPage === totalPages;
  nextButton.setAttribute("aria-label", "Próxima página");
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      carregarProdutos(currentCategory, currentStore, currentPage);
    }
  });

  paginationControls.appendChild(prevButton);
  pageButtons.forEach(button => paginationControls.appendChild(button));
  paginationControls.appendChild(nextButton);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initCookieBanner();

  const categoriesToggle = document.getElementById('categories-toggle');
  const closeSidebar = document.getElementById('close-sidebar');
  const sidebar = document.getElementById('categories-sidebar');
  const overlay = document.getElementById('overlay');
  const buscaInput = document.getElementById('busca');
  const buscaBtn = document.querySelector('.search-btn');
  const resetFilters = document.querySelector('.reset-filters');
  const retryLoad = document.querySelector('.retry-load');

  if (!categoriesToggle || !closeSidebar || !sidebar || !overlay || !buscaInput || !buscaBtn || !resetFilters || !retryLoad) {
    console.error('Elementos do DOM não encontrados:', {
      categoriesToggle: !!categoriesToggle,
      closeSidebar: !!closeSidebar,
      sidebar: !!sidebar,
      overlay: !!overlay,
      buscaInput: !!buscaInput,
      buscaBtn: !!buscaBtn,
      resetFilters: !!resetFilters,
      retryLoad: !!retryLoad
    });
    return;
  }

  categoriesToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });

  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentCategory = item.dataset.categoria;
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore);
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  });

  document.querySelectorAll('.store-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentStore = card.dataset.loja;
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore);
    });
  });

  buscaBtn.addEventListener('click', () => {
    currentSearch = buscaInput.value.trim();
    currentPage = 1;
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
  });

  buscaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      currentSearch = buscaInput.value.trim();
      currentPage = 1;
      carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
    }
  });

  resetFilters.addEventListener('click', (e) => {
    e.preventDefault();
    currentCategory = 'todas';
    currentStore = 'todas';
    currentSearch = '';
    currentPage = 1;
    buscaInput.value = '';
    document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.category-item[data-categoria="todas"]').classList.add('active');
    document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active'));
    document.querySelector('.store-card[data-loja="todas"]').classList.add('active');
    carregarProdutos(currentCategory, currentStore);
  });

  retryLoad.addEventListener('click', (e) => {
    e.preventDefault();
    carregarProdutos(currentCategory, currentStore, currentPage, currentSearch);
  });

  carregarProdutos();
  socket.on('newProduct', () => {
    if (currentCategory === 'todas' && currentStore === 'todas' && !currentSearch) {
      carregarProdutos();
    }
  });
});

// Atualizar ano no footer
document.getElementById('year').textContent = new Date().getFullYear();
