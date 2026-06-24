// dados.js — carrega o conteúdo da base de dados via API e converte-o nas listas
// usadas pelos outros módulos (cards.js, mapa.js, chatbot.js, etc.)

// links estruturais usados para construir o menu em todas as páginas
const links = [
    { texto: "Início", href: "sesimbra.html" },
    { texto: "Pontos Turísticos", href: "pontos-turisticos.html" },
    { texto: "Atividades", href: "atividades.html" },
    { texto: "Gastronomia", href: "gastronomia.html" },
    { texto: "Alojamentos", href: "alojamentos.html" },
    { texto: "Transportes", href: "transportes.html" },
    { texto: "História", href: "historia.html" },
    { texto: "Contactos", href: "contactos.html" }
];

// As listas mantêm os nomes esperados pelos componentes existentes, mas o
// conteúdo é preenchido exclusivamente pela base de dados através da API.
const pontosTuristicosLista = [];
const gastronomiaLista = [];
const actividadesLista = [];
const hospedagemLista = [];

const versaoImagensHospedagem = "20260611";
let pedidoConteudoSite = null;

// tenta fazer parse de um campo JSON guardado como texto; devolve array vazio se inválido
function lerJsonLista(valor) {
    if (Array.isArray(valor)) return valor;
    if (!valor) return [];

    try {
        const resultado = JSON.parse(valor);
        return Array.isArray(resultado) ? resultado : [];
    } catch (erro) {
        console.warn("Foi encontrado conteúdo JSON inválido na base de dados.", erro);
        return [];
    }
}

// converte uma linha da tabela pontos_interesse no objeto esperado pelos componentes de UI
function converterPonto(item) {
    return {
        id: item.id,
        title: item.nome,
        categoria: item.categoria || "",
        description: item.descricao,
        image: item.imagem,
        altImage: item.alt_imagem || item.nome,
        note: item.aviso || "",
        events: lerJsonLista(item.eventos_json),
        lat: item.lat == null ? null : Number(item.lat),
        lon: item.lon == null ? null : Number(item.lon)
    };
}

function converterRestaurante(item) {
    return {
        id: item.id,
        title: item.nome,
        tipo: item.tipo,
        local: item.local,
        description: item.descricao || "",
        image: item.imagem,
        phone: item.telefone || "",
        email: item.email || "",
        siteUrl: item.site_url || "",
        googleRating: item.avaliacao_google == null ? undefined : item.avaliacao_google,
        googleMapsUrl: item.google_maps_url || "",
        lat: item.lat == null ? null : Number(item.lat),
        lon: item.lon == null ? null : Number(item.lon)
    };
}

// converte uma linha da tabela atividades no objeto esperado pelos componentes de UI
function converterAtividade(item) {
    return {
        id: item.id,
        title: item.nome,
        categoria: item.categoria,
        icone: item.icone || "",
        description: item.descricao,
        image: item.imagem || "",
        local: item.local || "",
        phone: item.telefone || "",
        siteUrl: item.site_url || "",
        links: lerJsonLista(item.links_json),
        lat: item.lat == null ? null : Number(item.lat),
        lon: item.lon == null ? null : Number(item.lon)
    };
}

// converte uma linha da tabela alojamentos no objeto esperado pelos componentes de UI
function converterAlojamento(item) {
    return {
        id: item.id,
        title: item.nome,
        description: item.descricao,
        image: item.imagem,
        altImage: item.alt_imagem || item.nome,
        phone: item.telefone || "",
        siteUrl: item.site_url || "",
        bookingUrl: item.booking_url || "",
        bookingRating: item.avaliacao_booking == null ? undefined : item.avaliacao_booking,
        googleRating: item.avaliacao_google == null ? undefined : item.avaliacao_google,
        googleMapsUrl: item.google_maps_url || "",
        lat: item.lat == null ? null : Number(item.lat),
        lon: item.lon == null ? null : Number(item.lon)
    };
}

// substitui o conteúdo do array de destino pelos itens convertidos (atualiza a referência sem a quebrar)
function substituirLista(destino, itens, conversor) {
    destino.splice(0, destino.length, ...itens.map(conversor));
}

// faz um único pedido GET a /api/conteudo e preenche as quatro listas globais;
// pedidos simultâneos reutilizam a mesma promessa em vez de disparar vários fetches
async function carregarConteudoSite() {
    if (pedidoConteudoSite) return pedidoConteudoSite;

    pedidoConteudoSite = fetch("/api/conteudo", {
        headers: { Accept: "application/json" }
    })
        .then(async (resposta) => {
            if (!resposta.ok) {
                throw new Error(`A API de conteúdo respondeu com ${resposta.status}.`);
            }

            const dados = await resposta.json();
            substituirLista(
                pontosTuristicosLista,
                Array.isArray(dados.pontos_interesse) ? dados.pontos_interesse : [],
                converterPonto
            );
            substituirLista(
                gastronomiaLista,
                Array.isArray(dados.restaurantes) ? dados.restaurantes : [],
                converterRestaurante
            );
            substituirLista(
                actividadesLista,
                Array.isArray(dados.atividades) ? dados.atividades : [],
                converterAtividade
            );
            substituirLista(
                hospedagemLista,
                Array.isArray(dados.alojamentos) ? dados.alojamentos : [],
                converterAlojamento
            );
            return dados;
        })
        .catch((erro) => {
            pedidoConteudoSite = null;
            throw erro;
        });

    return pedidoConteudoSite;
}
