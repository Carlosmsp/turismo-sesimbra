const links = [
    { texto: "Início", href: "sesimbra.html" },
    { texto: "Pontos Turísticos", href: "pontos-turisticos.html" },
    { texto: "Actividades", href: "atividades.html" },
    { texto: "Gastronomia", href: "gastronomia.html" },
    { texto: "Alojamentos", href: "alojamentos.html" },
    { texto: "História", href: "historia.html" },
    { texto: "Contactos", href: "contactos.html" }
];
const pontosTuristicosLista = [
    {
        "id": 1,
        "title": "Castelo de Sesimbra",
        "description": "O Castelo de Sesimbra, situado no topo de uma colina, oferece vistas panorâmicas deslumbrantes da vila e do oceano.",
        "image": "img/Castelo_Sesimbra.jpg",
        "altImage": "Castelo de Sesimbra visto do alto",
        "note": "ALERTA — Eventos no local: Festa no Castelo e celebrações históricas.",
        "events": [
            {
                "title": "Festa de Nossa Senhora do Castelo",
                "date": "Junho",
                "description": "Cortejos, música tradicional e fogo de artifício junto ao castelo histórico."
            },
            {
                "title": "Carnaval de Sesimbra",
                "date": "Fevereiro",
                "description": "Desfiles e animação na vila, com música de rua e cores ao redor do castelo."
            }
        ]
    },
    {
        "id": 2,
        "title": "Praia do Ouro",
        "description": "A Praia do Ouro é um dos destinos mais populares, com suas águas calmas e areia dourada.",
        "image": "img/praia-do-ouro-em-sesimbra.jpeg",
        "altImage": "Praia do Ouro em Sesimbra"
    },
    {
        "id": 3,
        "title": "Parque Natural da Arrábida",
        "description": "Para os amantes da natureza, o Parque Natural da Arrábida é um paraíso de biodiversidade, com trilhas para caminhadas e praias isoladas.",
        "image": "img/parque_natural_da_arrabia.jpg",
        "altImage": "Parque Natural da Arrábida",
        "note": "ATENÇÃO — JULHO E AGOSTO com trânsito limitado para veículos motorizados. Acesso apenas a pé ou de bicicleta."
    },
    {
        "id": 4,
        "title": "Porto de Abrigo",
        "description": "O Porto de Abrigo é um local encantador para passear, com seus barcos coloridos e atmosfera tranquila.",
        "image": "img/porto-de-abrigo.jpg",
        "altImage": "Porto de Abrigo de Sesimbra",
        "note": "ALERTA — Eventos de verão no porto, incluindo as Festas do Mar.",
        "events": [
            {
                "title": "Festas do Mar",
                "date": "Agosto",
                "description": "Música, sardinhada e festa popular com vista para a baía de Sesimbra."
            }
        ]
    },
    {
        "id": 5,
        "title": "Cabo Espichel",
        "description": "O Cabo Espichel é um ponto de vista deslumbrante que oferece vistas panorâmicas da costa e do oceano.",
        "image": "img/Cabo-Espichel.jpg",
        "altImage": "Cabo Espichel",
        "note": "ALERTA — Eventos no local: Romaria e observações noturnas.",
        "events": [
            {
                "title": "Romaria de Nossa Senhora do Cabo",
                "date": "Setembro",
                "description": "Celebração religiosa e procissão com música tradicional e barraquinhas locais."
            },
            {
                "title": "Noites de Observação Astronómica",
                "date": "Junho-Agosto",
                "description": "Sessões de astroturismo com guias e telescópios no ponto de vista do Cabo."
            }
        ]
    },
    {
        "id": 6,
        "title": "Lagoa de Albufeira",
        "description": "A Lagoa de Albufeira é um local natural privilegiado, conhecida por suas águas cristalinas e paisagens deslumbrantes.",
        "image": "img/Lagoa-Albufeira.jpg",
        "altImage": "Lagoa de Albufeira"
    },
     {
        "id": 7,
        "title": "Pegadas de Dinossauros em Sesimbra",
        "description": "Pegadas na Pedreira do Avelino, a Pedra da Mua e os Lagosteiros, e outros locais com trilhas para explorar e descobrir vestígios de dinossauros.",
        "image": "img/Pegadas-Dinossauro-Meco.jpg",
        "altImage": "Pegadas de Dinossauros da Pedreira do Avelino, a Pedra da Mua e os Lagosteiros"
    },
     {
        "id": 8,
        "title": "Praia da Califórnia",
        "description": "A Praia da Califórnia é um dos destinos mais populares, com suas águas calmas e areia dourada.",
        "image": "img/praia-da-california.jpg",
        "altImage": "Praia da Califórnia em Sesimbra"
    },
     {
        "id": 9,
        "title": "Praia da Ribeira do Cavalo",
        "description": "A Praia da Ribeira do Cavalo é um dos destinos mais populares, com suas águas calmas e transparentes.",
        "image": "img/praia-da-ribeira-do-cavalo.jpg",
        "altImage": "Praia da Ribeira do Cavalo em Sesimbra"
    },

];
const gastronomiaLista = [
    { "id": 1, "title": "Casa Mateus","tipo": "Marisco", "local": "Sesimbra", "image": "img/casa-mateus-sesimbra.jpg", "phone": "+351 963 650 939", "email": "reservas@casamateus.pt" },
    { "id": 2, "title": "O Zagaia", "tipo": "Peixe", "local": "Sesimbra", "image": "img/Zagaia.jpg", "phone": "+351 966 280 204" },
    { "id": 3, "title": "Taberna Isaias", "tipo": "Peixe grelhado", "local": "Sesimbra", "image": "img/taberna-do-isaias.jpg", "phone": "+351 914 574 373" },
    { "id": 4, "title": "O Batel", "tipo": "Marisco", "local": "Sesimbra", "image": "img/o-batel.jpg", "phone": "+351 969 306 556" },
    { "id": 5, "title": "O Rodinhas", "tipo": "Marisqueira", "local": "Sesimbra", "image": "img/o-rodinhas.jpg", "phone": "+351 212 231 557" },
    { "id": 6, "title": "Cantinho da Regina", "tipo": "Internacional", "local": "Sesimbra", "image": "img/cantinho-da-regina.jpg", "phone": "+351 212 235 182" },
    { "id": 7, "title": "O Velho e o Mar", "tipo": "Peixe", "local": "Sesimbra", "image": "img/oVelhoeoMar.jpg", "phone": "+351 21 087 9995" },
    { "id": 8, "title": "Lobo do Mar", "tipo": "Marisqueira", "local": "Sesimbra", "image": "img/rest8.jpg", "phone": "+351 212 234 567" },
    { "id": 9, "title": "Portofino", "tipo": "Mediterrânico", "local": "Sesimbra", "image": "img/rest9.jpg", "phone": "+351 212 224 890" },
    { "id": 10, "title": "Forte de Santiago", "tipo": "Mediterrânico", "local": "Sesimbra", "image": "img/rest10.jpg", "phone": "+351 212 228 340" },
    { "id": 11, "title": "Casa do Mar", "tipo": "Marisco", "local": "Sesimbra", "image": "img/rest11.jpg", "phone": "+351 212 232 156" },
    { "id": 12, "title": "O Pescador", "tipo": "Peixe", "local": "Sesimbra", "image": "img/rest12.jpg", "phone": "+351 212 233 478" },
    { "id": 13, "title": "Marisqueira O Barbas", "tipo": "Marisco", "local": "Sesimbra", "image": "img/rest13.jpg", "phone": "+351 212 225 634" },
    { "id": 14, "title": "A Tasca do Zé", "tipo": "Peixe grelhado", "local": "Sesimbra", "image": "img/rest14.jpg", "phone": "+351 212 221 345" },
    { "id": 15, "title": "O Marujo", "tipo": "Marisco", "local": "Sesimbra", "image": "img/rest15.jpg", "phone": "+351 212 226 789" },     
    { "id": 16, "title": "Costa Nossa", "tipo": "Marisco","local": "Sesimbra","image": "img/rest16.jpg", "phone": "+351 212 229 012" },
    {"id": 17, "title": "Pizza na Praia Meco", "tipo": "Italiano", "local": "Meco", "image": "img/rest17.jpg", "phone": "+351 212 273 456" },
    {"id": 18, "title": "Dôma", "tipo": "Tradicional", "local": "Sesimbra", "image": "img/rest18.jpg", "phone": "+351 212 230 567" },
    {"id": 19, "title": "Praiamar", "tipo": "Marisqueira", "local": "Sesimbra", "image": "img/rest19.jpg", "phone": "+351 212 227 890" },
    {"id": 20, "title": "Marulla Beach Bar", "tipo": "Moderno", "local": "Sesimbra", "image": "img/rest20.jpg", "phone": "+351 212 235 678" }
];
const actividadesLista = [
    {
        "id": 1,
        "title": "Mergulho",
        "categoria": "agua",
        "icone": "🤿",
        "description": "Sesimbra é o melhor destino de mergulho em Portugal, com recifes, grutas e naufrágios a explorar.",
        "links": [
            { "name": "Anthia Diving Center", "url": "https://anthiadiving.com/" },
            { "name": "CIP Diving", "url": "https://www.cipdiving.com/" },
            { "name": "H2O Diving", "url": "https://h2odiving.pt/" }
        ]
    },
    {
        "id": 2,
        "title": "Passeios de Barco",
        "categoria": "agua",
        "icone": "⛵",
        "description": "Explore praias secretas, grutas marinhas e a costa da Arrábida a bordo de embarcações típicas.",
        "links": [
            { "name": "Sesimbra Boat Tours", "url": "https://www.sesimbraboat.com/" },
            { "name": "Meira Pro", "url": "https://www.meira.pro/" },
            { "name": "Vertente Natural", "url": "https://www.vertente-natural.com/" }
        ]
    },
    {
        "id": 3,
        "title": "Ver Golfinhos",
        "categoria": "agua",
        "icone": "🐬",
        "description": "Observação de golfinhos no seu habitat natural, com operadores certificados e guias especializados.",
        "links": [
            { "name": "Vertente Natural", "url": "https://www.vertente-natural.com/" },
            { "name": "Roaz Dolphin Watching", "url": "https://www.roaz.pt/" }
        ]
    },
    {
        "id": 4,
        "title": "Pesca Desportiva",
        "categoria": "agua",
        "icone": "🎣",
        "description": "Pesca embarcada com profissionais locais. Excelentes condições para pesca ao largo da costa alentejana.",
        "links": [
            { "name": "Sesimbra Boat – Pesca", "url": "https://www.sesimbraboat.com/pesca" },
            { "name": "Meira Pro – Pesca", "url": "https://www.meira.pro/pesca" }
        ]
    },
    {
        "id": 5,
        "title": "Surf e Bodyboard",
        "categoria": "agua",
        "icone": "🏄",
        "description": "As praias do concelho oferecem boas ondas para surf e bodyboard, especialmente na Praia do Meco.",
        "links": [
            { "name": "Sesimbra Surf School", "url": "https://www.sesimbrasurf.com/" },
            { "name": "Meco Surf Camp", "url": "https://www.mecosurfcamp.com/" }
        ]
    },
    {
        "id": 6,
        "title": "Kayak e Stand Up Paddle",
        "categoria": "agua",
        "icone": "🛶",
        "description": "Percorra as águas calmas da baía de Sesimbra ou explore as grutas da Arrábida de kayak ou SUP.",
        "links": [
            { "name": "Vertente Natural – Kayak", "url": "https://www.vertente-natural.com/" },
            { "name": "Sesimbra Boat – SUP", "url": "https://www.sesimbraboat.com/" }
        ]
    },
    {
        "id": 7,
        "title": "Snorkeling",
        "categoria": "agua",
        "icone": "🐠",
        "description": "Águas cristalinas e ricas em vida marinha tornam Sesimbra um dos melhores locais de snorkeling de Portugal.",
        "links": [
            { "name": "H2O Diving – Snorkeling", "url": "https://h2odiving.pt/" },
            { "name": "Vertente Natural", "url": "https://www.vertente-natural.com/" }
        ]
    },
    {
        "id": 8,
        "title": "Serra da Arrábida",
        "categoria": "natureza",
        "icone": "🌿",
        "description": "Trilhos, miradouros e natureza protegida num dos parques naturais mais bonitos de Portugal.",
        "links": [
            { "name": "Walking Arrábida", "url": "https://www.walkingarrabida.com/" },
            { "name": "Trilhos no AllTrails", "url": "https://www.alltrails.com/portugal/setubal/serra-da-arrabida" }
        ]
    },
    {
        "id": 9,
        "title": "Caminhadas e Trilhos",
        "categoria": "natureza",
        "icone": "🥾",
        "description": "Percursos pedestres pela serra e pela costa, com vistas deslumbrantes para o mar e para a Lagoa de Albufeira.",
        "links": [
            { "name": "Trilhos AllTrails – Sesimbra", "url": "https://www.alltrails.com/portugal/setubal" },
            { "name": "Wikiloc – Sesimbra", "url": "https://pt.wikiloc.com/trilhas/sesimbra" }
        ]
    },
    {
        "id": 10,
        "title": "Birdwatching",
        "categoria": "natureza",
        "icone": "🦅",
        "description": "O Parque Natural da Arrábida e a Lagoa de Albufeira são habitats ideais para observação de aves selvagens.",
        "links": [
            { "name": "eBird Portugal", "url": "https://ebird.org/region/PT" },
            { "name": "SPEA – Birdwatching", "url": "https://spea.pt/" }
        ]
    },
    {
        "id": 11,
        "title": "Observação de Estrelas",
        "categoria": "natureza",
        "icone": "⭐",
        "description": "O Cabo Espichel, longe da poluição luminosa, é um dos melhores locais da região para contemplar o céu noturno.",
        "links": [
            { "name": "Astroturismo Portugal", "url": "https://astroturismo.pt/" },
            { "name": "Dark Sky Portugal", "url": "https://darksky.org/places/dark-sky-reserve-of-the-alqueva/" }
        ]
    },
    {
        "id": 12,
        "title": "Escalada",
        "categoria": "aventura",
        "icone": "🧗",
        "description": "Paredes naturais com vista para o mar, ideais para iniciantes e avançados. A Arrábida tem os melhores spots de escalada de Portugal.",
        "links": [
            { "name": "Vertente Natural – Escalada", "url": "https://www.vertente-natural.com/" },
            { "name": "Climbing Portugal", "url": "https://climbingportugal.com/arrabida" }
        ]
    },
    {
        "id": 13,
        "title": "Visitar Grutas",
        "categoria": "aventura",
        "icone": "🪨",
        "description": "Grutas marinhas e formações rochosas únicas na costa, acessíveis de barco ou kayak.",
        "links": [
            { "name": "Vertente Natural – Grutas", "url": "https://www.vertente-natural.com/" },
            { "name": "Sesimbra Boat – Grutas", "url": "https://www.sesimbraboat.com/grutas" }
        ]
    },
    {
        "id": 14,
        "title": "BTT e Ciclismo",
        "categoria": "aventura",
        "icone": "🚴",
        "description": "Percursos de bicicleta pela serra e pela orla costeira, com opções para todos os níveis de condicionamento.",
        "links": [
            { "name": "Bike Adventures Portugal", "url": "https://www.bikeadventures.pt/" },
            { "name": "Trilhos BTT AllTrails", "url": "https://www.alltrails.com/portugal/setubal" }
        ]
    },
    {
        "id": 15,
        "title": "Festas e Eventos",
        "categoria": "cultura",
        "icone": "🎉",
        "description": "Eventos culturais, religiosos e festivais ao longo do ano, incluindo as Festas do Mar em Agosto.",
        "links": [
            { "name": "Agenda Cultural – Câmara Municipal", "url": "https://www.sesimbra.pt/" },
            { "name": "Eventos na Arrábida", "url": "https://viajarentreviagens.pt/portugal/serra-da-arrabida-visitar-ver-fazer-praias/" }
        ]
    },
    {
        "id": 16,
        "title": "Carnaval de Sesimbra",
        "categoria": "cultura",
        "icone": "🎭",
        "description": "Desfiles e muita cor nas ruas de Sesimbra, com música, máscaras e festa em família.",
        "links": [
            { "name": "Agenda Cultural – Câmara Municipal", "url": "https://www.sesimbra.pt/" },
            { "name": "Turismo em Sesimbra", "url": "https://www.visitarportugal.pt/" }
        ]
    },
    {
        "id": 17,
        "title": "Festa no Castelo de Sesimbra",
        "categoria": "cultura",
        "icone": "🏰",
        "description": "Celebrações religiosas e culturais no Castelo de Sesimbra, com espetáculos, mercados e tradição local.",
        "links": [
            { "name": "Agenda Cultural – Câmara Municipal", "url": "https://www.sesimbra.pt/" },
            { "name": "Património Histórico", "url": "https://www.patrimoniocultural.gov.pt/" }
        ]
    },
    {
        "id": 18,
        "title": "Forte de Santiago",
        "categoria": "cultura",
        "icone": "🏰",
        "description": "O Forte de Santiago, construído no século XVII, guarda a entrada da baía de Sesimbra. Hoje alberga exposições e eventos culturais.",
        "links": [
            { "name": "Câmara Municipal de Sesimbra", "url": "https://www.sesimbra.pt/" },
            { "name": "Visitar Sesimbra", "url": "https://www.visitarportugal.pt/distritos/setubal/concelhos/sesimbra/" }
        ]
    },
    {
        "id": 17,
        "title": "Museus e Arqueologia",
        "categoria": "cultura",
        "icone": "🏛️",
        "description": "Descubra o Museu Arqueológico de Sesimbra e as pegadas de dinossauros do Jurássico espalhadas pelo concelho.",
        "links": [
            { "name": "Museu Municipal de Sesimbra", "url": "https://www.sesimbra.pt/pt/menu/172/museu-municipal.aspx" },
            { "name": "Pegadas de Dinossauros", "url": "https://viajarentreviagens.pt/" }
        ]
    },
    {
        "id": 18,
        "title": "Visita ao Castelo",
        "categoria": "cultura",
        "icone": "🗺️",
        "description": "O Castelo de Sesimbra, de origem mourisca, oferece vistas panorâmicas da vila e do oceano. Entrada gratuita.",
        "links": [
            { "name": "Câmara Municipal de Sesimbra", "url": "https://www.sesimbra.pt/" },
            { "name": "Património Histórico", "url": "https://www.patrimoniocultural.gov.pt/" }
        ]
    }
];
const hospedagemLista = [
    {
        "id": 1,
        "title": "Sesimbra Hotel & Spa ★★★★",
        "description": "Hotel moderno em frente à Praia do Ouro, com piscina, spa e vista panorâmica.",
        "image": "img/hotel-sesimbra-spa.jpg",
        "altImage": "Sesimbra Hotel & Spa",
        "siteUrl": "https://www.sesimbrahotelspa.com/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Sesimbra+Hotel+%26+Spa"
    },
    {
        "id": 2,
        "title": "SANA Sesimbra Hotel ★★★★",
        "description": "Localizado na marginal, com rooftop, piscina aquecida e vista para a baía.",
        "image": "img/hotel-sana-sesimbra.jpg",
        "altImage": "SANA Sesimbra Hotel",
        "siteUrl": "https://www.sanahotels.com/sana-sesimbra/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=SANA+Sesimbra+Hotel"
    },
    {
        "id": 3,
        "title": "Hotel do Mar ★★★★",
        "description": "Hotel clássico com vista elevada sobre a vila e acesso direto à praia.",
        "image": "img/hotel-do-mar.jpg",
        "altImage": "Hotel do Mar Sesimbra",
        "siteUrl": "https://www.hoteldomar.pt/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Hotel+do+Mar+Sesimbra"
    },
    {
        "id": 4,
        "title": "Four Points by Sheraton Sesimbra ★★★★",
        "description": "Hotel moderno com piscina exterior, restaurante e ambiente tranquilo.",
        "image": "img/hotel-fourpoints.jpg",
        "altImage": "Four Points by Sheraton Sesimbra",
        "siteUrl": "https://www.marriott.com/en-us/hotels/lisfp-four-points-sesimbra/overview/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Four+Points+by+Sheraton+Sesimbra"
    },
    {
        "id": 5,
        "title": "Hotel dos Zimbros ★★★★",
        "description": "Localizado perto do Cabo Espichel, ideal para descanso e natureza.",
        "image": "img/hotel-zimbros.jpg",
        "altImage": "Hotel dos Zimbros",
        "siteUrl": "https://www.hotelzimbros.com/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Hotel+dos+Zimbros"
    },
    {
        "id": 6,
        "title": "Eco-Lodge da Arrábida",
        "description": "Alojamento sustentável no coração da serra, perfeito para amantes da natureza.",
        "image": "img/hotel-ecolodge.jpg",
        "altImage": "Eco Lodge Arrábida",
        "siteUrl": "https://www.ecolodgesarrabida.com/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Eco-Lodge+da+Arrabida"
    },
    {
        "id": 7,
        "title": "Casa da Praça Guest House",
        "description": "Guest house acolhedora no centro histórico, perto da praia e restaurantes.",
        "image": "img/hotel-casa-praca.jpg",
        "altImage": "Casa da Praça Sesimbra",
        "siteUrl": "https://casadapraca.pt/",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Casa+da+Praça+Guest+House+Sesimbra"
    },
    {
        "id": 8,
        "title": "Sesimbra Ocean View Apartments",
        "description": "Apartamentos turísticos com vista total para o mar e excelente localização.",
        "image": "img/hotel-oceanview.jpg",
        "altImage": "Sesimbra Ocean View Apartments",
        "siteUrl": "https://www.google.com/search?q=Sesimbra+Ocean+View+Apartments",
        "bookingUrl": "https://www.booking.com/hotel/pt/sesimbra-ocean-view.html"
    },
    {
        "id": 9,
        "title": "Sesimbra Beach Suites",
        "description": "Apartamentos com varanda e vista para o mar, ideais para famílias e grupos.",
        "image": "img/sesimbra-beach-suites.jpg",
        "altImage": "Sesimbra Beach Suites",
        "siteUrl": "https://www.google.com/search?q=Sesimbra+Beach+Suites",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Sesimbra+Beach+Suites+Portugal"
    },
    {
        "id": 10,
        "title": "Hostel da Vila",
        "description": "Alojamento económico no centro de Sesimbra, perfeito para jovens viajantes e mochileiros.",
        "image": "img/hostel-da-vila.jpg",
        "altImage": "Hostel da Vila",
        "siteUrl": "https://www.google.com/search?q=Hostel+da+Vila+Sesimbra",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Hostel+da+Vila+Sesimbra"
    },
    {
        "id": 11,
        "title": "Castelo View Residences",
        "description": "Estúdios e apartamentos com decoração moderna, perto do centro histórico.",
        "image": "img/castelo-view-residences.jpg",
        "altImage": "Castelo View Residences",
        "siteUrl": "https://www.google.com/search?q=Castelo+View+Residences+Sesimbra",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Castelo+View+Residences+Sesimbra"
    },
    {
        "id": 12,
        "title": "Camping Sesimbra",
        "description": "Área de campismo perto da serra e do mar, ideal para quem procura uma experiência mais natural.",
        "image": "img/camping-sesimbra.jpg",
        "altImage": "Camping Sesimbra",
        "siteUrl": "https://www.google.com/search?q=Camping+Sesimbra",
        "bookingUrl": "https://www.booking.com/searchresults.html?ss=Camping+Sesimbra"
    }
];

