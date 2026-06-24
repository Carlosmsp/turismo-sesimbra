// cards.js — constrói e renderiza dinamicamente os cards HTML de cada secção:
// atividades, alojamentos, pontos turísticos e gastronomia;
// inclui filtros por categoria/texto e utilitários de avaliação e links externos

// ícone genérico de site (globo)
const ICONE_GLOBO = `
    <svg class="card-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M3 12h18"></path>
        <path d="M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9"></path>
        <path d="M12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9"></path>
    </svg>
`;

// ícone da marca do Facebook
const ICONE_FACEBOOK = `
    <svg class="card-link-icon-brand" viewBox="8 5 9 14" aria-hidden="true" focusable="false">
        <path fill="#ffffff" d="M14.5 8.5h1.7V6.1h-1.9c-2 0-3.2 1.2-3.2 3.2v1.5H9v2.5h2.1V18h2.6v-4.7h2l.4-2.5h-2.4V9.3c0-.6.3-.8.8-.8z"></path>
    </svg>
`;

// escolhe o ícone do link de site com base no link: marca do Facebook se apontar para facebook.com, globo genérico caso contrário
function iconeLinkSite(url) {
    const urlMinuscula = (url || "").toLowerCase();
    return urlMinuscula.includes("facebook") ? ICONE_FACEBOOK : ICONE_GLOBO;
}

// escolhe o texto/título do link de site com base no link
function tituloLinkSite(url) {
    const urlMinuscula = (url || "").toLowerCase();
    return urlMinuscula.includes("facebook") ? "Página de Facebook" : "Site oficial";
}

// mapa de categorias de atividades para texto legível em português
const categoriaTextos = { agua: "Água", natureza: "Natureza", aventura: "Aventura", cultura: "Cultura" };

let categoriaAtiva = "todos";
let pesquisaAtividade = "";

const inputActividadesFiltro = document.getElementById("inputActividadesFiltro");
const actividadesResultado = document.getElementById("actividadesResultado");
const btnsCategorias = document.querySelectorAll(".btn-categoria");

// filtra atividades em tempo real ao escrever no campo de pesquisa
if (inputActividadesFiltro) {
    inputActividadesFiltro.addEventListener("input", function () {
        pesquisaAtividade = this.value.toLowerCase();
        atualizarAtividades();
    });
}

// ao clicar num botão de categoria, marca-o como ativo e refiltrar
btnsCategorias.forEach(btn => {
    btn.addEventListener("click", function () {
        btnsCategorias.forEach(b => {
            b.classList.remove("ativo");
            b.setAttribute("aria-pressed", "false");
        });
        this.classList.add("ativo");
        this.setAttribute("aria-pressed", "true");
        categoriaAtiva = this.dataset.categoria;
        atualizarAtividades();
    });
});

// devolve as atividades que passam no filtro de categoria e de texto
function filtrarAtividades() {
    return actividadesLista.filter(a => {
        const matchCategoria = categoriaAtiva === "todos" || a.categoria === categoriaAtiva;
        const matchPesquisa = pesquisaAtividade === "" ||
            a.title.toLowerCase().includes(pesquisaAtividade) ||
            a.description.toLowerCase().includes(pesquisaAtividade);
        return matchCategoria && matchPesquisa;
    });
}

// ponto de entrada para renderizar as atividades
function addActividades() {
    atualizarAtividades();
}

// devolve o html do ícone svg para uma atividade (usa "compass" se não existir no mapa)
function iconeAtividadeSvg(atividade) {
    const nomeIcone = atividade.icone || "compass";
    return `<i class="ph ph-${nomeIcone}" aria-hidden="true"></i>`;
}

// atualiza o contador de resultados e re-renderiza os cards de atividades
function atualizarAtividades() {
    if (!actividadeCard) return;

    const filtradas = filtrarAtividades();

    if (actividadesResultado) {
        const n = filtradas.length;
        actividadesResultado.textContent = `${n} atividade${n !== 1 ? "s" : ""} encontrada${n !== 1 ? "s" : ""}`;
    }

    actividadeCard.replaceChildren();

    if (filtradas.length === 0) {
        const semResultados = document.createElement("p");
        semResultados.classList.add("sem-resultados");
        semResultados.textContent = "Nenhuma atividade encontrada.";
        actividadeCard.appendChild(semResultados);
        return;
    }

    filtradas.forEach((actividade, i) => {
        const elem = criaActividade(actividade);
        // pequeno atraso de entrada para animação visual escalonada
        elem.style.animationDelay = `${i * 0.05}s`;
        actividadeCard.appendChild(elem);
    });
}

