"""
app.py — ponto de entrada da aplicação Flask para o Guia de Sesimbra.

Responsabilidades principais:
  - Inicializar a base de dados SQLite (tabelas de conteúdo, contactos, sugestões, logs)
  - Gerir o ciclo de vida das imagens das sugestões (validação, redimensionamento, WebP)
  - Construir o contexto do Assistente IA a partir da BD e comunicar com a API do Gemini
  - Integrar dados de transportes em tempo real (Transit API) e meteorologia (Open-Meteo)
  - Registar todas as rotas HTTP via backend/rotas.py (injeção de dependências)
"""
from __future__ import annotations

import json
import os
import re
import secrets
import sqlite3
from datetime import datetime
from io import BytesIO
from math import atan2, cos, radians, sin, sqrt
from pathlib import Path
from types import SimpleNamespace
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask
from PIL import Image, ImageOps, UnidentifiedImageError

from backend.avaliacoes import obter_avaliacao_alojamento
from backend.rotas import registar_rotas
from backend.seguranca import (
    adicionar_cors,
    obter_ip_cliente,
    validar_admin_token,
    validar_csrf,
    verificar_limite_contactos,
    verificar_limite_ip,
)
from backend.configuracoes import (
    BASE_DIR,
    CONTACTOS_DB_PATH,
    DB_PATH,
    FRONTEND_DIR,
    GEMINI_MODEL,
    OSM_USER_AGENT,
    SUGESTAO_IMAGEM_EXTENSOES,
    SUGESTAO_IMAGEM_MAX_DIMENSAO,
    SUGESTAO_IMAGEM_MAX_BYTES,
    SUGESTOES_IMG_DIR,
    carregar_env,
)
from backend.validadores import validar_dados_contacto, validar_sugestao_local, telefone_internacional_valido


app = Flask(__name__, static_folder=None)


carregar_env()


app.after_request(adicionar_cors)

# nomes dos dias da semana em portugues, indexados como datetime.weekday() (0 = segunda)
DIAS_SEMANA_PT = [
    "segunda-feira",
    "terca-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sabado",
    "domingo",
]

# coordenadas do centro de sesimbra usadas para obter a meteorologia
CENTRO_SESIMBRA = {
    "nome": "Centro de Sesimbra",
    "lat": 38.4445,
    "lon": -9.1015,
}

# fallback mínimo: os locais concretos são sempre lidos do SQLite
SITE_CONTEXT = """
Site: guia de viagem de Sesimbra, Portugal.

O conteúdo editorial não está disponível neste momento. Não inventes locais,
contactos, horários ou preços. Explica brevemente que os dados do guia estão
temporariamente indisponíveis e pede ao utilizador para tentar novamente.
"""


def init_logs_db() -> None:
    # cria a tabela de logs da api se ainda não existir
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


