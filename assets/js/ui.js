// ui.js — utilitários de interface partilhados por todas as páginas:
// dark mode, proteção de links externos e formatação de texto para HTML

// alterna entre dark mode e light mode e guarda a preferência no localstorage
function darkModeToggle(){
    document.body.classList.toggle("darkMode");
    const isDarkMode = document.body.classList.contains("darkMode");
    localStorage.setItem("darkMode", isDarkMode);
    atualizarBotaoDarkMode();
}

// ao carregar a página, aplica o dark mode se o utilizador o tinha ativado antes
function carregarDarkMode() {
    const darkModePref = localStorage.getItem("darkMode");
    if (darkModePref === "true") {
        document.body.classList.add("darkMode");
    }
    atualizarBotaoDarkMode();
}

// atualiza o ícone, o label e o title do botão conforme o estado atual do dark mode
function atualizarBotaoDarkMode() {
    if (!darkModeBotao) return;

    const isDarkMode = document.body.classList.contains("darkMode");
    darkModeBotao.textContent = isDarkMode ? "☼" : "⏾";
    darkModeBotao.type = "button";
    darkModeBotao.setAttribute("aria-label", isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro");
    darkModeBotao.setAttribute("aria-pressed", String(isDarkMode));
    darkModeBotao.title = isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro";
}

// garante que os links externos têm rel="noopener noreferrer" por segurança
function protegerLinksExternos() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
        link.rel = "noopener noreferrer";
    });
}

// escapa caracteres especiais html para evitar injeção de código
function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// converte a resposta do assistente de markdown básico para html legível no browser
function formatarMensagemAssistente(texto) {
    return escaparHtml(texto)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/^\s*\*\s+/gm, "- ")
        .replace(/#{1,6}\s*/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\n/g, "<br>");
}