// cria o artigo html de uma atividade com ícone, badge de categoria e links
function criaActividade(p) {
    const elemArt = document.createElement("article");
    elemArt.dataset.categoria = p.categoria;

    const elemIcone = document.createElement("span");
    elemIcone.classList.add("atividade-icone");
    elemIcone.setAttribute("aria-hidden", "true");
    elemIcone.innerHTML = iconeAtividadeSvg(p);

    const elemHeader = document.createElement("div");
    elemHeader.classList.add("atividade-header");

    const elemH3 = document.createElement("h3");
    elemH3.textContent = p.title;
    elemH3.title = p.title;

    const elemBadge = document.createElement("span");
    elemBadge.classList.add("categoria-badge", `categoria-${p.categoria}`);
    elemBadge.textContent = categoriaTextos[p.categoria] || p.categoria;

    elemHeader.appendChild(elemH3);
    elemHeader.appendChild(elemBadge);

    const elemP = document.createElement("p");
    elemP.textContent = p.description;
    elemP.title = p.description;

    const elemUl = document.createElement("ul");
    for (const l of p.links) {
        const elemLi = document.createElement("li");
        const elemA = document.createElement("a");
        elemA.textContent = l.name;
        elemA.href = l.url;
        elemA.target = "_blank";
        elemA.rel = "noopener noreferrer";
        elemLi.appendChild(elemA);
        elemUl.appendChild(elemLi);
    }

    elemArt.appendChild(elemIcone);
    elemArt.appendChild(elemHeader);
    elemArt.appendChild(elemP);
    if (elemUl.children.length) elemArt.appendChild(elemUl);

    if (p.siteUrl) {
        const elemActions = document.createElement("div");
        elemActions.classList.add("card-actions");
        elemActions.style.justifyContent = "flex-end";
        const elemLinkSite = document.createElement("a");
        elemLinkSite.innerHTML = iconeLinkSite(p.siteUrl);
        elemLinkSite.href = p.siteUrl;
        elemLinkSite.target = "_blank";
        elemLinkSite.rel = "noopener noreferrer";
        elemLinkSite.classList.add("card-link", "card-link-site");
        elemLinkSite.title = tituloLinkSite(p.siteUrl);
        elemActions.appendChild(elemLinkSite);
        elemArt.appendChild(elemActions);
    }

    return elemArt;
}

const inputAlojamentosFiltro = document.getElementById("inputAlojamentosFiltro");
const alojamentosResultado = document.getElementById("alojamentosResultado");

// filtra alojamentos em tempo real ao escrever no campo de pesquisa
if (inputAlojamentosFiltro) {
    inputAlojamentosFiltro.addEventListener("input", addHospedagem);
}

// devolve os alojamentos que correspondem ao texto pesquisado (nome ou descrição)
function filtrarHospedagem() {
    if (!inputAlojamentosFiltro) return hospedagemLista;
    const filtro = inputAlojamentosFiltro.value.toLowerCase();
    return hospedagemLista.filter(h =>
        h.title.toLowerCase().includes(filtro) ||
        h.description.toLowerCase().includes(filtro)
    );
}

// renderiza todos os alojamentos na grelha de hospedagem
function addHospedagem() {
    if (!hospedagemCard) return;

    const filtrados = filtrarHospedagem();
    hospedagemCard.replaceChildren();

    if (alojamentosResultado) {
        const n = filtrados.length;
        alojamentosResultado.textContent = `${n} alojamento${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}`;
    }

    if (filtrados.length === 0) {
        const semResultados = document.createElement("p");
        semResultados.classList.add("sem-resultados");
        semResultados.textContent = "Nenhum alojamento encontrado.";
        hospedagemCard.appendChild(semResultados);
        return;
    }

    for (const hospedagem of filtrados) {
        const elemento = criaHospedagem(hospedagem);
        hospedagemCard.appendChild(elemento);
    }
}

// remove estrelas e sufixos do nome do hotel para usar em pesquisas externas
function normalizeHotelTitle(title) {
    return title.replace(/★+/g, '').replace(/\s+\*+.*$/, '').trim();
}

// identifica a plataforma de reserva a partir do link, para rotular corretamente a avaliação
function detetarPlataformaAlojamento(url) {
    const urlMinuscula = (url || "").toLowerCase();
    if (urlMinuscula.includes("booking")) return "Booking";
    if (urlMinuscula.includes("airbnb")) return "Airbnb";
    return null;
}