def init_contactos_db() -> None:
    # cria todas as tabelas do projeto e adiciona colunas novas em bases de dados existentes
    with sqlite3.connect(CONTACTOS_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contactos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT NOT NULL,
                telefone TEXT,
                mensagem TEXT NOT NULL,
                estado TEXT NOT NULL DEFAULT 'pendente',
                criado_em TEXT NOT NULL
            )
            """
        )
        colunas_contactos = {
            linha[1]
            for linha in conn.execute("PRAGMA table_info(contactos)").fetchall()
        }
        if "estado" not in colunas_contactos:
            conn.execute("ALTER TABLE contactos ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendente'")
        # migração: remove o estado antigo 'novo' que foi substituído por 'pendente'
        conn.execute("UPDATE contactos SET estado = 'pendente' WHERE estado = 'novo'")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sugestoes_locais (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categoria TEXT NOT NULL,
                nome TEXT NOT NULL,
                descricao TEXT NOT NULL,
                morada TEXT,
                telefone TEXT,
                site TEXT,
                booking_url TEXT,
                email TEXT,
                foto_path TEXT,
                recomendado_por TEXT,
                pagina_origem TEXT,
                lat REAL,
                lon REAL,
                estado TEXT NOT NULL DEFAULT 'pendente',
                criado_em TEXT NOT NULL
            )
            """
        )
        colunas_sugestoes = {
            linha[1]
            for linha in conn.execute("PRAGMA table_info(sugestoes_locais)").fetchall()
        }
        if "estado" not in colunas_sugestoes:
            conn.execute("ALTER TABLE sugestoes_locais ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendente'")
        if "foto_path" not in colunas_sugestoes:
            conn.execute("ALTER TABLE sugestoes_locais ADD COLUMN foto_path TEXT")
        if "recomendado_por" not in colunas_sugestoes:
            conn.execute("ALTER TABLE sugestoes_locais ADD COLUMN recomendado_por TEXT")
        if "booking_url" not in colunas_sugestoes:
            conn.execute("ALTER TABLE sugestoes_locais ADD COLUMN booking_url TEXT")
        if "lat" not in colunas_sugestoes:
            conn.execute("ALTER TABLE sugestoes_locais ADD COLUMN lat REAL")
        if "lon" not in colunas_sugestoes:
            conn.execute("ALTER TABLE sugestoes_locais ADD COLUMN lon REAL")
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS pontos_interesse (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                descricao TEXT NOT NULL,
                categoria TEXT NOT NULL,
                local TEXT,
                imagem TEXT,
                telefone TEXT,
                site_url TEXT,
                lat REAL,
                lon REAL,
                tempo_minutos INTEGER,
                custo_estimado REAL,
                aviso TEXT,
                alt_imagem TEXT,
                eventos_json TEXT NOT NULL DEFAULT '[]',
                ordem INTEGER NOT NULL DEFAULT 0,
                recomendado_por TEXT,
                origem TEXT NOT NULL DEFAULT 'oficial',
                origem_sugestao_id INTEGER
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
                descricao TEXT,
                imagem TEXT,
                telefone TEXT,
                email TEXT,
                site_url TEXT,
                avaliacao_google REAL,
                google_maps_url TEXT,
                lat REAL,
                lon REAL,
                ordem INTEGER NOT NULL DEFAULT 0,
                recomendado_por TEXT,
                origem TEXT NOT NULL DEFAULT 'oficial',
                origem_sugestao_id INTEGER
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
                alt_imagem TEXT,
                site_url TEXT,
                booking_url TEXT,
                local TEXT,
                telefone TEXT,
                avaliacao_google REAL,
                avaliacao_booking REAL,
                google_maps_url TEXT,
                lat REAL,
                lon REAL,
                ordem INTEGER NOT NULL DEFAULT 0,
                recomendado_por TEXT,
                origem TEXT NOT NULL DEFAULT 'oficial',
                origem_sugestao_id INTEGER
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS atividades (
                id INTEGER PRIMARY KEY,
                nome TEXT NOT NULL,
                categoria TEXT NOT NULL,
                descricao TEXT NOT NULL,
                imagem TEXT,
                site_url TEXT,
                icone TEXT,
                links_json TEXT NOT NULL DEFAULT '[]',
                local TEXT,
                telefone TEXT,
                lat REAL,
                lon REAL,
                ordem INTEGER NOT NULL DEFAULT 0,
                recomendado_por TEXT,
                origem TEXT NOT NULL DEFAULT 'oficial',
                origem_sugestao_id INTEGER
            )
            """
        )
        # adiciona colunas novas em tabelas existentes sem apagar os dados
        for tabela, colunas in {
            "pontos_interesse": {
                "local": "TEXT",
                "telefone": "TEXT",
                "lat": "REAL",
                "lon": "REAL",
                "site_url": "TEXT",
                "alt_imagem": "TEXT",
                "eventos_json": "TEXT NOT NULL DEFAULT '[]'",
                "ordem": "INTEGER NOT NULL DEFAULT 0",
                "recomendado_por": "TEXT",
                "origem": "TEXT NOT NULL DEFAULT 'oficial'",
                "origem_sugestao_id": "INTEGER",
            },
            "restaurantes": {
                "descricao": "TEXT",
                "site_url": "TEXT",
                "avaliacao_google": "REAL",
                "google_maps_url": "TEXT",
                "lat": "REAL",
                "lon": "REAL",
                "ordem": "INTEGER NOT NULL DEFAULT 0",
                "recomendado_por": "TEXT",
                "origem": "TEXT NOT NULL DEFAULT 'oficial'",
                "origem_sugestao_id": "INTEGER",
            },
            "alojamentos": {
                "booking_url": "TEXT",
                "local": "TEXT",
                "telefone": "TEXT",
                "alt_imagem": "TEXT",
                "avaliacao_google": "REAL",
                "avaliacao_booking": "REAL",
                "google_maps_url": "TEXT",
                "lat": "REAL",
                "lon": "REAL",
                "ordem": "INTEGER NOT NULL DEFAULT 0",
                "recomendado_por": "TEXT",
                "origem": "TEXT NOT NULL DEFAULT 'oficial'",
                "origem_sugestao_id": "INTEGER",
            },
            "atividades": {
                "imagem": "TEXT",
                "site_url": "TEXT",
                "icone": "TEXT",
                "links_json": "TEXT NOT NULL DEFAULT '[]'",
                "local": "TEXT",
                "telefone": "TEXT",
                "lat": "REAL",
                "lon": "REAL",
                "ordem": "INTEGER NOT NULL DEFAULT 0",
                "recomendado_por": "TEXT",
                "origem": "TEXT NOT NULL DEFAULT 'oficial'",
                "origem_sugestao_id": "INTEGER",
            },
        }.items():
            colunas_existentes = {
                linha[1]
                for linha in conn.execute(f"PRAGMA table_info({tabela})").fetchall()
            }
            for coluna, definicao in colunas.items():
                if coluna not in colunas_existentes:
                    conn.execute(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {definicao}")
            # preenche origem_sugestao_id para registos malta com base na imagem
            conn.execute(
                f"""
                UPDATE {tabela}
                SET origem_sugestao_id = (
                    SELECT sugestoes_locais.id
                    FROM sugestoes_locais
                    WHERE sugestoes_locais.foto_path = {tabela}.imagem
                    LIMIT 1
                )
                WHERE origem = 'malta'
                  AND origem_sugestao_id IS NULL
                  AND imagem IS NOT NULL
                """
            )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_pontos_origem_ordem ON pontos_interesse (origem, ordem, id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_restaurantes_origem_ordem ON restaurantes (origem, ordem, id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_alojamentos_origem_ordem ON alojamentos (origem, ordem, id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_atividades_origem_ordem ON atividades (origem, ordem, id)")


def init_db() -> None:
    init_logs_db()
    init_contactos_db()


def guardar_log_api(endpoint: str, modelo: str, pedido: dict, resposta: dict, prompt: str, resposta_text: str, estado: str) -> None:
    # regista cada chamada ao assistente ia na tabela de logs para análise posterior
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


def guardar_contacto(nome: str, email: str, telefone: str, mensagem: str) -> str:
    # insere uma nova mensagem de contacto e devolve a data/hora de criação
    criado_em = datetime.now().astimezone().isoformat(timespec="seconds")

    with sqlite3.connect(CONTACTOS_DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO contactos (nome, email, telefone, mensagem, estado, criado_em)
            VALUES (?, ?, ?, ?, 'pendente', ?)
            """,
            (nome, email, telefone or None, mensagem, criado_em),
        )

    return criado_em


