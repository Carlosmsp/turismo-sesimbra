// mapa.js — mapa interativo com Leaflet.js e OpenStreetMap: desenha marcadores
// coloridos por categoria (pontos, atividades, restaurantes, alojamentos) e carrega
// também os pontos sugeridos pela comunidade ("malta") via /api/recomendacoes

// mapa interativo (Leaflet + OpenStreetMap) com os pontos turísticos que têm coordenadas

const CENTRO_SESIMBRA = [38.4454, -9.1029];

let instanciaMapaPontos = null;
let marcadoresPontosMapa = [];
let marcadoresFixosMapa = [];
let marcadoresMaltaMapa = [];
let limitesMapaAjustados = false;
let pedidoMarcadoresMalta = null;

// ícones coloridos com símbolo (círculos) para distinguir as categorias no mapa
function criarIconeCategoria(classeCor, classeIcone) {
    return L.divIcon({
        className: `marcador-mapa ${classeCor}`,
        html: `<i class="ph ph-${classeIcone}" aria-hidden="true"></i>`,
        iconSize: [28, 28]
    });
}

// ícones criados uma única vez e reutilizados em todos os marcadores
const ICONE_PONTO = criarIconeCategoria("marcador-ponto", "map-pin");
const ICONE_ATIVIDADE = criarIconeCategoria("marcador-atividade", "person-simple-hike");
const ICONE_RESTAURANTE = criarIconeCategoria("marcador-restaurante", "fork-knife");
const ICONE_ALOJAMENTO = criarIconeCategoria("marcador-alojamento", "bed");

function textoPopupMapa(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// adiciona um botão de ecrã inteiro ao mapa, usando a Fullscreen API do browser
function adicionarControleFullscreen(mapa, container) {
    const ControleFullscreen = L.Control.extend({
        options: { position: "topright" },
        onAdd: function () {
            const botao = L.DomUtil.create("button", "mapa-fullscreen-btn leaflet-bar");
            botao.type = "button";
            botao.innerHTML = '<i class="ph ph-corners-out" aria-hidden="true"></i>';
            botao.title = "Ver mapa em ecrã inteiro";
            botao.setAttribute("aria-label", "Ver mapa em ecrã inteiro");
            L.DomEvent.disableClickPropagation(botao);
            botao.addEventListener("click", () => {
                if (!document.fullscreenElement) {
                    container.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            });
            return botao;
        }
    });
    mapa.addControl(new ControleFullscreen());

    container.addEventListener("fullscreenchange", () => {
        container.classList.toggle("mapa-pontos-fullscreen", !!document.fullscreenElement);
        setTimeout(() => mapa.invalidateSize(), 0);
    });
}

// cria o mapa centrado em Sesimbra, se ainda não existir
function iniciarMapaPontos() {
    if (instanciaMapaPontos || !mapaPontos || typeof L === "undefined") return;

    instanciaMapaPontos = L.map(mapaPontos, {
        scrollWheelZoom: false
    }).setView(CENTRO_SESIMBRA, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        keepBuffer: 4
    }).addTo(instanciaMapaPontos);

    adicionarControleFullscreen(instanciaMapaPontos, mapaPontos);

    // ativa o zoom por scroll enquanto o cursor está dentro do mapa
    // (e desativa ao sair), para não "roubar" o scroll da página
    instanciaMapaPontos.on("mouseover", () => instanciaMapaPontos.scrollWheelZoom.enable());
    instanciaMapaPontos.on("mouseout", () => instanciaMapaPontos.scrollWheelZoom.disable());
}

// desenha uma única vez os marcadores de restaurantes e alojamentos (não mudam com o filtro)
function desenharMarcadoresFixos() {
    if (marcadoresFixosMapa.length > 0) return;

    const restaurantesComCoordenadas = gastronomiaLista.filter(
        (r) => Number.isFinite(r.lat) && Number.isFinite(r.lon)
    );
    for (const restaurante of restaurantesComCoordenadas) {
        const marcador = L.marker([restaurante.lat, restaurante.lon], { icon: ICONE_RESTAURANTE }).addTo(instanciaMapaPontos);
        marcador.bindPopup(`<strong>${textoPopupMapa(restaurante.title)}</strong><br>${textoPopupMapa(restaurante.tipo)}<br><a href="gastronomia.html">Ver na Gastronomia</a>`);
        marcadoresFixosMapa.push(marcador);
    }

    const alojamentosComCoordenadas = hospedagemLista.filter(
        (a) => Number.isFinite(a.lat) && Number.isFinite(a.lon)
    );
    for (const alojamento of alojamentosComCoordenadas) {
        const marcador = L.marker([alojamento.lat, alojamento.lon], { icon: ICONE_ALOJAMENTO }).addTo(instanciaMapaPontos);
        marcador.bindPopup(`<strong>${textoPopupMapa(alojamento.title)}</strong><br><a href="alojamentos.html">Ver em Alojamentos</a>`);
        marcadoresFixosMapa.push(marcador);
    }

    const atividadesComCoordenadas = actividadesLista.filter(
        (a) => Number.isFinite(a.lat) && Number.isFinite(a.lon)
    );
    for (const atividade of atividadesComCoordenadas) {
        const marcador = L.marker([atividade.lat, atividade.lon], { icon: ICONE_ATIVIDADE }).addTo(instanciaMapaPontos);
        marcador.bindPopup(`<strong>${textoPopupMapa(atividade.title)}</strong><br><a href="atividades.html">Ver em Atividades</a>`);
        marcadoresFixosMapa.push(marcador);
    }
}

function adicionarMarcadorMalta(item, tipo, icone, href, rotulo) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const marcador = L.marker([lat, lon], { icon: icone }).addTo(instanciaMapaPontos);
    marcador.bindPopup(`<strong>${textoPopupMapa(item.nome || item.title || "Sugestão")}</strong><br>Sugestão da Malta<br><a href="${href}">Ver em ${rotulo}</a>`);
    marcadoresMaltaMapa.push(marcador);
}

