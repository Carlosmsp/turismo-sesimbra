# Sesimbra - Guia de Viagem

 
Affonso Neto		 20240910
Alexandre Neves	 50032545 
André Pereira		 20241780 
Carlos Pereira 	 20241813

Links do Projeto

Repositório Principal GitHub	https://github.com/Carlosmsp/Pro-Web



Site intermedio online	https://web-production-1065.up.railway.app
Rep. GitHub intermedio	https://github.com/Carlosmsp/turismo-sesimbra
Enviado convite ao professor deste repositório no início de junho onde guardamos neste repositório uma versão intermédia que estava online .



Projeto académico de Programação Web dedicado ao concelho de Sesimbra. O site reúne páginas informativas, mapa interativo, formulário de contacto, sistema de sugestões da comunidade ("Sugestão da Malta"), painel de administração e assistente IA integrado com Gemini.

## Como Executar

Na raiz do repositório:

```bash
python iniciar.py
```

O script instala as dependências de `Projecto-Sesimbra/requirements.txt`, entra na pasta do projeto e inicia o servidor Flask.

Depois abre:

```text
http://127.0.0.1:5000
```

O painel admin fica em:

```text
http://127.0.0.1:5000/admin.html?token=ADMIN_TOKEN
```

## Variáveis de Ambiente

O ficheiro `Projecto-Sesimbra/.env` pode conter:

```env
GEMINI_API_KEY=colocar_chave_aqui
ADMIN_TOKEN=colocar_token_admin_aqui
```

Sem `GEMINI_API_KEY`, o assistente mostra uma resposta de fallback. O `ADMIN_TOKEN` protege as rotas administrativas (`/api/admin/...` e `/api/restaurantes/telefones`).

## Funcionalidades

### Páginas e navegação

- Páginas de turismo: início, pontos turísticos, atividades, gastronomia, alojamentos, história, transportes e contactos, além de página 404 personalizada.
- Navegação gerada por JavaScript com estado ativo por página.
- Filtros de texto em tempo real para pontos turísticos, atividades, restaurantes e alojamentos.
- Modo escuro com preferência guardada em `localStorage`; botão de alternância com ícone perfeitamente centrado.
- Overlay para ampliar imagens ao clicar.
- Carrossel de imagens na secção Galeria da página inicial.
- Mapa interativo (Leaflet + OpenStreetMap) na página de atividades, com marcadores coloridos por categoria para pontos turísticos.

### Cards e conteúdo

- Cards reutilizáveis para pontos turísticos, restaurantes e alojamentos, com avaliações Google (estrelas + link para o Google Maps), morada, contactos (telefone/email) e links para site/reserva (Booking, etc.).
- Moradas preenchidas via geocodificação inversa (Nominatim/OpenStreetMap) a partir das coordenadas de cada ponto, com cache de pedidos para coordenadas partilhadas.
- Limite de linhas (`line-clamp`) consistente nas descrições para manter os cards uniformes.
- Conteúdo editorial principal lido da base de dados SQLite (`origem = 'oficial'`).

### Sugestões da comunidade ("Sugestão da Malta")

- Widget flutuante presente nas páginas principais, com convite e categoria sugerida adaptados a cada página.
- Formulário com validação no frontend (limites de caracteres por campo e por categoria — Ponto turístico, Gastronomia, Alojamento, Atividade), validação de telefone internacional via `intl-tel-input` e upload de foto (máx. 3 MB, JPG/PNG/WebP).
- Sugestões ficam `pendente` até serem moderadas no painel admin.
- Sugestões `aceite` são publicadas nas tabelas oficiais com `origem = 'malta'` e aparecem automaticamente nas páginas relevantes (`/api/recomendacoes`).

### Painel de administração

- Gestão de contactos (`pendente` / `resolvido`), com exportação dos contactos resolvidos em XLSX (formatado com `openpyxl`).
- Moderação de sugestões da comunidade: aceitar (com pré-visualização e edição dos campos antes de publicar), recusar ou criar uma sugestão diretamente no admin já como publicada.
- Pré-visualização ("PRÉVIA NA PÁGINA") do card resultante para cada categoria, incluindo localização e contactos.
- Pesquisa automática de telefones de restaurantes via OpenStreetMap/Nominatim, com opção de forçar nova pesquisa.
- Edição de coordenadas de qualquer entrada de conteúdo diretamente no admin.
- Resumo de contagens (contactos pendentes, sugestões pendentes/aceites, logs da IA) e consulta de logs do assistente IA.

