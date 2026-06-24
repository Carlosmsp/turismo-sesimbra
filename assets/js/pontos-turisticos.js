// constrói e injeta os links de navegação no elemento #navLinks
function addNavLinks(){
    if (!navLinks) return;

    navLinks.setAttribute("aria-label", "Navegação principal");

    const elemUl = document.createElement("ul")
    const paginaAtual = window.location.pathname.split("/").pop() || "sesimbra.html";

    for (const l of links){
        const elemLi = document.createElement("li")
        const elemA = document.createElement("a")
        elemA.textContent = l.texto;
        elemA.href = l.href;
        // marca o link da página atual como ativo para destaque visual e acessibilidade
        if (l.href === paginaAtual) {
            elemA.classList.add("ativo");
            elemA.setAttribute("aria-current", "page");
        }
        elemLi.appendChild(elemA)
        elemUl.appendChild(elemLi)
    }
    navLinks.appendChild(elemUl)

    // move o botão de dark mode para dentro da barra de navegação para que
    // fique sempre fixo nela em vez de flutuar sobre o conteúdo ao fazer scroll
    if (darkModeBotao) {
        navLinks.appendChild(darkModeBotao);
    }
}

// limpa e volta a renderizar os cards de pontos turísticos com os dados filtrados
function addPontosTuristicos() {
    if (!pontoCard) return;

    pontoCard.replaceChildren();
    const limite = Number.parseInt(pontoCard.dataset.limite || "", 10);
    const pontosVisiveis = Number.isFinite(limite)
        ? pontosFiltrados.slice(0, limite)
        : pontosFiltrados;
    const mostrarEventos = pontoCard.dataset.mostrarEventos !== "false";

    for (const ponto of pontosVisiveis) {
        const elemento = criaPonto(ponto, { mostrarEventos });
        pontoCard.appendChild(elemento);
    }
}

// cria o artigo html de um ponto turístico, incluindo alerta e eventos se existirem
function criaPonto(p, opcoes = {}) {
    const mostrarEventos = opcoes.mostrarEventos !== false;
    const elemArt = document.createElement("article");

    const elemImg = document.createElement("img");
    elemImg.src = p.image;
    elemImg.alt = p.altImage;
    elemImg.loading = "lazy";
    elemArt.setAttribute("aria-label", p.title);
    prepararImagemAmpliavel(elemImg);

    const elemH3 = document.createElement("h3");
    elemH3.textContent = p.title;
    elemH3.title = p.title;

    const elemP = document.createElement("p");
    elemP.textContent = p.description;
    elemP.title = p.description;

    elemArt.appendChild(elemImg);
    elemArt.appendChild(elemH3);
    elemArt.appendChild(elemP);

    // adiciona bloco de alerta e lista de eventos se o ponto os tiver definidos
    if (p.note || (mostrarEventos && p.events && p.events.length > 0)) {
        const alertWrapper = document.createElement("div");
        alertWrapper.classList.add("alert-popover");

        if (p.note) {
            const elemDestaque = document.createElement("p");
            elemDestaque.classList.add("destaque");
            elemDestaque.textContent = p.note;
            alertWrapper.appendChild(elemDestaque);
        }

        if (mostrarEventos && p.events && p.events.length > 0) {
            const eventosContainer = document.createElement("div");
            eventosContainer.classList.add("eventos-popup");
            const eventosTitulo = document.createElement("h4");
            eventosTitulo.textContent = "Eventos no local:";
            eventosContainer.appendChild(eventosTitulo);

            const eventosLista = document.createElement("ul");
            for (const evento of p.events) {
                const eventoItem = document.createElement("li");
                const tituloEvento = document.createElement("strong");
                tituloEvento.textContent = evento.title;
                eventoItem.appendChild(tituloEvento);
                eventoItem.append(` (${evento.date}) — ${evento.description}`);
                eventosLista.appendChild(eventoItem);
            }
            eventosContainer.appendChild(eventosLista);
            alertWrapper.appendChild(eventosContainer);
        }

        elemArt.appendChild(alertWrapper);
    }

    return elemArt;
}