const versaoImagensHospedagem = "20260524";

const inputNome = document.getElementById("inputNome")
const inputEmail = document.getElementById("inputEmail")
const inputTelefone = document.getElementById("inputTelefone")
const inputTelefoneCompleto = document.getElementById("inputTelefoneCompleto")
const inputMensagem = document.getElementById("inputMensagem")
const nomeErro = document.getElementById("nomeErro")
const emailErro = document.getElementById("emailErro")
const telefoneErro = document.getElementById("telefoneErro")
const botaoSubmit = document.getElementById("botaoSubmit")
const respostaValidacao = document.getElementById("respostaValidacao")
const mensagemLength = document.getElementById("mensagemLength")
const navLinks = document.getElementById("navLinks")
const formularioContacto = document.getElementById("formularioContacto")
const darkModeBotao = document.getElementById("darkModeBotao")
const apiBaseUrl = 'http://127.0.0.1:5000'
const contactServerStatus = document.getElementById("contactServerStatus")
const pontosTuristicos = document.getElementById("pontos-turisticos")
const inputPontosFiltro = document.getElementById("inputPontosFiltro")
const pontoCard = document.getElementById("pontoCard")
const actividadeCard = document.getElementById("actividadeCard")
const hospedagemCard = document.getElementById("hospedagemCard")

