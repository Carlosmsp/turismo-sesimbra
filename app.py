from __future__ import annotations

import json
import math
import os
import re
import secrets
import smtplib
import sqlite3
import time
from collections import defaultdict, deque
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
_DATA_DIR = Path("/data") if Path("/data").exists() else BASE_DIR
DB_PATH = _DATA_DIR / "sesimbra.db"
DB_PATH = DB_PATH
DADOS_EXTRAS_PATH = BASE_DIR / "dados_extras.json"
GEMINI_MODEL = "gemini-2.5-flash"
app = Flask(__name__, static_folder=None)
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5000",
    "http://localhost:5000",
}
RATE_LIMIT_JANELA_CURTA = 60
RATE_LIMIT_JANELA_LONGA = 60 * 60
RATE_LIMIT_MAX_CURTO = 8
RATE_LIMIT_MAX_LONGO = 45
RATE_LIMIT_INTERVALO_MINIMO = 2.5
RATE_LIMIT_PEDIDOS: dict[str, deque[float]] = defaultdict(deque)
CONTACTOS_RATE_LIMIT_MAX = 5
CONTACTOS_RATE_LIMIT_JANELA = 10 * 60
CONTACTOS_RATE_LIMIT_PEDIDOS: dict[str, deque[float]] = defaultdict(deque)
OSM_USER_AGENT = "Projecto-Sesimbra/1.0 (+https://github.com/Carlosmsp/Pro-Web)"


def carregar_env() -> None:
    env_path = BASE_DIR / ".env"

    if not env_path.exists():
        return

    for linha in env_path.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()

        if not linha or linha.startswith("#") or "=" not in linha:
            continue

        chave, valor = linha.split("=", 1)
        chave = chave.strip()
        valor = valor.strip().strip('"').strip("'")

        if chave and chave not in os.environ:
            os.environ[chave] = valor


carregar_env()


@app.after_request
def adicionar_cors(response):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-CSRF-Token, X-Admin-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    set_cookie_headers = response.headers.getlist("Set-Cookie")
    csrf_ja_definido = any(header.startswith("csrf_token=") for header in set_cookie_headers)

    if "csrf_token" not in request.cookies and not csrf_ja_definido:
        response.set_cookie(
            "csrf_token",
            secrets.token_urlsafe(32),
            httponly=False,
            samesite="Strict",
            secure=False,
        )

    return response


def obter_ip_cliente() -> str:
    encaminhado = request.headers.get("X-Forwarded-For", "")
    if encaminhado:
        return encaminhado.split(",")[0].strip()

    return request.remote_addr or "desconhecido"


def verificar_limite_ip(ip: str) -> tuple[bool, str]:
    agora = time.time()
    pedidos = RATE_LIMIT_PEDIDOS[ip]

    while pedidos and agora - pedidos[0] > RATE_LIMIT_JANELA_LONGA:
        pedidos.popleft()

    if pedidos and agora - pedidos[-1] < RATE_LIMIT_INTERVALO_MINIMO:
        return False, "Aguarde alguns segundos antes de enviar outra pergunta."

    pedidos_ultimo_minuto = [momento for momento in pedidos if agora - momento <= RATE_LIMIT_JANELA_CURTA]
    if len(pedidos_ultimo_minuto) >= RATE_LIMIT_MAX_CURTO:
        return False, "Recebemos muitas perguntas em pouco tempo. Tente novamente dentro de um minuto."

    if len(pedidos) >= RATE_LIMIT_MAX_LONGO:
        return False, "Limite temporário atingido para este dispositivo. Tente novamente mais tarde."

    pedidos.append(agora)
    return True, ""


def verificar_limite_contactos(ip: str) -> tuple[bool, str]:
    agora = time.time()
    pedidos = CONTACTOS_RATE_LIMIT_PEDIDOS[ip]

    while pedidos and agora - pedidos[0] > CONTACTOS_RATE_LIMIT_JANELA:
        pedidos.popleft()

    if len(pedidos) >= CONTACTOS_RATE_LIMIT_MAX:
        return False, "Recebemos muitas mensagens em pouco tempo. Tente novamente mais tarde."

    pedidos.append(agora)
    return True, ""


def validar_csrf() -> bool:
    token_cookie = request.cookies.get("csrf_token", "")
    token_header = request.headers.get("X-CSRF-Token", "")
    return bool(token_cookie and token_header and secrets.compare_digest(token_cookie, token_header))


def validar_admin_token() -> bool:
    admin_token = os.environ.get("ADMIN_TOKEN", "")
    token_recebido = request.headers.get("X-Admin-Token", "") or request.args.get("token", "")
    return bool(admin_token and token_recebido and secrets.compare_digest(admin_token, token_recebido))

CENTRO_SESIMBRA = {
    "nome": "Centro de Sesimbra",
    "lat": 38.4445,
    "lon": -9.1015,
}

PONTOS = [
    {
        "nome": "Praia do Ouro",
        "descricao": "Praia central com areia dourada, aguas calmas e acesso facil a partir da vila.",
        "lat": 38.4438,
        "lon": -9.1052,
        "interesses": ["praia", "gastronomia"],
        "tempo": 75,
        "custo": 0,
    },
    {
        "nome": "Castelo de Sesimbra",
        "descricao": "Fortaleza no topo da colina com vista panoramica sobre a vila e o oceano.",
        "lat": 38.4517,
        "lon": -9.0973,
        "interesses": ["historia", "natureza"],
        "tempo": 60,
        "custo": 0,
    },
    {
        "nome": "Porto de Abrigo",
        "descricao": "Zona ligada a tradicao piscatoria, ideal para passeio e contacto com a vida maritima.",
        "lat": 38.4364,
        "lon": -9.1163,
        "interesses": ["gastronomia", "historia"],
        "tempo": 45,
        "custo": 0,
    },
    {
        "nome": "Praia da Ribeira do Cavalo",
        "descricao": "Praia natural conhecida pelas aguas transparentes e ambiente mais selvagem.",
        "lat": 38.4297,
        "lon": -9.1139,
        "interesses": ["praia", "natureza"],
        "tempo": 90,
        "custo": 0,
    },
    {
        "nome": "Cabo Espichel",
        "descricao": "Miradouro costeiro com santuario, farol e paisagem dramatica sobre o Atlantico.",
        "lat": 38.4190,
        "lon": -9.2146,
        "interesses": ["historia", "natureza"],
        "tempo": 75,
        "custo": 0,
    },
    {
        "nome": "Parque Natural da Arrabida",
        "descricao": "Area protegida com biodiversidade, trilhos, praias e vistas sobre a serra e o mar.",
        "lat": 38.4836,
        "lon": -9.0274,
        "interesses": ["natureza", "praia"],
        "tempo": 120,
        "custo": 0,
        "aviso": "Em julho e agosto existem limitacoes ao transito automovel em zonas da Arrabida.",
    },
    {
        "nome": "Lagoa de Albufeira",
        "descricao": "Zona natural com lagoa, praia e paisagens abertas, boa para familias e desportos nauticos.",
        "lat": 38.5116,
        "lon": -9.1785,
        "interesses": ["praia", "natureza"],
        "tempo": 90,
        "custo": 0,
    },
]