def guardar_sugestao_local(sugestao: dict) -> tuple[int, str]:
    # insere uma nova sugestão com estado 'pendente' e devolve o seu id e a data/hora de criação
    criado_em = datetime.now().astimezone().isoformat(timespec="seconds")

    with sqlite3.connect(CONTACTOS_DB_PATH) as conn:
        cursor = conn.execute(
            """
            INSERT INTO sugestoes_locais
            (categoria, nome, descricao, morada, telefone, site, booking_url, email, foto_path, recomendado_por, pagina_origem, lat, lon, estado, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                sugestao["categoria"],
                sugestao["nome"],
                sugestao["descricao"],
                sugestao["morada"] or None,
                sugestao["telefone"] or None,
                sugestao["site"] or None,
                sugestao["booking_url"] or None,
                sugestao["email"] or None,
                sugestao["foto_path"],
                sugestao["recomendado_por"] or None,
                sugestao["pagina_origem"] or None,
                sugestao.get("lat"),
                sugestao.get("lon"),
                "pendente",
                criado_em,
            ),
        )

    return cursor.lastrowid, criado_em


def guardar_imagem_sugestao(arquivo) -> tuple[str, str]:
    # valida o conteúdo real, corrige a orientação e guarda uma versão otimizada
    if not arquivo or not arquivo.filename:
        return "", "Foto é obrigatória."

    extensao = Path(arquivo.filename).suffix.lower()
    if extensao not in SUGESTAO_IMAGEM_EXTENSOES:
        return "", "Foto deve ser JPG, PNG ou WebP."

    arquivo.stream.seek(0, os.SEEK_END)
    tamanho = arquivo.stream.tell()
    arquivo.stream.seek(0)
    if tamanho > SUGESTAO_IMAGEM_MAX_BYTES:
        return "", "Foto deve ter no máximo 3 MB."

    try:
        conteudo = arquivo.stream.read()
        with Image.open(BytesIO(conteudo)) as imagem_recebida:
            if imagem_recebida.format not in {"JPEG", "PNG", "WEBP"}:
                return "", "Foto deve ser JPG, PNG ou WebP."
            imagem_recebida.verify()

        with Image.open(BytesIO(conteudo)) as imagem_recebida:
            imagem = ImageOps.exif_transpose(imagem_recebida)
            if imagem.width < 1 or imagem.height < 1:
                return "", "A foto enviada não é válida."

            imagem.thumbnail(
                (SUGESTAO_IMAGEM_MAX_DIMENSAO, SUGESTAO_IMAGEM_MAX_DIMENSAO),
                Image.Resampling.LANCZOS,
            )
            if imagem.mode not in ("RGB", "RGBA"):
                imagem = imagem.convert("RGBA" if "transparency" in imagem.info else "RGB")

            buffer = BytesIO()
            imagem.save(buffer, format="WEBP", quality=82, method=6)
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError):
        return "", "O ficheiro enviado não é uma imagem válida."

    SUGESTOES_IMG_DIR.mkdir(parents=True, exist_ok=True)
    nome_ficheiro = f"{datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(8)}.webp"
    destino = SUGESTOES_IMG_DIR / nome_ficheiro
    destino.write_bytes(buffer.getvalue())
    return f"img/sugestoes/{nome_ficheiro}", ""


def proximo_id(conn: sqlite3.Connection, tabela: str) -> int:
    # devolve o próximo id disponível (max + 1) para evitar conflitos em inserções
    linha = conn.execute(f"SELECT COALESCE(MAX(id), 0) + 1 FROM {tabela}").fetchone()
    return int(linha[0])


def publicar_sugestao_local(sugestao_id: int, dados_admin: dict | None = None) -> dict | None:
    # valida, publica a sugestão na tabela correta e marca-a como 'aceite'
    foto_antiga = ""
    with sqlite3.connect(CONTACTOS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        sugestao_row = conn.execute(
            """
            SELECT id, categoria, nome, descricao, morada, telefone, site, booking_url, email, foto_path, recomendado_por, pagina_origem, lat, lon, estado, criado_em
            FROM sugestoes_locais
            WHERE id = ?
            """,
            (sugestao_id,),
        ).fetchone()

        if not sugestao_row:
            return None

        sugestao = dict(sugestao_row)
        foto_antiga = sugestao.get("foto_path") or ""
        if dados_admin:
            for campo in ("categoria", "nome", "descricao", "morada", "telefone", "site", "booking_url", "email", "recomendado_por", "foto_path", "lat", "lon"):
                if campo in dados_admin:
                    sugestao[campo] = str(dados_admin.get(campo, "")).strip()

            sugestao_validada, erros = validar_sugestao_local(sugestao)
            if erros:
                return None
            sugestao.update(sugestao_validada)

        if sugestao["estado"] == "aceite":
            return sugestao
        if not sugestao.get("foto_path"):
            return None

        categoria = sugestao["categoria"]
        if categoria == "Ponto turistico":
            conn.execute(
                """
                INSERT INTO pontos_interesse
                (id, nome, descricao, categoria, local, imagem, telefone, site_url, lat, lon, tempo_minutos, custo_estimado, aviso, recomendado_por, origem, origem_sugestao_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    proximo_id(conn, "pontos_interesse"),
                    sugestao["nome"],
                    sugestao["descricao"],
                    "malta",
                    sugestao["morada"] or None,
                    sugestao["foto_path"],
                    sugestao["telefone"] or None,
                    None,
                    sugestao.get("lat"),
                    sugestao.get("lon"),
                    0,
                    0,
                    "",
                    sugestao["recomendado_por"] or None,
                    "malta",
                    sugestao_id,
                ),
            )
        elif categoria == "Gastronomia":
            conn.execute(
                """
                INSERT INTO restaurantes
                (id, nome, tipo, local, descricao, imagem, telefone, email, site_url, lat, lon, recomendado_por, origem, origem_sugestao_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    proximo_id(conn, "restaurantes"),
                    sugestao["nome"],
                    "Sugestão da Malta",
                    sugestao["morada"] or "Sesimbra",
                    sugestao["descricao"] or None,
                    sugestao["foto_path"],
                    sugestao["telefone"] or None,
                    sugestao["email"] or None,
                    sugestao["site"] or None,
                    sugestao.get("lat"),
                    sugestao.get("lon"),
                    sugestao["recomendado_por"] or None,
                    "malta",
                    sugestao_id,
                ),
            )
        elif categoria == "Atividade":
            conn.execute(
                """
                INSERT INTO atividades
                (id, nome, categoria, descricao, imagem, site_url, icone, links_json, local, telefone, lat, lon, recomendado_por, origem, origem_sugestao_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    proximo_id(conn, "atividades"),
                    sugestao["nome"],
                    "Sugestão da Malta",
                    sugestao["descricao"],
                    sugestao["foto_path"],
                    sugestao["site"] or None,
                    "fa-solid fa-person-hiking",
                    "[]",
                    sugestao["morada"] or None,
                    sugestao["telefone"] or None,
                    sugestao.get("lat"),
                    sugestao.get("lon"),
                    sugestao["recomendado_por"] or None,
                    "malta",
                    sugestao_id,
                ),
            )
        elif categoria == "Alojamento":
            novo_id = proximo_id(conn, "alojamentos")
            conn.execute(
                """
                INSERT INTO alojamentos
                (id, nome, descricao, imagem, site_url, booking_url, local, telefone, lat, lon, recomendado_por, origem, origem_sugestao_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    novo_id,
                    sugestao["nome"],
                    sugestao["descricao"],
                    sugestao["foto_path"],
                    sugestao["site"] or None,
                    sugestao["booking_url"] or None,
                    sugestao["morada"] or None,
                    sugestao["telefone"] or None,
                    sugestao.get("lat"),
                    sugestao.get("lon"),
                    sugestao["recomendado_por"] or None,
                    "malta",
                    sugestao_id,
                ),
            )

            # tenta obter automaticamente a avaliação a partir do link de reserva
            avaliacao = obter_avaliacao_alojamento(sugestao["booking_url"])
            if avaliacao is not None:
                conn.execute(
                    "UPDATE alojamentos SET avaliacao_booking = ? WHERE id = ?",
                    (avaliacao, novo_id),
                )
        else:
            return None

        conn.execute(
            """
            UPDATE sugestoes_locais
            SET categoria = ?, nome = ?, descricao = ?, morada = ?, telefone = ?, site = ?, booking_url = ?, email = ?, foto_path = ?, recomendado_por = ?, lat = ?, lon = ?, estado = 'aceite'
            WHERE id = ?
            """,
            (
                sugestao["categoria"],
                sugestao["nome"],
                sugestao["descricao"],
                sugestao["morada"] or None,
                sugestao["telefone"] or None,
                sugestao["site"] or None,
                sugestao["booking_url"] or None,
                sugestao["email"] or None,
                sugestao["foto_path"],
                sugestao["recomendado_por"] or None,
                sugestao.get("lat"),
                sugestao.get("lon"),
                sugestao_id,
            ),
        )

    # apaga a foto anterior se foi substituída por uma nova
    if foto_antiga and foto_antiga != sugestao["foto_path"]:
        caminho_foto_antiga = BASE_DIR / foto_antiga
        if caminho_foto_antiga.exists() and caminho_foto_antiga.is_file():
            caminho_foto_antiga.unlink()

    sugestao["estado"] = "aceite"
    return sugestao


def apagar_sugestao_local(sugestao_id: int) -> bool:
    # apaga a sugestão, os registos relacionados nas tabelas de conteúdo e a foto do disco
    with sqlite3.connect(CONTACTOS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        linha = conn.execute(
            """
            SELECT id, nome, foto_path
            FROM sugestoes_locais
            WHERE id = ?
            """,
            (sugestao_id,),
        ).fetchone()

        if not linha:
            return False

        sugestao = dict(linha)
        for tabela in ("pontos_interesse", "atividades", "restaurantes", "alojamentos"):
            conn.execute(
                f"""
                DELETE FROM {tabela}
                WHERE origem = 'malta'
                  AND (
                    origem_sugestao_id = ?
                    OR (
                        origem_sugestao_id IS NULL
                        AND imagem = ?
                        AND nome = ?
                    )
                  )
                """,
                (
                    sugestao_id,
                    sugestao["foto_path"],
                    sugestao["nome"],
                ),
            )

        cursor = conn.execute("DELETE FROM sugestoes_locais WHERE id = ?", (sugestao_id,))

    if cursor.rowcount and sugestao["foto_path"]:
        caminho_foto = BASE_DIR / sugestao["foto_path"]
        if caminho_foto.exists() and caminho_foto.is_file():
            caminho_foto.unlink()

    return cursor.rowcount > 0


TABELAS_CONTEUDO = {
    "pontos_interesse",
    "restaurantes",
    "alojamentos",
    "atividades",
}


def ler_tabela_projeto(nome_tabela: str, origem: str | None = None) -> list[dict]:
    # lê uma tabela de conteúdo autorizada e devolve os registos pela ordem editorial
    if nome_tabela not in TABELAS_CONTEUDO:
        raise ValueError("Tabela de conteúdo inválida.")

    where = ""
    parametros: tuple[str, ...] = ()
    if origem:
        where = "WHERE origem = ?"
        parametros = (origem,)

    with sqlite3.connect(CONTACTOS_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        linhas = conn.execute(
            f"SELECT * FROM {nome_tabela} {where} ORDER BY ordem, id",
            parametros,
        ).fetchall()

    return [dict(linha) for linha in linhas]


def obter_dados_projeto(origem: str | None = None) -> dict:
    return {
        "pontos_interesse": ler_tabela_projeto("pontos_interesse", origem),
        "restaurantes": ler_tabela_projeto("restaurantes", origem),
        "alojamentos": ler_tabela_projeto("alojamentos", origem),
        "atividades": ler_tabela_projeto("atividades", origem),
    }


def criar_contexto_site_db() -> str:
    # constrói o bloco de contexto do assistente ia a partir da base de dados
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

Transportes publicos (rede Carris Metropolitana, operada pela TST), partindo/chegando ao
Terminal Rodoviario de Sesimbra (junto ao Porto de Abrigo):
- Linha 3721: Lisboa (Sete Rios) - Sesimbra (Terminal). Liga Sesimbra a Lisboa.
- Linha 3536: Cacilhas (Terminal) - Sesimbra (Terminal). Liga Sesimbra a Cacilhas (Almada).
- Linha 4642: Sesimbra (Terminal) - Setubal (Hospital). Liga Sesimbra a Setubal.
- Linha 3205: Sesimbra (Terminal) - Cabo Espichel. Liga a vila ao Cabo Espichel.
- Linha 3207: Sesimbra (Terminal) - Carrasqueira.
- Linha 3208: Sesimbra (Terminal) - Fetais.
- Linha 3209: Sesimbra (Terminal) - Aldeia do Meco. Util para a Praia do Meco.
- Linha 3220: Sesimbra Circular (percurso interno na vila).
- Linha 3222: Quinta do Conde Circular.
- Linha 3549: Sesimbra (Terminal) - Quinta do Conde, via Sampaio e Marco do Grilo.
Para viagens vindas de Palmela ou Setubal, a opcao recomendada e apanhar a linha 4642 com
destino/origem Setubal e fazer ligacao em Setubal. Os horarios exatos devem ser confirmados
em www.carrismetropolitana.pt ou www.tsuldotejo.pt, pois sao atualizados periodicamente.

Objetivo do assistente:
Responder perguntas do utilizador e, quando pedido, criar planos de viagem com ordem de visita,
rotas aproximadas, tempos, transportes, restaurantes e custos previstos. Se nao houver dados
oficiais, apresentar valores como estimativas.
"""


def pedir_json(url: str, timeout: int = 5) -> dict | None:
    # faz um pedido get e devolve o json, ou none em caso de erro
    try:
        with urlopen(url, timeout=timeout) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError, OSError):
        return None


