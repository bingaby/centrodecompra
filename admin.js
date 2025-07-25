import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const db = window.firebaseDb;
const storage = getStorage();

const form = document.getElementById("produto-form");
const loadingSpinner = document.getElementById("loading-spinner");
const feedback = document.getElementById("form-feedback");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  feedback.textContent = "";
  loadingSpinner.style.display = "block";

  const nome = form.nome.value.trim();
  const descricao = form.descricao.value.trim();
  const categoria = form.categoria.value;
  const loja = form.loja.value;
  const link = form.link.value.trim();
  const preco = parseFloat(form.preco.value);
  const imagens = form.imagens.files;

  if (!nome || !descricao || !categoria || !loja || !link || isNaN(preco)) {
    feedback.textContent = "Por favor, preencha todos os campos corretamente.";
    loadingSpinner.style.display = "none";
    return;
  }

  if (imagens.length > 5) {
    feedback.textContent = "Você pode enviar no máximo 5 imagens.";
    loadingSpinner.style.display = "none";
    return;
  }

  try {
    // Upload das imagens para Storage e pegar URLs
    const urls = [];
    for (let i = 0; i < imagens.length; i++) {
      const file = imagens[i];
      const storageRef = ref(storage, `produtos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }

    // Salvar produto no Firestore
    await addDoc(collection(db, "produtos"), {
      nome,
      descricao,
      categoria,
      loja,
      link,
      preco,
      imagemUrls: urls,
      createdAt: serverTimestamp(),
    });

    feedback.style.color = "green";
    feedback.textContent = "Produto salvo com sucesso!";
    form.reset();
  } catch (error) {
    console.error(error);
    feedback.style.color = "red";
    feedback.textContent = "Erro ao salvar produto: " + error.message;
  } finally {
    loadingSpinner.style.display = "none";
  }
});