let pontosFiltrados = pontosTuristicosLista;
let telefoneInternacional = null;

if (inputTelefone && window.intlTelInput) {
    telefoneInternacional = window.intlTelInput(inputTelefone, {
        initialCountry: "pt",
        countryOrder: ["pt", "br", "es", "fr", "gb"],
        countrySelectorMode: "DROPDOWN",
        matchDropdownWidth: false,
        separateDialCode: true,
        nationalMode: true,
        placeholderNumberPolicy: "AGGRESSIVE",
        placeholderNumberType: "FIXED_LINE_OR_MOBILE",
        strictMode: true,
        allowedNumberTypes: ["MOBILE", "FIXED_LINE"],
        i18n: {
            searchPlaceholder: ""
        }
    });

}

if(formularioContacto){
    formularioContacto.addEventListener("submit", validarForm)
}
if (inputNome) {
    inputNome.addEventListener("input", function () {
        inputNome.classList.remove("campo-invalido")
        if (nomeErro) {
            nomeErro.classList.remove("visivel")
        }
    })
    inputNome.addEventListener("blur", function () {
        validarNomeVisual(true)
    })
}
if (inputEmail) {
    inputEmail.addEventListener("input", function () {
        inputEmail.classList.remove("campo-invalido")
        inputEmail.setCustomValidity("")
        if (emailErro) {
            emailErro.classList.remove("visivel")
        }
    })
    inputEmail.addEventListener("blur", function () {
        validarEmailVisual(true)
    })
    inputEmail.addEventListener("invalid", function () {
        validarEmailVisual(true)
    })
}
if (inputTelefone) {
    inputTelefone.addEventListener("input", function () {
        validarTelefoneVisual(false)
    })
    inputTelefone.addEventListener("blur", function () {
        validarTelefoneVisual(true)
    })
}
if (inputMensagem) {
    inputMensagem.addEventListener("input", inputMensagemNumero)
}
if (darkModeBotao) {
    darkModeBotao.addEventListener("click", darkModeToggle)
}
if (inputPontosFiltro) {
    inputPontosFiltro.addEventListener("input", atualizarInterface)
}
document.addEventListener("keydown", fecharOverlayComEsc)

