# Painel Admin - Centro de Compras

Este arquivo `admin.js` é um script JavaScript para o painel admin de cadastro de produtos.

## Como usar

1. Coloque o arquivo `admin.js` na raiz do seu projeto (mesmo local do HTML admin-xyz-123.html).
2. Certifique-se que seu HTML importa o Firebase e inicializa o app (como no exemplo fornecido).
3. No HTML, insira a linha para importar este script:

```html
<script defer src="/admin.js"></script>
```

4. O formulário com id `produto-form` será usado para enviar produtos, fazer upload das imagens para Firebase Storage, e salvar os dados no Firestore.
5. Limite de até 5 imagens por produto.
6. Mensagens de feedback e loading são exibidas automaticamente.

---

Para dúvidas ou problemas, me pergunte!