def pedir_json_post(url: str, payload: dict, headers: dict | None = None, timeout: int = 20) -> dict | None:
    # faz um pedido post com json e devolve a resposta, ou none em caso de erro
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
    # procura o número de telefone de um local no openstreetmap pelo nome e cidade
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
    # para cada restaurante, usa o telefone existente ou vai buscá-lo ao osm
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


def obter_meteorologia() -> str:
    # vai buscar a meteorologia atual de sesimbra à api open-meteo
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


# raio em torno de sesimbra (km) dentro do qual a transit api tem cobertura util
RAIO_TRANSIT_KM = 70


def extrair_origem_transporte(pergunta: str) -> str | None:
    # tenta detetar a localidade de origem numa pergunta sobre como chegar a sesimbra
    pergunta_lower = pergunta.lower()
    if "sesimbra" not in pergunta_lower:
        return None

    padrao = (
        r"(?:de|desde|do|da|dos|das|a partir de|partindo de|saindo de)\s+"
        r"([a-zà-ÿ][a-zà-ÿ\s]{1,40}?)"
        r"(?=\s+(?:para|até|a|atè)\s+sesimbra|[,.!?]|\s+e\s|$)"
    )
    correspondencia = re.search(padrao, pergunta_lower)
    if not correspondencia:
        return None

    origem = correspondencia.group(1).strip()
    if not origem or "sesimbra" in origem:
        return None

    return origem


