/* Reset básico */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
}

.site-header {
  text-align: center;
  padding: 20px;
  background: #f4f4f4;
}

.logo-container img {
  max-width: 150px;
}

nav {
  background: #333;
  padding: 10px;
  text-align: center;
}

nav a {
  color: #fff;
  margin: 0 15px;
  text-decoration: none;
}

.container {
  display: flex;
  max-width: 1200px;
  margin: 20px auto;
}

.sidebar-categorias {
  width: 250px;
  padding: 20px;
  background: #f9f9f9;
}

.sidebar-categorias h3 {
  margin-bottom: 10px;
}

.sidebar-categorias ul {
  list-style: none;
}

.categoria-item {
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
  margin-bottom: 5px;
}

.categoria-item.ativa {
  background: #FFA500;
  color: #fff;
}

main {
  flex: 1;
  padding: 20px;
}

.lojas-parceiras {
  margin-bottom: 20px;
}

.grid-lojas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}

.loja, .loja-todas {
  text-align: center;
  padding: 10px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.loja.ativa, .loja-todas.ativa {
  background: #FFA500;
  color: #fff;
}

.loja img {
  max-width: 50px;
}

.barra-busca {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.busca-feedback {
  display: none;
  color: #888;
  font-size: 0.9em;
}

.loading-spinner {
  display: none;
  text-align: center;
  font-size: 1.5em;
}

.grid-produtos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.produto-card {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.produto-card.visible {
  opacity: 1;
}

.carrossel {
  position: relative;
  overflow: hidden;
}

.carrossel-imagens {
  display: flex;
  transition: transform 0.3s ease;
}

.carrossel-imagens img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.carrossel-prev, .carrossel-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  padding: 10px;
  cursor: pointer;
}

.carrossel-prev {
  left: 0;
}

.carrossel-next {
  right: 0;
}

.carrossel-dots {
  text-align: center;
  padding: 10px 0;
}

.carrossel-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: #ddd;
  border-radius: 50%;
  margin: 0 5px;
  cursor: pointer;
}

.carrossel-dot.ativo {
  background: #FFA500;
}

.favoritar {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}

.favoritar.favorito {
  color: #FFD700;
}

.ver-na-loja {
  background: #FFA500;
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
}

.mensagem-vazia {
  display: none;
  text-align: center;
  color: #888;
}

.whatsapp, .telegram {
  display: block;
  text-align: center;
  margin: 10px 0;
  color: #333;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.social-links a {
  text-decoration: none;
  color: #333;
}

.social-links img {
  width: 30px;
}

footer {
  text-align: center;
  padding: 20px;
  background: #f4f4f4;
}

.robo-assistente {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #25D366;
  border-radius: 50%;
  padding: 10px;
}

.robo-assistente img {
  width: 50px;
  border-radius: 50%;
}

.robo-texto {
  color: #fff;
  font-size: 0.8em;
}