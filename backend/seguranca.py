from __future__ import annotations

import os
import secrets
import time
from collections import defaultdict, deque

from flask import request

from .configuracoes import ALLOWED_ORIGINS


# limites de pedidos do assistente ia por ip: janela curta (1 min) e longa (1 hora)
RATE_LIMIT_JANELA_CURTA = 60
RATE_LIMIT_JANELA_LONGA = 60 * 60
RATE_LIMIT_MAX_CURTO = 8
RATE_LIMIT_MAX_LONGO = 45
# intervalo mínimo em segundos entre pedidos consecutivos do mesmo ip
RATE_LIMIT_INTERVALO_MINIMO = 2.5
RATE_LIMIT_PEDIDOS: dict[str, deque[float]] = defaultdict(deque)

# limites de envio de mensagens de contacto por ip (máx. 5 por 10 minutos)
CONTACTOS_RATE_LIMIT_MAX = 5
CONTACTOS_RATE_LIMIT_JANELA = 10 * 60
CONTACTOS_RATE_LIMIT_PEDIDOS: dict[str, deque[float]] = defaultdict(deque)


def adicionar_cors(response):
    # adiciona os cabeçalhos cors apenas para origens conhecidas
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-CSRF-Token, X-Admin-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    set_cookie_headers = response.headers.getlist("Set-Cookie")
    csrf_ja_definido = any(header.startswith("csrf_token=") for header in set_cookie_headers)

    # emite o cookie csrf apenas se o cliente ainda não o tiver
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
    # usa o cabeçalho x-forwarded-for se existir (proxy/load balancer)
    encaminhado = request.headers.get("X-Forwarded-For", "")
    if encaminhado:
        return encaminhado.split(",")[0].strip()

    return request.remote_addr or "desconhecido"


def verificar_limite_ip(ip: str) -> tuple[bool, str]:
    # verifica se o ip excedeu algum dos limites do assistente ia
    agora = time.time()
    pedidos = RATE_LIMIT_PEDIDOS[ip]

    # remove registos mais antigos que a janela longa
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
    # verifica se o ip excedeu o limite de envio de mensagens de contacto
    agora = time.time()
    pedidos = CONTACTOS_RATE_LIMIT_PEDIDOS[ip]

    while pedidos and agora - pedidos[0] > CONTACTOS_RATE_LIMIT_JANELA:
        pedidos.popleft()

    if len(pedidos) >= CONTACTOS_RATE_LIMIT_MAX:
        return False, "Recebemos muitas mensagens em pouco tempo. Tente novamente mais tarde."

    pedidos.append(agora)
    return True, ""


def validar_csrf() -> bool:
    # compara o token csrf do cookie com o do cabeçalho de forma segura (sem timing attacks)
    token_cookie = request.cookies.get("csrf_token", "")
    token_header = request.headers.get("X-CSRF-Token", "")
    return bool(token_cookie and token_header and secrets.compare_digest(token_cookie, token_header))


def validar_admin_token() -> bool:
    # valida o token de acesso ao painel de administração
    admin_token = os.environ.get("ADMIN_TOKEN", "")
    token_recebido = request.headers.get("X-Admin-Token", "")
    return bool(admin_token and token_recebido and secrets.compare_digest(admin_token, token_recebido))
