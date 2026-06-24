let imagemOverlayOrigem = null;

function fecharOverlayImagem() {
    const overlay = document.querySelector(".overlay");
    if (!overlay) return;

    overlay.remove();
    document.body.classList.remove("overlay-aberto");
    imagemOverlayOrigem?.focus();
    imagemOverlayOrigem = null;
}

// cria e mostra o overlay com a imagem ampliada ao clicar
function ampliarImagem(imagem) {
    fecharOverlayImagem();

    const overlay = document.createElement("div");
    const imagemGrande = document.createElement("img");
    const fechar = document.createElement("button");

    overlay.classList.add("overlay");
    imagemGrande.classList.add("overlay-img");
    fechar.classList.add("overlay-fechar");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", `Imagem ampliada: ${imagem.alt || "imagem"}`);
    overlay.tabIndex = -1;

    imagemGrande.src = imagem.src;
    imagemGrande.alt = imagem.alt;
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar imagem ampliada");
    fechar.textContent = "×";

    overlay.appendChild(imagemGrande);
    overlay.appendChild(fechar);

    // fecha ao clicar fora da imagem
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) fecharOverlayImagem();
    });
    fechar.addEventListener("click", fecharOverlayImagem);
    overlay.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            event.preventDefault();
            fecharOverlayImagem();
            return;
        }
        if (event.key === "Tab") {
            event.preventDefault();
            fechar.focus();
        }
    });

    imagemOverlayOrigem = imagem;
    document.body.appendChild(overlay);
    document.body.classList.add("overlay-aberto");
    fechar.focus();
}

// fecha o overlay quando o utilizador prime a tecla escape
function fecharOverlayComEsc(event) {
    if (event.key !== "Escape") return;

    fecharOverlayImagem();
}

// adiciona o comportamento de ampliar a uma imagem (clique e teclado)
function prepararImagemAmpliavel(imagem) {
    if (imagem.getAttribute("role") === "button") return;

    imagem.tabIndex = 0;
    imagem.setAttribute("role", "button");
    imagem.setAttribute("aria-label", `Ampliar imagem: ${imagem.alt || "imagem"}`);
    imagem.addEventListener("click", function () {
        ampliarImagem(this);
    });
    imagem.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            ampliarImagem(this);
        }
    });
}

// ativa o comportamento de ampliar em todas as imagens estáticas dos cards
function ativarImagensEstaticas() {
    document.querySelectorAll('.card img:not([role="button"])').forEach(prepararImagemAmpliavel);
}
