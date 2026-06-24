// recomendacoes.js — carrega as sugestões aprovadas da comunidade via /api/recomendacoes
// e injeta-as no final de cada página relevante como secção "Recomendações da Malta"

const ICONE_BOOKING = `
    <svg class="card-link-icon-brand" viewBox="5 4 15 17" aria-hidden="true" focusable="false">
        <text x="7" y="17.5" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="13" fill="#ffffff">B</text>
        <circle cx="18" cy="17.5" r="1.7" fill="#ffffff"></circle>
    </svg>
`;

const ICONE_AIRBNB = `
    <svg class="card-link-icon-brand" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#ffffff" fill-rule="evenodd" d="M12 2c.8 0 1.5.6 2 1.6l5.5 11.9c1 2.2.5 4.5-1.7 5.3-2.3.8-4.5-.3-5.8-2.3-1.3 2-3.5 3.1-5.8 2.3-2.2-.8-2.7-3.1-1.7-5.3L10 3.6c.5-1 1.2-1.6 2-1.6zm0 9.2c-1.2 0-2.2 1.1-2.2 2.8 0 1.5 1 3 2.2 4.5 1.2-1.5 2.2-3 2.2-4.5 0-1.7-1-2.8-2.2-2.8z"></path>
    </svg>
`;

// escolhe o texto do link de reserva com base na plataforma indicada na URL (usado quando não há ícone específico)
function textoLinkReserva(url) {
    const urlMinuscula = (url || "").toLowerCase();
    if (urlMinuscula.includes("booking")) return "Ver no Booking";
    if (urlMinuscula.includes("airbnb")) return "Ver no Airbnb";
    return "Ver reserva";
}

// escolhe o ícone do link de reserva com base na plataforma indicada na URL, ou null se não houver um ícone específico
function iconeLinkReserva(url) {
    const urlMinuscula = (url || "").toLowerCase();
    if (urlMinuscula.includes("booking")) return ICONE_BOOKING;
    if (urlMinuscula.includes("airbnb")) return ICONE_AIRBNB;
    return null;
}

// cria um link externo com estilo de card, com ícone se indicado em opcoes.iconeSite ou opcoes.iconeSvg
function criarLinkRecomendacao(url, texto, opcoes = {}) {
    if (!url) return null;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "card-link";
    const iconeHtml = opcoes.iconeSite ? iconeLinkSite(url) : opcoes.iconeSvg;
    if (iconeHtml) {
        link.classList.add("card-link-site");
        link.innerHTML = iconeHtml;
        link.setAttribute("aria-label", opcoes.ariaLabel || texto);
        link.title = opcoes.iconeSite ? tituloLinkSite(url) : texto;
    } else {
        link.textContent = texto;
    }

    return link;
}

// cria o card html de uma recomendação da comunidade, adaptando o conteúdo ao tipo
function criarCardRecomendacao(item, tipo) {
    const article = document.createElement("article");
    article.className = "recomendacao-malta-card";

    const titulo = document.createElement("h3");
    titulo.textContent = item.nome || item.title || "Sugestão";
    titulo.title = titulo.textContent;
    article.setAttribute("aria-label", titulo.textContent);

    if (item.imagem) {
        const imagem = document.createElement("img");
        imagem.src = item.imagem;
        imagem.alt = titulo.textContent;
        imagem.loading = "lazy";
        prepararImagemAmpliavel(imagem);

        const plataformaReserva = tipo === "alojamentos" ? detetarPlataformaAlojamento(item.booking_url) : null;
        if (tipo === "alojamentos" && plataformaReserva) {
            const media = document.createElement("div");
            media.classList.add("alojamento-media");
            media.appendChild(imagem);
            const avaliacao = criarAvaliacaoGoogleCompacta(
                item,
                { origem: plataformaReserva, linkUrl: item.booking_url, escala: plataformaReserva === "Airbnb" ? 5 : 10, rating: item.avaliacao_booking }
            );
            if (avaliacao) media.appendChild(avaliacao);
            article.appendChild(media);
        } else {
            article.appendChild(imagem);
        }
    }

    article.appendChild(titulo);

    // ordem de leitura (cima para baixo): porque recomenda, localização, recomendado por
    if (tipo === "gastronomia" || tipo === "pontos" || tipo === "atividades" || tipo === "alojamentos") {
        if (item.descricao || item.description) {
            const porqueRecomenda = document.createElement("p");
            porqueRecomenda.textContent = item.descricao || item.description;
            porqueRecomenda.title = porqueRecomenda.textContent;
            article.appendChild(porqueRecomenda);
        }
        if (item.local) {
            const localizacao = document.createElement("p");
            localizacao.className = "recomendacao-meta";
            localizacao.textContent = `📍 ${item.local}`;
            article.appendChild(localizacao);
        }
    } else {
        const descricao = document.createElement("p");
        descricao.textContent = item.descricao || item.description || "";
        descricao.title = descricao.textContent;
        article.appendChild(descricao);
    }

    if (item.recomendado_por) {
        const recomendadoPor = document.createElement("p");
        recomendadoPor.className = "recomendacao-meta";
        recomendadoPor.append("Recomendado por ");
        const recomendadoNome = document.createElement("strong");
        recomendadoNome.textContent = item.recomendado_por;
        recomendadoPor.appendChild(recomendadoNome);
        article.appendChild(recomendadoPor);
    }

    if ((tipo === "pontos" || tipo === "atividades" || tipo === "alojamentos") && item.telefone) {
        const telefone = document.createElement("p");
        telefone.className = "recomendacao-meta";
        telefone.append("Tel: ");
        const telefoneLink = document.createElement("a");
        telefoneLink.href = `tel:${item.telefone}`;
        telefoneLink.textContent = item.telefone;
        telefone.appendChild(telefoneLink);
        article.appendChild(telefone);
    }

    // para pontos turísticos, mostra o aviso de acesso ou atenção se existir
    if (tipo === "pontos" && item.aviso) {
        const morada = document.createElement("p");
        morada.className = "recomendacao-meta";
        morada.textContent = `⚠️ ${item.aviso}`;
        article.appendChild(morada);
    }

    const acoes = document.createElement("div");
    acoes.className = "card-actions";

    const site = criarLinkRecomendacao(item.site_url, "Site oficial", {
        ariaLabel: `Abrir site de ${titulo.textContent}`,
        iconeSite: tipo === "alojamentos" || tipo === "gastronomia"
    });
    const booking = criarLinkRecomendacao(item.booking_url, textoLinkReserva(item.booking_url), {
        ariaLabel: `Abrir reserva de ${titulo.textContent}`,
        iconeSvg: iconeLinkReserva(item.booking_url)
    });
    if (site) acoes.appendChild(site);
    if (booking) acoes.appendChild(booking);

    // telefone e email ficam alinhados ao lado do ícone do site, um em cima do outro
    if (tipo === "gastronomia" && (item.telefone || item.email)) {
        const contactos = document.createElement("div");
        contactos.className = "recomendacao-contactos";
        if (item.telefone) {
            const telefone = document.createElement("p");
            telefone.className = "recomendacao-meta";
            telefone.append("Tel: ");
            const telefoneValor = document.createElement("span");
            telefoneValor.className = "recomendacao-contacto-valor";
            telefoneValor.textContent = item.telefone;
            telefone.appendChild(telefoneValor);
            contactos.appendChild(telefone);
        }
        if (item.email) {
            const email = document.createElement("p");
            email.className = "recomendacao-meta";
            email.append("Email: ");
            const emailValor = document.createElement("span");
            emailValor.className = "recomendacao-contacto-valor";
            emailValor.textContent = item.email;
            email.appendChild(emailValor);
            contactos.appendChild(email);
        }
        acoes.appendChild(contactos);
    }

    if (acoes.children.length) article.appendChild(acoes);

    return article;
}

