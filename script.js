// Função para copiar o código do cupom ao clicar (opcional)
document.querySelectorAll('.cupom a').forEach(button => {
    button.addEventListener('click', () => {
        const code = button.previousElementSibling.querySelector('strong').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Código ' + code + ' copiado!');
        });
    });
});