// Funçao de ampliar imagem
// Cria uma nova imagem no meio do ecra, baseando na imagem clicada
function ampliarImagem(imagem) {
    const overlay = document.createElement("div");
    const imagemGrande = document.createElement("img");

    overlay.classList.add("overlay");               
    imagemGrande.classList.add("overlay-img");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Imagem ampliada. Prima Escape para fechar.");
    overlay.tabIndex = -1;

    imagemGrande.src = imagem.src;                  //Copia a imagem clicada para a nova imagem
    imagemGrande.alt = imagem.alt;

    overlay.appendChild(imagemGrande);              //Coloca a nova imagem no div overlay

    overlay.addEventListener("click", function () {     //Remove o overlay ao clicar
        overlay.remove();
    });

    document.body.appendChild(overlay);             //Adiciona o div overlay ao final do body
    overlay.focus();
}

function fecharOverlayComEsc(event) {
    if (event.key !== "Escape") return;

    const overlay = document.querySelector(".overlay");
    if (overlay) {
        overlay.remove();
    }
}

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

function ativarImagensEstaticas() {
    document.querySelectorAll('.card img:not([role="button"])').forEach(prepararImagemAmpliavel);
}

async function validarForm(event){
    event.preventDefault();
    const erros = [];
    const obrigatoriosEmFalta = [];
    respostaValidacao.innerHTML = "";
    respostaValidacao.className = "";

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const mensagem = inputMensagem.value.trim();

    inputNome.classList.remove("campo-invalido");
    inputEmail.classList.remove("campo-invalido");
    inputMensagem.classList.remove("campo-invalido");

    if (!nome) obrigatoriosEmFalta.push("nome");
    if (!email) obrigatoriosEmFalta.push("email");
    if (!mensagem) obrigatoriosEmFalta.push("mensagem");

    if (obrigatoriosEmFalta.length > 0) {
        if (!nome) inputNome.classList.add("campo-invalido");
        if (!email) inputEmail.classList.add("campo-invalido");
        if (!mensagem) inputMensagem.classList.add("campo-invalido");

        respostaValidacao.className = "erro";
        respostaValidacao.textContent = obrigatoriosEmFalta.length > 1
            ? `Por favor, preenche os campos obrigatórios: ${formatarListaCampos(obrigatoriosEmFalta)}.`
            : `Por favor, preenche o campo obrigatório: ${formatarListaCampos(obrigatoriosEmFalta)}.`;
        return;
    }

    if (nome.length < 3) {
        erros.push("Nome deve ter pelo menos 3 caracteres.");
        inputNome.classList.add("campo-invalido");
    }
    if (nome.length > 100) {
        erros.push("Nome deve ter menos de 100 caracteres.");
        inputNome.classList.add("campo-invalido");
    }
    if (/\d/.test(nome)) {
        erros.push("O nome não pode ter números.");
        inputNome.classList.add("campo-invalido");
    }
    else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
        erros.push("Nome inválido.");
        inputNome.classList.add("campo-invalido");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erros.push("Email inválido.");
        inputEmail.classList.add("campo-invalido");
    }
    if (email.length > 100) {
        erros.push("Email deve ter menos de 100 caracteres.");
        inputEmail.classList.add("campo-invalido");
    }
    if (mensagem.length < 3) {
        erros.push("Mensagem deve ter pelo menos 3 caracteres.");
        inputMensagem.classList.add("campo-invalido");
    }
    if (mensagem.length > 500) {
        erros.push("Mensagem deve ter menos de 500 caracteres.");
        inputMensagem.classList.add("campo-invalido");
    }
    validarEmailVisual(true);
    let telefoneValido = true;
    try {
        telefoneValido = validarTelefoneVisual(true);
    }
    catch (erro) {
        telefoneValido = validarTelefoneFallback(inputTelefone.value.trim(), "pt");
    }
    if (!telefoneValido) {
        erros.push("Telefone inválido.");
    }

    if (erros.length > 0){
        respostaValidacao.className = "erro";
        respostaValidacao.textContent = erros.join(" ");
    }
    else{
        if (inputTelefoneCompleto && telefoneInternacional && inputTelefone.value.trim() !== "") {
            try {
                inputTelefoneCompleto.value = telefoneInternacional.getNumber();
            } catch (e) {
                inputTelefoneCompleto.value = inputTelefone.value.trim();
            }
        }

        const telefone = inputTelefoneCompleto && inputTelefoneCompleto.value
            ? inputTelefoneCompleto.value
            : inputTelefone.value.trim();

        if (botaoSubmit) {
            botaoSubmit.disabled = true;
            botaoSubmit.textContent = "A enviar...";
        }
        respostaValidacao.className = "a-enviar";
        respostaValidacao.textContent = "A contactar o servidor...";

        try {
            const csrfToken = await obterCsrfToken();
            const resposta = await fetch(formularioContacto.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                body: JSON.stringify({
                    nome,
                    email,
                    telefone,
                    mensagem
                })
            });
            const dados = await resposta.json().catch(function () {
                return {};
            });

            if (!resposta.ok) {
                const errosServidor = Array.isArray(dados.erros)
                    ? dados.erros
                    : ["Não foi possível guardar a mensagem. Tente novamente."];
                respostaValidacao.className = "erro";
                const elemUl = document.createElement("ul");
                for (const e of errosServidor) {
                    const elemLi = document.createElement("li");
                    elemLi.textContent = e;
                    elemUl.appendChild(elemLi);
                }
                respostaValidacao.replaceChildren(elemUl);
                return;
            }

            respostaValidacao.className = "sucesso";
            respostaValidacao.textContent = "Mensagem enviada com sucesso.";
            formularioContacto.reset();
            inputNome.classList.remove("campo-invalido");
            inputEmail.classList.remove("campo-invalido");
            inputTelefone.classList.remove("campo-invalido");
            inputMensagem.classList.remove("campo-invalido");
            if (inputTelefoneCompleto) {
                inputTelefoneCompleto.value = "";
            }
            if (emailErro) {
                emailErro.classList.remove("visivel");
            }
            if (telefoneErro) {
                telefoneErro.classList.remove("visivel");
            }
            if (mensagemLength) {
                mensagemLength.textContent = "0";
            }
        }
        catch (erro) {
            respostaValidacao.className = "erro";
            respostaValidacao.textContent = "Não foi possível enviar a mensagem. Tente novamente.";
        }
        finally {
            if (botaoSubmit) {
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = "Enviar";
            }
        }
    }
}

function validarNomeVisual(mostrarMensagem){
    const nome = inputNome.value.trim();
    const temNumero = /\d/.test(nome);

    if (!nome || !temNumero) {
        inputNome.classList.remove("campo-invalido");
        inputNome.setCustomValidity("");
        if (nomeErro) {
            nomeErro.classList.remove("visivel");
        }
        return !temNumero;
    }

    inputNome.classList.add("campo-invalido");
    inputNome.setCustomValidity("");
    if (nomeErro) {
        nomeErro.textContent = "O nome não pode ter números.";
        nomeErro.classList.toggle("visivel", mostrarMensagem);
    }
    return false;
}

function validarEmailVisual(mostrarMensagem){
    const email = inputEmail.value.trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (email === "") {
        inputEmail.classList.remove("campo-invalido");
        inputEmail.setCustomValidity("");
        if (emailErro) {
            emailErro.textContent = "Por favor, insira o seu email.";
            emailErro.classList.remove("visivel");
        }
    }
    else if (!emailValido) {
        inputEmail.classList.add("campo-invalido");
        inputEmail.setCustomValidity("");
        if (emailErro) {
            emailErro.textContent = "Por favor, insira um email válido.";
            emailErro.classList.toggle("visivel", mostrarMensagem);
        }
    }
    else {
        inputEmail.classList.remove("campo-invalido");
        inputEmail.setCustomValidity("");
        if (emailErro) {
            emailErro.classList.remove("visivel");
        }
    }
}