// soma as recomendações da malta ao contador da secção principal da página
function atualizarContagemComMalta(tipo, maltaCount) {
    if (!maltaCount) return;
    if (tipo === "gastronomia") {
        const el = document.getElementById("gastronomiaResultado");
        if (!el || typeof filtrarGastronomia !== "function") return;
        const total = filtrarGastronomia().length + maltaCount;
        el.textContent = `${total} restaurante${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;
    } else if (tipo === "alojamentos") {
        const el = document.getElementById("alojamentosResultado");
        if (!el || typeof filtrarHospedagem !== "function") return;
        const total = filtrarHospedagem().length + maltaCount;
        el.textContent = `${total} alojamento${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;
    } else if (tipo === "pontos") {
        const el = document.getElementById("pontosResultado");
        if (!el || typeof filtrarPorNome !== "function") return;
        const total = filtrarPorNome().length + maltaCount;
        el.textContent = `${total} ponto${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;
    } else if (tipo === "atividades") {
        const el = document.getElementById("actividadesResultado");
        if (!el || typeof filtrarAtividades !== "function") return;
        const total = filtrarAtividades().length + maltaCount;
        el.textContent = `${total} atividade${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`;
    }
}

// injeta a secção de recomendações da comunidade no final do main da página
function renderizarRecomendacoesMalta(tipo, itens) {
    if (!Array.isArray(itens) || !itens.length) return;

    const alvo = document.querySelector("main");
    if (!alvo || document.getElementById(`recomendacoes-${tipo}`)) return;

    const section = document.createElement("section");
    section.id = `recomendacoes-${tipo}`;
    section.className = "recomendacoes-malta";
    if (itens.length === 1) {
        section.classList.add("uma-recomendacao");
    }

    const titulo = document.createElement("h2");
    titulo.textContent = "Recomendações da Malta";

    const intro = document.createElement("p");
    intro.textContent = "Locais sugeridos por visitantes e aprovados pela equipa.";

    const grid = document.createElement("div");
    grid.className = "card recomendacoes-malta-grid";

    itens.forEach((item) => {
        grid.appendChild(criarCardRecomendacao(item, tipo));
    });

    section.appendChild(titulo);
    section.appendChild(intro);
    section.appendChild(grid);
    alvo.appendChild(section);
    atualizarContagemComMalta(tipo, itens.length);
}

// vai buscar as recomendações da api e renderiza-as na página atual se for relevante
async function carregarRecomendacoesMalta() {
    const pagina = window.location.pathname.split("/").pop() || "sesimbra.html";
    // só carrega recomendações nas páginas que têm secção para isso
    const tipoPorPagina = {
        "pontos-turisticos.html": "pontos",
        "atividades.html": "atividades",
        "gastronomia.html": "gastronomia",
        "alojamentos.html": "alojamentos"
    };
    const tipo = tipoPorPagina[pagina];
    if (!tipo) return;

    try {
        const resposta = await fetch("/api/recomendacoes");
        if (!resposta.ok) return;

        const dados = await resposta.json();
        renderizarRecomendacoesMalta(tipo, dados[tipo]);
    } catch (erro) {
        console.warn("Não foi possível carregar recomendações da Malta.", erro);
    }
}