RESTAURANTES = {
    "baixo": "Taberna Isaias - peixe grelhado e ambiente tradicional no centro de Sesimbra.",
    "medio": "Casa Mateus - marisco e pratos de peixe, boa escolha para uma refeicao principal.",
    "alto": "O Velho e o Mar - sugestao para uma experiencia mais completa junto ao mar.",
}

PONTOS_INTERESSE_DB = [
    (1, "Castelo de Sesimbra", "Fortaleza historica com vista panoramica sobre a vila e o oceano.", "historia", "img/Castelo_Sesimbra.jpg", 38.4517, -9.0973, 60, 0, ""),
    (2, "Praia do Ouro", "Praia central com aguas calmas, areia dourada e acesso facil a partir da vila.", "praia", "img/praia-do-ouro-em-sesimbra.jpeg", 38.4438, -9.1052, 75, 0, ""),
    (3, "Parque Natural da Arrabida", "Area protegida com trilhos, biodiversidade, praias e vistas sobre a serra e o mar.", "natureza", "img/parque_natural_da_arrabia.jpg", 38.4836, -9.0274, 120, 0, "Em julho e agosto existem limitacoes ao transito automovel em zonas da Arrabida."),
    (4, "Porto de Abrigo", "Zona ligada a tradicao piscatoria, ideal para passeio e contacto com a vida maritima.", "gastronomia", "img/porto-de-abrigo.jpg", 38.4364, -9.1163, 45, 0, ""),
    (5, "Cabo Espichel", "Santuario, farol e miradouro costeiro com paisagem dramatica sobre o Atlantico.", "historia", "img/Cabo-Espichel.jpg", 38.4190, -9.2146, 75, 0, ""),
    (6, "Lagoa de Albufeira", "Zona natural com lagoa, praia e atividades nauticas, boa para familias.", "natureza", "img/Lagoa-Albufeira.jpg", 38.5116, -9.1785, 90, 0, ""),
    (7, "Pegadas de Dinossauros", "Locais com vestigios jurassicos no concelho, incluindo Pedreira do Avelino e Pedra da Mua.", "historia", "img/Pegadas-Dinossauro-Meco.jpg", None, None, 60, 0, ""),
    (8, "Praia da California", "Praia central de Sesimbra, adequada para banho e passeio junto ao mar.", "praia", "img/praia-da-california.jpg", None, None, 75, 0, ""),
    (9, "Praia da Ribeira do Cavalo", "Praia natural conhecida pelas aguas transparentes e ambiente mais selvagem.", "praia", "img/praia-da-ribeira-do-cavalo.jpg", 38.4297, -9.1139, 90, 0, "Acesso mais exigente, recomendado com cuidado."),
]

RESTAURANTES_DB = [
    (1, "Casa Mateus", "Marisco", "Sesimbra", "img/casa-mateus-sesimbra.jpg", "+351 963 650 939", "reservas@casamateus.pt"),
    (2, "O Zagaia", "Peixe", "Sesimbra", "img/Zagaia.jpg", "+351 966 280 204", ""),
    (3, "Taberna Isaias", "Peixe grelhado", "Sesimbra", "img/taberna-do-isaias.jpg", "+351 914 574 373", ""),
    (4, "O Batel", "Marisco", "Sesimbra", "img/o-batel.jpg", "+351 969 306 556", ""),
    (5, "O Rodinhas", "Marisqueira", "Sesimbra", "img/o-rodinhas.jpg", "+351 212 231 557", ""),
    (6, "Cantinho da Regina", "Internacional", "Sesimbra", "img/cantinho-da-regina.jpg", "+351 212 235 182", ""),
    (7, "O Velho e o Mar", "Peixe", "Sesimbra", "img/oVelhoeoMar.jpg", "", ""),
]

ALOJAMENTOS_DB = [
    (1, "Sesimbra Hotel & Spa", "Hotel moderno em frente a Praia do Ouro, com piscina, spa e vista panoramica.", "img/hotel-sesimbra-spa.jpg", "https://www.sesimbrahotelspa.com/", "https://www.booking.com/searchresults.html?ss=Sesimbra+Hotel+%26+Spa"),
    (2, "SANA Sesimbra Hotel", "Hotel na marginal, com rooftop, piscina aquecida e vista para a baia.", "img/hotel-sana-sesimbra.jpg", "https://www.sanahotels.com/sana-sesimbra/", "https://www.booking.com/searchresults.html?ss=SANA+Sesimbra+Hotel"),
    (3, "Hotel do Mar", "Hotel classico com vista elevada sobre a vila e acesso direto a praia.", "img/hotel-do-mar.jpg", "https://www.hoteldomar.pt/", "https://www.booking.com/searchresults.html?ss=Hotel+do+Mar+Sesimbra"),
    (4, "Four Points by Sheraton Sesimbra", "Hotel moderno com piscina exterior, restaurante e ambiente tranquilo.", "img/hotel-fourpoints.jpg", "https://www.marriott.com/en-us/hotels/lisfp-four-points-sesimbra/overview/", "https://www.booking.com/searchresults.html?ss=Four+Points+by+Sheraton+Sesimbra"),
    (5, "Hotel dos Zimbros", "Alojamento perto do Cabo Espichel, ideal para descanso e natureza.", "img/hotel-zimbros.jpg", "https://www.hotelzimbros.com/", "https://www.booking.com/searchresults.html?ss=Hotel+dos+Zimbros"),
    (6, "Camping Sesimbra", "Area de campismo perto da serra e do mar.", "img/camping-sesimbra.jpg", "https://www.google.com/search?q=Camping+Sesimbra", "https://www.booking.com/searchresults.html?ss=Camping+Sesimbra"),
]

ATIVIDADES_DB = [
    (1, "Mergulho", "agua", "Recifes, grutas e vida marinha para explorar em Sesimbra."),
    (2, "Passeios de Barco", "agua", "Passeios por praias secretas, grutas marinhas e costa da Arrabida."),
    (3, "Ver Golfinhos", "agua", "Observacao de golfinhos no habitat natural com operadores locais."),
    (4, "Kayak e Stand Up Paddle", "agua", "Percursos pela baia de Sesimbra e grutas da Arrabida."),
    (5, "Caminhadas e Trilhos", "natureza", "Percursos pela serra e pela costa, com vistas para o mar."),
    (6, "Observacao de Estrelas", "natureza", "O Cabo Espichel e uma boa zona para observar o ceu noturno."),
    (7, "Festas e Eventos", "cultura", "Eventos culturais e populares, incluindo Festas do Mar e Carnaval."),
    (8, "Museus e Arqueologia", "cultura", "Museu Municipal, castelo e vestigios de dinossauros no concelho."),
]

LIMITES_DURACAO = {
    "meio-dia": 3,
    "1-dia": 5,
    "2-dias": 7,
}