// cria o elemento de avaliação google para alojamentos (link ou span conforme disponível)
function criarAvaliacaoGoogleCompacta(item, opcoes = {}) {
    const nomeOrigem = opcoes.origem || "Google";
    const linkUrl = opcoes.linkUrl !== undefined ? opcoes.linkUrl : item.googleMapsUrl;
    const escala = opcoes.escala || 5;

    const rating = Number(opcoes.rating !== undefined ? opcoes.rating : item.googleRating);
    const temRating = Number.isFinite(rating);
    const temLink = Boolean(linkUrl);

    if (!temRating && !temLink) return null;

    const elem = document.createElement(temLink ? "a" : "span");
    elem.classList.add("google-rating-compacto");
    elem.setAttribute(
        "aria-label",
        temRating ? `Avaliação ${nomeOrigem} ${rating.toFixed(1)} de ${escala}` : `Ver avaliações no ${nomeOrigem}`
    );

    if (temLink) {
        elem.href = linkUrl;
        elem.target = "_blank";
        elem.rel = "noopener noreferrer";
        elem.title = temRating ? `Ver no ${nomeOrigem}` : `Ver avaliações no ${nomeOrigem}`;
    }

    const origem = document.createElement("span");
    origem.classList.add("google-rating-origem");
    origem.textContent = nomeOrigem;

    const valor = document.createElement("span");
    valor.classList.add("google-rating-valor");
    valor.textContent = temRating
        ? rating.toLocaleString("pt-PT", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })
        : "Avaliações";

    elem.appendChild(origem);
    elem.appendChild(valor);
    return elem;
}

// cria o artigo html de um alojamento com imagem, avaliação e links de reserva
function criaHospedagem(p) {
    const elemArt = document.createElement("article");

    const elemTopo = document.createElement("div");
    elemTopo.classList.add("alojamento-topo");

    const elemH3 = document.createElement("h3");
    const elemMedia = document.createElement("div");
    const elemImg = document.createElement("img");
    const elemP = document.createElement("p");
    const elemActions = document.createElement("div");
    const elemLinkSite = document.createElement("a");
    const elemLinkBooking = document.createElement("a");

    elemH3.textContent = p.title;
    elemH3.title = p.title;
    elemImg.src = `${p.image}?v=${versaoImagensHospedagem}`;
    elemImg.alt = p.altImage;
    elemImg.loading = "lazy";
    elemArt.setAttribute("aria-label", normalizeHotelTitle(p.title));
    prepararImagemAmpliavel(elemImg);
    elemP.textContent = p.description;
    elemP.title = p.description;

    const hotelName = normalizeHotelTitle(p.title);
    const siteUrl = p.siteUrl;
    const bookingUrl = p.bookingUrl;

    elemTopo.appendChild(elemH3);
    const plataformaReserva = detetarPlataformaAlojamento(bookingUrl);
    const elemRating = plataformaReserva
        ? criarAvaliacaoGoogleCompacta(p, { origem: plataformaReserva, linkUrl: bookingUrl, escala: plataformaReserva === "Airbnb" ? 5 : 10, rating: p.bookingRating })
        : null;
    elemMedia.classList.add("alojamento-media");
    elemMedia.appendChild(elemImg);
    if (elemRating) elemMedia.appendChild(elemRating);

    elemActions.classList.add("card-actions");
    if (siteUrl) {
        elemLinkSite.innerHTML = iconeLinkSite(siteUrl);
        elemLinkSite.href = siteUrl;
        elemLinkSite.target = "_blank";
        elemLinkSite.rel = "noopener noreferrer";
        elemLinkSite.classList.add("card-link", "card-link-site");
        elemLinkSite.setAttribute("aria-label", `Abrir site de ${hotelName}`);
        elemLinkSite.title = tituloLinkSite(siteUrl);
        elemActions.appendChild(elemLinkSite);
    }

    if (bookingUrl) {
        const iconeReserva = iconeLinkReserva(bookingUrl);
        const tituloReserva = textoLinkReserva(bookingUrl);
        if (iconeReserva) {
            elemLinkBooking.innerHTML = iconeReserva;
            elemLinkBooking.classList.add("card-link", "card-link-site");
            elemLinkBooking.setAttribute("aria-label", `Abrir reserva de ${hotelName}`);
            elemLinkBooking.title = tituloReserva;
        } else {
            elemLinkBooking.textContent = tituloReserva;
            elemLinkBooking.classList.add("card-link");
        }
        elemLinkBooking.href = bookingUrl;
        elemLinkBooking.target = "_blank";
        elemLinkBooking.rel = "noopener noreferrer";
        elemActions.appendChild(elemLinkBooking);
    }

    elemArt.appendChild(elemTopo);
    elemArt.appendChild(elemMedia);
    elemArt.appendChild(elemP);

    if (p.phone) {
        const elemContato = document.createElement("div");
        elemContato.classList.add("card-contact");
        const elemPhone = document.createElement("p");
        const elemPhoneLink = document.createElement("a");
        elemPhone.append("Tel: ");
        elemPhoneLink.href = `tel:${p.phone}`;
        elemPhoneLink.textContent = p.phone;
        elemPhoneLink.title = p.phone;
        elemPhone.appendChild(elemPhoneLink);
        elemContato.appendChild(elemPhone);
        elemArt.appendChild(elemContato);
    }

    if (elemActions.children.length) {
        elemArt.appendChild(elemActions);
    }
    return elemArt;
}