async function carregarMarcadoresMaltaMapa() {
    if (pedidoMarcadoresMalta || marcadoresMaltaMapa.length > 0) return pedidoMarcadoresMalta;

    pedidoMarcadoresMalta = fetch("/api/recomendacoes")
        .then(async (resposta) => {
            if (!resposta.ok || !instanciaMapaPontos) return;
            const dados = await resposta.json();
            (dados.pontos || []).forEach((item) => adicionarMarcadorMalta(item, "pontos", ICONE_PONTO, "pontos-turisticos.html", "Pontos Turísticos"));
            (dados.atividades || []).forEach((item) => adicionarMarcadorMalta(item, "atividades", ICONE_ATIVIDADE, "atividades.html", "Atividades"));
            (dados.gastronomia || []).forEach((item) => adicionarMarcadorMalta(item, "gastronomia", ICONE_RESTAURANTE, "gastronomia.html", "Gastronomia"));
            (dados.alojamentos || []).forEach((item) => adicionarMarcadorMalta(item, "alojamentos", ICONE_ALOJAMENTO, "alojamentos.html", "Alojamentos"));

            if (!limitesMapaAjustados && marcadoresMaltaMapa.length > 0) {
                const grupo = L.featureGroup(marcadoresMaltaMapa);
                instanciaMapaPontos.fitBounds(grupo.getBounds().pad(0.2), { maxZoom: 15 });
                limitesMapaAjustados = true;
            }
        })
        .catch((erro) => {
            pedidoMarcadoresMalta = null;
            console.warn("Não foi possível carregar marcadores da Malta.", erro);
        });

    return pedidoMarcadoresMalta;
}

// volta a desenhar apenas os marcadores de pontos turísticos conforme o filtro ativo
function atualizarMarcadoresMapa() {
    if (!instanciaMapaPontos) return;

    desenharMarcadoresFixos();

    marcadoresPontosMapa.forEach((marcador) => marcador.remove());
    marcadoresPontosMapa = [];

    const pontosComCoordenadas = pontosFiltrados.filter(
        (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon)
    );
    for (const ponto of pontosComCoordenadas) {
        const marcador = L.marker([ponto.lat, ponto.lon], { icon: ICONE_PONTO }).addTo(instanciaMapaPontos);
        marcador.bindPopup(`<strong>${textoPopupMapa(ponto.title)}</strong><br><a href="pontos-turisticos.html">Ver em Pontos Turísticos</a>`);
        marcadoresPontosMapa.push(marcador);
    }

    carregarMarcadoresMaltaMapa();

    // os limites do mapa só são ajustados uma vez, para não saltar a vista a cada filtro
    if (!limitesMapaAjustados) {
        const todosMarcadores = [...marcadoresPontosMapa, ...marcadoresFixosMapa, ...marcadoresMaltaMapa];
        if (todosMarcadores.length > 0) {
            const grupo = L.featureGroup(todosMarcadores);
            instanciaMapaPontos.fitBounds(grupo.getBounds().pad(0.2), { maxZoom: 15 });
            limitesMapaAjustados = true;
            setTimeout(() => instanciaMapaPontos.invalidateSize(), 0);
        }
    }
}
