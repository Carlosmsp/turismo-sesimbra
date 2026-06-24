// inicializa o plugin de telefone internacional no campo de contacto
function iniciarTelefoneContacto() {
    if (inputTelefone && window.intlTelInput) {
        telefoneInternacional = window.intlTelInput(inputTelefone, {
            initialCountry: "pt",
            countryOrder: ["pt", "br", "es", "fr", "gb"],
            countrySelectorMode: "DROPDOWN",
            matchDropdownWidth: false,
            separateDialCode: true,
            nationalMode: true,
            placeholderNumberPolicy: "AGGRESSIVE",
            placeholderNumberType: "FIXED_LINE_OR_MOBILE",
            strictMode: true,
            allowedNumberTypes: ["MOBILE", "FIXED_LINE"],
            i18n: {
                searchPlaceholder: ""
            },
            loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/js/utils.js")
        });
    }
}

// regista todos os event listeners da página (formulário, dark mode, filtros, teclado)
function iniciarEventosGlobais() {
    if (formularioContacto) {
        formularioContacto.addEventListener("submit", validarForm);
    }
    // limpa o erro do nome ao começar a escrever; valida ao sair do campo
    if (inputNome) {
        inputNome.addEventListener("input", function () {
            inputNome.classList.remove("campo-invalido");
            if (nomeErro) {
                nomeErro.classList.remove("visivel");
            }
        });
        inputNome.addEventListener("blur", function () {
            validarNomeVisual(true);
        });
    }
    // limpa o erro do email ao escrever; valida ao sair do campo
    if (inputEmail) {
        inputEmail.addEventListener("input", function () {
            inputEmail.classList.remove("campo-invalido");
            inputEmail.setCustomValidity("");
            if (emailErro) {
                emailErro.classList.remove("visivel");
            }
        });
        inputEmail.addEventListener("blur", function () {
            validarEmailVisual(true);
        });
        inputEmail.addEventListener("invalid", function () {
            validarEmailVisual(true);
        });
    }
    // valida o telefone em tempo real e ao sair do campo
    if (inputTelefone) {
        inputTelefone.addEventListener("input", function () {
            validarTelefoneVisual(false);
        });
        inputTelefone.addEventListener("blur", function () {
            validarTelefoneVisual(true);
        });
    }
    if (inputMensagem) {
        inputMensagem.addEventListener("input", inputMensagemNumero);
    }
    if (darkModeBotao) {
        darkModeBotao.addEventListener("click", darkModeToggle);
    }
    document.addEventListener("keydown", fecharOverlayComEsc);
}

// recalcula os pontos filtrados e atualiza os cards e o mapa na página
function atualizarInterface() {
    aplicarFiltros();
    addPontosTuristicos();
    if (typeof atualizarMarcadoresMapa === "function") {
        atualizarMarcadoresMapa();
    }
}

function mostrarErroCarregamentoConteudo() {
    const contentores = [pontoCard, actividadeCard, hospedagemCard, gastroCard].filter(Boolean);
    contentores.forEach((contentor) => {
        contentor.replaceChildren();
        const mensagem = document.createElement("p");
        mensagem.className = "sem-resultados";
        mensagem.textContent = "Não foi possível carregar o conteúdo. Atualize a página e tente novamente.";
        contentor.appendChild(mensagem);
    });
}

// ponto de entrada: prepara a estrutura e só renderiza os cartões depois de
// carregar o conteúdo editorial guardado no SQLite.
async function iniciarSite() {
    iniciarTelefoneContacto();
    iniciarEventosGlobais();
    carregarDarkMode();
    addNavLinks();

    if (typeof iniciarMapaPontos === "function") {
        iniciarMapaPontos();
    }

    try {
        await carregarConteudoSite();
        addActividades();
        addHospedagem();
        atualizarInterface();
        if (gastroCard) atualizarGastronomia();
    } catch (erro) {
        console.error("Não foi possível carregar o conteúdo do site.", erro);
        mostrarErroCarregamentoConteudo();
    }

    ativarImagensEstaticas();
    protegerLinksExternos();
    iniciarAssistenteIA();
    iniciarSugestaoLocal();
    carregarRecomendacoesMalta();
}

iniciarSite();