SITE_CONTEXT = """
Site: guia de viagem de Sesimbra, Portugal.

Pontos turisticos principais:
- Castelo de Sesimbra: fortaleza historica com vista panoramica sobre a vila e o oceano.
- Praia do Ouro: praia central, aguas calmas, areia dourada, boa para passeio e familias.
- Praia da California: praia central de Sesimbra, adequada para banho e passeio junto ao mar.
- Praia da Ribeira do Cavalo: praia natural com aguas transparentes; acesso mais exigente.
- Parque Natural da Arrabida: natureza, trilhos e praias; em julho e agosto ha limitacoes ao transito automovel.
- Porto de Abrigo: zona piscatoria, barcos, tradicao maritima e bons pontos para comer peixe.
- Cabo Espichel: santuario, farol, miradouro e paisagem costeira.
- Lagoa de Albufeira: lagoa, praia, natureza e atividades nauticas.
- Pegadas de Dinossauros: locais com vestigios jurassicos no concelho.

Gastronomia:
- Casa Mateus: marisco, Sesimbra.
- O Zagaia: peixe, Sesimbra.
- Taberna Isaias: peixe grelhado, Sesimbra.
- O Batel: marisco, Sesimbra.
- O Rodinhas: marisqueira, Sesimbra.
- Cantinho da Regina: comida internacional, Sesimbra.
- O Velho e o Mar: peixe, Sesimbra.

Alojamentos:
- Hotel do Mar, Sana Sesimbra, Sesimbra Oceanfront Hotel, Four Points, Hotel dos Zimbros,
  Hotel Casa da Praca, Sesimbra Beach Suites, Hostel da Vila, camping e eco-lodges.

Contactos uteis:
- Posto de Turismo de Sesimbra: Rua da Fortaleza, 43.
- Camara Municipal de Sesimbra: Rua da Republica, 3.

Objetivo do assistente:
Responder perguntas do utilizador e, quando pedido, criar planos de viagem com ordem de visita,
rotas aproximadas, tempos, transportes, restaurantes e custos previstos. Se nao houver dados
oficiais, apresentar valores como estimativas.
"""


def ler_dados_extras() -> dict:
    """Lê o ficheiro dados_extras.json que persiste sugestões aprovadas entre deployments."""
    if not DADOS_EXTRAS_PATH.exists():
        return {"pontos_interesse": [], "restaurantes": [], "alojamentos": [], "atividades": []}
    try:
        return json.loads(DADOS_EXTRAS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"pontos_interesse": [], "restaurantes": [], "alojamentos": [], "atividades": []}


def guardar_sugestao_em_extras(sugestao: dict) -> None:
    """Guarda uma sugestão aprovada no ficheiro dados_extras.json (commited no git)."""
    dados = ler_dados_extras()
    tipo = sugestao.get("tipo", "")
    nome = str(sugestao.get("nome", "")).strip()
    descricao = str(sugestao.get("descricao", "")).strip()
    localizacao = str(sugestao.get("localizacao") or "").strip()
    telefone = str(sugestao.get("telefone") or "").strip()
    website = str(sugestao.get("website") or "").strip()
    website_booking = str(sugestao.get("website_booking") or "").strip()
    cat_atividade = str(sugestao.get("categoria_atividade") or "").strip() or "outros"
    cat_turistica = str(sugestao.get("categoria_turistica") or "").strip() or "outros"
    alerta = str(sugestao.get("alerta") or "").strip()

    if tipo == "ponto" and not any(p["nome"] == nome for p in dados["pontos_interesse"]):
        dados["pontos_interesse"].append({
            "nome": nome, "descricao": descricao, "categoria": cat_turistica,
            "imagem": None, "lat": None, "lon": None,
            "tempo_minutos": 90, "custo_estimado": 0, "aviso": alerta or None,
        })
    elif tipo == "atividade" and not any(a["nome"] == nome for a in dados["atividades"]):
        dados["atividades"].append({"nome": nome, "categoria": cat_atividade, "descricao": descricao})
    elif tipo == "gastronomia" and not any(r["nome"] == nome for r in dados["restaurantes"]):
        dados["restaurantes"].append({
            "nome": nome, "tipo": "Gastronomia", "local": localizacao or "",
            "imagem": None, "telefone": telefone or None, "email": None,
        })
    elif tipo == "alojamento" and not any(a["nome"] == nome for a in dados["alojamentos"]):
        dados["alojamentos"].append({
            "nome": nome, "descricao": descricao, "imagem": None,
            "site_url": website or None, "booking_url": website_booking or None,
        })
    DADOS_EXTRAS_PATH.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def aplicar_dados_extras_na_db(conn: sqlite3.Connection) -> None:
    """Re-aplica os dados_extras.json à BD — garante persistência após novo deployment."""
    dados = ler_dados_extras()
    for p in dados.get("pontos_interesse", []):
        if not conn.execute("SELECT 1 FROM pontos_interesse WHERE nome = ? LIMIT 1", (p["nome"],)).fetchone():
            conn.execute(
                "INSERT INTO pontos_interesse (nome, descricao, categoria, imagem, lat, lon, tempo_minutos, custo_estimado, aviso) VALUES (?,?,?,?,?,?,?,?,?)",
                (p["nome"], p["descricao"], p.get("categoria", "outros"), p.get("imagem"),
                 p.get("lat"), p.get("lon"), p.get("tempo_minutos", 90), p.get("custo_estimado", 0), p.get("aviso")),
            )
    for r in dados.get("restaurantes", []):
        if not conn.execute("SELECT 1 FROM restaurantes WHERE nome = ? LIMIT 1", (r["nome"],)).fetchone():
            conn.execute(
                "INSERT INTO restaurantes (nome, tipo, local, imagem, telefone, email) VALUES (?,?,?,?,?,?)",
                (r["nome"], r.get("tipo", ""), r.get("local", ""), r.get("imagem"), r.get("telefone"), r.get("email")),
            )
    for a in dados.get("alojamentos", []):
        if not conn.execute("SELECT 1 FROM alojamentos WHERE nome = ? LIMIT 1", (a["nome"],)).fetchone():
            conn.execute(
                "INSERT INTO alojamentos (nome, descricao, imagem, site_url, booking_url) VALUES (?,?,?,?,?)",
                (a["nome"], a.get("descricao", ""), a.get("imagem"), a.get("site_url"), a.get("booking_url")),
            )
    for at in dados.get("atividades", []):
        if not conn.execute("SELECT 1 FROM atividades WHERE nome = ? LIMIT 1", (at["nome"],)).fetchone():
            conn.execute(
                "INSERT INTO atividades (nome, categoria, descricao) VALUES (?,?,?)",
                (at["nome"], at.get("categoria", "outros"), at.get("descricao", "")),
            )


