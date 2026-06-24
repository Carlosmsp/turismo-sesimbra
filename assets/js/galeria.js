// carrossel de imagens da secção "Galeria" da página inicial
function iniciarGaleria() {
    const carrossel = document.getElementById("galeriaCarrossel");
    if (!carrossel) return;

    const pista = carrossel.querySelector(".galeria-pista");
    const slides = Array.from(pista.children);
    const pontosContentor = carrossel.querySelector(".galeria-pontos");
    const botaoAnterior = carrossel.querySelector(".galeria-seta-anterior");
    const botaoSeguinte = carrossel.querySelector(".galeria-seta-seguinte");
    let indiceAtual = 0;
    let temporizador = null;

    // permite ampliar cada imagem da galeria ao clicar (mesmo comportamento dos outros cards)
    slides.forEach((slide) => {
        const imagem = slide.querySelector("img");
        if (imagem) prepararImagemAmpliavel(imagem);
    });

    slides.forEach((_, indice) => {
        const ponto = document.createElement("button");
        ponto.type = "button";
        ponto.className = "galeria-ponto";
        ponto.setAttribute("aria-label", `Ir para a imagem ${indice + 1} de ${slides.length}`);
        ponto.addEventListener("click", () => irParaSlide(indice));
        pontosContentor.appendChild(ponto);
    });
    const pontos = Array.from(pontosContentor.children);

    function irParaSlide(indice) {
        indiceAtual = (indice + slides.length) % slides.length;
        pista.style.transform = `translateX(-${indiceAtual * 100}%)`;
        pontos.forEach((ponto, i) => ponto.classList.toggle("ativo", i === indiceAtual));
    }

    function iniciarTemporizador() {
        temporizador = setInterval(() => irParaSlide(indiceAtual + 1), 9000);
    }

    function pararTemporizador() {
        clearInterval(temporizador);
    }

    botaoAnterior.addEventListener("click", () => {
        irParaSlide(indiceAtual - 1);
        pararTemporizador();
        iniciarTemporizador();
    });
    botaoSeguinte.addEventListener("click", () => {
        irParaSlide(indiceAtual + 1);
        pararTemporizador();
        iniciarTemporizador();
    });

    carrossel.addEventListener("mouseenter", pararTemporizador);
    carrossel.addEventListener("mouseleave", iniciarTemporizador);

    irParaSlide(0);
    iniciarTemporizador();
}

iniciarGaleria();