### Assistente IA

- Assistente com histórico temporário em `sessionStorage` e painel arrastável.
- Contexto construído dinamicamente a partir dos dados da base SQLite (pontos turísticos, restaurantes, alojamentos, atividades).
- Meteorologia em tempo real integrada no contexto do assistente (Open-Meteo).
- Dados de transportes em tempo real via Transit API.
- Sugestão de roteiros e rotas com links diretos para o Google Maps.
- Cada pedido/resposta é registado em `API_Log.db` para consulta no painel admin.

### Segurança e validação

- Formulário de contacto e widget de sugestões com validação no frontend e no servidor, incluindo validação internacional de telemóvel via `intl-tel-input`.
- Proteção CSRF e rate limit por IP para contactos, sugestões e chatbot.
- Base de dados SQLite incluída para facilitar a execução após clone.

## Estrutura

```text
Pro-Web/
├── iniciar.py
├── README.md
└── Projecto-Sesimbra/
    ├── app.py
    ├── requirements.txt
    ├── .env
    ├── backend/
    │   ├── rotas.py
    │   ├── seguranca.py
    │   ├── configuracoes.py
    │   └── validadores.py
    ├── database/
    │   ├── API_Log.db
    │   └── Projeto.db
    ├── frontend/
    │   ├── sesimbra.html
    │   ├── pontos-turisticos.html
    │   ├── atividades.html
    │   ├── gastronomia.html
    │   ├── alojamentos.html
    │   ├── historia.html
    │   ├── transportes.html
    │   ├── contactos.html
    │   ├── admin.html
    │   └── 404.html
    ├── assets/
    │   ├── styles-final.css
    │   ├── admin.css
    │   └── js/
    │       ├── dados.js
    │       ├── elementos.js
    │       ├── imagens.js
    │       ├── galeria.js
    │       ├── contactos.js
    │       ├── pontos-turisticos.js
    │       ├── mapa.js
    │       ├── cards.js
    │       ├── ui.js
    │       ├── chatbot.js
    │       ├── sugestoes.js
    │       ├── recomendacoes.js
    │       ├── admin.js
    │       └── main.js
    └── img/
        └── sugestoes/
```

## Organização do Código

- `iniciar.py` — arranque simples do projeto após clone.
- `app.py` — ponto de entrada Flask; inicializa a aplicação, as bases de dados (com migrações automáticas), o contexto do assistente IA e regista as rotas.
- `backend/rotas.py` — rotas públicas, APIs e rotas de administração.
- `backend/seguranca.py` — CORS, CSRF, token admin e rate limiting.
- `backend/configuracoes.py` — caminhos do projeto, constantes e leitura do `.env`.
- `backend/validadores.py` — validações de contactos e de sugestões da comunidade (limites por campo/categoria, telefone internacional, URLs).
- `frontend/` — páginas HTML.
- `assets/admin.css` — estilos do painel administrativo.
- `assets/js/` — JavaScript dividido por responsabilidade; carregamento por ordem definida, terminando em `main.js` (ou `admin.js` no painel admin):
  - `dados.js` — leitura e conversão dos dados vindos da API.
  - `elementos.js` — referências a elementos do DOM partilhados.
  - `imagens.js` — overlay de ampliação de imagens.
  - `galeria.js` — carrossel de imagens da secção Galeria da página inicial.
  - `contactos.js` — formulário de contacto.
  - `pontos-turisticos.js` — listagem e filtros de pontos turísticos/atividades.
  - `mapa.js` — mapa interativo Leaflet (página de atividades).
  - `cards.js` — geração dos cards de pontos turísticos, restaurantes e alojamentos.
  - `ui.js` — modo escuro, navegação e outros comportamentos gerais de interface.
  - `chatbot.js` — assistente IA (painel arrastável e histórico).
  - `sugestoes.js` — widget "Sugestão da Malta" e respetiva validação.
  - `recomendacoes.js` — injeção das recomendações aprovadas nas páginas.
  - `admin.js` — lógica completa do painel de administração.
- `database/` — ficheiros SQLite usados pelo projeto.
- `img/sugestoes/` — fotografias enviadas através das sugestões da comunidade.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python 3, Flask |
| Base de dados | SQLite |
| IA | Google Gemini 2.5 Flash |
| Mapa | Leaflet + OpenStreetMap |
| Geocodificação | Nominatim (OpenStreetMap) |
| Meteorologia | Open-Meteo |
| Transportes | Transit API |
| Telefone | intl-tel-input v29 |
| Exportação | openpyxl (XLSX) |

