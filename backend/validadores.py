"""
validadores.py — funções de validação de dados usadas pelo backend Flask:
  telefone internacional, URL HTTP(S) e dados dos formulários de contacto e sugestão.
"""
from __future__ import annotations

import re
from urllib.parse import urlsplit


def telefone_internacional_valido(telefone: str) -> bool:
    """Verifica se o número de telefone segue o formato internacional (+351...)."""
    if not telefone:
        return True
    normalizado = re.sub(r"[\s().-]", "", telefone)
    return bool(re.fullmatch(r"\+[1-9]\d{7,14}", normalizado))


def url_http_valida(valor: str) -> bool:
    """Verifica se a URL é válida, começa por http/https e tem domínio bem formado."""
    if not valor or len(valor) > 220 or re.search(r"\s", valor):
        return False

    try:
        url = urlsplit(valor)
        # A leitura da porta também rejeita valores como ":abc" ou portas fora do intervalo.
        _ = url.port
        if url.scheme.lower() not in {"http", "https"}:
            return False
        if not url.hostname or url.username or url.password:
            return False

        dominio = url.hostname.encode("idna").decode("ascii").rstrip(".")
        etiquetas = dominio.split(".")
        if len(etiquetas) < 2:
            return False
        return all(
            re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?", etiqueta)
            for etiqueta in etiquetas
        )
    except (UnicodeError, ValueError):
        return False


def validar_dados_contacto(dados: dict) -> tuple[dict, list[str]]:
    """Valida os campos do formulário de contacto; devolve (contacto_limpo, lista_de_erros)."""
    # normaliza os campos do formulário de contacto antes de validar
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
        erros.append("Telemóvel deve ter menos de 20 caracteres.")
    if contacto["telefone"] and not telefone_internacional_valido(contacto["telefone"]):
        erros.append("Telemóvel inválido. Use o indicativo internacional.")
    if len(contacto["mensagem"]) < 3:
        erros.append("Mensagem deve ter pelo menos 3 caracteres.")
    if len(contacto["mensagem"]) > 300:
        erros.append("Mensagem deve ter menos de 300 caracteres.")

    return contacto, erros


def validar_sugestao_local(dados: dict) -> tuple[dict, list[str]]:
    """Valida os campos da sugestão da comunidade; devolve (sugestao_limpa, lista_de_erros)."""
    # lê um campo e converte para string vazia se ausente ou None
    def texto_opcional(campo: str) -> str:
        valor = dados.get(campo, "")
        if valor is None:
            return ""
        return str(valor).strip()

    sugestao = {
        "categoria": texto_opcional("categoria"),
        "nome": texto_opcional("nome"),
        "descricao": texto_opcional("descricao"),
        "morada": texto_opcional("morada"),
        "telefone": texto_opcional("telefone"),
        "site": texto_opcional("site"),
        "booking_url": texto_opcional("booking_url"),
        "email": texto_opcional("email"),
        "foto_path": texto_opcional("foto_path"),
        "recomendado_por": texto_opcional("recomendado_por"),
        "pagina_origem": texto_opcional("pagina_origem"),
        "lat": texto_opcional("lat"),
        "lon": texto_opcional("lon"),
    }
    erros = []

    categorias_validas = {
        "Ponto turistico",
        "Atividade",
        "Gastronomia",
        "Alojamento",
    }

    if sugestao["categoria"] not in categorias_validas:
        erros.append("Categoria inválida.")

    # ignora dados que não pertencem à categoria antes de validar os formatos
    campos_por_categoria = {
        "Ponto turistico": {"morada", "telefone"},
        "Atividade": {"morada", "telefone"},
        "Gastronomia": {"morada", "telefone", "email", "site"},
        "Alojamento": {"morada", "telefone", "booking_url", "site"},
    }
    campos_especificos = {"morada", "telefone", "site", "booking_url", "email"}
    campos_permitidos = campos_por_categoria.get(sugestao["categoria"], set())
    for campo in campos_especificos - campos_permitidos:
        sugestao[campo] = ""

    if len(sugestao["nome"]) < 3:
        erros.append("Nome deve ter pelo menos 3 caracteres.")
    if len(sugestao["nome"]) > 25:
        erros.append("Nome deve ter menos de 25 caracteres.")
    if len(sugestao["descricao"]) < 10:
        erros.append("Descrição deve ter pelo menos 10 caracteres.")
    if len(sugestao["descricao"]) > 110:
        erros.append("Descrição deve ter menos de 110 caracteres.")
    if len(sugestao["morada"]) > 30:
        erros.append("Morada deve ter menos de 30 caracteres.")
    if len(sugestao["telefone"]) > 20:
        erros.append("Telemóvel deve ter menos de 20 caracteres.")
    if sugestao["telefone"] and not telefone_internacional_valido(sugestao["telefone"]):
        erros.append("Telemóvel inválido. Use o indicativo internacional.")
    if len(sugestao["site"]) > 220:
        erros.append("Site deve ter menos de 220 caracteres.")
    if sugestao["site"] and not url_http_valida(sugestao["site"]):
        erros.append("Site inválido. Use um link completo iniciado por http:// ou https://.")

    if len(sugestao["booking_url"]) > 220:
        erros.append("Link do alojamento deve ter menos de 220 caracteres.")
    if sugestao["booking_url"] and not url_http_valida(sugestao["booking_url"]):
        erros.append("Link do alojamento inválido. Use um link completo iniciado por http:// ou https://.")
    if len(sugestao["email"]) > 120:
        erros.append("Email deve ter menos de 120 caracteres.")
    if sugestao["email"] and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", sugestao["email"]):
        erros.append("Email inválido.")
    if len(sugestao["pagina_origem"]) > 100:
        erros.append("Página de origem inválida.")
    if len(sugestao["recomendado_por"]) > 30:
        erros.append("Nome de quem recomenda deve ter menos de 30 caracteres.")
    if bool(sugestao["lat"]) != bool(sugestao["lon"]):
        erros.append("Preencha latitude e longitude em conjunto.")
    if sugestao["lat"] and sugestao["lon"]:
        try:
            lat = float(sugestao["lat"].replace(",", "."))
            lon = float(sugestao["lon"].replace(",", "."))
        except ValueError:
            erros.append("Coordenadas inválidas.")
        else:
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                erros.append("Coordenadas fora do intervalo válido.")
            sugestao["lat"] = lat
            sugestao["lon"] = lon
    else:
        sugestao["lat"] = None
        sugestao["lon"] = None
    # valida que o caminho da foto está dentro da pasta segura de sugestões
    if sugestao["foto_path"] and not sugestao["foto_path"].startswith("img/sugestoes/"):
        erros.append("Foto inválida.")

    return sugestao, erros