def init_contactos_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contactos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL,
                telefone TEXT,
                mensagem TEXT NOT NULL,
                criado_em TEXT NOT NULL
            )

            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contactos_respostas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contacto_id INTEGER NOT NULL,
                assunto TEXT NOT NULL,
                mensagem TEXT NOT NULL,
                criado_em TEXT NOT NULL,
                FOREIGN KEY (contacto_id) REFERENCES contactos(id)
            )
            """
        )
        for _col_def in ["respondido INTEGER NOT NULL DEFAULT 0", "respondido_em TEXT"]:
            try:
                conn.execute(f"ALTER TABLE contactos ADD COLUMN {_col_def}")
            except Exception:
                pass
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS pontos_interesse (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT NOT NULL,
                categoria TEXT NOT NULL,
                imagem TEXT,
                lat REAL,
                lon REAL,
                tempo_minutos INTEGER,
                custo_estimado REAL,
                aviso TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS restaurantes (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL,
                local TEXT NOT NULL,
                imagem TEXT,
                telefone TEXT,
                email TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS alojamentos (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT NOT NULL,
                imagem TEXT,
                site_url TEXT,
                booking_url TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS atividades (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                categoria TEXT NOT NULL,
                descricao TEXT NOT NULL
            )
            """
        )
        conn.executemany(
            """
            INSERT OR REPLACE INTO pontos_interesse
            (id, nome, descricao, categoria, imagem, lat, lon, tempo_minutos, custo_estimado, aviso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            PONTOS_INTERESSE_DB,
        )
        conn.executemany(
            """
            INSERT OR REPLACE INTO restaurantes
            (id, nome, tipo, local, imagem, telefone, email)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            RESTAURANTES_DB,
        )
        conn.executemany(
            """
            INSERT OR REPLACE INTO alojamentos
            (id, nome, descricao, imagem, site_url, booking_url)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ALOJAMENTOS_DB,
        )
        conn.executemany(
            """
            INSERT OR REPLACE INTO atividades
            (id, nome, categoria, descricao)
            VALUES (?, ?, ?, ?)
            """,
            ATIVIDADES_DB,
        )


def init_db() -> None:
    init_contactos_db()
    init_sugestoes_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS api_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                endpoint TEXT NOT NULL,
                modelo TEXT,
                pedido_json TEXT NOT NULL,
                resposta_json TEXT NOT NULL,
                prompt TEXT,
                resposta_text TEXT,
                estado TEXT NOT NULL
            )
            """
        )
        aplicar_dados_extras_na_db(conn)
        conn.commit()


def guardar_log_api(endpoint: str, modelo: str, pedido: dict, resposta: dict, prompt: str, resposta_text: str, estado: str) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO api_logs (endpoint, modelo, pedido_json, resposta_json, prompt, resposta_text, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                endpoint,
                modelo,
                json.dumps(pedido, ensure_ascii=False),
                json.dumps(resposta, ensure_ascii=False),
                prompt,
                resposta_text,
                estado,
            ),
        )


def _env(chave: str, default: str = "") -> str:
    """Lê sempre o valor mais recente do .env (ignora cache do os.environ)."""
    env_path = BASE_DIR / ".env"
    if env_path.exists():
        for linha in env_path.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if not linha or linha.startswith("#") or "=" not in linha:
                continue
            k, v = linha.split("=", 1)
            if k.strip() == chave:
                return v.strip().strip('"').strip("'")
    return os.environ.get(chave, default)


def enviar_email_resposta(para: str, nome: str, assunto: str, mensagem: str) -> tuple[bool, str]:
    smtp_host = _env("EMAIL_SMTP_HOST")
    smtp_port = int(_env("EMAIL_SMTP_PORT") or "587")
    email_user = _env("EMAIL_USER")
    email_pass = _env("EMAIL_PASS")
    email_from = _env("EMAIL_FROM") or email_user
    from_name = _env("EMAIL_FROM_NAME") or "Sesimbra - Guia de Viagem"

    if not all([smtp_host, email_user, email_pass]):
        return False, "Configuração SMTP em falta (EMAIL_SMTP_HOST, EMAIL_USER, EMAIL_PASS no .env)."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"] = f"{from_name} <{email_from}>"
        msg["To"] = para

        corpo_texto = f"Caro(a) {nome},\n\n{mensagem}\n\nCom os melhores cumprimentos,\nEquipa Sesimbra"
        corpo_html = (
            "<html><body style='font-family:sans-serif;color:#0f2342;'>"
            f"<p>Caro(a) <strong>{nome}</strong>,</p>"
            f"<p>{mensagem.replace(chr(10), '<br>')}</p>"
            "<br><p>Com os melhores cumprimentos,<br><strong>Equipa Sesimbra</strong></p>"
            "</body></html>"
        )
        msg.attach(MIMEText(corpo_texto, "plain", "utf-8"))
        msg.attach(MIMEText(corpo_html, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(email_user, email_pass)
            smtp.sendmail(email_from, para, msg.as_string())

        return True, ""
    except Exception as exc:
        return False, str(exc)


def guardar_contacto(nome: str, email: str, telefone: str, mensagem: str) -> str:
    criado_em = datetime.now().astimezone().isoformat(timespec="seconds")

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO contactos (nome, email, telefone, mensagem, criado_em)
            VALUES (?, ?, ?, ?, ?)
            """,
            (nome, email, telefone or None, mensagem, criado_em),
        )

    return criado_em


def validar_dados_contacto(dados: dict) -> tuple[dict, list[str]]:
    contacto = {
        "nome": str(dados.get("nome", "")).strip(),
        "email": str(dados.get("email", "")).strip(),
        "telefone": str(dados.get("telefone", "") or dados.get("telefoneCompleto", "")).strip(),
        "mensagem": str(dados.get("mensagem", "")).strip(),
    }
    erros = []

    if len(contacto["nome"]) < 3:
        erros.append("Nome deve ter pelo menos 3 caracteres.")
    if len(contacto["nome"]) > 100:
        erros.append("Nome deve ter menos de 100 caracteres.")
    if contacto["nome"] and not re.fullmatch(r"[A-Za-zÀ-ÿ\s]+", contacto["nome"]):
        erros.append("Nome inválido.")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", contacto["email"]):
        erros.append("Email inválido.")
    if len(contacto["email"]) > 100:
        erros.append("Email deve ter menos de 100 caracteres.")
    if len(contacto["telefone"]) > 20:
        erros.append("Telefone deve ter menos de 20 caracteres.")
    if len(contacto["mensagem"]) < 3:
        erros.append("Mensagem deve ter pelo menos 3 caracteres.")
    if len(contacto["mensagem"]) > 500:
        erros.append("Mensagem deve ter menos de 500 caracteres.")

    return contacto, erros


def ler_tabela_projeto(nome_tabela: str) -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        linhas = conn.execute(f"SELECT * FROM {nome_tabela} ORDER BY id").fetchall()

    return [dict(linha) for linha in linhas]


def obter_dados_projeto() -> dict:
    return {
        "pontos_interesse": ler_tabela_projeto("pontos_interesse"),
        "restaurantes": ler_tabela_projeto("restaurantes"),
        "alojamentos": ler_tabela_projeto("alojamentos"),
        "atividades": ler_tabela_projeto("atividades"),
    }


def aplicar_sugestao_na_base(conn: sqlite3.Connection, sugestao: sqlite3.Row) -> None:
    sugestao = dict(sugestao)
    tipo = sugestao["tipo"]
    nome = sugestao["nome"].strip()
    descricao = sugestao["descricao"].strip()
    localizacao = str(sugestao.get("localizacao") or "").strip()
    telefone = str(sugestao.get("telefone") or "").strip()
    website = str(sugestao.get("website") or "").strip()
    website_booking = str(sugestao.get("website_booking") or "").strip()
    categoria_atividade = str(sugestao.get("categoria_atividade") or "").strip() or "outros"
    categoria_turistica = str(sugestao.get("categoria_turistica") or "").strip() or "outros"
    alerta = str(sugestao.get("alerta") or "").strip()

    if tipo == "ponto":
        descricao_base = descricao
        if localizacao:
            descricao_base += f" Localização: {localizacao}."
        if alerta:
            descricao_base += f" Aviso: {alerta}."

        existente = conn.execute(
            "SELECT 1 FROM pontos_interesse WHERE nome = ? LIMIT 1",
            (nome,),
        ).fetchone()
        if existente:
            return

        conn.execute(
            "INSERT INTO pontos_interesse (nome, descricao, categoria, imagem, lat, lon, tempo_minutos, custo_estimado, aviso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (nome, descricao_base, categoria_turistica, None, None, None, 90, 0, alerta or None),
        )
        return

    if tipo == "atividade":
        existente = conn.execute(
            "SELECT 1 FROM atividades WHERE nome = ? LIMIT 1",
            (nome,),
        ).fetchone()
        if existente:
            return

        conn.execute(
            "INSERT INTO atividades (nome, categoria, descricao) VALUES (?, ?, ?)",
            (nome, categoria_atividade, descricao),
        )
        return

    if tipo == "gastronomia":
        existente = conn.execute(
            "SELECT 1 FROM restaurantes WHERE nome = ? LIMIT 1",
            (nome,),
        ).fetchone()
        if existente:
            return

        conn.execute(
            "INSERT INTO restaurantes (nome, tipo, local, imagem, telefone, email) VALUES (?, ?, ?, ?, ?, ?)",
            (nome, "Gastronomia", localizacao or "", None, telefone or None, str(sugestao.get("email_sugestor") or "").strip() or None),
        )
        return

    if tipo == "alojamento":
        existente = conn.execute(
            "SELECT 1 FROM alojamentos WHERE nome = ? LIMIT 1",
            (nome,),
        ).fetchone()
        if existente:
            return

        conn.execute(
            "INSERT INTO alojamentos (nome, descricao, imagem, site_url, booking_url) VALUES (?, ?, ?, ?, ?)",
            (nome, descricao, None, website or None, website_booking or None),
        )
        return


def init_sugestoes_db() -> None:
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sugestoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo TEXT NOT NULL,
                nome TEXT NOT NULL,
                descricao TEXT NOT NULL,
                localizacao TEXT,
                telefone TEXT,
                website TEXT,
                website_booking TEXT,
                categoria_atividade TEXT,
                categoria_turistica TEXT,
                alerta TEXT,
                imagens TEXT,
                email_sugestor TEXT,
                estado TEXT NOT NULL DEFAULT 'pendente',
                criado_em TEXT NOT NULL
            )
            """
        )
        for col in ("telefone", "website_booking", "categoria_atividade", "categoria_turistica", "alerta", "imagens"):
            try:
                conn.execute(f"ALTER TABLE sugestoes ADD COLUMN {col} TEXT")
            except Exception:
                pass


def criar_contexto_site_db() -> str:
    try:
        dados = obter_dados_projeto()
    except sqlite3.Error:
        return SITE_CONTEXT

    pontos = "\n".join(
        f"- {p['nome']}: {p['descricao']} Categoria: {p['categoria']}. Tempo estimado: {p['tempo_minutos']} minutos. Custo estimado: {p['custo_estimado']} euros."
        + (f" Aviso: {p['aviso']}" if p.get("aviso") else "")
        for p in dados["pontos_interesse"]
    )
    restaurantes = "\n".join(
        f"- {r['nome']}: {r['tipo']}, {r['local']}."
        for r in dados["restaurantes"]
    )
    alojamentos = "\n".join(
        f"- {a['nome']}: {a['descricao']}"
        for a in dados["alojamentos"]
    )
    atividades = "\n".join(
        f"- {a['nome']}: {a['descricao']} Categoria: {a['categoria']}."
        for a in dados["atividades"]
    )

    return f"""
Site: guia de viagem de Sesimbra, Portugal.

Pontos de interesse guardados em SQLite:
{pontos}

Restaurantes guardados em SQLite:
{restaurantes}

Alojamentos guardados em SQLite:
{alojamentos}

Atividades guardadas em SQLite:
{atividades}

Contactos uteis:
- Posto de Turismo de Sesimbra: Rua da Fortaleza, 43.
- Camara Municipal de Sesimbra: Rua da Republica, 3.

Objetivo do assistente:
Responder perguntas do utilizador e, quando pedido, criar planos de viagem com ordem de visita,
rotas aproximadas, tempos, transportes, restaurantes e custos previstos. Se nao houver dados
oficiais, apresentar valores como estimativas.
"""


def pedir_json(url: str, timeout: int = 5) -> dict | None:
    try:
        with urlopen(url, timeout=timeout) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError, OSError):
        return None