function validarTelefoneVisual(mostrarMensagem){
    try {
        const telefone = inputTelefone.value.trim();

    if (telefone === "") {
        inputTelefone.classList.remove("campo-invalido");
        if (telefoneErro) {
            telefoneErro.classList.remove("visivel");
        }
        return true;
    }

    let dadosPais = { dialCode: "351", iso2: "pt" };
    let telefoneValido = false;

    if (telefoneInternacional && typeof telefoneInternacional.getSelectedCountryData === 'function') {
        try {
            dadosPais = telefoneInternacional.getSelectedCountryData() || dadosPais;
        } catch (e) {
            console.warn('validarTelefoneVisual: getSelectedCountryData failed', e)
        }
    }

    const indicativo = `+${dadosPais.dialCode}`;

    if (telefoneInternacional && typeof telefoneInternacional.isValidNumber === 'function') {
        try {
            telefoneValido = telefoneInternacional.isValidNumber();
        } catch (e) {
            console.warn('validarTelefoneVisual: isValidNumber failed', e)
            telefoneValido = validarTelefoneFallback(telefone, dadosPais.iso2);
        }
    } else {
        telefoneValido = validarTelefoneFallback(telefone, dadosPais.iso2);
    }

    if (!telefoneValido) {
        inputTelefone.classList.add("campo-invalido");
        if (telefoneErro) {
            telefoneErro.textContent = `Por favor, insira um telefone válido para ${indicativo}.`;
            telefoneErro.classList.toggle("visivel", mostrarMensagem);
        }
        return false;
    }

    inputTelefone.classList.remove("campo-invalido");
    if (telefoneErro) {
        telefoneErro.classList.remove("visivel");
    }
    return true;
    } catch (err) {
        console.error('validarTelefoneVisual: unexpected error', err)
        // Em caso de erro inesperado, não bloquear o envio — aceitar e deixar o servidor validar
        inputTelefone.classList.remove("campo-invalido");
        if (telefoneErro) {
            telefoneErro.classList.remove("visivel");
        }
        return true;
    }
}

function validarTelefoneFallback(telefone, pais){
    const digitos = telefone.replace(/\D/g, "");
    const tamanhosPorPais = {
        pt: [9],
        br: [10, 11],
        es: [9],
        fr: [9],
        gb: [10]
    };
    const tamanhosValidos = tamanhosPorPais[pais] || [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    return tamanhosValidos.includes(digitos.length);
}

function inputMensagemNumero(){
    mensagemLength.textContent = inputMensagem.value.length;
    // if (inputMensagem.value.length>500){
    //     mensagemLength.style.color = "red";
    // }
    // else{
    //     mensagemLength.style.color = "black";
    // }
}

function lerCookie(nome){
    const prefixo = `${nome}=`;
    const cookie = document.cookie
        .split(";")
        .map(valor => valor.trim())
        .find(valor => valor.startsWith(prefixo));

    return cookie ? cookie.slice(prefixo.length) : "";
}

async function obterCsrfToken(){
    const tokenAtual = lerCookie("csrf_token");
    if (tokenAtual) return tokenAtual;

    const resposta = await fetch("/api/csrf");
    const dados = await resposta.json();
    return dados.csrf_token || lerCookie("csrf_token");
}

function formatarListaCampos(campos) {
    if (campos.length <= 1) return campos[0] || "";
    if (campos.length === 2) return campos.join(" e ");
    return `${campos.slice(0, -1).join(", ")} e ${campos[campos.length - 1]}`;
}

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
        if (l.href === paginaAtual) {
            elemA.classList.add("ativo");
            elemA.setAttribute("aria-current", "page");
        }
        elemLi.appendChild(elemA)
        elemUl.appendChild(elemLi)
    }
    navLinks.appendChild(elemUl)
}

function addPontosTuristicos() {
    if (!pontoCard) return;

    pontoCard.replaceChildren();
    for (const ponto of pontosFiltrados) {
        const elemento = criaPonto(ponto);
        pontoCard.appendChild(elemento);
    }
}

function criaPonto(p) {
    const elemArt = document.createElement("article");

    const elemH3 = document.createElement("h3");
    const elemP = document.createElement("p");
    const elemImg = document.createElement("img");
    elemH3.textContent = p.title;
    elemP.textContent = p.description;
    elemImg.src = p.image;
    elemImg.alt = p.altImage;
    prepararImagemAmpliavel(elemImg);

    elemArt.appendChild(elemImg);
    elemArt.appendChild(elemH3);
    elemArt.appendChild(elemP);

    if (p.note || (p.events && p.events.length > 0)) {
        const alertWrapper = document.createElement("div");
        alertWrapper.classList.add("alert-popover");

        if (p.note) {
            const elemDestaque = document.createElement("p");
            elemDestaque.classList.add("destaque");
            elemDestaque.textContent = p.note;
            alertWrapper.appendChild(elemDestaque);
        }

        if (p.events && p.events.length > 0) {
            const eventosContainer = document.createElement("div");
            eventosContainer.classList.add("eventos-popup");
            const eventosTitulo = document.createElement("h4");
            eventosTitulo.textContent = "Eventos no local:";
            eventosContainer.appendChild(eventosTitulo);

            const eventosLista = document.createElement("ul");
            for (const evento of p.events) {
                const eventoItem = document.createElement("li");
                eventoItem.innerHTML = `<strong>${evento.title}</strong> (${evento.date}) — ${evento.description}`;
                eventosLista.appendChild(eventoItem);
            }
            eventosContainer.appendChild(eventosLista);
            alertWrapper.appendChild(eventosContainer);
        }

        elemArt.appendChild(alertWrapper);
    }

    return elemArt;
}
const categoriaTextos = { agua: "Água", natureza: "Natureza", aventura: "Aventura", cultura: "Cultura" };

let categoriaAtiva = "todos";
let pesquisaAtividade = "";

const inputActividadesFiltro = document.getElementById("inputActividadesFiltro");
const actividadesResultado = document.getElementById("actividadesResultado");
const btnsCategorias = document.querySelectorAll(".btn-categoria");

if (inputActividadesFiltro) {
    inputActividadesFiltro.addEventListener("input", function () {
        pesquisaAtividade = this.value.toLowerCase();
        atualizarAtividades();
    });
}

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

function filtrarAtividades() {
    return actividadesLista.filter(a => {
        const matchCategoria = categoriaAtiva === "todos" || a.categoria === categoriaAtiva;
        const matchPesquisa = pesquisaAtividade === "" ||
            a.title.toLowerCase().includes(pesquisaAtividade) ||
            a.description.toLowerCase().includes(pesquisaAtividade);
        return matchCategoria && matchPesquisa;
    });
}

function addActividades() {
    atualizarAtividades();
}

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
        elem.style.animationDelay = `${i * 0.05}s`;
        actividadeCard.appendChild(elem);
    });
}

function criaActividade(p) {
    const elemArt = document.createElement("article");
    elemArt.dataset.categoria = p.categoria;

    const elemIcone = document.createElement("span");
    elemIcone.classList.add("atividade-icone");
    elemIcone.setAttribute("aria-hidden", "true");
    elemIcone.textContent = p.icone || "🏖️";

    const elemHeader = document.createElement("div");
    elemHeader.classList.add("atividade-header");

    const elemH3 = document.createElement("h3");
    elemH3.textContent = p.title;

    const elemBadge = document.createElement("span");
    elemBadge.classList.add("categoria-badge", `categoria-${p.categoria}`);
    elemBadge.textContent = categoriaTextos[p.categoria] || p.categoria;

    elemHeader.appendChild(elemH3);
    elemHeader.appendChild(elemBadge);

    const elemP = document.createElement("p");
    elemP.textContent = p.description;

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
    elemArt.appendChild(elemUl);
    return elemArt;
}

function addHospedagem() {
    if (!hospedagemCard) return;

    hospedagemCard.replaceChildren();
    for (const hospedagem of hospedagemLista) {
        const elemento = criaHospedagem(hospedagem);
        hospedagemCard.appendChild(elemento);
    }
}

function normalizeHotelTitle(title) {
    return title.replace(/★+/g, '').replace(/\s+\*+.*$/, '').trim();
}

