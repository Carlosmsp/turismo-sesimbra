from __future__ import annotations

import subprocess
import sys
from pathlib import Path


RAIZ = Path(__file__).resolve().parent
PASTA_PROJETO = RAIZ / "Projecto-Sesimbra"
REQUISITOS = PASTA_PROJETO / "requirements.txt"
APP = PASTA_PROJETO / "app.py"


def instalar_dependencias() -> None:
    if not REQUISITOS.exists():
        return

    print("A verificar dependencias do projeto...")
    subprocess.check_call([
        sys.executable,
        "-m",
        "pip",
        "install",
        "-r",
        str(REQUISITOS),
    ])


def iniciar_servidor() -> None:
    print("A iniciar o Guia de Sesimbra...")
    print("Abre no navegador: http://127.0.0.1:5000")
    subprocess.check_call([sys.executable, str(APP)], cwd=PASTA_PROJETO)


def main() -> None:
    if not APP.exists():
        raise SystemExit("Nao encontrei Projecto-Sesimbra/app.py.")

    instalar_dependencias()
    iniciar_servidor()


if __name__ == "__main__":
    main()