def geocodificar_local(nome: str, timeout: int = 10) -> tuple[float, float] | None:
    # converte um nome de localidade em coordenadas usando o nominatim (openstreetmap)
    parametros = urlencode({"format": "json", "q": f"{nome}, Portugal", "limit": 1})
    url = f"https://nominatim.openstreetmap.org/search?{parametros}"

    try:
        pedido = Request(url, headers={"User-Agent": OSM_USER_AGENT})
        with urlopen(pedido, timeout=timeout) as resposta:
            dados = json.loads(resposta.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError, OSError):
        return None

    if not dados:
        return None

    try:
        return float(dados[0]["lat"]), float(dados[0]["lon"])
    except (KeyError, ValueError, TypeError, IndexError):
        return None


def distancia_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # distância aproximada entre duas coordenadas (formula de haversine)
    raio_terra = 6371
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    return 2 * raio_terra * atan2(sqrt(a), sqrt(1 - a))


def obter_plano_transit(origem_lat: float, origem_lon: float, timeout: int = 10) -> dict | None:
    # pede um plano de viagem até sesimbra à transit api
    api_key = os.environ.get("TRANSIT_API_KEY")
    if not api_key:
        return None

    parametros = urlencode({
        "from_lat": origem_lat,
        "from_lon": origem_lon,
        "to_lat": CENTRO_SESIMBRA["lat"],
        "to_lon": CENTRO_SESIMBRA["lon"],
    })
    url = f"https://external.transitapp.com/v4/public/plan?{parametros}"

    try:
        pedido = Request(url, headers={"apiKey": api_key})
        with urlopen(pedido, timeout=timeout) as resposta:
            return json.loads(resposta.read().decode("utf-8"))
    except (URLError, TimeoutError, ValueError, OSError):
        return None


def _nome_paragem(itinerario: dict, global_stop_id: str | None) -> str:
    if not global_stop_id:
        return ""

    for paragem in itinerario.get("stops", []):
        if paragem.get("global_stop_id") == global_stop_id:
            return paragem.get("stop_name", "")

    return ""