def pedir_json_post(url: str, payload: dict, headers: dict | None = None, timeout: int = 20) -> dict | None:
    dados = json.dumps(payload).encode("utf-8")
    pedido = Request(
        url,
        data=dados,
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )

    try:
        with urlopen(pedido, timeout=timeout) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError, OSError):
        return None


def buscar_telefone_osm(nome: str, cidade: str, timeout: int = 30) -> str | None:
    consulta = f"{nome} {cidade}".strip()
    if not consulta:
        return None

    parametros = urlencode({"format": "json", "q": consulta})
    url = f"https://nominatim.openstreetmap.org/search?{parametros}"
    try:
        pedido = Request(url, headers={"User-Agent": OSM_USER_AGENT})
        with urlopen(pedido, timeout=timeout) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError, OSError):
        return None

    if not dados:
        return None

    melhor = dados[0]
    if melhor.get("osm_type") != "node":
        return None

    osm_id = melhor.get("osm_id")
    if not osm_id:
        return None

    node_url = f"https://api.openstreetmap.org/api/0.6/node/{osm_id}"
    try:
        pedido = Request(node_url, headers={"User-Agent": OSM_USER_AGENT})
        with urlopen(pedido, timeout=timeout) as resposta:
            xml = resposta.read().decode("utf-8", errors="ignore")
    except (URLError, TimeoutError, OSError):
        return None

    match = re.search(r'<tag k="phone" v="([^"]+)"', xml)
    if not match:
        return None

    return match.group(1)


def buscar_telefones_restaurantes(restaurantes: list[dict], forcar: bool = False) -> list[dict]:
    resultados = []
    for restaurante in restaurantes:
        nome = restaurante.get("nome", "").strip()
        local = restaurante.get("local", "").strip()
        telefone_existente = str(restaurante.get("telefone", "")).strip()

        if telefone_existente and not forcar:
            resultados.append(
                {
                    "nome": nome,
                    "local": local,
                    "telefone": telefone_existente,
                    "status": "existing",
                }
            )
            continue

        telefone = buscar_telefone_osm(nome, local)
        resultados.append(
            {
                "nome": nome,
                "local": local,
                "telefone": telefone,
                "status": "found" if telefone else "not_found",
            }
        )

    return resultados


def selecionar_pontos(interesses: list[str], duracao: str) -> list[dict]:
    interesses = interesses or ["praia", "historia"]
    limite = LIMITES_DURACAO.get(duracao, 5)

    def pontuacao(ponto: dict) -> int:
        return sum(1 for interesse in interesses if interesse in ponto["interesses"])

    ordenados = sorted(PONTOS, key=lambda ponto: (pontuacao(ponto), -PONTOS.index(ponto)), reverse=True)
    escolhidos = [ponto for ponto in ordenados if pontuacao(ponto) > 0][:limite]

    if not escolhidos:
        escolhidos = PONTOS[:limite]

    return escolhidos