function criaHospedagem(p) {
    const elemArt = document.createElement("article");

    const elemH3 = document.createElement("h3");
    const elemImg = document.createElement("img");
    const elemP = document.createElement("p");
    const elemActions = document.createElement("div");
    const elemLinkSite = document.createElement("a");
    const elemLinkBooking = document.createElement("a");

    elemH3.textContent = p.title;
    elemImg.src = `${p.image}?v=${versaoImagensHospedagem}`;
    elemImg.alt = p.altImage;
    prepararImagemAmpliavel(elemImg);
    elemP.textContent = p.description;

    const hotelName = normalizeHotelTitle(p.title);
    const siteUrl = p.siteUrl || `https://www.google.com/search?q=${encodeURIComponent(hotelName)}`;
    const bookingUrl = p.bookingUrl || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelName)}`;

    elemLinkSite.textContent = "Site Oficial";
    elemLinkSite.href = siteUrl;
    elemLinkSite.target = "_blank";
    elemLinkSite.rel = "noopener noreferrer";
    elemLinkSite.classList.add("card-link");

    elemLinkBooking.textContent = "Ver no Booking";
    elemLinkBooking.href = bookingUrl;
    elemLinkBooking.target = "_blank";
    elemLinkBooking.rel = "noopener noreferrer";
    elemLinkBooking.classList.add("card-link");

    elemActions.classList.add("card-actions");
    elemActions.appendChild(elemLinkSite);
    elemActions.appendChild(elemLinkBooking);

    elemArt.appendChild(elemH3);
    elemArt.appendChild(elemImg);
    elemArt.appendChild(elemP);
    elemArt.appendChild(elemActions);
    return elemArt;
}

function filtrarPorNome() {
    if (!inputPontosFiltro) return pontosTuristicosLista;   //Se numa pagina sem Pontos de Interesse

    const resultado = [];
    const filtro = inputPontosFiltro.value.toLowerCase();

    if (filtro === "") {
        return pontosTuristicosLista;
    }
    else {
        for (const p of pontosTuristicosLista) {
            const titulo = p.title.toLowerCase();
            const descricao = p.description.toLowerCase();

            if (titulo.includes(filtro) || descricao.includes(filtro)) {
                resultado.push(p);
            }
        }
        return resultado;
    }
}
const gastroCard = document.getElementById("gastroCard");
const inputGastroFiltro = document.getElementById("inputGastroFiltro");

let gastronomiaFiltrada = gastronomiaLista;
const versaoImagensGastronomia = "20260524";

if (inputGastroFiltro) {
    inputGastroFiltro.addEventListener("input", atualizarGastronomia);
}

function criaRestaurante(r) {
    const elemArt = document.createElement("article");

    const elemH3 = document.createElement("h3");
    elemH3.textContent = r.title;

    const elemP = document.createElement("p");
    elemP.textContent = `${r.tipo} • ${r.local}`;

    const elemImg = document.createElement("img");
    elemImg.src = `${r.image}?v=${versaoImagensGastronomia}`;
    elemImg.alt = r.title;
    prepararImagemAmpliavel(elemImg);

    const phone = r.phone || `+351 21 200 00${String(r.id).padStart(2, '0')}`;

    const elemContato = document.createElement("div");
    elemContato.classList.add("card-contact");

    const elemPhone = document.createElement("p");
    elemPhone.innerHTML = `Tel: <a href="tel:${phone}">${phone}</a>`;
    elemContato.appendChild(elemPhone);

    if (r.email) {
        const elemEmail = document.createElement("p");
        elemEmail.innerHTML = `Email: <a href="mailto:${r.email}">${r.email}</a>`;
        elemContato.appendChild(elemEmail);
    }

    elemArt.appendChild(elemH3);
    elemArt.appendChild(elemP);
    elemArt.appendChild(elemImg);
    elemArt.appendChild(elemContato);

    return elemArt;
}

function filtrarGastronomia() {
    const filtro = inputGastroFiltro.value.toLowerCase();
    return gastronomiaLista.filter(r =>
        r.title.toLowerCase().includes(filtro) ||
        r.tipo.toLowerCase().includes(filtro) ||
        r.local.toLowerCase().includes(filtro)
    );
}

function atualizarGastronomia() {
    gastronomiaFiltrada = filtrarGastronomia();
    gastroCard.replaceChildren();

    for (const r of gastronomiaFiltrada) {
        gastroCard.appendChild(criaRestaurante(r));
    }
}

if (gastroCard) atualizarGastronomia();

function darkModeToggle(){
    document.body.classList.toggle("darkMode");

    // Guardar no localStorage; Depois de fazer toggle, faz "darkMode = true/false" dependendo se tem a class ou nao
    const isDarkMode = document.body.classList.contains("darkMode");
    localStorage.setItem("darkMode", isDarkMode);
    atualizarBotaoDarkMode();
}

// Ao carregar a pagina, verificar se dark mode de localStorage é true
function carregarDarkMode() {
    const darkModePref = localStorage.getItem("darkMode");
    if (darkModePref === "true") {
        document.body.classList.add("darkMode");
    }
    atualizarBotaoDarkMode();
}

function atualizarBotaoDarkMode() {
    if (!darkModeBotao) return;

    const isDarkMode = document.body.classList.contains("darkMode");
    darkModeBotao.type = "button";
    darkModeBotao.setAttribute("aria-label", isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro");
    darkModeBotao.setAttribute("aria-pressed", String(isDarkMode));
    darkModeBotao.title = isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro";
}

// DEPOIS
function atualizarPosicaoBotaoDarkMode() {
    if (!darkModeBotao) return;

    const nav = document.getElementById("navLinks");
    if (!nav) return;

    const navTop = nav.getBoundingClientRect().top;
    document.body.classList.toggle("dark-botao-fixo", navTop <= 0);
}

function protegerLinksExternos() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
        link.rel = "noopener noreferrer";
    });
}

function escaparHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatarMensagemAssistente(texto) {
    return escaparHtml(texto)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/^\s*\*\s+/gm, "- ")
        .replace(/#{1,6}\s*/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\n/g, "<br>");
}

function iniciarAssistenteIA() {
    if (document.getElementById("assistenteIa")) return;

    const ASSISTENTE_STORAGE_KEY = "assistenteIaEstado";
    const ASSISTENTE_VERSAO = 1;
    const ASSISTENTE_INATIVIDADE_MAX = 30 * 60 * 1000;
    const ASSISTENTE_IDADE_MAX = 8 * 60 * 60 * 1000;

    function carregarEstadoAssistente() {
        const agora = Date.now();
        const estado = JSON.parse(sessionStorage.getItem(ASSISTENTE_STORAGE_KEY) || "{}");
        const criadoEm = estado.criadoEm || agora;
        const atualizadoEm = estado.atualizadoEm || agora;
        const expirouPorVersao = estado.versao && estado.versao !== ASSISTENTE_VERSAO;
        const expirouPorInatividade = agora - atualizadoEm > ASSISTENTE_INATIVIDADE_MAX;
        const expirouPorIdade = agora - criadoEm > ASSISTENTE_IDADE_MAX;

        if (expirouPorVersao || expirouPorInatividade || expirouPorIdade) {
            sessionStorage.removeItem(ASSISTENTE_STORAGE_KEY);
            return {};
        }

        return estado;
    }

    const estadoGuardado = carregarEstadoAssistente();
    const mensagensGuardadas = Array.isArray(estadoGuardado.mensagens) ? estadoGuardado.mensagens : [];

    const wrapper = document.createElement("aside");
    wrapper.id = "assistenteIa";
    wrapper.className = "assistente-ia";
    wrapper.innerHTML = `
        <button type="button" class="assistente-toggle" aria-label="Abrir assistente de viagem" aria-expanded="false">?</button>
        <section class="assistente-painel" aria-label="Assistente de viagem com IA">
            <div class="assistente-topo">
                <div>
                    <h2>Assistente IA</h2>
                    <p>Peça um roteiro, tempos, custos, transportes, restaurantes ou pontos a visitar.</p>
                </div>
                <div class="assistente-acoes">
                    <button type="button" class="assistente-minimizar" aria-label="Minimizar assistente">-</button>
                    <button type="button" class="assistente-fechar" aria-label="Fechar assistente">x</button>
                </div>
            </div>
            <div class="assistente-mensagens" aria-live="polite"></div>
            <form class="assistente-form">
                <div class="assistente-form-topo">
                    <label for="assistentePergunta">Faça a sua pergunta</label>
                    <button type="button" class="assistente-limpar" aria-label="Limpar conversa" title="Limpar conversa">🗑</button>
                </div>
                <textarea id="assistentePergunta" name="pergunta" maxlength="700" required placeholder="Ex: Quero visitar o Castelo, Cabo Espichel e almoçar peixe. Faz um plano com tempos e custos."></textarea>
                <button type="submit">Enviar</button>
            </form>
        </section>
    `;

    document.body.appendChild(wrapper);

    const toggle = wrapper.querySelector(".assistente-toggle");
    const painel = wrapper.querySelector(".assistente-painel");
    const fechar = wrapper.querySelector(".assistente-fechar");
    const limpar = wrapper.querySelector(".assistente-limpar");
    const minimizar = wrapper.querySelector(".assistente-minimizar");
    const topo = wrapper.querySelector(".assistente-topo");
    const form = wrapper.querySelector(".assistente-form");
    const textarea = wrapper.querySelector("textarea");
    const mensagens = wrapper.querySelector(".assistente-mensagens");
    const botaoEnviar = form.querySelector("button");

    function obterMensagensGuardadas() {
        return Array.from(mensagens.querySelectorAll(".assistente-msg")).map((msg) => ({
            tipo: msg.classList.contains("assistente-user") ? "user" : "bot",
            texto: msg.dataset.texto || msg.textContent
        }));
    }

    function guardarEstadoAssistente() {
        const agora = Date.now();
        sessionStorage.setItem(ASSISTENTE_STORAGE_KEY, JSON.stringify({
            versao: ASSISTENTE_VERSAO,
            criadoEm: estadoGuardado.criadoEm || agora,
            atualizadoEm: agora,
            mensagens: obterMensagensGuardadas(),
            scrollTop: mensagens.scrollTop
        }));
    }

    function resetarConversaAssistente() {
        sessionStorage.removeItem(ASSISTENTE_STORAGE_KEY);
        mensagens.replaceChildren();
        adicionarMensagem("Olá! Diz-me o que queres visitar em Sesimbra e eu preparo um plano de viagem.", "bot");
        textarea.value = "";
        guardarEstadoAssistente();
    }

    function definirAberto(aberto) {
        if (!aberto) {
            painel.style.left = "";
            painel.style.top = "";
            painel.style.right = "";
            painel.style.bottom = "";
        }

        wrapper.classList.toggle("aberto", aberto);
        toggle.setAttribute("aria-expanded", String(aberto));
        if (aberto) textarea.focus();
        guardarEstadoAssistente();
    }

    function adicionarMensagem(texto, tipo) {
        const msg = document.createElement("p");
        msg.className = `assistente-msg assistente-${tipo}`;
        msg.dataset.texto = texto;
        msg.innerHTML = tipo === "bot" ? formatarMensagemAssistente(texto) : escaparHtml(texto).replace(/\n/g, "<br>");
        mensagens.appendChild(msg);
        mensagens.scrollTop = mensagens.scrollHeight;
        guardarEstadoAssistente();
        return msg;
    }

    function aplicarPosicaoAssistente(posicao) {
        if (!posicao || !posicao.left || !posicao.top) return;

        painel.style.left = posicao.left;
        painel.style.top = posicao.top;
        painel.style.right = "auto";
        painel.style.bottom = "auto";
    }

    function limitarPosicao(left, top) {
        const rect = painel.getBoundingClientRect();
        const margem = 12;
        const maxLeft = window.innerWidth - rect.width - margem;
        const maxTop = window.innerHeight - rect.height - margem;

        return {
            left: Math.min(Math.max(margem, left), Math.max(margem, maxLeft)),
            top: Math.min(Math.max(margem, top), Math.max(margem, maxTop))
        };
    }

    function iniciarArrasto(event) {
        if (event.target.closest("button")) return;

        const inicioX = event.clientX;
        const inicioY = event.clientY;
        const rect = painel.getBoundingClientRect();
        const leftInicial = rect.left;
        const topInicial = rect.top;

        topo.setPointerCapture(event.pointerId);
        painel.classList.add("arrastando");

        function mover(e) {
            const posicao = limitarPosicao(
                leftInicial + e.clientX - inicioX,
                topInicial + e.clientY - inicioY
            );
            painel.style.left = `${posicao.left}px`;
            painel.style.top = `${posicao.top}px`;
            painel.style.right = "auto";
            painel.style.bottom = "auto";
        }

        function terminar(e) {
            topo.releasePointerCapture(e.pointerId);
            painel.classList.remove("arrastando");
            topo.removeEventListener("pointermove", mover);
            topo.removeEventListener("pointerup", terminar);
            topo.removeEventListener("pointercancel", terminar);
            guardarEstadoAssistente();
        }

        topo.addEventListener("pointermove", mover);
        topo.addEventListener("pointerup", terminar);
        topo.addEventListener("pointercancel", terminar);
    }

    if (mensagensGuardadas.length) {
        for (const msg of mensagensGuardadas) {
            adicionarMensagem(msg.texto, msg.tipo);
        }
        mensagens.scrollTop = estadoGuardado.scrollTop || mensagens.scrollHeight;
    }
    else {
        adicionarMensagem("Olá! Diz-me o que queres visitar em Sesimbra e eu preparo um plano de viagem.", "bot");
    }

    toggle.addEventListener("click", () => definirAberto(!wrapper.classList.contains("aberto")));
    fechar.addEventListener("click", () => definirAberto(false));
    limpar.addEventListener("click", resetarConversaAssistente);
    minimizar.addEventListener("click", () => definirAberto(false));
    topo.addEventListener("pointerdown", iniciarArrasto);
    mensagens.addEventListener("scroll", guardarEstadoAssistente, { passive: true });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const pergunta = textarea.value.trim();
        if (!pergunta) return;

        adicionarMensagem(pergunta, "user");
        textarea.value = "";
        const estado = adicionarMensagem("A preparar uma sugestão para si...", "bot");
        botaoEnviar.disabled = true;

        try {
            const apiBase = "";

            const resposta = await fetch(`${apiBase}/api/chatbot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pergunta,
                    pagina: window.location.pathname.split("/").pop() || "sesimbra.html"
                })
            });

            const dados = await resposta.json();
            if (!resposta.ok) {
                estado.innerHTML = formatarMensagemAssistente(dados.resposta || "Não consegui responder agora. Tente novamente dentro de alguns segundos.");
                estado.dataset.texto = estado.textContent;
                guardarEstadoAssistente();
                return;
            }

            estado.innerHTML = formatarMensagemAssistente(dados.resposta);
            estado.dataset.texto = dados.resposta;

            const pontosMapa = extrairPontosDoTexto(dados.resposta);
            if (pontosMapa.length >= 2) {
                const pontosOtimizados = otimizarRota(pontosMapa);
                const rotaMudou = !rotasIguais(pontosMapa, pontosOtimizados);
                const urlOriginal = construirUrlGoogleMaps(pontosMapa);
                const urlOtimizada = construirUrlGoogleMaps(pontosOtimizados);

                estado.appendChild(criarResumoCustos(pontosMapa));

                const wrapper = document.createElement("div");
                wrapper.className = "botao-navegar-wrapper";
                const botaoNav = document.createElement("a");
                botaoNav.href = urlOriginal;
                botaoNav.target = "_blank";
                botaoNav.rel = "noopener noreferrer";
                botaoNav.className = "botao-navegar";
                botaoNav.textContent = "Navegar no Google Maps";
                wrapper.appendChild(botaoNav);

                if (rotaMudou) {
                    const sugestao = document.createElement("div");
                    sugestao.className = "rota-sugestao";
                    sugestao.innerHTML = `
                        <p class="rota-sugestao-texto">🔄 Rota mais curta: ${pontosOtimizados.map(p => p.nome).join(" → ")}</p>
                        <div class="rota-sugestao-botoes">
                            <button class="btn-aceitar-rota">✓ Aceitar rota otimizada</button>
                            <button class="btn-rejeitar-rota">✗ Manter ordem original</button>
                        </div>`;
                    sugestao.querySelector(".btn-aceitar-rota").addEventListener("click", () => {
                        botaoNav.href = urlOtimizada;
                        sugestao.remove();
                    });
                    sugestao.querySelector(".btn-rejeitar-rota").addEventListener("click", () => {
                        sugestao.remove();
                    });
                    estado.appendChild(sugestao);
                }

                estado.appendChild(wrapper);
            }

            guardarEstadoAssistente();
        }
        catch (erro) {
            estado.textContent = "Não consegui responder agora. Tente novamente dentro de alguns segundos.";
            estado.dataset.texto = estado.textContent;
            guardarEstadoAssistente();
        }
        finally {
            botaoEnviar.disabled = false;
        }
    });

    painel.style.left = "";
    painel.style.top = "";
    painel.style.right = "";
    painel.style.bottom = "";
    wrapper.classList.remove("aberto");
    toggle.setAttribute("aria-expanded", "false");
}