def _descricao_linha(rota: dict) -> str:
    modo = rota.get("mode_name") or "Transporte publico"
    nome_curto = str(rota.get("route_short_name") or "")
    rede = rota.get("route_network_name")

    if nome_curto and (any(caracter.isdigit() for caracter in nome_curto) or " " in nome_curto):
        return f"{modo} {nome_curto}"
    if rede:
        return f"{modo} {rede}"
    if nome_curto:
        return f"{modo} {nome_curto}"

    return modo


def formatar_plano_transit(plano: dict | None) -> str | None:
    # converte a resposta da transit api num resumo legivel do trajeto sugerido
    if not plano:
        return None

    resultados = plano.get("results") or []
    if not resultados:
        return None

    melhor = resultados[0]
    linhas = []

    for perna in melhor.get("legs", []):
        duracao_min = round(perna.get("duration", 0) / 60)
        inicio = datetime.fromtimestamp(perna.get("start_time", 0)).strftime("%H:%M")
        fim = datetime.fromtimestamp(perna.get("end_time", 0)).strftime("%H:%M")

        if perna.get("leg_mode") == "walk":
            if duracao_min >= 1:
                linhas.append(f"A pe ({duracao_min} min)")
            continue

        rota = (perna.get("routes") or [{}])[0]
        itinerario = (rota.get("itineraries") or [{}])[0]
        destino_linha = itinerario.get("headsign", "")

        detalhes = (perna.get("departures") or [{}])[0].get("plan_details", {})
        paragens = detalhes.get("stop_schedule_items", [])
        paragem_embarque = paragens[0].get("global_stop_id") if paragens else None
        paragem_desembarque = paragens[-1].get("global_stop_id") if paragens else None

        nome_embarque = _nome_paragem(itinerario, paragem_embarque)
        nome_desembarque = _nome_paragem(itinerario, paragem_desembarque)

        descricao = _descricao_linha(rota)
        if destino_linha:
            descricao += f" (direcao {destino_linha})"
        if nome_embarque:
            descricao += f": embarcar em {nome_embarque} as {inicio}"
        if nome_desembarque:
            descricao += f", desembarcar em {nome_desembarque} as {fim}"
        descricao += f" ({duracao_min} min)"

        linhas.append(descricao)

    if not linhas:
        return None

    duracao_total = round(melhor.get("duration", 0) / 60)
    passos = "\n".join(f"- {linha}" for linha in linhas)
    return f"Trajeto sugerido (duracao total aproximada {duracao_total} min):\n{passos}"


def obter_transporte_tempo_real(pergunta: str) -> str | None:
    # se a pergunta indicar uma origem proxima de sesimbra, devolve um trajeto real da transit api
    origem = extrair_origem_transporte(pergunta)
    if not origem:
        return None

    coordenadas = geocodificar_local(origem)
    if not coordenadas:
        return None

    origem_lat, origem_lon = coordenadas
    if distancia_km(origem_lat, origem_lon, CENTRO_SESIMBRA["lat"], CENTRO_SESIMBRA["lon"]) > RAIO_TRANSIT_KM:
        return None

    plano = obter_plano_transit(origem_lat, origem_lon)
    resumo = formatar_plano_transit(plano)
    if not resumo:
        return None

    return f"Dados de transporte em tempo real ({origem.title()} -> Sesimbra):\n{resumo}"


def extrair_texto_gemini(resposta: dict | None) -> str:
    # extrai o texto das respostas candidatas devolvidas pelo gemini
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
    # verifica se o gemini cortou a resposta por atingir o limite de tokens
    if not resposta:
        return False

    return any(
        candidato.get("finishReason") == "MAX_TOKENS"
        for candidato in resposta.get("candidates", [])
    )


def resumo_resposta_gemini(resposta_json: str) -> dict:
    # extrai campos relevantes da resposta gemini para mostrar no painel de logs
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


def formatar_historico_chatbot(historico: list[dict] | None) -> str:
    # formata as ultimas trocas da conversa para dar contexto ao gemini
    if not historico:
        return ""

    linhas = []
    for item in historico[-8:]:
        tipo = item.get("tipo")
        texto = str(item.get("texto", "")).strip()[:700]
        if not texto:
            continue

        papel = "Utilizador" if tipo == "user" else "Assistente"
        linhas.append(f"{papel}: {texto}")

    if not linhas:
        return ""

    return "Conversa anterior (mais recente no fim):\n" + "\n".join(linhas) + "\n\n"