def distancia_linha_reta_km(origem: dict, destino: dict) -> float:
    raio_terra = 6371
    lat1 = math.radians(origem["lat"])
    lat2 = math.radians(destino["lat"])
    delta_lat = math.radians(destino["lat"] - origem["lat"])
    delta_lon = math.radians(destino["lon"] - origem["lon"])
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    return raio_terra * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def estimar_rota_fallback(pontos: list[dict], transporte: str) -> dict:
    locais = [CENTRO_SESIMBRA, *pontos]
    distancia = sum(distancia_linha_reta_km(locais[i], locais[i + 1]) for i in range(len(locais) - 1))
    distancia *= 1.35

    velocidades = {"pe": 4.5, "autocarro": 22, "carro": 38}
    horas = distancia / velocidades.get(transporte, 35)

    return {
        "distancia_km": round(distancia, 1),
        "duracao_min": int(horas * 60),
        "origem": "estimativa local",
    }


def obter_rota(pontos: list[dict], transporte: str) -> dict:
    perfil = "foot" if transporte == "pe" else "driving"
    locais = [CENTRO_SESIMBRA, *pontos]
    coordenadas = ";".join(f'{local["lon"]},{local["lat"]}' for local in locais)
    url = f"https://router.project-osrm.org/route/v1/{perfil}/{coordenadas}?overview=false"
    dados = pedir_json(url)

    if not dados or dados.get("code") != "Ok" or not dados.get("routes"):
        return estimar_rota_fallback(pontos, transporte)

    rota = dados["routes"][0]
    duracao_min = int(rota["duration"] / 60)

    if transporte == "autocarro":
        duracao_min = int(duracao_min * 1.35) + 12

    return {
        "distancia_km": round(rota["distance"] / 1000, 1),
        "duracao_min": duracao_min,
        "origem": "OSRM",
    }


def obter_meteorologia() -> str:
    parametros = urlencode({
        "latitude": CENTRO_SESIMBRA["lat"],
        "longitude": CENTRO_SESIMBRA["lon"],
        "current": "temperature_2m,precipitation,wind_speed_10m,weather_code",
        "timezone": "Europe/Lisbon",
    })
    dados = pedir_json(f"https://api.open-meteo.com/v1/forecast?{parametros}")

    if not dados or "current" not in dados:
        return "indisponivel"

    atual = dados["current"]
    temperatura = atual.get("temperature_2m")
    chuva = atual.get("precipitation", 0)
    vento = atual.get("wind_speed_10m")

    if temperatura is None:
        return "indisponivel"

    estado = "sem chuva" if not chuva else "com possibilidade de chuva"
    return f"{temperatura} C, {estado}, vento {vento} km/h"


def calcular_custos(pontos: list[dict], rota: dict, transporte: str, orcamento: str) -> str:
    refeicao = {"baixo": 12, "medio": 22, "alto": 38}.get(orcamento, 22)

    if transporte == "carro":
        deslocacao = rota["distancia_km"] * 0.18
    elif transporte == "autocarro":
        deslocacao = max(4, len(pontos) * 1.8)
    else:
        deslocacao = 0

    entradas = sum(ponto.get("custo", 0) for ponto in pontos)
    total = deslocacao + refeicao + entradas
    return f"{round(total, 2)} euros por pessoa"


def formatar_tempo(minutos: int) -> str:
    horas = minutos // 60
    resto = minutos % 60
    if horas and resto:
        return f"{horas}h{resto:02d}"
    if horas:
        return f"{horas}h"
    return f"{resto} min"


def criar_prompt_gemini(dados_utilizador: dict, plano_base: dict) -> str:
    return (
        "Escreve uma resposta curta em portugues de Portugal para um turista que quer visitar Sesimbra. "
        "Usa apenas a informacao deste plano base e nao inventes horarios oficiais. "
        "Inclui uma ordem clara de visita, transporte, tempo total, custo aproximado, meteorologia e avisos. "
        "Se o utilizador tiver feito uma pergunta, responde tambem a essa pergunta.\n\n"
        f"Pedido do utilizador:\n{json.dumps(dados_utilizador, ensure_ascii=False, indent=2)}\n\n"
        f"Plano base do site:\n{json.dumps(plano_base, ensure_ascii=False, indent=2)}"
    )


def extrair_texto_gemini(resposta: dict | None) -> str:
    if not resposta:
        return ""

    partes_texto = []
    for candidato in resposta.get("candidates", []):
        conteudo = candidato.get("content", {})
        for parte in conteudo.get("parts", []):
            texto = parte.get("text")
            if texto:
                partes_texto.append(texto)

    return "\n".join(partes_texto).strip()


def gemini_cortou_resposta(resposta: dict | None) -> bool:
    if not resposta:
        return False

    return any(
        candidato.get("finishReason") == "MAX_TOKENS"
        for candidato in resposta.get("candidates", [])
    )


def resumo_resposta_gemini(resposta_json: str) -> dict:
    try:
        dados = json.loads(resposta_json)
    except json.JSONDecodeError:
        return {}

    gemini = dados.get("gemini", dados)
    candidatos = gemini.get("candidates", [])
    primeiro = candidatos[0] if candidatos else {}
    conteudo = primeiro.get("content", {})
    partes = conteudo.get("parts", [])

    return {
        "resposta_text": extrair_texto_gemini(gemini),
        "resposta_candidates": candidatos,
        "resposta_usage_metadata": gemini.get("usageMetadata"),
        "resposta_prompt_feedback": gemini.get("promptFeedback"),
        "resposta_model_version": gemini.get("modelVersion"),
        "resposta_response_id": gemini.get("responseId"),
        "resposta_parts": partes,
        "resposta_function_calls": [
            parte.get("functionCall")
            for parte in partes
            if parte.get("functionCall")
        ],
        "resposta_parsed": None,
    }


def chamar_gemini(dados_utilizador: dict, plano_base: dict) -> tuple[str, dict, str, str]:
    prompt = criar_prompt_gemini(dados_utilizador, plano_base)
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if not api_key:
        texto = (
            "Gemini ainda nao foi chamado porque falta configurar a variavel de ambiente GEMINI_API_KEY. "
            "O plano abaixo foi gerado pelas regras do Flask e pelas APIs de meteorologia/rota."
        )
        resposta = {"erro": "GEMINI_API_KEY nao configurada"}
        return texto, resposta, prompt, "sem_chave"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 700,
        },
    }
    resposta = pedir_json_post(url, payload)
    texto = extrair_texto_gemini(resposta)

    if not texto:
        texto = "Nao foi possivel obter texto do Gemini. O plano base continua disponivel abaixo."
        return texto, resposta or {"erro": "sem resposta"}, prompt, "erro"

    return texto, resposta or {}, prompt, "ok"