const pontosResultado = document.getElementById("pontosResultado");

// filtra os pontos turísticos pelo texto introduzido no campo de pesquisa
function filtrarPorNome() {
    if (!inputPontosFiltro) return pontosTuristicosLista;
    const filtro = inputPontosFiltro.value.toLowerCase();
    if (!filtro) return pontosTuristicosLista;
    return pontosTuristicosLista.filter((p) =>
        p.title.toLowerCase().includes(filtro) || p.description.toLowerCase().includes(filtro)
    );
}

// aplica os filtros ativos, atualiza a lista e o contador de resultados
function aplicarFiltros() {
    pontosFiltrados = filtrarPorNome();
    if (pontosResultado) {
        const n = pontosFiltrados.length;
        pontosResultado.textContent = `${n} ponto${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}`;
    }
}

if (inputPontosFiltro) {
    inputPontosFiltro.addEventListener("input", () => { aplicarFiltros(); addPontosTuristicos(); });
}

const gastroCard = document.getElementById("gastroCard");
const inputGastroFiltro = document.getElementById("inputGastroFiltro");
const gastronomiaResultado = document.getElementById("gastronomiaResultado");

let gastronomiaFiltrada = gastronomiaLista;
const versaoImagensGastronomia = "20260524";

// filtra restaurantes em tempo real ao escrever no campo de pesquisa
if (inputGastroFiltro) {
    inputGastroFiltro.addEventListener("input", atualizarGastronomia);
}

// cria o elemento de avaliação google com estrelas para restaurantes
function criarAvaliacaoRestaurante(r) {
    const rating = Number(r.googleRating);
    const temRating = Number.isFinite(rating);
    const googleMapsUrl = r.googleMapsUrl;
    if (!temRating && !googleMapsUrl) return null;

    const elem = document.createElement(googleMapsUrl ? "a" : "span");
    elem.classList.add("restaurante-rating");
    if (googleMapsUrl) {
        elem.href = googleMapsUrl;
        elem.target = "_blank";
        elem.rel = "noopener noreferrer";
        elem.title = temRating ? "Ver no Google Maps" : "Ver avaliações no Google";
    }
    elem.setAttribute(
        "aria-label",
        temRating ? `Avaliação Google ${rating.toFixed(1)} de 5` : "Ver avaliações no Google"
    );

    if (temRating) {
        const estrelas = document.createElement("span");
        estrelas.classList.add("restaurante-rating-estrelas");
        estrelas.setAttribute("aria-hidden", "true");
        // css usa esta variável para preencher as estrelas proporcionalmente à nota
        estrelas.style.setProperty("--rating-percent", `${Math.max(0, Math.min(100, rating / 5 * 100))}%`);
        estrelas.textContent = "★★★★★";

        const estrelasPreenchidas = document.createElement("span");
        estrelasPreenchidas.textContent = "★★★★★";
        estrelas.appendChild(estrelasPreenchidas);

        const valor = document.createElement("span");
        valor.classList.add("restaurante-rating-valor");
        valor.textContent = rating.toLocaleString("pt-PT", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });

        elem.appendChild(estrelas);
        elem.appendChild(valor);
    } else {
        elem.classList.add("restaurante-rating-sem-nota");
        elem.textContent = "Google Avaliações";
    }

    return elem;
}