def criar_prompt_chatbot(
    pergunta: str,
    pagina: str,
    meteorologia: str,
    transporte_tempo_real: str | None = None,
    bloco_historico: str = "",
) -> str:
    # monta o prompt completo para enviar ao gemini com o contexto do site
    contexto_site = criar_contexto_site_db()
    bloco_transporte_tempo_real = (
        f"\n{transporte_tempo_real}\n"
        "Estes dados de transporte em tempo real sao mais fiaveis do que o teu conhecimento geral: "
        "usa-os como base principal da resposta, mas podes complementar com o teu conhecimento sobre "
        "transbordos ou alternativas se for util.\n"
        if transporte_tempo_real
        else ""
    )

    return (
        "Responde SEMPRE em portugues europeu de Portugal (nunca em portugues do Brasil), de forma util e "
        "direta, como assistente do site de turismo de Sesimbra. "
        "Podes usar um tom casual e simpatico, mais informal e proximo, como falarias com um amigo (sem deixar "
        "de ser claro e respeitoso); evita um registo demasiado formal ou robotico. Mesmo num tom casual, "
        "mantem sempre a gramatica e o vocabulario de Portugal: usa a forma 'tu' (nunca 'você'), evita "
        "gerundismos tipicos do Brasil (por exemplo 'estou indo', 'vai estar chegando', 'chegando a Sete "
        "Rios') e usa antes infinitivo ou presente simples (por exemplo 'ao chegar a Sete Rios', 'quando "
        "chegares'). "
        "Usa principalmente o contexto do site abaixo, mas para perguntas sobre transportes publicos "
        "(autocarros, comboios, metro, barcos/ferries, numeros de linha ou carreira, horarios, estacoes, "
        "paragens, origens e destinos, em Sesimbra ou em qualquer outro ponto de Portugal) podes tambem "
        "usar o teu proprio conhecimento sobre as redes de transportes portuguesas (Carris Metropolitana, "
        "TST, Fertagus, CP, Metro de Lisboa, Transtejo/Soflusa, Rede Expressos, etc.), dando respostas o mais "
        "concretas e diretas possivel: numero da linha/carreira, estacao ou paragem de embarque, eventuais "
        "transbordos, e horarios aproximados de partida e chegada. "
        "Nao uses expressoes do portugues do Brasil como 'pular', 'ônibus' ou 'legal'; usa 'dar um mergulho', 'autocarro' e 'agradavel'. "
        "Se o utilizador pedir roteiro, inclui ordem dos pontos, tempos aproximados, transporte recomendado, "
        "custos estimados e sugestao de restaurante. "
        "Se o utilizador pedir para ir de um sitio para outro (de Sesimbra, ou de qualquer outra localidade "
        "de Portugal para Sesimbra), uma rota, ou como chegar (a pe, autocarro, comboio, metro, barco, carro, "
        "etc.), para cada trajeto sugere o(s) meio(s) de transporte mais adequados com tempo estimado. "
        "A explicacao por escrito do percurso e o mais importante e deve vir sempre em primeiro lugar: "
        "descreve passo a passo onde o utilizador embarca (paragem, estacao ou terminal), o numero da "
        "linha/carreira a apanhar, em que paragens ou estacoes faz transbordo (se houver), em que linha/"
        "carreira segue depois, e onde desembarca, com horarios aproximados de partida e chegada em cada "
        "etapa. "
        "Sempre que possivel, indica o numero da linha/carreira, a origem/destino, onde embarcar (no caso de "
        "Sesimbra, o Terminal Rodoviario junto ao Porto de Abrigo) e eventuais transbordos, com horarios "
        "aproximados. "
        "Sempre que indicares um trajeto com horarios de partida e chegada (incluindo etapas a pe e "
        "transbordos), soma a duracao de todas as etapas e indica no final a duracao total aproximada da "
        "viagem, em horas e minutos (por exemplo 'duracao total aproximada: 3h20'). "
        "Usa a conversa anterior (se existir) para entender perguntas de seguimento, como 'essa viagem', "
        "'esse trajeto' ou 'quanto tempo demora no total': calcula a resposta com base no trajeto que ja "
        "indicaste antes, sem pedir ao utilizador para repetir informacao que ja deu, e sem voltares a "
        "descrever o trajeto inteiro a nao ser que ele peca. "
        "Depois dessa explicacao, podes opcionalmente acrescentar, numa ultima linha curta, um link do Google "
        "Maps no formato "
        "https://www.google.com/maps/dir/?api=1&origin=ORIGEM,+Sesimbra&destination=DESTINO,+Sesimbra&travelmode=driving "
        "(troca 'driving' por 'walking' ou 'transit' conforme o meio sugerido, e substitui ORIGEM/DESTINO pelos "
        "nomes dos locais com espacos trocados por +), mas o link nunca substitui a descricao por escrito do "
        "percurso. "
        "Da sempre os horarios aproximados que conheces (nunca te limites a dizer que existem sem dar "
        "numeros) e so depois, se quiseres, sugere confirmar eventuais alteracoes recentes no site oficial "
        "da operadora relevante. So fales de precos se o utilizador perguntar especificamente sobre custo, "
        "preco ou bilhete; caso contrario nao mencionas precos. Sempre que mencionares um site oficial para "
        "confirmar horarios (por exemplo da Carris Metropolitana, TST, Fertagus, CP, Transtejo/Soflusa, Rede "
        "Expressos, etc.), inclui o endereco do site (ex.: www.carrismetropolitana.pt, www.tsuldotejo.pt, "
        "www.fertagus.pt, www.cp.pt, www.ttsl.pt) em vez de dizeres apenas 'o site da empresa'. "
        "Foca-te sobretudo em transportes publicos (comboio, autocarro, metro, barco): linhas, horarios "
        "aproximados, frequencias e transbordos. "
        "IMPORTANTE - verificacao de consistencia horaria: antes de indicares horas de partida e chegada, "
        "faz mentalmente a soma de todas as etapas (duracao real de cada troco + tempo de espera realista "
        "entre transbordos, tipicamente 15 a 30 minutos). Por exemplo, se uma viagem tem uma etapa de "
        "2h30 e outra de 1h00 com 20 minutos de espera, a duracao total e 3h50 e a chegada tem de ser "
        "pelo menos 3h50 depois da partida. Se os horarios que ias indicar sao inconsistentes com essa "
        "soma (chegada antes do possivel), corrige-os antes de responder. Nunca indiques uma chegada "
        "que seja impossivel dada a distancia real e duracao dos transportes. "
        "Se a pergunta usar referencias relativas ao momento atual (por exemplo 'agora', 'esta noite', 'hoje', "
        "'amanha', 'daqui a X', um dia da semana sem data), usa SEMPRE a data e hora atuais indicadas abaixo "
        "como referencia, em vez de assumires que e de dia ou que e um horario normal de funcionamento. "
        "Usa o teu proprio conhecimento e bom senso sobre os horarios reais de funcionamento dos "
        "transportes publicos em Portugal para avaliar com realismo se ha algum servico a circular nessa "
        "altura, em vez de assumires sempre que ha uma proxima ligacao. Se concluires que a essa hora "
        "(por exemplo de madrugada) nao existe nenhuma opcao viavel de transporte publico para o trajeto "
        "pedido, di-lo claramente em poucas palavras, sugere logo o taxi ou TVDE como melhor opcao imediata, "
        "e a seguir indica a primeira ligacao de transporte publico do dia seguinte a partir do mesmo ponto "
        "de partida indicado pelo utilizador e com destino a Sesimbra (linha/carreira e horario aproximado de "
        "inicio de servico, com base no teu conhecimento geral dos horarios habituais dessa rede, mesmo que "
        "seja uma estimativa), para quem preferir esperar. Se, pelo contrario, houver mesmo um servico "
        "noturno ou matinal proximo em que confies, indica-o com o horario aproximado e a linha/carreira, em "
        "vez do taxi/TVDE. Menciona o taxi ou TVDE apenas UMA vez na resposta (nunca repitas essa sugestao "
        "no final se ja a tiveres feito antes). "
        "Quando indicares a primeira ligacao do dia, da o horario aproximado do primeiro servico em CADA "
        "etapa do percurso, incluindo a primeira etapa a partir do ponto de partida indicado pelo utilizador "
        "(por exemplo o primeiro metro ou comboio do dia nessa estacao), e nao apenas das etapas seguintes. "
        "Os horarios e linhas concretas que indicares para a madrugada ou para a primeira ligacao do dia sao "
        "sempre estimativas indicativas (podem nao corresponder exatamente a rede e transbordos reais); "
        "por isso, nestes casos, termina sempre recomendando confirmar a rota e horarios exatos na app "
        "Moovit ou no Google Maps (modo transportes publicos), que mostram em tempo real as ligacoes, "
        "linhas e transbordos disponiveis a partir da localizacao do utilizador. "
        "Nao uses Markdown: nao uses asteriscos, cardinal, tabelas nem blocos de codigo. "
        "Escreve com frases completas, sem cortar titulos. "
        "Se a resposta tiver passos numerados (1., 2., 3., ...), separa cada passo do seguinte com uma "
        "linha em branco, para ficar mais facil de ler. "
        "Mantem a resposta compacta: usa no maximo 8 linhas curtas, e se houver mais do que uma alternativa "
        "viavel organiza-as em linhas separadas (por exemplo 'Opcao 1 - ...', 'Opcao 2 - ...') em vez de um "
        "unico paragrafo. "
        "Se for um roteiro, usa 4 a 6 passos numerados, cada um com apenas a informacao essencial. "
        "Inclui detalhes importantes e concretos (numeros de linha, horarios aproximados), mas evita "
        "introducoes longas, repeticao e perguntas de seguimento desnecessarias.\n\n"
        f"Data e hora atuais: {DIAS_SEMANA_PT[datetime.now().weekday()]}, "
        f"{datetime.now().strftime('%d/%m/%Y, %H:%M')}\n"
        f"Pagina atual do utilizador: {pagina}\n"
        f"Meteorologia atual aproximada em Sesimbra: {meteorologia}\n"
        f"{bloco_transporte_tempo_real}\n"
        f"Contexto do site:\n{contexto_site}\n\n"
        f"{bloco_historico}"
        f"Pergunta do utilizador:\n{pergunta}"
    )