def criar_prompt_chatbot(pergunta: str, pagina: str, meteorologia: str) -> str:
    contexto_site = criar_contexto_site_db()

    return (
        "Responde em portugues europeu de Portugal, de forma util e direta, como assistente do site de turismo de Sesimbra. "
        "Baseia a resposta apenas no contexto do site abaixo. "
        "Nao uses expressoes do portugues do Brasil como 'pular', 'ônibus' ou 'legal'; usa 'dar um mergulho', 'autocarro' e 'agradavel'. "
        "Se o utilizador pedir roteiro, inclui ordem dos pontos, tempos aproximados, transporte recomendado, "
        "custos estimados e sugestao de restaurante. "
        "Nao inventes horarios oficiais nem precos exatos; quando necessario, diz que sao estimativas. "
        "Nao uses Markdown: nao uses asteriscos, cardinal, tabelas nem blocos de codigo. "
        "Escreve com frases completas, sem cortar titulos. "
        "Mantem a resposta compacta e facil de ler: no maximo 7 linhas curtas. "
        "Se for um roteiro, usa 4 a 6 passos numerados, cada um com apenas a informacao essencial. "
        "Inclui detalhes importantes, mas evita introducoes longas e repeticao.\n\n"
        f"Pagina atual do utilizador: {pagina}\n"
        f"Meteorologia atual aproximada em Sesimbra: {meteorologia}\n\n"
        f"Contexto do site:\n{contexto_site}\n\n"
        f"Pergunta do utilizador:\n{pergunta}"
    )


def chamar_gemini_prompt(prompt: str) -> tuple[str, dict, str]:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

    if not api_key:
        texto = (
            "Ainda falta configurar a chave GEMINI_API_KEY no Flask. "
            "Depois disso consigo responder com Gemini e guardar automaticamente o pedido e a resposta em SQLite."
        )
        return texto, {"erro": "GEMINI_API_KEY nao configurada"}, "sem_chave"

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.25,
            "maxOutputTokens": 900,
            "thinkingConfig": {
                "thinkingBudget": 0
            },
        },
    }
    resposta = pedir_json_post(url, payload)
    texto = extrair_texto_gemini(resposta)

    if gemini_cortou_resposta(resposta):
        return (
            "A resposta ficou incompleta. Por favor, tente novamente com um pedido mais curto.",
            resposta or {"erro": "resposta cortada"},
            "erro",
        )

    if not texto:
        return "Nao consegui obter uma resposta valida do Gemini neste momento.", resposta or {"erro": "sem resposta"}, "erro"

    return texto, resposta or {}, "ok"


@app.post("/api/chatbot")
def api_chatbot():
    dados = request.get_json(silent=True) or {}
    pergunta = str(dados.get("pergunta", "")).strip()
    pagina = str(dados.get("pagina", "sesimbra.html")).strip() or "sesimbra.html"

    if not pergunta:
        return jsonify({"erro": "A pergunta e obrigatoria."}), 400

    ip_cliente = obter_ip_cliente()
    permitido, mensagem_limite = verificar_limite_ip(ip_cliente)
    if not permitido:
        resposta_site = {
            "modelo": GEMINI_MODEL,
            "estado": "limitado",
            "resposta": mensagem_limite,
        }
        guardar_log_api(
            endpoint="/api/chatbot",
            modelo=GEMINI_MODEL,
            pedido={**dados, "ip": ip_cliente},
            resposta={"gemini": None, "resposta_site": resposta_site},
            prompt="Pedido bloqueado por limite de utilização por IP.",
            resposta_text=mensagem_limite,
            estado="limitado",
        )
        return jsonify(resposta_site), 429

    meteorologia = obter_meteorologia()
    prompt = criar_prompt_chatbot(pergunta, pagina, meteorologia)
    texto, resposta_gemini, estado = chamar_gemini_prompt(prompt)

    resposta_site = {
        "modelo": GEMINI_MODEL,
        "estado": estado,
        "resposta": texto,
    }

    guardar_log_api(
        endpoint="/api/chatbot",
        modelo=GEMINI_MODEL,
        pedido=dados,
        resposta={"gemini": resposta_gemini, "resposta_site": resposta_site},
        prompt=prompt,
        resposta_text=texto,
        estado=estado,
    )

    return jsonify(resposta_site)


@app.route("/api/chatbot", methods=["OPTIONS"])
def api_chatbot_options():
    return "", 204


@app.post("/contactos")
@app.post("/api/contactos")
def api_contactos():
    if not validar_csrf():
        return jsonify({"estado": "erro", "erros": ["Pedido inválido. Atualize a página e tente novamente."]}), 403

    permitido, mensagem_limite = verificar_limite_contactos(obter_ip_cliente())
    if not permitido:
        return jsonify({"estado": "erro", "erros": [mensagem_limite]}), 429

    dados = request.get_json(silent=True) or request.form.to_dict()
    contacto, erros = validar_dados_contacto(dados)

    if erros:
        return jsonify({"estado": "erro", "erros": erros}), 400

    criado_em = guardar_contacto(
        nome=contacto["nome"],
        email=contacto["email"],
        telefone=contacto["telefone"],
        mensagem=contacto["mensagem"],
    )

    return jsonify(
        {
            "estado": "ok",
            "mensagem": "Mensagem guardada com sucesso.",
            "criado_em": criado_em,
        }
    ), 201


@app.route("/contactos", methods=["OPTIONS"])
@app.route("/api/contactos", methods=["OPTIONS"])
def api_contactos_options():
    return "", 204


@app.get("/api/csrf")
def api_csrf():
    token = request.cookies.get("csrf_token") or secrets.token_urlsafe(32)
    response = jsonify({"csrf_token": token})
    response.set_cookie(
        "csrf_token",
        token,
        httponly=False,
        samesite="Strict",
        secure=False,
    )
    return response


@app.get("/api/conteudo")
def api_conteudo():
    return jsonify(obter_dados_projeto())


@app.get("/api/restaurantes/telefones")
def api_restaurantes_telefones():
    forcar = str(request.args.get("forcar", "")).strip().lower() in ("1", "true", "sim", "yes")
    restaurantes = ler_tabela_projeto("restaurantes")
    resultados = buscar_telefones_restaurantes(restaurantes, forcar=forcar)
    return jsonify(resultados)


@app.get("/api/admin/contactos")
def api_admin_contactos():
    if not validar_admin_token():
        return jsonify({"erro": "Acesso não autorizado."}), 401

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        contactos = conn.execute(
            """
            SELECT c.id, c.nome, c.email, c.telefone, c.mensagem, c.criado_em,
                   COALESCE(c.respondido, 0) AS respondido, c.respondido_em,
                   cr.assunto AS resp_assunto, cr.mensagem AS resp_mensagem, cr.criado_em AS resp_em
            FROM contactos c
            LEFT JOIN contactos_respostas cr
                ON cr.contacto_id = c.id
                AND cr.id = (SELECT MAX(id) FROM contactos_respostas WHERE contacto_id = c.id)
            ORDER BY c.id DESC
            LIMIT 100
            """
        ).fetchall()

    return jsonify([dict(contacto) for contacto in contactos])


