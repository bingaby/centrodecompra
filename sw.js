body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #fff;
  color: #333;
}header {
  background-color: #FFA500;
  color: white;
  padding: 20px;
  text-align: center;
}nav {
  background-color: #2E8B57;
  color: white;
  padding: 10px;
  text-align: center;
}nav a {
  color: white;
  text-decoration: none;
  margin: 0 15px;
  font-weight: bold;
}nav a:focus {
  outline: 2px solid #FFA500;
}.container {
  display: flex;
  max-width: 1200px;
  margin: auto;
  padding: 20px;
  gap: 20px;
  background-color: #fff;
}.sidebar-categorias {
  width: 200px;
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  position: sticky;
  top: 20px;
  align-self: start;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.3s ease;
}.sidebar-categorias:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}.sidebar-categorias h3 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #444;
  text-align: center;
}.sidebar-categorias ul {
  list-style: none;
  padding: 0;
  margin: 0;
}.categoria-item {
  padding: 10px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
}.categoria-item:hover {
  background-color: #f0f0f0;
  color: #000;
  transform: translateX(5px);
}.categoria-item.ativa {
  background-color: #fff9e6;
  color: #FFA500;
  font-weight: bold;
  box-shadow: inset 0 0 5px rgba(255, 165, 0, 0.3);
}main {
  flex: 1;
  max-width: 1000px;
  background-color: #fff;
}section {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 5px;
  border: 1px solid #e0e0e0;
}h1, h2, h3 {
  color: #444;
  transition: color 0.3s ease;
}.grid-lojas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 20px;
  align-items: center;
  justify-items: center;
}.loja {
  text-align: center;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.3s, border 0.3s;
}.loja.ativa {
  background-color: #fff9e6;
  border: 2px solid #FFA500;
  border-radius: 5px;
  padding: 5px;
}.loja img {
  width: auto;
  max-height: 60px;
  object-fit: contain;
  background: transparent;
}.loja span {
  margin-top: 8px;
  display: block;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.3s, font-weight 0.3s;
}.loja span:hover {
  font-weight: bold;
  transform: scale(1.05);
}.loja-todas {
  text-align: center;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, border 0.3s;
}.loja-todas.ativa {
  background-color: #fff9e6;
  border: 2px solid #FFA500;
}.loja-todas span {
  font-weight: 600;
  font-size: 14px;
}.mercadolivre { color: #2D3277; }
.amazon { color: #232F3E; }
.magalu { color: #ED008C; }
.shein { color: #000000; }
.shopee { color: #FF5722; }
.alibaba { color: #E02020; }.whatsapp, .telegram {
  display: inline-block;
  margin: 15px 10px 30px;
  text-decoration: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
}.whatsapp {
  background-color: #25D366;
}.telegram {
  background-color: #0088cc;
}.telegram:hover {
  background-color: #007ab8;
}.social-links {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}.social-links a {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  background-color: transparent;
  border: none;
}.social-links a .icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}.social-links a:hover .icon {
  background-color: #ccc;
}.social-links a img {
  width: 24px;
  height: 24px;
}.social-links a span {
  margin-top: 6px;
  font-size: 14px;
  color: #333;
  font-weight: normal;
  transition: color 0.3s, font-weight 0.3s;
}.social-links a:hover span {
  color: #000;
  font-weight: bold;
}footer {
  background-color: #2E8B57;
  color: white;
  text-align: center;
  padding: 15px;
  margin-top: 40px;
}#grid-produtos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px 0;
}.produto-card {
  background-color: #fff;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  text-decoration: none;
  border: 1px solid #e0e0e0;
  transition: transform 0.2s, opacity 0.5s ease;
  font-size: 14px;
  opacity: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}.produto-card.visible {
  opacity: 1;
}.produto-card:hover {
  transform: scale(1.03);
}.produto-card img {
  max-height: 100px;
  width: auto;
  object-fit: contain;
  margin: 0 auto;
  cursor: pointer; /* Indica que a imagem é clicável */
}.produto-card span {
  display: block;
  font-weight: 500;
  color: #333;
  margin: 5px 0;
}.produto-card .descricao {
  color: #666;
  font-size: 12px;
  margin: 5px 0;
}.ver-na-loja {
  margin-top: 10px;
  padding: 8px 16px;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  text-decoration: none;
  display: inline-block;
}.ver-na-loja.amazon {
  background-color: #FF9900;
}
.ver-na-loja.amazon:hover {
  background-color: #E68A00;
}.ver-na-loja.mercadolivre {
  background-color: #FFE600;
  color: #333;
}
.ver-na-loja.mercadolivre:hover {
  background-color: #E6CD00;
}.ver-na-loja.magalu {
  background-color: #ED008C;
}
.ver-na-loja.magalu:hover {
  background-color: #CC007A;
}.ver-na-loja.shein {
  background-color: #000000;
}
.ver-na-loja.shein:hover {
  background-color: #333333;
}.ver-na-loja.shopee {
  background-color: #FF5722;
}
.ver-na-loja.shopee:hover {
  background-color: #E64A1C;
}.ver-na-loja.alibaba {
  background-color: #E02020;
}
.ver-na-loja.alibaba:hover {
  background-color: #CC1B1B;
}.favoritar {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #FFA500;
}.favoritar.favorito {
  color: #FF4500;
}.carrossel {
  position: relative;
  width: 100%;
  height: 100px;
  margin-bottom: 8px;
  overflow: hidden;
}.carrossel-imagens {
  display: flex;
  transition: transform 0.3s ease;
  height: 100%;
}.carrossel-imagens img {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
}.carrossel-prev, .carrossel-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 50%;
}.carrossel-prev {
  left: 5px;
}.carrossel-next {
  right: 5px;
}.carrossel-dots {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}.carrossel-dot {
  width: 8px;
  height: 8px;
  background-color: #bbb;
  border-radius: 50%;
  cursor: pointer;
}.carrossel-dot.ativo {
  background-color: #FFA500;
}.site-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #FFA500;
  color: white;
  padding: 20px;
  text-align: center;
}.logo-container img {
  max-width: 120px;
  height: auto;
  margin-bottom: 10px;
}.header-text h1 {
  margin: 0;
  font-size: 2em;
  font-weight: bold;
}.header-text p {
  margin: 5px 0 0;
  font-size: 1.2em;
}.barra-busca {
  width: 100%;
  max-width: 500px;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px;
}.busca-feedback {
  display: none;
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}.mensagem-vazia {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin: 20px 0;
  display: none;
}.loading-spinner {
  display: none;
  text-align: center;
  margin: 20px 0;
}.loading-spinner::after {
  content: '';
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #FFA500;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}.robo-assistente {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  text-align: center;
  transition: transform 0.3s ease;
  animation: pulsar 2s infinite;
}@keyframes pulsar {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}.robo-assistente:hover {
  transform: scale(1.1);
}.robo-imagem {
  width: 80px;
  height: auto;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  background: transparent;
}.robo-texto {
  display: none;
  background-color: #FFA500;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  max-width: 200px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease, opacity 0.3s ease;
}.robo-assistente:hover .robo-texto {
  display: block;
  background-color: #FF8C00;
}@media (max-width: 768px) {
  .container {
    flex-direction: column;
    background-color: #fff;
  }  .sidebar-categorias {
    position: static;
    width: 100%;
    margin-bottom: 0;
    padding: 10px;
    border: none;
    background-color: #f9f9f9;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }  .sidebar-categorias h3 {
    display: none;
  }  .sidebar-categorias ul {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    width: 100%;
  }  .categoria-item {
    flex: 1 1 auto;
    text-align: center;
    padding: 8px 12px;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }  main {
    width: 100%;
  }  .grid-lojas {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }  #grid-produtos {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }  .robo-imagem {
    width: 60px;
  }  .robo-texto {
    font-size: 12px;
    max-width: 150px;
    padding: 6px 10px;
  }  .robo-assistente {
    bottom: 10px;
    right: 10px;
  }
}

