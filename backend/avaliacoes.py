from __future__ import annotations

import re

# user-agent de um browser comum, para passar pela proteção anti-bot do booking.com
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# seletores onde cada plataforma mostra a nota média e a escala em que essa nota vem
SELETORES_AVALIACAO = {
    "airbnb": ('[data-testid="pdp-reviews-highlight-banner-host-rating"]', 5),
    "booking": ('[data-testid="review-score-component"]', 10),
}


def obter_avaliacao_alojamento(url: str, timeout_ms: int = 20000) -> float | None:
    # abre o link de reserva (Booking ou Airbnb) num browser headless e devolve
    # a nota exatamente como aparece na plataforma de origem (0-10 no Booking, 0-5 no Airbnb),
    # ou None se não conseguir extrair
    if not url:
        return None

    url_minuscula = url.lower()
    if "airbnb" in url_minuscula:
        seletor, escala_origem = SELETORES_AVALIACAO["airbnb"]
    elif "booking" in url_minuscula:
        seletor, escala_origem = SELETORES_AVALIACAO["booking"]
    else:
        return None

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as playwright:
            navegador = playwright.chromium.launch()
            try:
                pagina = navegador.new_page(user_agent=USER_AGENT)
                pagina.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
                pagina.wait_for_selector(seletor, timeout=timeout_ms)
                texto = pagina.locator(seletor).first.inner_text()
            finally:
                navegador.close()
    except Exception:
        return None

    correspondencia = re.search(r"(\d+),(\d+)", texto)
    if not correspondencia:
        return None

    nota = float(f"{correspondencia.group(1)}.{correspondencia.group(2)}")
    return round(min(max(nota, 0), escala_origem), 1)