@app.post("/api/admin/contactos/<int:cid>/responder")
def api_admin_responder_contacto(cid):
    if not validar_admin_token():
        return jsonify({"erro": "Acesso não autorizado."}), 401

    dados = request.get_json(silent=True) or {}
    assunto = str(dados.get("assunto", "")).strip()
    mensagem_resposta = str(dados.get("mensagem", "")).strip()

    if not assunto or not mensagem_resposta:
        return jsonify({"erro": "Assunto e mensagem são obrigatórios."}), 400

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            contacto = conn.execute(
                "SELECT email, nome FROM contactos WHERE id = ?",
                (cid,),
            ).fetchone()
            if not contacto:
                return jsonify({"erro": "Contacto não encontrado."}), 404

            data_resposta = datetime.now().astimezone().isoformat(timespec="seconds")
            conn.execute(
                """INSERT INTO contactos_respostas
                (contacto_id, assunto, mensagem, criado_em)
                VALUES (?,?,?,?)""",
                (cid, assunto, mensagem_resposta, data_resposta),
            )
            conn.execute(
                "UPDATE contactos SET respondido = 1, respondido_em = ? WHERE id = ?",
                (data_resposta, cid),
            )
            conn.commit()

        email_ok, email_msg = enviar_email_resposta(
            para=contacto["email"],
            nome=contacto["nome"],
            assunto=assunto,
            mensagem=mensagem_resposta,
        )

        return jsonify({
            "estado": "ok",
            "mensagem": "Resposta guardada e email enviado." if email_ok
                        else f"Resposta guardada na BD. Email não enviado: {email_msg}",
            "email_enviado": email_ok,
        })
    except Exception as e:
        return jsonify({"erro": f"Erro: {str(e)}"}), 500


@app.route("/api/admin/contactos/<int:cid>/responder", methods=["OPTIONS"])
def api_admin_responder_contacto_options(cid):
    return "", 204


@app.get("/api/logs")
def api_logs():
    if not validar_admin_token():
        return jsonify({"erro": "Acesso não autorizado."}), 401

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        linhas = conn.execute(
            """
            SELECT id, created_at, endpoint, modelo, pedido_json, resposta_json, prompt, resposta_text, estado
            FROM api_logs
            ORDER BY id DESC
            LIMIT 20
            """
        ).fetchall()

    logs = []
    for linha in linhas:
        item = dict(linha)
        item.update(resumo_resposta_gemini(item.get("resposta_json", "{}")))
        logs.append(item)

    return jsonify(logs)


@app.post("/api/sugestoes")
def api_sugestoes_criar():
    if not validar_csrf():
        return jsonify({"estado": "erro", "erros": ["Pedido inválido. Atualize a página."]}), 403

    dados = request.get_json(silent=True) or {}
    tipo = str(dados.get("tipo", "")).strip()
    nome = str(dados.get("nome", "")).strip()
    descricao = str(dados.get("descricao", "")).strip()
    localizacao = str(dados.get("localizacao", "")).strip()
    telefone = str(dados.get("telefone", "")).strip()
    website = str(dados.get("website", "")).strip()
    website_booking = str(dados.get("website_booking", "")).strip()
    categoria_atividade = str(dados.get("categoria_atividade", "")).strip()
    categoria_turistica = str(dados.get("categoria_turistica", "")).strip()
    alerta = str(dados.get("alerta", "")).strip()
    email_sugestor = str(dados.get("email", "")).strip()

    erros = []
    if tipo not in ("ponto", "atividade", "gastronomia", "alojamento"):
        erros.append("Tipo inválido.")
    if len(nome) < 3:
        erros.append("Nome deve ter pelo menos 3 caracteres.")
    if len(descricao) < 10:
        erros.append("Descrição deve ter pelo menos 10 caracteres.")
    if erros:
        return jsonify({"estado": "erro", "erros": erros}), 400

    imagens = dados.get("imagens") if isinstance(dados.get("imagens"), list) else []
    criado_em = datetime.now().astimezone().isoformat(timespec="seconds")
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """INSERT INTO sugestoes
            (tipo, nome, descricao, localizacao, telefone, website, website_booking, categoria_atividade, categoria_turistica, alerta, imagens, email_sugestor, criado_em)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (tipo, nome, descricao, localizacao or None, telefone or None, website or None,
             website_booking or None, categoria_atividade or None, categoria_turistica or None,
             alerta or None, json.dumps(imagens), email_sugestor or None, criado_em),
        )
    return jsonify({"estado": "ok", "mensagem": "Sugestão enviada. Obrigado!"}), 201


@app.get("/api/sugestoes/aprovadas")
def api_sugestoes_aprovadas():
    tipo = request.args.get("tipo")
    query = "SELECT * FROM sugestoes WHERE estado = 'aprovado'"
    params: list = []
    if tipo:
        query += " AND tipo = ?"
        params.append(tipo)
    query += " ORDER BY id"
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(query, params).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/sugestoes", methods=["OPTIONS"])
def api_sugestoes_options():
    return "", 204


@app.get("/api/admin/sugestoes")
def api_admin_sugestoes():
    if not validar_admin_token():
        return jsonify({"erro": "Acesso não autorizado."}), 401
    estado_filtro = request.args.get("estado", "pendente")
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM sugestoes WHERE estado = ? ORDER BY id DESC",
            (estado_filtro,)
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.post("/api/admin/sugestoes/<int:sid>/estado")
def api_admin_sugestoes_estado(sid):
    if not validar_admin_token():
        return jsonify({"erro": "Acesso não autorizado."}), 401
    dados = request.get_json(silent=True) or {}
    novo_estado = str(dados.get("estado", "")).strip()
    if novo_estado not in ("aprovado", "rejeitado"):
        return jsonify({"erro": "Estado inválido."}), 400

    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            sugestao = conn.execute(
                "SELECT * FROM sugestoes WHERE id = ?",
                (sid,),
            ).fetchone()
            if not sugestao:
                return jsonify({"erro": "Sugestão não encontrada."}), 404

            if novo_estado == "aprovado":
                aplicar_sugestao_na_base(conn, sugestao)
                conn.commit()
                guardar_sugestao_em_extras(dict(sugestao))

            conn.execute("UPDATE sugestoes SET estado = ? WHERE id = ?", (novo_estado, sid))
            conn.commit()
    except Exception as e:
        return jsonify({"erro": f"Erro ao atualizar: {str(e)}"}), 500

    return jsonify({"estado": "ok"})


@app.post("/api/admin/sugestoes/<int:sid>")
def api_admin_sugestoes_atualizar(sid):
    if not validar_admin_token():
        return jsonify({"erro": "Acesso não autorizado."}), 401

    dados = request.get_json(silent=True) or {}
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "UPDATE sugestoes SET nome = ?, descricao = ?, localizacao = ?, telefone = ?, website = ?, website_booking = ?, categoria_atividade = ?, categoria_turistica = ?, alerta = ? WHERE id = ?",
                (
                    str(dados.get("nome", "")).strip(),
                    str(dados.get("descricao", "")).strip(),
                    str(dados.get("localizacao", "")).strip() or None,
                    str(dados.get("telefone", "")).strip() or None,
                    str(dados.get("website", "")).strip() or None,
                    str(dados.get("website_booking", "")).strip() or None,
                    str(dados.get("categoria_atividade", "")).strip() or None,
                    str(dados.get("categoria_turistica", "")).strip() or None,
                    str(dados.get("alerta", "")).strip() or None,
                    sid,
                ),
            )
            conn.commit()
    except Exception as e:
        return jsonify({"erro": f"Erro ao atualizar: {str(e)}"}), 500

    return jsonify({"estado": "ok"})


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "sesimbra.html")


@app.get("/<path:filename>")
def ficheiros_site(filename: str):
    return send_from_directory(BASE_DIR, filename)


init_db()


if __name__ == "__main__":
    app.run(debug=True)