def chamar_gemini_prompt(prompt: str) -> tuple[str, dict, str]:
    # envia o prompt à api do gemini e devolve (texto, resposta_bruta, estado)
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

    # garante uma linha em branco antes de cada passo numerado a partir do 2., mesmo que o gemini nao a tenha incluido
    texto = re.sub(r"\n(?!\n)(?=[2-9]\d*\.\s)", "\n\n", texto)

    return texto, resposta or {}, "ok"


# regista as rotas da api passando as dependências como namespace para evitar imports circulares
registar_rotas(
    app,
    SimpleNamespace(
        BASE_DIR=BASE_DIR,
        FRONTEND_DIR=FRONTEND_DIR,
        DB_PATH=DB_PATH,
        CONTACTOS_DB_PATH=CONTACTOS_DB_PATH,
        GEMINI_MODEL=GEMINI_MODEL,
        obter_ip_cliente=obter_ip_cliente,
        verificar_limite_ip=verificar_limite_ip,
        verificar_limite_contactos=verificar_limite_contactos,
        validar_csrf=validar_csrf,
        validar_admin_token=validar_admin_token,
        guardar_log_api=guardar_log_api,
        guardar_contacto=guardar_contacto,
        guardar_sugestao_local=guardar_sugestao_local,
        guardar_imagem_sugestao=guardar_imagem_sugestao,
        validar_dados_contacto=validar_dados_contacto,
        validar_sugestao_local=validar_sugestao_local,
        telefone_internacional_valido=telefone_internacional_valido,
        publicar_sugestao_local=publicar_sugestao_local,
        apagar_sugestao_local=apagar_sugestao_local,
        ler_tabela_projeto=ler_tabela_projeto,
        obter_dados_projeto=obter_dados_projeto,
        buscar_telefones_restaurantes=buscar_telefones_restaurantes,
        geocodificar_local=geocodificar_local,
        obter_meteorologia=obter_meteorologia,
        obter_transporte_tempo_real=obter_transporte_tempo_real,
        formatar_historico_chatbot=formatar_historico_chatbot,
        criar_prompt_chatbot=criar_prompt_chatbot,
        chamar_gemini_prompt=chamar_gemini_prompt,
        resumo_resposta_gemini=resumo_resposta_gemini,
    ),
)


# inicializa as bases de dados ao arrancar a aplicação
init_db()


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "").strip().lower() in {"1", "true", "sim", "yes"}
    app.run(debug=debug)