// cria o artigo html de um restaurante com imagem, avaliação e contactos
function criaRestaurante(r) {
    const elemArt = document.createElement("article");
    elemArt.classList.add("restaurante-card");

    const elemTopo = document.createElement("div");
    elemTopo.classList.add("restaurante-topo");

    const elemH3 = document.createElement("h3");
    elemH3.textContent = r.title;
    elemH3.title = r.title;

    elemTopo.appendChild(elemH3);
    const elemRating = criarAvaliacaoRestaurante(r);
    if (elemRating) elemTopo.appendChild(elemRating);

    const elemP = document.createElement("p");
    elemP.textContent = `${r.tipo} • ${r.local}`;
    elemP.title = `${r.tipo} • ${r.local}`;

    const elemImg = document.createElement("img");
    elemImg.src = `${r.image}?v=${versaoImagensGastronomia}`;
    elemImg.alt = r.title;
    elemImg.loading = "lazy";
    elemArt.setAttribute("aria-label", r.title);
    prepararImagemAmpliavel(elemImg);

    const elemContato = document.createElement("div");
    elemContato.classList.add("card-contact");
    const elemRodape = document.createElement("div");
    elemRodape.classList.add("restaurante-rodape");

    if (r.phone) {
        const elemPhone = document.createElement("p");
        const elemPhoneLink = document.createElement("a");
        elemPhone.append("Tel: ");
        elemPhoneLink.href = `tel:${r.phone}`;
        elemPhoneLink.textContent = r.phone;
        elemPhoneLink.title = r.phone;
        elemPhone.appendChild(elemPhoneLink);
        elemContato.appendChild(elemPhone);
    }

    if (r.email) {
        const elemEmail = document.createElement("p");
        const elemEmailLink = document.createElement("a");
        elemEmail.append("Email: ");
        elemEmailLink.href = `mailto:${r.email}`;
        elemEmailLink.textContent = r.email;
        elemEmailLink.title = r.email;
        elemEmail.appendChild(elemEmailLink);
        elemContato.appendChild(elemEmail);
    }

    const elemActions = document.createElement("div");
    elemActions.classList.add("card-actions");

    if (r.siteUrl) {
        const elemLinkSite = document.createElement("a");
        elemLinkSite.innerHTML = iconeLinkSite(r.siteUrl);
        elemLinkSite.href = r.siteUrl;
        elemLinkSite.target = "_blank";
        elemLinkSite.rel = "noopener noreferrer";
        elemLinkSite.classList.add("card-link", "card-link-site");
        elemLinkSite.setAttribute("aria-label", `Abrir site de ${r.title}`);
        elemLinkSite.title = tituloLinkSite(r.siteUrl);
        elemActions.appendChild(elemLinkSite);
    }

    elemArt.appendChild(elemTopo);
    elemArt.appendChild(elemP);
    elemArt.appendChild(elemImg);
    if (r.description) {
        const elemDesc = document.createElement("p");
        elemDesc.textContent = r.description;
        elemDesc.title = r.description;
        elemDesc.classList.add("restaurante-descricao");
        elemArt.appendChild(elemDesc);
    }
    if (elemContato.children.length) {
        elemRodape.appendChild(elemContato);
    }
    if (elemActions.children.length) {
        elemRodape.appendChild(elemActions);
    }
    if (elemRodape.children.length) {
        elemArt.appendChild(elemRodape);
    }

    return elemArt;
}

// devolve os restaurantes que correspondem ao texto pesquisado (nome, tipo ou local)
function filtrarGastronomia() {
    if (!inputGastroFiltro) return gastronomiaLista;
    const filtro = inputGastroFiltro.value.toLowerCase();
    return gastronomiaLista.filter(r =>
        r.title.toLowerCase().includes(filtro) ||
        r.tipo.toLowerCase().includes(filtro) ||
        r.local.toLowerCase().includes(filtro)
    );
}

// re-renderiza os cards de restaurantes com os resultados do filtro atual
function atualizarGastronomia() {
    gastronomiaFiltrada = filtrarGastronomia();
    gastroCard.replaceChildren();

    if (gastronomiaResultado) {
        const n = gastronomiaFiltrada.length;
        gastronomiaResultado.textContent = `${n} restaurante${n !== 1 ? "s" : ""} encontrado${n !== 1 ? "s" : ""}`;
    }

    if (gastronomiaFiltrada.length === 0) {
        const semResultados = document.createElement("p");
        semResultados.classList.add("sem-resultados");
        semResultados.textContent = "Nenhum restaurante encontrado.";
        gastroCard.appendChild(semResultados);
        return;
    }

    for (const r of gastronomiaFiltrada) {
        gastroCard.appendChild(criaRestaurante(r));
    }
}

if (gastroCard) atualizarGastronomia();
