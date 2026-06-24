from __future__ import annotations

import os
from pathlib import Path


# caminhos base do projeto calculados a partir da localização deste ficheiro
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DATABASE_DIR = BASE_DIR / "database"

# base de dados de logs da api e base de dados principal do projeto
DB_PATH = DATABASE_DIR / "API_Log.db"
CONTACTOS_DB_PATH = DATABASE_DIR / "Projeto.db"

# pasta onde são guardadas as imagens enviadas pelas sugestões da comunidade
SUGESTOES_IMG_DIR = BASE_DIR / "img" / "sugestoes"

# modelo gemini usado pelo assistente ia
GEMINI_MODEL = "gemini-2.5-flash"

# garante que a pasta da base de dados existe antes de qualquer acesso
DATABASE_DIR.mkdir(parents=True, exist_ok=True)

# origens permitidas nos cabeçalhos cors (apenas ambiente de desenvolvimento local)
ALLOWED_ORIGINS = {
    "http://127.0.0.1:5000",
    "http://localhost:5000",
}

# extensões e tamanho máximo aceites para imagens de sugestões
SUGESTAO_IMAGEM_EXTENSOES = {".jpg", ".jpeg", ".png", ".webp"}
SUGESTAO_IMAGEM_MAX_BYTES = 3 * 1024 * 1024
SUGESTAO_IMAGEM_MAX_DIMENSAO = 1920

# identificador do projeto nos pedidos à api do openstreetmap
OSM_USER_AGENT = "Projecto-Sesimbra/1.0 (+https://github.com/Carlosmsp/Pro-Web)"


def carregar_env() -> None:
    # lê o ficheiro .env e carrega as variáveis de ambiente que ainda não estejam definidas
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

        # não sobrescreve variáveis já definidas no ambiente do sistema
        if chave and chave not in os.environ:
            os.environ[chave] = valor