## Rotas Principais

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Página inicial |
| `GET` | `/<pagina>.html` | Páginas do frontend |
| `GET` | `/api/csrf` | Gera/devolve token CSRF |
| `GET` | `/api/conteudo` | Devolve conteúdo oficial da base de dados |
| `GET` | `/api/recomendacoes` | Devolve sugestões aceites da comunidade (`origem = 'malta'`) |
| `POST` | `/contactos` e `/api/contactos` | Guarda mensagem de contacto |
| `POST` | `/api/sugestoes` | Guarda sugestão enviada por visitante (com foto opcional) |
| `POST` | `/api/chatbot` | Envia pergunta ao assistente IA |
| `GET` | `/api/restaurantes/telefones` | Pesquisa telefones de restaurantes via OpenStreetMap (admin) |
| `GET` | `/api/admin/contactos` | Lista contactos no admin |
| `GET` | `/api/admin/resumo` | Resumo de contagens para o painel admin |
| `POST` | `/api/admin/contactos/<id>/resolver` | Marca contacto como resolvido |
| `POST` | `/api/admin/contactos/<id>/apagar` | Apaga contacto |
| `GET` | `/api/admin/contactos/exportar.xlsx` | Exporta contactos resolvidos em XLSX |
| `GET` | `/api/admin/sugestoes` | Lista sugestões no admin (filtrável por estado) |
| `POST` | `/api/admin/sugestoes` | Cria e publica uma sugestão diretamente a partir do admin |
| `POST` | `/api/admin/sugestoes/<id>/<acao>` | Aceita ou recusa uma sugestão (`aceitar`/`recusar`) |
| `GET` | `/api/admin/conteudo` | Lista conteúdo editável no admin |
| `POST` | `/api/admin/conteudo/<tabela>/<id>` | Atualiza campos de uma entrada de conteúdo |
| `GET` | `/api/admin/coordenadas` | Devolve coordenadas de todas as entradas |
| `POST` | `/api/admin/coordenadas/<tabela>/<id>` | Atualiza coordenadas de uma entrada |
| `GET` | `/api/logs` | Lista logs da IA |

## Base de Dados

O projeto usa dois ficheiros SQLite:

- `database/Projeto.db` — contactos, conteúdo do site (pontos turísticos, restaurantes, alojamentos, atividades) e sugestões da comunidade.
- `database/API_Log.db` — logs das chamadas ao assistente IA.

As tabelas de conteúdo (`pontos_interesse`, `restaurantes`, `alojamentos`, `atividades`) distinguem a origem dos registos através da coluna `origem`:

- `oficial` — conteúdo editorial do guia.
- `malta` — sugestões da comunidade aceites, ligadas à sugestão original via `origem_sugestao_id`.

As tabelas são criadas automaticamente ao iniciar a aplicação, incluindo migrações para bases de dados existentes (colunas novas são adicionadas sem perda de dados). Todos os registos com coordenadas têm morada preenchida via geocodificação inversa.

Neste projeto académico, os `.db` ficam incluídos no repositório para que o professor ou qualquer colega consiga clonar e executar de imediato. Em projetos profissionais, estes ficheiros seriam substituídos por scripts de migração e dados de exemplo.

## Estados

**Contactos:** `pendente` → `resolvido`

**Sugestões da comunidade:** `pendente` → `aceite` ou `recusada`

## Segurança

- CSRF no formulário de contactos e no envio de sugestões.
- Rate limit por IP para chatbot (8 pedidos/minuto, 45/hora) e contactos/sugestões (5 mensagens/10 minutos).
- Token administrativo via `ADMIN_TOKEN`, exigido em todas as rotas `/api/admin/*` e em `/api/restaurantes/telefones`.
- Validação de dados no frontend e no servidor (limites de caracteres, formatos de telefone/URL/email, categorias permitidas).
- Validação do caminho das fotos de sugestões para garantir que ficam dentro de `img/sugestoes/`.
- Links externos com `rel="noopener noreferrer"`.
- Respostas estruturadas em JSON nas APIs.

## Observações

O projeto foi organizado para manter uma estrutura clara sem adicionar frameworks ou ferramentas de build. A separação privilegia simplicidade, facilidade de execução e leitura do código. Todo o código está comentado em português.