function aplicarFiltros() {

    pontosFiltrados = filtrarPorNome();
}

function atualizarInterface() {
    aplicarFiltros();
    addPontosTuristicos();
}
const PONTOS_GPS = {
    "Praia do Ouro":               "38.4438,-9.1052",
    "Castelo de Sesimbra":         "38.4517,-9.0973",
    "Porto de Abrigo":             "38.4364,-9.1163",
    "Praia da Ribeira do Cavalo":  "38.4297,-9.1139",
    "Cabo Espichel":               "38.4190,-9.2146",
    "Parque Natural da Arrábida":  "38.4836,-9.0274",
    "Arrábida":                    "38.4836,-9.0274",
    "Lagoa de Albufeira":          "38.5116,-9.1785",
    "Praia da Califórnia":         "38.4414,-9.1005",
    "Pegadas de Dinossauros":      "38.4243,-9.2065",
    "Forte de Santiago":           "38.4441,-9.1005",
    "Praia do Meco":               "38.3956,-9.0361",
};

function extrairPontosDoTexto(texto) {
    const encontrados = [];
    const textoLower = texto.toLowerCase();
    for (const [nome, coords] of Object.entries(PONTOS_GPS)) {
        if (textoLower.includes(nome.toLowerCase()) && !encontrados.find(p => p.coords === coords)) {
            encontrados.push({ nome, coords });
        }
    }
    return encontrados;
}

function construirUrlGoogleMaps(pontos) {
    const waypoints = pontos.map(p => p.coords).join("/");
    return "https://www.google.com/maps/dir/" + waypoints;
}

