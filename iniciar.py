from __future__ import annotations

import subprocess
import sys
from pathlib import Path


RAIZ = Path(__file__).resolve().parent
REQUISITOS = RAIZ / "requirements.txt"
APP = RAIZ / "app.py"


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
    subprocess.check_call([sys.executable, str(APP)], cwd=RAIZ)


def main() -> None:
    if not APP.exists():
        raise SystemExit("Nao encontrei app.py.")

    instalar_dependencias()
    iniciar_servidor()


if __name__ == "__main__":
    main()