function calcularDistanciaKm(c1, c2) {
    const [lat1, lon1] = c1.split(",").map(Number);
    const [lat2, lon2] = c2.split(",").map(Number);
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function otimizarRota(pontos) {
    if (pontos.length <= 2) return pontos;
    const restantes = [...pontos];
    const otimizados = [restantes.shift()];
    while (restantes.length > 0) {
        const ultimo = otimizados[otimizados.length - 1];
        let menorIdx = 0;
        let menorDist = Infinity;
        restantes.forEach((p, i) => {
            const d = calcularDistanciaKm(ultimo.coords, p.coords);
            if (d < menorDist) { menorDist = d; menorIdx = i; }
        });
        otimizados.push(restantes.splice(menorIdx, 1)[0]);
    }
    return otimizados;
}

function rotasIguais(r1, r2) {
    return r1.map(p => p.nome).join() === r2.map(p => p.nome).join();
}

function criarResumoCustos(pontos) {
    const SESIMBRA = "38.4438,-9.1052";
    const todos = [SESIMBRA, ...pontos.map(p => p.coords)];
    let distKm = 0;
    for (let i = 0; i < todos.length - 1; i++) distKm += calcularDistanciaKm(todos[i], todos[i+1]);
    distKm = Math.round(distKm * 1.3);

    const combustivel = Math.round(distKm * 0.08 * 1.75 * 10) / 10;
    const transportePublico = Math.max(4, pontos.length * 2);
    const almoco = 18;
    const bilhetes = 0;
    const totalCarro = Math.round(combustivel + almoco + bilhetes);
    const totalTransporte = Math.round(transportePublico + almoco + bilhetes);

    const div = document.createElement("div");
    div.className = "custo-resumo";
    div.innerHTML = `
        <p class="custo-titulo">Custos estimados por pessoa</p>
        <div class="custo-linha"><span>🚗 Combustível (~${distKm} km)</span><span>~${combustivel}€</span></div>
        <div class="custo-linha custo-ou"><span>🚌 Transporte público</span><span>~${transportePublico}€</span></div>
        <div class="custo-linha"><span>🍽️ Almoço</span><span>~${almoco}€</span></div>
        <div class="custo-linha custo-total"><span>Total (carro + almoço)</span><span>~${totalCarro}€</span></div>
        <div class="custo-linha custo-total"><span>Total (transporte + almoço)</span><span>~${totalTransporte}€</span></div>
    `;
    return div;
}

const ICONES_TIPO = { ponto: "📍", atividade: "🏄", gastronomia: "🍽️", alojamento: "🏨" };

function criaSugestaoCard(s) {
    const elemArt = document.createElement("article");
    elemArt.classList.add("sugestao-card-comunidade");

    const badge = document.createElement("span");
    badge.className = "badge-comunidade";
    badge.textContent = "💡 Comunidade";

    const icone = document.createElement("span");
    icone.className = "atividade-icone";
    icone.textContent = ICONES_TIPO[s.tipo] || "💡";

    const h3 = document.createElement("h3");
    h3.textContent = s.nome;

    const p = document.createElement("p");
    p.textContent = s.descricao;

    elemArt.appendChild(badge);
    elemArt.appendChild(icone);
    elemArt.appendChild(h3);
    elemArt.appendChild(p);

    if (s.localizacao) {
        const loc = document.createElement("p");
        loc.innerHTML = `<small>📍 ${s.localizacao}</small>`;
        elemArt.appendChild(loc);
    }
    if (s.website) {
        const a = document.createElement("a");
        a.href = s.website;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Ver website";
        elemArt.appendChild(a);
    }
    return elemArt;
}

async function carregarSugestoesAprovadas(tipo, container) {
    if (!container) return;
    try {
        const res = await fetch(`/api/sugestoes/aprovadas?tipo=${tipo}`);
        if (!res.ok) return;
        const lista = await res.json();
        if (!lista.length) return;

        const separador = document.createElement("p");
        separador.className = "sugestoes-separador";
        separador.textContent = "Sugestões da comunidade";
        container.appendChild(separador);

        lista.forEach(s => container.appendChild(criaSugestaoCard(s)));
    } catch { /* silent */ }
}

function carregarTodasSugestoesAprovadas() {
    carregarSugestoesAprovadas("alojamento", hospedagemCard);
    carregarSugestoesAprovadas("gastronomia", gastroCard);
    carregarSugestoesAprovadas("atividade", actividadeCard);
    carregarSugestoesAprovadas("ponto", pontoCard);
}

function iniciarModalSugestao() {
    const TIPOS = [
        { val: "ponto",      label: "Ponto Turístico" },
        { val: "atividade",  label: "Atividade" },
        { val: "gastronomia",label: "Gastronomia" },
        { val: "alojamento", label: "Alojamento" },
    ];

    const overlay = document.createElement("div");
    overlay.id = "sugestaoOverlay";
    overlay.className = "sugestao-overlay oculto";
    overlay.innerHTML = `
        <div class="sugestao-modal" role="dialog" aria-modal="true" aria-labelledby="sugestaoTitulo">
            <button class="sugestao-fechar" aria-label="Fechar">✕</button>
            <h2 id="sugestaoTitulo">Sugerir novo local</h2>
            <p class="sugestao-intro">Conheces um local que merece estar aqui? Partilha a tua sugestão — a equipa irá analisar e publicar se aprovado.</p>
            <form id="formSugestao" novalidate>
                <label for="sugTipo">Categoria <span aria-hidden="true">*</span></label>
                <select id="sugTipo" name="tipo" required>
                    <option value="">-- Escolhe uma categoria --</option>
                    ${TIPOS.map(t => `<option value="${t.val}">${t.label}</option>`).join("")}
                </select>
                <label for="sugNome">Nome <span aria-hidden="true">*</span></label>
                <input type="text" id="sugNome" name="nome" placeholder="Ex: Restaurante O Mar" maxlength="100" required>
                <label for="sugDesc">Descrição <span aria-hidden="true">*</span></label>
                <textarea id="sugDesc" name="descricao" placeholder="Descreve brevemente o local..." maxlength="500" rows="3" required></textarea>
                <label for="sugLocal">Localização / Morada</label>
                <input type="text" id="sugLocal" name="localizacao" placeholder="Ex: Rua da Praia, Sesimbra" maxlength="200">
                <label for="sugWeb">Website</label>
                <input type="url" id="sugWeb" name="website" placeholder="https://..." maxlength="200">
                <label for="sugEmail">O teu email (para feedback)</label>
                <input type="email" id="sugEmail" name="email" placeholder="opcional" maxlength="100">
                <div id="sugResposta" class="sugestao-resposta" aria-live="polite"></div>
                <button type="submit" class="sugestao-btn-enviar">Enviar sugestão</button>
            </form>
        </div>`;
    document.body.appendChild(overlay);

    const botaoFlutuante = document.createElement("button");
    botaoFlutuante.className = "botao-sugerir";
    botaoFlutuante.setAttribute("aria-label", "Sugerir novo local");
    botaoFlutuante.innerHTML = "💡 Sugerir";
    document.body.appendChild(botaoFlutuante);

    function abrirModal() {
        overlay.classList.remove("oculto");
        overlay.querySelector("#sugTipo").focus();
    }
    function fecharModal() {
        overlay.classList.add("oculto");
        document.getElementById("formSugestao").reset();
        document.getElementById("sugResposta").textContent = "";
    }

    botaoFlutuante.addEventListener("click", abrirModal);
    overlay.querySelector(".sugestao-fechar").addEventListener("click", fecharModal);
    overlay.addEventListener("click", e => { if (e.target === overlay) fecharModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

    document.getElementById("formSugestao").addEventListener("submit", async function (e) {
        e.preventDefault();
        const resp = document.getElementById("sugResposta");
        const btn = this.querySelector(".sugestao-btn-enviar");
        resp.textContent = "";
        resp.className = "sugestao-resposta";

        const tipo = document.getElementById("sugTipo").value;
        const nome = document.getElementById("sugNome").value.trim();
        const descricao = document.getElementById("sugDesc").value.trim();

        if (!tipo || nome.length < 3 || descricao.length < 10) {
            resp.textContent = "Preenche os campos obrigatórios (categoria, nome e descrição).";
            resp.classList.add("erro");
            return;
        }

        btn.disabled = true;
        btn.textContent = "A enviar...";
        try {
            const csrf = await obterCsrfToken();
            const res = await fetch("/api/sugestoes", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
                body: JSON.stringify({
                    tipo,
                    nome,
                    descricao,
                    localizacao: document.getElementById("sugLocal").value.trim(),
                    website:     document.getElementById("sugWeb").value.trim(),
                    email:       document.getElementById("sugEmail").value.trim(),
                })
            });
            const dados = await res.json();
            if (!res.ok) {
                resp.textContent = (dados.erros || [dados.erro || "Erro ao enviar."]).join(" ");
                resp.classList.add("erro");
            } else {
                resp.textContent = "✓ " + dados.mensagem;
                resp.classList.add("sucesso");
                this.reset();
                setTimeout(fecharModal, 2000);
            }
        } catch {
            resp.textContent = "Não foi possível enviar. Tente novamente.";
            resp.classList.add("erro");
        } finally {
            btn.disabled = false;
            btn.textContent = "Enviar sugestão";
        }
    });
}

carregarDarkMode();             // Chamar a funçao ao carregar a pagina
addNavLinks();                   // Funçao para adicionar o nav
atualizarPosicaoBotaoDarkMode();
window.addEventListener("scroll", atualizarPosicaoBotaoDarkMode, { passive: true });
window.addEventListener("resize", atualizarPosicaoBotaoDarkMode);

addActividades();                   // Funçao para adicionar actividades
addHospedagem();                   // Funçao para adicionar hospedagem

atualizarInterface();   
ativarImagensEstaticas();
protegerLinksExternos();
iniciarAssistenteIA();
iniciarModalSugestao();
carregarTodasSugestoesAprovadas();
