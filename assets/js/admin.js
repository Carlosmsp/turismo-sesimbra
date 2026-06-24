(function () {
    const parametros = new URLSearchParams(window.location.search);
    const tokenUrl = parametros.get("token");
    if (!tokenUrl) return;

    sessionStorage.setItem("adminToken", tokenUrl);
    parametros.delete("token");
    const queryLimpa = parametros.toString();
    history.replaceState(null, "", `${window.location.pathname}${queryLimpa ? `?${queryLimpa}` : ""}${window.location.hash}`);
})();

(function () {
    const token = sessionStorage.getItem("adminToken") || "";
    const status = document.getElementById("adminStatus");
    const adminResumo = document.getElementById("adminResumo");
    const sugestoesTabela = document.getElementById("sugestoesTabela");
    const contactosTabela = document.getElementById("contactosTabela");
    const logsTabela = document.getElementById("logsTabela");
    const estadoSugestoesFiltro = document.getElementById("estadoSugestoesFiltro");
    const categoriaSugestoesFiltro = document.getElementById("categoriaSugestoesFiltro");
    const pesquisaSugestoes = document.getElementById("pesquisaSugestoes");
    const atualizarSugestoesBotao = document.getElementById("atualizarSugestoesBotao");
    const criarSugestaoBotao = document.getElementById("criarSugestaoBotao");
    const estadoContactosFiltro = document.getElementById("estadoContactosFiltro");
    const removerSugestoesSelecionadas = document.getElementById("removerSugestoesSelecionadas");
    const darkModeBotao = document.getElementById("darkModeBotao");
    const exportarContactosBotao = document.getElementById("exportarContactosBotao");
    const pesquisaContactos = document.getElementById("pesquisaContactos");
    let estadoSugestoes = "pendente";
    let criarSugestaoAberto = false;
    let categoriaSugestoes = "todas";
    let termoPesquisaSugestoes = "";
    let dadosSugestoes = [];
    let estadoContactos = "todos";
    let dadosContactos = [];
    let dadosLogs = [];
    let termoPesquisaContactos = "";
    const filtrosTabelas = {
        contactos: {},
        logs: {}
    };
    const ordenacaoTabelas = {
        contactos: { campo: "criado_em", direcao: "desc" },
        logs: { campo: "created_at", direcao: "desc" }
    };
    const sugestoesSelecionadasRemocao = new Set();

    function opcoesAdmin(opcoes = {}) {
        return {
            ...opcoes,
            headers: {
                ...(opcoes.headers || {}),
                "X-Admin-Token": token
            }
        };
    }

    function atualizarBotaoDarkMode() {
        if (!darkModeBotao) return;

        const isDarkMode = document.body.classList.contains("darkMode");
        darkModeBotao.textContent = isDarkMode ? "☼" : "⏾";
        darkModeBotao.setAttribute("aria-label", isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro");
        darkModeBotao.setAttribute("aria-pressed", String(isDarkMode));
        darkModeBotao.title = isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro";
    }

    function carregarDarkMode() {
        if (localStorage.getItem("darkMode") === "true") {
            document.body.classList.add("darkMode");
        }
        atualizarBotaoDarkMode();
    }

    function darkModeToggle() {
        document.body.classList.toggle("darkMode");
        localStorage.setItem("darkMode", document.body.classList.contains("darkMode"));
        atualizarBotaoDarkMode();
    }

    function texto(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // injeta um script externo de forma dinâmica e devolve uma promessa
    function carregarScript(src) {
        return new Promise((resolve, reject) => {
            const existente = document.querySelector(`script[src="${src}"]`);
            if (existente) {
                existente.addEventListener("load", resolve, { once: true });
                if (window.intlTelInput) resolve();
                return;
            }

            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // injeta uma folha de estilos externa se ainda não estiver na página
    function carregarCss(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
    }

    // instâncias ativas do plugin de telefone internacional, indexadas pelo id da sugestão
    const telefonesAdminIntl = {};

    // pré-carrega o script e CSS do ITI imediatamente para estar pronto quando qualquer form abrir
    carregarCss("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/css/intlTelInput.css");
    carregarScript("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/js/intlTelInput.min.js").catch(() => {});

    // inicializa o plugin de telefone internacional num campo de telefone do admin (carrega sob demanda)
    async function iniciarTelefoneAdmin(id, raiz = sugestoesTabela) {
        const telefoneInput = raiz.querySelector(`[name="telefone"][data-id="${id}"]`);
        if (!telefoneInput || telefonesAdminIntl[id]) return;

        carregarCss("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/css/intlTelInput.css");

        if (!window.intlTelInput) {
            try {
                await carregarScript("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/js/intlTelInput.min.js");
            } catch (erro) {
                return;
            }
        }

        if (telefonesAdminIntl[id]) return;

        const valorAtual = telefoneInput.value.trim();
        telefonesAdminIntl[id] = window.intlTelInput(telefoneInput, {
            initialCountry: "pt",
            countryOrder: ["pt", "br", "es", "fr", "gb"],
            countrySelectorMode: "DROPDOWN",
            matchDropdownWidth: false,
            separateDialCode: true,
            nationalMode: true,
            placeholderNumberPolicy: "AGGRESSIVE",
            placeholderNumberType: "FIXED_LINE_OR_MOBILE",
            strictMode: true,
            loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/js/utils.js")
        });
        if (valorAtual.startsWith("+") && telefonesAdminIntl[id]?.promise) {
            telefonesAdminIntl[id].promise.then(() => {
                telefonesAdminIntl[id]?.setNumber(valorAtual);
            });
        }
    }

    // destrói a instância do plugin de telefone associada ao id (usado antes de voltar a renderizar a tabela)
    function destruirTelefoneAdmin(id) {
        const instancia = telefonesAdminIntl[id];
        if (!instancia) return;

        try {
            instancia.destroy();
        } catch (erro) {
            // ignora falhas ao destruir uma instância já desmontada do DOM
        }
        delete telefonesAdminIntl[id];
    }

    // devolve o número de telefone completo com indicativo, ou o valor bruto se o plugin não estiver ativo
    function obterTelefoneAdmin(id, raiz = sugestoesTabela) {
        const telefoneInput = raiz.querySelector(`[name="telefone"][data-id="${id}"]`);
        if (!telefoneInput) return "";

        const telefone = telefoneInput.value.trim();
        if (!telefone) return "";

        const instancia = telefonesAdminIntl[id];
        if (instancia && instancia.isValidNumber()) {
            return instancia.getNumber();
        }
        return telefone;
    }

    function urlHttpValidaAdmin(valor) {
        if (!valor || valor.length > 220 || /\s/.test(valor)) return false;
        try {
            const url = new URL(valor);
            const etiquetasDominio = url.hostname.replace(/\.$/, "").split(".");
            const dominioValido = etiquetasDominio.length >= 2
                && etiquetasDominio.every((etiqueta) => (
                    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(etiqueta)
                ));
            return ["http:", "https:"].includes(url.protocol)
                && dominioValido
                && !url.username
                && !url.password;
        } catch (erro) {
            return false;
        }
    }

    const validadoresFormatoAdmin = {
        email: {
            validar: (valor) => valor.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor),
            mensagem: "Por favor, insira um email válido."
        },
        site: {
            validar: urlHttpValidaAdmin,
            mensagem: "Por favor, insira um link válido (deve começar por http:// ou https://)."
        },
        booking_url: {
            validar: urlHttpValidaAdmin,
            mensagem: "Por favor, insira um link válido (deve começar por http:// ou https://)."
        }
    };

    function validarFormatoCampoAdmin(id, nomeCampo, mostrarMensagem, raiz = sugestoesTabela) {
        const campo = raiz.querySelector(`[name="${nomeCampo}"][data-id="${id}"]`);
        const erro = raiz.querySelector(`[data-erro-campo="${nomeCampo}-${id}"]`);
        if (!campo) return true;

        const regra = validadoresFormatoAdmin[nomeCampo === "site_url" ? "site" : nomeCampo];
        if (!regra) return true;
        const valor = campo.value.trim();

        if (!valor || regra.validar(valor)) {
            campo.classList.remove("campo-invalido");
            campo.setAttribute("aria-invalid", "false");
            if (erro) erro.classList.remove("visivel");
            return true;
        }

        campo.classList.add("campo-invalido");
        campo.setAttribute("aria-invalid", "true");
        if (erro) {
            erro.textContent = regra.mensagem;
            erro.classList.toggle("visivel", mostrarMensagem);
        }
        return false;
    }

    function validarTelefoneCampoAdmin(id, mostrarMensagem, raiz = sugestoesTabela) {
        const campo = raiz.querySelector(`[name="telefone"][data-id="${id}"]`);
        const erro = raiz.querySelector(`[data-erro-campo="telefone-${id}"]`);
        if (!campo) return true;

        const telefone = campo.value.trim();
        if (!telefone) {
            campo.classList.remove("campo-invalido");
            campo.setAttribute("aria-invalid", "false");
            campo.closest(".iti")?.classList.remove("campo-invalido");
            if (erro) erro.classList.remove("visivel");
            return true;
        }

        const instancia = telefonesAdminIntl[id];
        const normalizado = telefone.replace(/[\s().-]/g, "");
        const telefoneValido = instancia
            ? instancia.isValidNumber()
            : /^\+[1-9]\d{7,14}$/.test(normalizado);

        if (!telefoneValido) {
            campo.classList.add("campo-invalido");
            campo.setAttribute("aria-invalid", "true");
            campo.closest(".iti")?.classList.add("campo-invalido");
            if (erro) {
                const indicativo = instancia?.getSelectedCountry().dialCode;
                erro.textContent = indicativo
                    ? `Por favor, insira um telemóvel válido para +${indicativo}.`
                    : "Por favor, insira um telemóvel válido com indicativo internacional.";
                erro.classList.toggle("visivel", mostrarMensagem);
            }
            return false;
        }

        campo.classList.remove("campo-invalido");
        campo.setAttribute("aria-invalid", "false");
        campo.closest(".iti")?.classList.remove("campo-invalido");
        if (erro) erro.classList.remove("visivel");
        return true;
    }

    function validarTextoObrigatorioAdmin(id, nomeCampo, minimo, maximo, mostrarMensagem) {
        const campo = sugestoesTabela.querySelector(`[name="${nomeCampo}"][data-id="${id}"]`);
        const erro = sugestoesTabela.querySelector(`[data-erro-campo="${nomeCampo}-${id}"]`);
        if (!campo) return true;

        const tamanho = campo.value.trim().length;
        const valido = tamanho >= minimo && tamanho <= maximo;
        campo.classList.toggle("campo-invalido", !valido);
        campo.setAttribute("aria-invalid", String(!valido));
        if (erro) erro.classList.toggle("visivel", !valido && mostrarMensagem);
        return valido;
    }

    function validarCoordenadasAdmin(id, mostrarMensagem) {
        const latCampo = sugestoesTabela.querySelector(`[name="lat"][data-id="${id}"]`);
        const lonCampo = sugestoesTabela.querySelector(`[name="lon"][data-id="${id}"]`);
        const erro = sugestoesTabela.querySelector(`[data-erro-campo="coordenadas-${id}"]`);
        if (!latCampo || !lonCampo) return true;

        const latValor = latCampo.value.trim().replace(",", ".");
        const lonValor = lonCampo.value.trim().replace(",", ".");
        let valido = true;
        let mensagem = "";

        if (Boolean(latValor) !== Boolean(lonValor)) {
            valido = false;
            mensagem = "Preenche latitude e longitude em conjunto.";
        } else if (latValor && lonValor) {
            const lat = Number(latValor);
            const lon = Number(lonValor);
            valido = Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
            mensagem = "Usa coordenadas válidas. Ex: 38.4445 e -9.1015.";
        }

        [latCampo, lonCampo].forEach((campo) => {
            campo.classList.toggle("campo-invalido", !valido);
            campo.setAttribute("aria-invalid", String(!valido));
        });
        if (erro) {
            erro.textContent = mensagem;
            erro.classList.toggle("visivel", !valido && mostrarMensagem);
        }
        return valido;
    }

    function validarFormatosSugestao(id, mostrarMensagem) {
        const nomeValido = validarTextoObrigatorioAdmin(id, "nome", 3, 25, mostrarMensagem);
        const descricaoValida = validarTextoObrigatorioAdmin(id, "descricao", 10, 110, mostrarMensagem);
        const emailValido = validarFormatoCampoAdmin(id, "email", mostrarMensagem);
        const siteValido = validarFormatoCampoAdmin(id, "site", mostrarMensagem);
        const bookingValido = validarFormatoCampoAdmin(id, "booking_url", mostrarMensagem);
        const telefoneValido = validarTelefoneCampoAdmin(id, mostrarMensagem);
        const coordenadasValidas = validarCoordenadasAdmin(id, mostrarMensagem);
        return nomeValido && descricaoValida && emailValido && siteValido && bookingValido && telefoneValido && coordenadasValidas;
    }

    function formatarDataHora(valor) {
        if (!valor) return "";

        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return texto(valor);

        return data.toLocaleString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    }

    function renderizarResumo(resumo) {
        if (!adminResumo) return;

        adminResumo.innerHTML = `
            <article><span>Contactos pendentes</span><strong>${texto(resumo.contactos_pendentes || 0)}</strong></article>
            <article><span>Total contactos</span><strong>${texto(resumo.contactos || 0)}</strong></article>
            <article><span>Sugestões pendentes</span><strong>${texto(resumo.sugestoes_pendentes || 0)}</strong></article>
            <article><span>Sugestões aceitas</span><strong>${texto(resumo.sugestoes_aceites || 0)}</strong></article>
            <article><span>Logs da IA</span><strong>${texto(resumo.logs || 0)}</strong></article>
        `;
        atualizarOpcoesFiltro(resumo);
    }

    function atualizarOpcoesFiltro(resumo) {
        const pendentes = Number(resumo.sugestoes_pendentes || 0);
        const aceites = Number(resumo.sugestoes_aceites || 0);
        const totalSugestoes = pendentes + aceites;
        const labelsSugestoes = {
            pendente: `Pendentes (${pendentes})`,
            aceite: `Aceitas (${aceites})`,
            todas: `Todas (${totalSugestoes})`
        };

        if (estadoSugestoesFiltro) {
            Array.from(estadoSugestoesFiltro.options).forEach((option) => {
                option.textContent = labelsSugestoes[option.value] || option.textContent;
            });
        }

        const totalContactos = Number(resumo.contactos || 0);
        const contactosPendentes = Number(resumo.contactos_pendentes || 0);
        const contactosResolvidos = Math.max(0, totalContactos - contactosPendentes);
        const labelsContactos = {
            todos: `Todos (${totalContactos})`,
            pendente: `Pendentes (${contactosPendentes})`,
            resolvido: `Resolvidos (${contactosResolvidos})`
        };

        if (estadoContactosFiltro) {
            Array.from(estadoContactosFiltro.options).forEach((option) => {
                option.textContent = labelsContactos[option.value] || option.textContent;
            });
        }
    }

    function atualizarBotaoRemocao() {
        if (!removerSugestoesSelecionadas) return;

        const total = sugestoesSelecionadasRemocao.size;
        removerSugestoesSelecionadas.classList.toggle("visivel", estadoSugestoes !== "pendente" && total > 0);
        removerSugestoesSelecionadas.disabled = total === 0;
        removerSugestoesSelecionadas.textContent = total === 1
            ? "Remover 1 selecionada"
            : `Remover ${total} selecionadas`;
    }

    function normalizarPesquisa(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    function iconeFiltroTabela() {
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z"></path>
            </svg>
        `;
    }

    function filtroAtivo(tabela, campo, tipo) {
        const filtro = filtrosTabelas[tabela];
        if (tipo === "data") return Boolean(filtro[`${campo}De`] || filtro[`${campo}Ate`]);
        return Boolean(filtro[campo]);
    }

    function cabecalhoTabela(rotulo, campo, tabela, opcoes = {}) {
        const tipo = opcoes.tipo || "texto";
        const ordenavel = opcoes.ordenavel !== false;
        const filtravel = opcoes.filtravel ?? tipo === "data";
        const ordenacao = ordenacaoTabelas[tabela];
        const direcao = ordenacao.campo === campo ? ordenacao.direcao : "";
        const ativo = filtroAtivo(tabela, campo, tipo);
        const proximaDirecao = direcao === "asc" ? "descendente" : "ascendente";
        let camposFiltro = "";

        if (tipo === "data") {
            camposFiltro = `
                <label>De
                    <input type="date" name="${texto(campo)}De" value="${texto(filtrosTabelas[tabela][`${campo}De`] || "")}">
                </label>
                <label>Até
                    <input type="date" name="${texto(campo)}Ate" value="${texto(filtrosTabelas[tabela][`${campo}Ate`] || "")}">
                </label>
            `;
        } else {
            camposFiltro = `
                <label>Pesquisar em ${texto(rotulo)}
                    <input type="search" name="${texto(campo)}" value="${texto(filtrosTabelas[tabela][campo] || "")}" placeholder="Pesquisar...">
                </label>
            `;
        }

        const botaoOrdenar = ordenavel ? `
            <button type="button" class="admin-th-botao admin-th-ordenar ${direcao ? "ativo" : ""}" data-ordenar-tabela="${tabela}" data-ordenar-campo="${texto(campo)}" data-direcao="${direcao}" aria-label="Ordenar ${texto(rotulo)} de forma ${proximaDirecao}" title="Ordenar ${texto(rotulo)} (${proximaDirecao})">
                <span class="admin-th-ordenar-setas" aria-hidden="true">
                    <svg class="admin-sort-asc" viewBox="0 0 12 8"><path d="M2 6l4-4 4 4"></path></svg>
                    <svg class="admin-sort-desc" viewBox="0 0 12 8"><path d="M2 2l4 4 4-4"></path></svg>
                </span>
            </button>
        ` : "";

        const botaoFiltro = filtravel ? `
            <button type="button" class="admin-th-botao ${ativo ? "ativo" : ""}" data-abrir-filtro="${tabela}:${texto(campo)}" aria-label="Filtrar ${texto(rotulo)}" title="Filtrar">
                ${iconeFiltroTabela()}
            </button>
        ` : "";

        const formularioFiltro = filtravel ? `
            <form class="admin-th-filtro" data-filtro-form="${tabela}" data-filtro-campo="${texto(campo)}" data-filtro-tipo="${tipo}">
                ${camposFiltro}
                <div class="admin-th-filtro-acoes">
                    <button type="button" class="admin-th-limpar" data-limpar-filtro="${tabela}:${texto(campo)}">Limpar</button>
                    <button type="submit">Aplicar</button>
                </div>
            </form>
        ` : "";

        const temAcoes = ordenavel || filtravel;

        return `
            <th class="${opcoes.classe || ""}">
                <div class="admin-th-conteudo">
                    <span>${texto(rotulo)}</span>
                    ${temAcoes ? `<span class="admin-th-acoes">${botaoOrdenar}${botaoFiltro}${formularioFiltro}</span>` : ""}
                </div>
            </th>
        `;
    }

    function valorData(valor) {
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? null : data;
    }

    function aplicarFiltrosTabela(itens, tabela, campos) {
        const filtros = filtrosTabelas[tabela];
        return itens.filter((item) => campos.every(({ campo, tipo = "texto", valor }) => {
            if (tipo === "data") {
                const data = valorData(item[campo]);
                if (!data) return !filtros[`${campo}De`] && !filtros[`${campo}Ate`];

                if (filtros[`${campo}De`]) {
                    const inicio = new Date(`${filtros[`${campo}De`]}T00:00:00`);
                    if (data < inicio) return false;
                }
                if (filtros[`${campo}Ate`]) {
                    const fim = new Date(`${filtros[`${campo}Ate`]}T23:59:59.999`);
                    if (data > fim) return false;
                }
                return true;
            }

            const pesquisa = normalizarPesquisa(filtros[campo]);
            const conteudo = valor ? valor(item) : item[campo];
            return !pesquisa || normalizarPesquisa(conteudo).includes(pesquisa);
        }));
    }

    function ordenarTabela(itens, tabela) {
        const { campo, direcao } = ordenacaoTabelas[tabela];
        if (!campo) return itens;

        return [...itens].sort((a, b) => {
            let valorA = a[campo];
            let valorB = b[campo];

            if (campo === "criado_em" || campo === "created_at") {
                valorA = valorData(valorA)?.getTime() || 0;
                valorB = valorData(valorB)?.getTime() || 0;
            } else if (campo === "id") {
                valorA = Number(valorA) || 0;
                valorB = Number(valorB) || 0;
            } else {
                valorA = normalizarPesquisa(valorA);
                valorB = normalizarPesquisa(valorB);
            }

            const resultado = valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
            return direcao === "asc" ? resultado : -resultado;
        });
    }

    function correspondePesquisaGlobal(item, termo, campos) {
        const pesquisa = normalizarPesquisa(termo);
        if (!pesquisa) return true;
        return campos.some((campo) => normalizarPesquisa(
            typeof campo === "function" ? campo(item) : item[campo]
        ).includes(pesquisa));
    }

    function sugestoesVisiveis() {
        return dadosSugestoes.filter((sugestao) => {
            const correspondeCategoria = categoriaSugestoes === "todas"
                || sugestao.categoria === categoriaSugestoes;
            const correspondePesquisa = correspondePesquisaGlobal(
                sugestao,
                termoPesquisaSugestoes,
                ["id", "nome", "descricao", "morada", "telefone", "email", "site", "recomendado_por", (item) => formatarDataHora(item.criado_em)]
            );
            return correspondeCategoria && correspondePesquisa;
        });
    }

    function renderizarSugestoes() {
        sugestoesSelecionadasRemocao.clear();
        atualizarBotaoRemocao();
        Object.keys(telefonesAdminIntl).forEach(destruirTelefoneAdmin);
        sugestoesTabela.innerHTML = tabelaSugestoes(sugestoesVisiveis());
        requestAnimationFrame(() => {
            sugestoesTabela.querySelectorAll(`[name="categoria"][data-id]`).forEach((campo) => {
                atualizarCamposCategoria(campo.dataset.id, true);
            });
            sugestoesTabela.querySelectorAll("[data-crop-frame]").forEach(ajustarImagemCrop);
        });
    }

    function fecharCriarSugestao() {
        criarSugestaoAberto = false;
        if (criarSugestaoBotao) {
            criarSugestaoBotao.textContent = "+ Criar sugestão";
            criarSugestaoBotao.classList.remove("ativo");
        }
        renderizarSugestoes();
    }

    function contactosVisiveis() {
        const porEstado = filtrarContactos(dadosContactos);
        const filtrados = aplicarFiltrosTabela(porEstado, "contactos", [
            { campo: "id" },
            { campo: "nome" },
            { campo: "email" },
            { campo: "telefone" },
            { campo: "mensagem" },
            { campo: "estado", valor: (item) => item.estado === "resolvido" ? "Resolvido" : "Pendente" },
            { campo: "criado_em", tipo: "data" }
        ]);
        const pesquisados = filtrados.filter((item) => correspondePesquisaGlobal(
            item,
            termoPesquisaContactos,
            ["id", "nome", "email", "telefone", "mensagem", (contacto) => contacto.estado === "resolvido" ? "Resolvido" : "Pendente", (contacto) => formatarDataHora(contacto.criado_em)]
        ));
        return ordenarTabela(pesquisados, "contactos");
    }

    function logsVisiveis() {
        const filtrados = aplicarFiltrosTabela(dadosLogs, "logs", [
            { campo: "id" },
            { campo: "created_at", tipo: "data" },
            { campo: "endpoint" },
            { campo: "estado" },
            { campo: "resposta_text" }
        ]);
        return ordenarTabela(filtrados, "logs");
    }

    function renderizarTabelasAdmin() {
        fecharFiltrosCabecalho();
        contactosTabela.innerHTML = tabelaContactos(contactosVisiveis());
        logsTabela.innerHTML = tabelaLogs(logsVisiveis());
    }

    function tabelaContactos(contactos) {
        return `
            <table>
                <thead>
                    <tr>
                        ${cabecalhoTabela("ID", "id", "contactos")}
                        ${cabecalhoTabela("Nome", "nome", "contactos")}
                        ${cabecalhoTabela("Email", "email", "contactos")}
                        ${cabecalhoTabela("Telefone", "telefone", "contactos")}
                        ${cabecalhoTabela("Mensagem", "mensagem", "contactos", { classe: "admin-col-texto" })}
                        ${cabecalhoTabela("Estado", "estado", "contactos")}
                        ${cabecalhoTabela("Data", "criado_em", "contactos", { tipo: "data" })}
                        ${cabecalhoTabela("Ações", "acoes", "contactos", { ordenavel: false, filtravel: false })}
                    </tr>
                </thead>
                <tbody>
                    ${contactos.length ? contactos.map(c => `
                        <tr>
                            <td>${texto(c.id)}</td>
                            <td>${texto(c.nome)}</td>
                            <td>${texto(c.email)}</td>
                            <td>${texto(c.telefone || "-")}</td>
                            <td class="admin-contacto-mensagem admin-col-texto"><pre>${texto(c.mensagem)}</pre></td>
                            <td><span class="admin-contacto-estado ${c.estado === "resolvido" ? "resolvido" : ""}">${texto(c.estado === "resolvido" ? "Resolvido" : "Pendente")}</span></td>
                            <td>${formatarDataHora(c.criado_em)}</td>
                            <td>
                                <div class="admin-contacto-acoes">
                                    ${c.estado === "resolvido" ? "" : `<button type="button" data-contacto-acao="resolver" data-contacto-id="${texto(c.id)}">Resolver</button>`}
                                    <button type="button" class="admin-contacto-apagar" data-contacto-acao="apagar" data-contacto-id="${texto(c.id)}">Apagar</button>
                                </div>
                            </td>
                        </tr>
                    `).join("") : `<tr><td colspan="8" class="admin-empty">Nenhum contacto corresponde aos filtros.</td></tr>`}
                </tbody>
            </table>
        `;
    }

    function filtrarContactos(contactos) {
        if (estadoContactos === "todos") return contactos;
        return contactos.filter((contacto) => contacto.estado === estadoContactos);
    }

    function campoSugestao(rotulo, valor) {
        return valor ? `<dt>${texto(rotulo)}:</dt><dd>${texto(valor)}</dd>` : "";
    }

    function metaSugestao(s) {
        if (s.id === "novo") {
            return `
                <p class="admin-sugestao-meta">
                    <span><strong>Nova sugestão</strong> — criada pelo admin e publicada de imediato.</span>
                </p>
            `;
        }

        if (s.estado === "pendente") {
            return `
                <p class="admin-sugestao-meta">
                    <span><strong>Data:</strong> ${texto(formatarDataHora(s.criado_em))}</span>
                </p>
            `;
        }

        return `
            <dl>
                ${campoSugestao("Categoria", s.categoria)}
                ${campoSugestao("Descrição", s.descricao)}
                ${campoSugestao("Morada", s.morada)}
                ${campoSugestao("Telemóvel", s.telefone)}
                ${campoSugestao("Email", s.email)}
                ${campoSugestao("Website", s.site)}
                ${campoSugestao("Link do alojamento", s.booking_url)}
                ${campoSugestao("Data", formatarDataHora(s.criado_em))}
            </dl>
        `;
    }

    function descricaoPreview(s) {
        return texto(s.descricao || "");
    }

    const ICONE_SITE = `<svg class="card-link-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9"></path><path d="M12 3c-2.2 2.4-3.3 5.4-3.3 9s1.1 6.6 3.3 9"></path></svg>`;
    const ICONE_FACEBOOK = `<svg class="card-link-icon-brand" viewBox="8 5 9 14" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M14.5 8.5h1.7V6.1h-1.9c-2 0-3.2 1.2-3.2 3.2v1.5H9v2.5h2.1V18h2.6v-4.7h2l.4-2.5h-2.4V9.3c0-.6.3-.8.8-.8z"></path></svg>`;
    const ICONE_BOOKING = `<svg class="card-link-icon-brand" viewBox="5 4 15 17" aria-hidden="true" focusable="false"><text x="7" y="17.5" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="13" fill="#ffffff">B</text><circle cx="18" cy="17.5" r="1.7" fill="#ffffff"></circle></svg>`;
    const ICONE_AIRBNB = `<svg class="card-link-icon-brand" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#ffffff" fill-rule="evenodd" d="M12 2c.8 0 1.5.6 2 1.6l5.5 11.9c1 2.2.5 4.5-1.7 5.3-2.3.8-4.5-.3-5.8-2.3-1.3 2-3.5 3.1-5.8 2.3-2.2-.8-2.7-3.1-1.7-5.3L10 3.6c.5-1 1.2-1.6 2-1.6zm0 9.2c-1.2 0-2.2 1.1-2.2 2.8 0 1.5 1 3 2.2 4.5 1.2-1.5 2.2-3 2.2-4.5 0-1.7-1-2.8-2.2-2.8z"></path></svg>`;

    function iconeLinkSite(url) {
        return (url || "").toLowerCase().includes("facebook") ? ICONE_FACEBOOK : ICONE_SITE;
    }

    function tituloLinkSite(url) {
        return (url || "").toLowerCase().includes("facebook") ? "Página de Facebook" : "Site oficial";
    }

    // escolhe o texto do link de reserva com base na plataforma indicada na URL (usado quando não há ícone específico)
    function textoLinkReserva(url) {
        const urlMinuscula = (url || "").toLowerCase();
        if (urlMinuscula.includes("booking")) return "Ver no Booking";
        if (urlMinuscula.includes("airbnb")) return "Ver no Airbnb";
        return "Ver reserva";
    }

    // escolhe o ícone do link de reserva com base na plataforma indicada na URL, ou null se não houver um ícone específico
    function iconeLinkReserva(url) {
        const urlMinuscula = (url || "").toLowerCase();
        if (urlMinuscula.includes("booking")) return ICONE_BOOKING;
        if (urlMinuscula.includes("airbnb")) return ICONE_AIRBNB;
        return null;
    }

    // recria o link de ação tal como aparece nos cards reais (icone para o site/reserva com plataforma conhecida, texto caso contrário)
    function linkPreview(id, campo, url, rotulo, icone) {
        const oculto = url ? "" : " hidden";
        const conteudoIcone = icone || null;
        const classe = conteudoIcone ? "card-link card-link-site" : "card-link";
        const conteudoLink = conteudoIcone || texto(rotulo);
        const titulo = conteudoIcone ? ` title="${texto(rotulo)}"` : "";
        return `<a href="${texto(url || "#")}" target="_blank" rel="noopener noreferrer" class="${classe}" data-preview-link="${campo}-${texto(id)}"${titulo}${oculto}>${conteudoLink}</a>`;
    }

    // monta o conteúdo da prévia tal como apareceria no card real da categoria escolhida
    function conteudoPreviewCategoria(s) {
        const id = texto(s.id);
        const oficial = s.origem === "oficial";

        if (s.categoria === "Atividade") {
            const catTextos = { agua: "Água", natureza: "Natureza", aventura: "Aventura", cultura: "Cultura" };
            const catTexto = catTextos[s.categoria_ativ] || s.categoria_ativ || "";
            let links = [];
            try { links = JSON.parse(s.links_json || "[]"); } catch (e) { links = []; }
            const linksHtml = links.length
                ? `<ul class="admin-preview-links">${links.map(l => `<li><a href="${texto(l.url)}" target="_blank" rel="noopener">${texto(l.name)}</a></li>`).join("")}</ul>`
                : "";
            return `
                <span class="atividade-icone" aria-hidden="true"><i class="ph ph-${texto(s.icone || "compass")}"></i></span>
                <div class="atividade-header">
                    <h3 data-conteudo-preview-nome="${id}">${texto(s.nome || "")}</h3>
                    ${catTexto ? `<span class="categoria-badge categoria-${texto(s.categoria_ativ)}">${texto(catTexto)}</span>` : ""}
                </div>
                <p class="admin-preview-desc" data-preview-descricao="${id}">${descricaoPreview(s)}</p>
                ${linksHtml}
                <div class="card-actions" style="justify-content:flex-end" data-preview-acoes="${id}"${s.site ? "" : " hidden"}>
                    ${linkPreview(id, "site", s.site, tituloLinkSite(s.site), iconeLinkSite(s.site))}
                </div>
            `;
        }

        if (s.categoria === "Gastronomia") {
            if (oficial) {
                // espelha criaRestaurante(): tipo•local → descrição → contactos → site
                const tipoLocal = [s.tipo, s.morada].filter(Boolean).join(" • ");
                return `
                    ${tipoLocal ? `<p class="recomendacao-meta" data-preview-localizacao="${id}">${texto(tipoLocal)}</p>` : ""}
                    ${descricaoPreview(s) ? `<p class="admin-preview-desc" data-preview-descricao-texto="${id}">${descricaoPreview(s)}</p>` : ""}
                    ${(s.telefone || s.email) ? `<div class="card-contact">
                        ${s.telefone ? `<p class="recomendacao-meta" data-preview-telefone="${id}">Tel: <span class="recomendacao-contacto-valor">${texto(s.telefone)}</span></p>` : ""}
                        ${s.email ? `<p class="recomendacao-meta" data-preview-email="${id}">Email: <span class="recomendacao-contacto-valor">${texto(s.email)}</span></p>` : ""}
                    </div>` : ""}
                    <div class="card-actions" data-preview-acoes="${id}">
                        ${linkPreview(id, "site", s.site, tituloLinkSite(s.site), iconeLinkSite(s.site))}
                    </div>
                `;
            }
            // malta: espelha criarCardRecomendacao(tipo="gastronomia")
            const local = s.morada || "Sesimbra";
            return `
                ${descricaoPreview(s) ? `<p class="admin-preview-desc" data-preview-descricao-texto="${id}">${descricaoPreview(s)}</p>` : ""}
                <p class="recomendacao-meta" data-preview-localizacao="${id}">📍 ${texto(local)}</p>
                ${recomendadoPreview(id, s.recomendado_por)}
                <div class="card-actions" data-preview-acoes="${id}">
                    ${linkPreview(id, "site", s.site, tituloLinkSite(s.site), iconeLinkSite(s.site))}
                    <div class="recomendacao-contactos" data-preview-contactos="${id}"${(s.telefone || s.email) ? "" : " hidden"}>
                        <p class="recomendacao-meta" data-preview-telefone="${id}"${s.telefone ? "" : " hidden"}>${s.telefone ? `Tel: <span class="recomendacao-contacto-valor">${texto(s.telefone)}</span>` : ""}</p>
                        <p class="recomendacao-meta" data-preview-email="${id}"${s.email ? "" : " hidden"}>${s.email ? `Email: <span class="recomendacao-contacto-valor">${texto(s.email)}</span>` : ""}</p>
                    </div>
                </div>
            `;
        }

        if (s.categoria === "Alojamento") {
            if (oficial) {
                // espelha criaHospedagem(): descrição → telefone → site+booking
                return `
                    <p class="admin-preview-desc" data-preview-descricao="${id}">${descricaoPreview(s)}</p>
                    ${s.telefone ? `<div class="card-contact"><p class="recomendacao-meta" data-preview-telefone="${id}">Tel: <span class="recomendacao-contacto-valor">${texto(s.telefone)}</span></p></div>` : ""}
                    <div class="card-actions admin-preview-alojamento-actions" data-preview-acoes="${id}">
                        ${linkPreview(id, "site", s.site, tituloLinkSite(s.site), iconeLinkSite(s.site))}
                        ${linkPreview(id, "booking_url", s.booking_url, textoLinkReserva(s.booking_url), iconeLinkReserva(s.booking_url))}
                    </div>
                `;
            }
            // malta: espelha criarCardRecomendacao(tipo="alojamentos")
            return `
                <p class="admin-preview-desc" data-preview-descricao="${id}">${descricaoPreview(s)}</p>
                <p class="recomendacao-meta" data-preview-localizacao="${id}">📍 ${texto(s.morada || "Sesimbra")}</p>
                ${s.telefone ? `<p class="recomendacao-meta" data-preview-telefone="${id}">Tel: <span class="recomendacao-contacto-valor">${texto(s.telefone)}</span></p>` : ""}
                ${recomendadoPreview(id, s.recomendado_por)}
                <div class="card-actions admin-preview-alojamento-actions" data-preview-acoes="${id}">
                    ${linkPreview(id, "site", s.site, tituloLinkSite(s.site), iconeLinkSite(s.site))}
                    ${linkPreview(id, "booking_url", s.booking_url, textoLinkReserva(s.booking_url), iconeLinkReserva(s.booking_url))}
                </div>
            `;
        }

        // Ponto turístico (e Atividade: sem ícone/badge na prévia por não depender do Phosphor)
        if (oficial) {
            // espelha criaPonto(): descrição → aviso (alert-popover)
            return `
                <p class="admin-preview-desc" data-preview-descricao="${id}">${descricaoPreview(s)}</p>
                ${s.aviso ? `<div class="alert-popover" data-preview-aviso="${id}"><p class="destaque">${texto(s.aviso)}</p></div>` : ""}
            `;
        }
        // malta: espelha criarCardRecomendacao(tipo="pontos")
        return `
            <p class="admin-preview-desc" data-preview-descricao="${id}">${descricaoPreview(s)}</p>
            <p class="recomendacao-meta" data-preview-localizacao="${id}">📍 ${texto(s.morada || "Sesimbra")}</p>
            ${s.aviso ? `<p class="recomendacao-meta" data-preview-aviso="${id}">⚠️ ${texto(s.aviso)}</p>` : ""}
            ${recomendadoPreview(id, s.recomendado_por)}
            ${s.telefone ? `<p class="recomendacao-meta" data-preview-telefone="${id}">Tel: <span class="recomendacao-contacto-valor">${texto(s.telefone)}</span></p>` : ""}
            <div class="card-actions" data-preview-acoes="${id}">
                ${linkPreview(id, "site", s.site, tituloLinkSite(s.site), iconeLinkSite(s.site))}
            </div>
        `;
    }

    function recomendadoPreview(id, recomendado) {
        return recomendado
            ? `<p class="admin-preview-meta" data-preview-recomendado="${texto(id)}">Recomendado por <strong>${texto(recomendado)}</strong></p>`
            : "";
    }

    function paginaCategoria(categoria) {
        return {
            "Ponto turistico": ["pontos-turisticos.html", "Pontos turísticos"],
            "Atividade": ["atividades.html", "Atividades"],
            "Gastronomia": ["gastronomia.html", "Gastronomia"],
            "Alojamento": ["alojamentos.html", "Alojamentos"]
        }[categoria] || ["sesimbra.html", "Sesimbra"];
    }

    const camposPorCategoria = {
        "Ponto turistico": ["morada", "telefone"],
        "Atividade": ["morada", "telefone"],
        "Gastronomia": ["morada", "telefone", "email", "site"],
        "Alojamento": ["morada", "telefone", "booking_url", "site"]
    };

    const nomePorCategoria = {
        "Ponto turistico": ["Nome do ponto turístico", "Ex: Miradouro da Falésia"],
        "Atividade": ["Nome da atividade", "Ex: Surf na Praia Grande"],
        "Gastronomia": ["Nome do restaurante", "Ex: Restaurante O Mar"],
        "Alojamento": ["Nome do alojamento", "Ex: Casa da Praia"]
    };

    const sitePorCategoria = {
        "Gastronomia": ["Link do restaurante", "Ex: https://www.restaurante.pt"],
        "Alojamento": ["Website oficial", "Ex: https://www.casadapraia.pt"]
    };

    function campoVisivelCategoria(categoria, campo) {
        return (camposPorCategoria[categoria] || []).includes(campo);
    }

    function atributoCampoCategoria(categoria, campo) {
        return campoVisivelCategoria(categoria, campo) ? "" : " hidden";
    }

    function estadoPublicacao(s) {
        if (s.estado !== "aceite") return "";

        const [href, rotulo] = paginaCategoria(s.categoria);
        return `<p class="admin-publicacao">Publicado em ${texto(rotulo)} <a href="${texto(href)}" target="_blank" rel="noopener">Ver página</a></p>`;
    }

    function selecaoRemocao(s) {
        if (s.estado !== "aceite") return "";

        return `
            <label class="admin-selecao-remocao">
                <input type="checkbox" data-remover-sugestao="${texto(s.id)}">
                <span class="admin-checkmark" aria-hidden="true"></span>
                <span>Selecionar para remover da página</span>
            </label>
        `;
    }

    function fotoPreview(s) {
        const podeEditar = s.estado === "pendente";
        const classeEditavel = podeEditar ? " admin-preview-frame-editavel" : "";
        const cropEditavel = podeEditar ? ' data-crop-editavel="1"' : "";

        if (s.foto_path) {
            return `
                <div class="admin-preview-frame${classeEditavel}" data-crop-frame="${texto(s.id)}" data-crop-x="0" data-crop-y="0" data-crop-zoom="1"${cropEditavel}>
                    <img src="${texto(s.foto_path)}" alt="${texto(s.nome)}" data-preview-img="${texto(s.id)}" draggable="false">
                </div>
            `;
        }

        return `
            <div class="admin-preview-frame${classeEditavel}" data-crop-frame="${texto(s.id)}" data-crop-x="0" data-crop-y="0" data-crop-zoom="1"${cropEditavel}>
                <button type="button" class="admin-preview-placeholder" data-preview-placeholder="${texto(s.id)}" data-adicionar-foto="${texto(s.id)}" aria-label="Adicionar foto a ${texto(s.nome)}">Foto por inserir<br><small>Clique para adicionar</small></button>
            </div>
        `;
    }

    function objetoNovaSugestao() {
        return {
            id: "novo",
            estado: "pendente",
            categoria: "Ponto turistico",
            nome: "",
            descricao: "",
            morada: "",
            telefone: "",
            email: "",
            site: "",
            booking_url: "",
            lat: "",
            lon: "",
            recomendado_por: "",
            foto_path: "",
            criado_em: ""
        };
    }

    function tabelaSugestoes(sugestoes) {
        const novoCard = criarSugestaoAberto ? cardSugestao(objetoNovaSugestao()) : "";

        if (!sugestoes.length) {
            return novoCard || `<p class="admin-empty">Nenhuma sugestão ${texto(estadoSugestoes)}.</p>`;
        }

        return novoCard + sugestoes.map(s => cardSugestao(s)).join("");
    }

    function cardSugestao(s) {
        return `
            <article class="admin-sugestao${s.id === "novo" ? " admin-sugestao-novo" : ""}">
                <div class="admin-sugestao-layout">
                    <div class="admin-preview-wrap">
                        <p class="admin-preview-titulo">Prévia na página</p>
                        <article class="admin-preview-card recomendacao-malta-card">
                            ${fotoPreview(s)}
                            <h3 data-preview-nome="${texto(s.id)}">${texto(s.nome)}</h3>
                            <div data-preview-conteudo="${texto(s.id)}">${conteudoPreviewCategoria(s)}</div>
                        </article>
                        ${s.estado === "pendente" ? `
                            <label class="admin-foto-label">${s.foto_path ? "Substituir foto" : "Inserir foto"} *
                                <span class="admin-file-input">
                                    <span class="admin-file-btn">Escolher ficheiro</span>
                                    <span class="admin-file-name" data-file-name="${texto(s.id)}">Nenhum ficheiro selecionado</span>
                                    <input type="file" name="foto" data-id="${texto(s.id)}" data-has-foto="${s.foto_path ? "1" : "0"}" accept="image/jpeg,image/png,image/webp">
                                </span>
                            </label>
                            <small class="sugestao-campo-ajuda">Máx. 3 MB. JPG, PNG ou WebP.</small>
                            <div class="admin-crop-controls" data-crop-controls="${texto(s.id)}">
                                <label>Zoom
                                    <input type="range" min="1" max="2.4" step="0.05" value="1" data-crop-zoom-input="${texto(s.id)}">
                                </label>
                            </div>
                        ` : ""}
                    </div>
                    <div class="admin-detalhes-wrap">
                        ${metaSugestao(s)}
                        ${estadoPublicacao(s)}
                        ${selecaoRemocao(s)}
                        ${s.estado === "aceite" ? `
                            <div class="admin-coordenadas admin-coordenadas-publicado">
                                <label>Latitude
                                    <input type="number" name="lat-publicado" data-id="${texto(s.id)}" value="${texto(s.lat ?? "")}" step="any" min="-90" max="90" placeholder="38.4445">
                                </label>
                                <label>Longitude
                                    <input type="number" name="lon-publicado" data-id="${texto(s.id)}" value="${texto(s.lon ?? "")}" step="any" min="-180" max="180" placeholder="-9.1015">
                                </label>
                                <button type="button" class="admin-coordenadas-botao" data-guardar-coordenadas="${texto(s.id)}">Guardar no mapa</button>
                                <span class="admin-coordenadas-status" data-coordenadas-status="${texto(s.id)}"></span>
                                <small class="admin-coord-dica">Deixa os dois campos vazios e guarda para remover o ponto do mapa.</small>
                            </div>
                        ` : ""}
                        ${s.estado === "pendente" ? `
                            <div class="admin-edit-grid">
                                <label>Categoria *
                                    <select name="categoria" data-id="${texto(s.id)}" required>
                                        ${[["Ponto turistico", "Ponto turístico"], ["Atividade", "Atividade"], ["Gastronomia", "Gastronomia"], ["Alojamento", "Alojamento"]].map(([val, label]) => `
                                            <option value="${texto(val)}" ${val === s.categoria ? "selected" : ""}>${texto(label)}</option>
                                        `).join("")}
                                    </select>
                                </label>
                                <label>${texto(nomePorCategoria[s.categoria]?.[0] || "Nome")} *
                                    <input type="text" name="nome" data-id="${texto(s.id)}" value="${texto(s.nome)}" minlength="3" maxlength="25" placeholder="${texto(nomePorCategoria[s.categoria]?.[1] || "")}" required aria-describedby="nomeContador-${texto(s.id)} nomeErro-${texto(s.id)}">
                                    <span id="nomeContador-${texto(s.id)}" class="admin-contador-caracteres" data-contador-nome="${texto(s.id)}">${(s.nome || "").length} / 25 caracteres</span>
                                    <small id="nomeErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="nome-${texto(s.id)}">O nome deve ter entre 3 e 25 caracteres.</small>
                                </label>
                                <label>Porque recomenda *
                                    <textarea name="descricao" data-id="${texto(s.id)}" minlength="10" maxlength="110" placeholder="Conta o que vale a pena ver, provar ou fazer..." required aria-describedby="descricaoContador-${texto(s.id)} descricaoErro-${texto(s.id)}">${texto(s.descricao)}</textarea>
                                    <span id="descricaoContador-${texto(s.id)}" class="admin-contador-caracteres" data-contador-descricao="${texto(s.id)}">${(s.descricao || "").length} / 110 caracteres</span>
                                    <small id="descricaoErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="descricao-${texto(s.id)}">A descrição deve ter entre 10 e 110 caracteres.</small>
                                </label>
                                <label class="admin-campo-categoria" data-campo-categoria="morada"${atributoCampoCategoria(s.categoria, "morada")}>Localização
                                    <input type="text" name="morada" data-id="${texto(s.id)}" value="${texto(s.morada || "")}" maxlength="30" placeholder="Ex: Rua da Praia, Sesimbra">
                                    <span class="admin-contador-caracteres" data-contador-morada="${texto(s.id)}">${(s.morada || "").length} / 30 caracteres</span>
                                </label>
                                <div class="admin-coordenadas">
                                    <label>Latitude
                                        <input type="number" name="lat" data-id="${texto(s.id)}" value="${texto(s.lat ?? "")}" step="any" min="-90" max="90" placeholder="38.4445" aria-describedby="coordenadasErro-${texto(s.id)}">
                                    </label>
                                    <label>Longitude
                                        <input type="number" name="lon" data-id="${texto(s.id)}" value="${texto(s.lon ?? "")}" step="any" min="-180" max="180" placeholder="-9.1015" aria-describedby="coordenadasErro-${texto(s.id)}">
                                    </label>
                                    <small id="coordenadasErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="coordenadas-${texto(s.id)}">Usa coordenadas válidas.</small>
                                </div>
                                <label class="admin-campo-categoria" data-campo-categoria="email"${atributoCampoCategoria(s.categoria, "email")}>Email
                                    <input type="email" name="email" data-id="${texto(s.id)}" value="${texto(s.email || "")}" maxlength="120" placeholder="Ex: geral@restaurante.pt" aria-describedby="emailErro-${texto(s.id)}">
                                    <small id="emailErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="email-${texto(s.id)}">Por favor, insira um email válido.</small>
                                </label>
                                <label class="admin-campo-categoria" data-campo-categoria="telefone"${atributoCampoCategoria(s.categoria, "telefone")}>Telemóvel
                                    <input type="text" name="telefone" data-id="${texto(s.id)}" value="${texto(s.telefone || "")}" maxlength="20" placeholder="Ex: +351 212 345 678" aria-describedby="telefoneErro-${texto(s.id)}">
                                    <small id="telefoneErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="telefone-${texto(s.id)}">Por favor, insira um telemóvel válido.</small>
                                </label>
                                <label class="admin-campo-categoria" data-campo-categoria="site"${atributoCampoCategoria(s.categoria, "site")}>${texto((sitePorCategoria[s.categoria] || ["Website"])[0])}
                                    <input type="url" name="site" data-id="${texto(s.id)}" value="${texto(s.site || "")}" maxlength="220" placeholder="${texto((sitePorCategoria[s.categoria] || ["", "Ex: https://exemplo.pt"])[1])}" aria-describedby="siteErro-${texto(s.id)}">
                                    <small id="siteErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="site-${texto(s.id)}">Por favor, insira um link válido (deve começar por http:// ou https://).</small>
                                </label>
                                <label class="admin-campo-categoria" data-campo-categoria="booking_url"${atributoCampoCategoria(s.categoria, "booking_url")}>Link do alojamento
                                    <input type="url" name="booking_url" data-id="${texto(s.id)}" value="${texto(s.booking_url || "")}" maxlength="220" placeholder="Ex: https://www.booking.com/..." aria-describedby="bookingUrlErro-${texto(s.id)}">
                                    <small id="bookingUrlErro-${texto(s.id)}" class="campo-erro-msg" data-erro-campo="booking_url-${texto(s.id)}">Por favor, insira um link válido (deve começar por http:// ou https://).</small>
                                </label>
                                <label data-admin-recomendado>Recomendado por
                                    <input type="text" name="recomendado_por" data-id="${texto(s.id)}" value="${texto(s.recomendado_por || "")}" maxlength="30" placeholder="Ex: Maria, João, visitante de Sesimbra...">
                                    <span class="admin-contador-caracteres" data-contador-recomendado_por="${texto(s.id)}">${(s.recomendado_por || "").length} / 30 caracteres</span>
                                </label>
                            </div>
                            <div class="admin-acoes">
                                ${s.id === "novo" ? `
                                    <button type="button" class="admin-aceitar" data-acao="publicar" data-id="novo">Publicar</button>
                                    <button type="button" class="admin-recusar" data-acao="cancelar" data-id="novo">Cancelar</button>
                                ` : `
                                    <button type="button" class="admin-aceitar" data-acao="aceitar" data-id="${texto(s.id)}">Aceitar</button>
                                    <button type="button" class="admin-recusar" data-acao="recusar" data-id="${texto(s.id)}">Recusar</button>
                                `}
                                <span class="admin-acoes-erro" data-acoes-erro="${texto(s.id)}"></span>
                            </div>
                        ` : ""}
                    </div>
                </div>
            </article>
        `;
    }

    function tabelaLogs(logs) {
        return `
            <table>
                <thead>
                    <tr>
                        ${cabecalhoTabela("ID", "id", "logs")}
                        ${cabecalhoTabela("Data", "created_at", "logs", { tipo: "data" })}
                        ${cabecalhoTabela("Endpoint", "endpoint", "logs")}
                        ${cabecalhoTabela("Estado", "estado", "logs")}
                        ${cabecalhoTabela("Resposta", "resposta_text", "logs", { classe: "admin-col-texto" })}
                    </tr>
                </thead>
                <tbody>
                    ${logs.length ? logs.map(log => `
                        <tr>
                            <td>${texto(log.id)}</td>
                            <td>${formatarDataHora(log.created_at)}</td>
                            <td>${texto(log.endpoint)}</td>
                            <td>${texto(log.estado)}</td>
                            <td class="admin-col-texto"><pre>${texto(log.resposta_text || "")}</pre></td>
                        </tr>
                    `).join("") : `<tr><td colspan="5" class="admin-empty">Nenhum log corresponde aos filtros.</td></tr>`}
                </tbody>
            </table>
        `;
    }

    async function carregar() {
        if (!token) {
            status.textContent = "Token em falta no link.";
            return;
        }

        const [resumoResp, sugestoesResp, contactosResp, logsResp] = await Promise.all([
            fetch("/api/admin/resumo", opcoesAdmin()),
            fetch(`/api/admin/sugestoes?estado=${encodeURIComponent(estadoSugestoes)}`, opcoesAdmin()),
            fetch("/api/admin/contactos", opcoesAdmin()),
            fetch("/api/logs", opcoesAdmin())
        ]);

        if (!resumoResp.ok || !sugestoesResp.ok || !contactosResp.ok || !logsResp.ok) {
            status.textContent = "Acesso não autorizado.";
            return;
        }

        const resumo = await resumoResp.json();
        const sugestoes = await sugestoesResp.json();
        const contactos = await contactosResp.json();
        const logs = await logsResp.json();
        dadosContactos = contactos;
        dadosLogs = logs;
        dadosSugestoes = sugestoes;
        renderizarResumo(resumo);
        renderizarSugestoes();
        renderizarTabelasAdmin();
        status.textContent = "";
    }

    function imagemPreviewCarregada(img) {
        if (img.complete && img.naturalWidth) return Promise.resolve();

        return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", reject, { once: true });
        });
    }

    async function criarFotoRecortada(id, raiz = sugestoesTabela) {
        const frame = raiz.querySelector(`[data-crop-frame="${id}"]`);
        const img = raiz.querySelector(`[data-preview-img="${id}"]`);
        if (!frame || !img || frame.dataset.cropTouched !== "1") return null;

        await imagemPreviewCarregada(img);

        const largura = 900;
        const altura = 540;
        const zoom = Number(frame.dataset.cropZoom || "1");
        const cropX = Number(frame.dataset.cropX || "0");
        const cropY = Number(frame.dataset.cropY || "0");
        const rect = frame.getBoundingClientRect();
        const escalaBase = Math.max(largura / img.naturalWidth, altura / img.naturalHeight) * zoom;
        const imgW = img.naturalWidth * escalaBase;
        const imgH = img.naturalHeight * escalaBase;
        const offsetX = (largura - imgW) / 2 + cropX * (largura / rect.width);
        const offsetY = (altura - imgH) / 2 + cropY * (altura / rect.height);
        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, offsetX, offsetY, imgW, imgH);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
        });
    }

    async function dadosEditadosSugestao(id) {
        const campos = Array.from(sugestoesTabela.querySelectorAll("[data-id][name]"))
            .filter((campo) => campo.dataset.id === id && campo.type !== "file");
        const dados = new FormData();

        const telefoneCampo = sugestoesTabela.querySelector(`[name="telefone"][data-id="${id}"]`);
        if (telefoneCampo?.value.trim() && !telefoneCampo.closest("[data-campo-categoria]")?.hidden) {
            await iniciarTelefoneAdmin(id);
            if (telefonesAdminIntl[id]?.promise) {
                await telefonesAdminIntl[id].promise.catch(() => {});
            }
        }

        if (!validarFormatosSugestao(id, true)) {
            throw new Error("Verifica os campos assinalados antes de continuar.");
        }

        campos.forEach((campo) => {
            if (campo.name === "telefone") {
                dados.append(campo.name, obterTelefoneAdmin(id));
                return;
            }
            dados.append(campo.name, campo.value.trim());
        });

        // exige categoria, nome e descrição preenchidos, tal como no formulário de sugestões
        for (const [campo, rotulo] of [["categoria", "Categoria"], ["nome", "Nome"], ["descricao", "Descrição"]]) {
            if (!String(dados.get(campo) || "").trim()) {
                throw new Error(`Preenche o campo "${rotulo}" antes de continuar.`);
            }
        }

        const foto = sugestoesTabela.querySelector(`input[type="file"][data-id="${id}"]`);
        const fotoRecortada = await criarFotoRecortada(id);
        if (fotoRecortada) {
            dados.append("foto", fotoRecortada, `sugestao-${id}.jpg`);
            return dados;
        }

        if (foto && foto.files[0]) {
            if (foto.files[0].size > 3 * 1024 * 1024) {
                throw new Error("A foto deve ter no máximo 3 MB.");
            }
            dados.append("foto", foto.files[0]);
        } else if (foto && foto.dataset.hasFoto !== "1") {
            throw new Error("Adiciona uma foto antes de continuar.");
        }

        return dados;
    }

    async function guardarCoordenadasAceite(id, botao) {
        const latCampo = sugestoesTabela.querySelector(`[name="lat-publicado"][data-id="${id}"]`);
        const lonCampo = sugestoesTabela.querySelector(`[name="lon-publicado"][data-id="${id}"]`);
        const statusEl = sugestoesTabela.querySelector(`[data-coordenadas-status="${id}"]`);

        const lat = latCampo?.value.trim().replace(",", ".") || "";
        const lon = lonCampo?.value.trim().replace(",", ".") || "";

        if ((lat && !lon) || (!lat && lon)) {
            if (statusEl) statusEl.textContent = "Preenche latitude e longitude em conjunto.";
            return;
        }

        if (lat && lon) {
            const latN = parseFloat(lat);
            const lonN = parseFloat(lon);
            if (!(latN >= 38.30 && latN <= 38.60 && lonN >= -9.35 && lonN <= -8.80)) {
                if (statusEl) statusEl.textContent = "Esta localização não fica em Sesimbra.";
                return;
            }
        }

        botao.disabled = true;
        if (statusEl) statusEl.textContent = "A guardar...";

        try {
            const resposta = await fetch(`/api/admin/sugestoes/${id}/coordenadas`, {
                ...opcoesAdmin({ method: "PATCH", headers: { "Content-Type": "application/json" } }),
                body: JSON.stringify({ lat, lon })
            });
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível guardar.");
            if (statusEl) statusEl.textContent = lat ? "Guardado no mapa." : "Coordenadas removidas.";
        } catch (erro) {
            if (statusEl) statusEl.textContent = erro.message;
        } finally {
            botao.disabled = false;
        }
    }

    function atualizarPreviewSugestao(id) {
        if (!sugestoesTabela.querySelector(`[name="nome"][data-id="${id}"]`)) return;
        const valor = (nome) => sugestoesTabela.querySelector(`[name="${nome}"][data-id="${id}"]`)?.value.trim() || "";
        const s = {
            id,
            nome: valor("nome") || "Sugestão",
            categoria: valor("categoria"),
            descricao: valor("descricao"),
            morada: valor("morada"),
            telefone: valor("telefone"),
            email: valor("email"),
            site: valor("site"),
            booking_url: valor("booking_url"),
            recomendado_por: valor("recomendado_por")
        };

        const nomePreview = sugestoesTabela.querySelector(`[data-preview-nome="${id}"]`);
        if (nomePreview) nomePreview.textContent = s.nome;

        const conteudo = sugestoesTabela.querySelector(`[data-preview-conteudo="${id}"]`);
        if (conteudo) conteudo.innerHTML = conteudoPreviewCategoria(s);
    }

    function atualizarCamposCategoria(id, limparIncompativeis = false) {
        const categoria = sugestoesTabela.querySelector(`[name="categoria"][data-id="${id}"]`)?.value || "";
        const nomeInput = sugestoesTabela.querySelector(`[name="nome"][data-id="${id}"]`);
        const nomeLabel = nomeInput?.closest("label");
        const [rotuloNome, placeholderNome] = nomePorCategoria[categoria] || ["Nome", ""];

        if (nomeInput) nomeInput.placeholder = placeholderNome;
        if (nomeLabel?.firstChild) nomeLabel.firstChild.textContent = `${rotuloNome} *`;

        const siteInput = sugestoesTabela.querySelector(`[name="site"][data-id="${id}"]`);
        const siteLabel = siteInput?.closest("label");
        const [rotuloSite, placeholderSite] = sitePorCategoria[categoria] || ["Website", "Ex: https://exemplo.pt"];
        if (siteLabel?.firstChild) siteLabel.firstChild.textContent = rotuloSite;
        if (siteInput) siteInput.placeholder = placeholderSite;

        const grid = siteInput?.closest(".admin-edit-grid");
        const emailLabel = sugestoesTabela.querySelector(`[name="email"][data-id="${id}"]`)?.closest("label");
        const telefoneLabel = sugestoesTabela.querySelector(`[name="telefone"][data-id="${id}"]`)?.closest("label");
        const bookingLabel = sugestoesTabela.querySelector(`[name="booking_url"][data-id="${id}"]`)?.closest("label");
        const recomendadoLabel = grid?.querySelector("[data-admin-recomendado]");

        // ordem fixa: campos escondidos não ocupam célula na grelha,
        // por isso esta ordem cobre as 3 categorias sem ramificações
        [emailLabel, telefoneLabel, siteLabel, bookingLabel, recomendadoLabel].forEach((label) => {
            if (label && grid) grid.appendChild(label);
        });

        sugestoesTabela.querySelectorAll(`.admin-campo-categoria [data-id="${id}"]`).forEach((campo) => {
            const label = campo.closest("[data-campo-categoria]");
            const visivel = campoVisivelCategoria(categoria, label.dataset.campoCategoria);
            label.hidden = !visivel;
            if (!visivel && limparIncompativeis) campo.value = "";

            if (campo.name === "telefone") {
                if (visivel) {
                    iniciarTelefoneAdmin(id);
                } else {
                    destruirTelefoneAdmin(id);
                }
            }
        });

        atualizarPreviewSugestao(id);
    }

    function atualizarPreviewFoto(input) {
        const id = input.dataset.id;
        const arquivo = input.files[0];
        if (!id || !arquivo) return;

        const raiz = input.closest(".admin-conteudo-form") || sugestoesTabela;
        const nomeArquivo = raiz.querySelector(`[data-file-name="${id}"]`);
        if (nomeArquivo) nomeArquivo.textContent = arquivo.name;

        const frame = raiz.querySelector(`[data-crop-frame="${id}"]`);
        const preview = raiz.querySelector(`[data-preview-img="${id}"]`);
        const placeholder = raiz.querySelector(`[data-preview-placeholder="${id}"]`);
        const url = URL.createObjectURL(arquivo);
        if (frame) {
            frame.dataset.cropTouched = "1";
            frame.dataset.cropX = "0";
            frame.dataset.cropY = "0";
            frame.dataset.cropZoom = "1";
            frame.style.setProperty("--crop-x", "0px");
            frame.style.setProperty("--crop-y", "0px");
            frame.style.setProperty("--crop-zoom", "1");
        }

        if (preview) {
            preview.src = url;
            preview.alt = "Prévia da foto escolhida";
            preview.onload = () => ajustarImagemCrop(frame);
            const zoom = raiz.querySelector(`[data-crop-zoom-input="${id}"]`);
            if (zoom) zoom.value = "1";
            return;
        }

        if (placeholder) {
            const img = document.createElement("img");
            img.src = url;
            img.alt = "Prévia da foto escolhida";
            img.dataset.previewImg = id;
            img.draggable = false;
            img.onload = () => ajustarImagemCrop(frame);
            placeholder.replaceWith(img);
        }
    }

    function tamanhoImagemCover(frame) {
        const img = frame.querySelector("img");
        const rect = frame.getBoundingClientRect();
        if (!img || !img.naturalWidth || !img.naturalHeight || !rect.width || !rect.height) {
            return { width: rect.width, height: rect.height };
        }

        const proporcaoFrame = rect.width / rect.height;
        const proporcaoImagem = img.naturalWidth / img.naturalHeight;

        if (proporcaoImagem > proporcaoFrame) {
            return {
                width: rect.height * proporcaoImagem,
                height: rect.height
            };
        }

        return {
            width: rect.width,
            height: rect.width / proporcaoImagem
        };
    }

    function ajustarImagemCrop(frame) {
        if (!frame) return;

        const img = frame.querySelector("img");
        if (!img) return;

        if (!img.complete || !img.naturalWidth) {
            img.addEventListener("load", () => ajustarImagemCrop(frame), { once: true });
            return;
        }

        const tamanho = tamanhoImagemCover(frame);
        frame.style.setProperty("--crop-img-w", `${tamanho.width}px`);
        frame.style.setProperty("--crop-img-h", `${tamanho.height}px`);

        const zoom = Number(frame.dataset.cropZoom || "1");
        const crop = limitarCrop(
            frame,
            Number(frame.dataset.cropX || "0"),
            Number(frame.dataset.cropY || "0"),
            zoom
        );
        aplicarCrop(frame, crop.x, crop.y, zoom);
    }

    function aplicarCrop(frame, x, y, zoom) {
        frame.dataset.cropTouched = "1";
        frame.dataset.cropX = String(x);
        frame.dataset.cropY = String(y);
        frame.dataset.cropZoom = String(zoom);
        frame.style.setProperty("--crop-x", `${x}px`);
        frame.style.setProperty("--crop-y", `${y}px`);
        frame.style.setProperty("--crop-zoom", String(zoom));
    }

    function limitarCrop(frame, x, y, zoom) {
        const rect = frame.getBoundingClientRect();
        const tamanho = tamanhoImagemCover(frame);
        const limiteX = Math.max(0, (tamanho.width * zoom - rect.width) / 2);
        const limiteY = Math.max(0, (tamanho.height * zoom - rect.height) / 2);

        return {
            x: Math.min(Math.max(x, -limiteX), limiteX),
            y: Math.min(Math.max(y, -limiteY), limiteY)
        };
    }

    function iniciarArrastoCrop(event) {
        const frame = event.target.closest("[data-crop-frame]");
        if (!frame || frame.dataset.cropEditavel !== "1" || !frame.querySelector("img")) return;

        event.preventDefault();
        const inicioX = event.clientX;
        const inicioY = event.clientY;
        const xInicial = Number(frame.dataset.cropX || "0");
        const yInicial = Number(frame.dataset.cropY || "0");
        const zoom = Number(frame.dataset.cropZoom || "1");

        frame.classList.add("arrastando");
        frame.setPointerCapture(event.pointerId);

        function mover(e) {
            const proximo = limitarCrop(
                frame,
                xInicial + e.clientX - inicioX,
                yInicial + e.clientY - inicioY,
                zoom
            );
            aplicarCrop(frame, proximo.x, proximo.y, zoom);
        }

        function terminar(e) {
            frame.classList.remove("arrastando");
            frame.releasePointerCapture(e.pointerId);
            frame.removeEventListener("pointermove", mover);
            frame.removeEventListener("pointerup", terminar);
            frame.removeEventListener("pointercancel", terminar);
        }

        frame.addEventListener("pointermove", mover);
        frame.addEventListener("pointerup", terminar);
        frame.addEventListener("pointercancel", terminar);
    }

    async function aplicarFiltroSugestoes(novoEstado) {
        estadoSugestoes = novoEstado;
        if (estadoSugestoesFiltro) {
            estadoSugestoesFiltro.value = novoEstado;
        }
        sugestoesSelecionadasRemocao.clear();
        atualizarBotaoRemocao();
        status.textContent = "A carregar sugestões...";
        await carregar();
    }

    if (estadoSugestoesFiltro) {
        estadoSugestoesFiltro.addEventListener("change", async function () {
            await aplicarFiltroSugestoes(this.value);
        });
    }

    if (categoriaSugestoesFiltro) {
        categoriaSugestoesFiltro.addEventListener("change", function () {
            categoriaSugestoes = this.value;
            renderizarSugestoes();
        });
    }

    if (pesquisaSugestoes) {
        pesquisaSugestoes.addEventListener("input", function () {
            termoPesquisaSugestoes = this.value;
            renderizarSugestoes();
        });
    }

    if (atualizarSugestoesBotao) {
        atualizarSugestoesBotao.addEventListener("click", async function () {
            this.disabled = true;
            status.textContent = "A atualizar sugestões...";
            try {
                await carregar();
            } finally {
                this.disabled = false;
            }
        });
    }

    if (estadoContactosFiltro) {
        estadoContactosFiltro.addEventListener("change", function () {
            estadoContactos = this.value;
            renderizarTabelasAdmin();
        });
    }

    if (pesquisaContactos) {
        pesquisaContactos.addEventListener("input", function () {
            termoPesquisaContactos = this.value;
            contactosTabela.innerHTML = tabelaContactos(contactosVisiveis());
        });
    }

    function fecharFiltrosCabecalho(excecao = null) {
        document.querySelectorAll(".admin-th-filtro.aberto").forEach((filtro) => {
            if (filtro === excecao) return;

            filtro.classList.remove("aberto");
            filtro.style.removeProperty("left");
            filtro.style.removeProperty("top");
            filtro.style.removeProperty("visibility");
            if (filtro._adminParent?.isConnected) {
                filtro._adminParent.appendChild(filtro);
            }
        });
    }

    function posicionarFiltroCabecalho(botao, form) {
        const margem = 12;
        const espacamento = 8;
        const botaoRect = botao.getBoundingClientRect();

        form._adminParent = form.parentElement;
        document.body.appendChild(form);
        form.style.visibility = "hidden";
        form.classList.add("aberto");
        const formRect = form.getBoundingClientRect();

        let left = botaoRect.left + botaoRect.width / 2 - formRect.width / 2;
        left = Math.min(
            Math.max(margem, left),
            window.innerWidth - formRect.width - margem
        );

        let top = botaoRect.bottom + espacamento;
        if (top + formRect.height > window.innerHeight - margem) {
            top = Math.max(margem, botaoRect.top - formRect.height - espacamento);
        }

        form.style.left = `${left}px`;
        form.style.top = `${top}px`;
        form.style.visibility = "";
    }

    function gerirCliqueTabela(event) {
        if (event._adminTabelaGerido) return true;

        const abrir = event.target.closest("[data-abrir-filtro]");
        if (abrir) {
            event._adminTabelaGerido = true;
            event.stopPropagation();
            const [tabelaFiltro, campoFiltro] = abrir.dataset.abrirFiltro.split(":");
            const form = document.querySelector(`.admin-th-filtro[data-filtro-form="${tabelaFiltro}"][data-filtro-campo="${campoFiltro}"]`);
            const estavaAberto = form.classList.contains("aberto");
            fecharFiltrosCabecalho();
            if (!estavaAberto) {
                posicionarFiltroCabecalho(abrir, form);
                form.querySelector("input, select")?.focus();
            }
            return true;
        }

        const ordenar = event.target.closest("[data-ordenar-tabela][data-ordenar-campo]");
        if (ordenar) {
            event._adminTabelaGerido = true;
            const tabela = ordenar.dataset.ordenarTabela;
            const campo = ordenar.dataset.ordenarCampo;
            const atual = ordenacaoTabelas[tabela];
            ordenacaoTabelas[tabela] = {
                campo,
                direcao: atual.campo === campo && atual.direcao === "asc" ? "desc" : "asc"
            };
            renderizarTabelasAdmin();
            return true;
        }

        const limpar = event.target.closest("[data-limpar-filtro]");
        if (limpar) {
            event._adminTabelaGerido = true;
            const [tabela, campo] = limpar.dataset.limparFiltro.split(":");
            delete filtrosTabelas[tabela][campo];
            delete filtrosTabelas[tabela][`${campo}De`];
            delete filtrosTabelas[tabela][`${campo}Ate`];
            renderizarTabelasAdmin();
            return true;
        }

        return false;
    }

    function gerirSubmitFiltro(event) {
        const form = event.target.closest("[data-filtro-form]");
        if (!form) return;

        event.preventDefault();
        const tabela = form.dataset.filtroForm;
        const dados = new FormData(form);
        for (const [nome, valor] of dados.entries()) {
            const limpo = String(valor).trim();
            if (limpo) {
                filtrosTabelas[tabela][nome] = limpo;
            } else {
                delete filtrosTabelas[tabela][nome];
            }
        }
        renderizarTabelasAdmin();
    }

    document.addEventListener("submit", gerirSubmitFiltro);
    logsTabela.addEventListener("click", gerirCliqueTabela);
    document.addEventListener("click", function (event) {
        if (gerirCliqueTabela(event)) return;
        if (!event.target.closest(".admin-th-filtro") && !event.target.closest("[data-abrir-filtro]")) {
            fecharFiltrosCabecalho();
        }
    });
    window.addEventListener("resize", () => fecharFiltrosCabecalho());
    window.addEventListener("scroll", () => fecharFiltrosCabecalho(), { passive: true });

    atualizarBotaoRemocao();

    if (criarSugestaoBotao) {
        criarSugestaoBotao.addEventListener("click", () => {
            criarSugestaoAberto = !criarSugestaoAberto;
            criarSugestaoBotao.textContent = criarSugestaoAberto ? "− Cancelar nova sugestão" : "+ Criar sugestão";
            criarSugestaoBotao.classList.toggle("ativo", criarSugestaoAberto);
            renderizarSugestoes();

            if (criarSugestaoAberto) {
                requestAnimationFrame(() => {
                    sugestoesTabela.querySelector(".admin-sugestao-novo")?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
            }
        });
    }

    if (removerSugestoesSelecionadas) {
        removerSugestoesSelecionadas.addEventListener("click", async function () {
            const ids = Array.from(sugestoesSelecionadasRemocao);
            if (!ids.length) return;
            if (!confirm(`Remover ${ids.length} sugestão${ids.length === 1 ? "" : "ões"} aceite${ids.length === 1 ? "" : "s"} das páginas?`)) return;

            this.disabled = true;
            status.textContent = "A remover sugestões...";

            for (const id of ids) {
                const resposta = await fetch(
                    `/api/admin/sugestoes/${encodeURIComponent(id)}/recusar`,
                    opcoesAdmin({ method: "POST" })
                );

                if (!resposta.ok) {
                    const erro = await resposta.json().catch(() => ({}));
                    status.textContent = erro.erro || "Não foi possível remover uma das sugestões.";
                    atualizarBotaoRemocao();
                    return;
                }
            }

            await carregar();
        });
    }

    sugestoesTabela.addEventListener("click", async function (event) {
        const adicionarFoto = event.target.closest("[data-adicionar-foto]");
        if (adicionarFoto) {
            const input = sugestoesTabela.querySelector(
                `input[type="file"][data-id="${adicionarFoto.dataset.adicionarFoto}"]`
            );
            input?.click();
            return;
        }

        const botaoGuardarCoordenadas = event.target.closest("[data-guardar-coordenadas]");
        if (botaoGuardarCoordenadas) {
            await guardarCoordenadasAceite(botaoGuardarCoordenadas.dataset.guardarCoordenadas, botaoGuardarCoordenadas);
            return;
        }

        const botao = event.target.closest("button[data-acao][data-id]");
        if (!botao) return;

        if (botao.dataset.acao === "cancelar") {
            fecharCriarSugestao();
            return;
        }

        const erroInline = sugestoesTabela.querySelector(`[data-acoes-erro="${botao.dataset.id}"]`);
        if (erroInline) erroInline.textContent = "";

        botao.disabled = true;
        status.textContent = botao.dataset.acao === "publicar" ? "A publicar sugestão..." : "A atualizar sugestão...";

        const opcoes = { method: "POST" };
        if (botao.dataset.acao === "aceitar" || botao.dataset.acao === "publicar") {
            try {
                opcoes.body = await dadosEditadosSugestao(botao.dataset.id);
            } catch (erro) {
                const mensagem = erro.message || "Não foi possível preparar a sugestão.";
                status.textContent = mensagem;
                if (erroInline) erroInline.textContent = mensagem;
                botao.disabled = false;
                return;
            }
        }

        const url = botao.dataset.acao === "publicar"
            ? "/api/admin/sugestoes"
            : `/api/admin/sugestoes/${encodeURIComponent(botao.dataset.id)}/${encodeURIComponent(botao.dataset.acao)}`;

        const resposta = await fetch(url, opcoesAdmin(opcoes));

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            const mensagem = erro.erro || "Não foi possível atualizar a sugestão.";
            status.textContent = mensagem;
            if (erroInline) erroInline.textContent = mensagem;
            botao.disabled = false;
            return;
        }

        if (botao.dataset.acao === "publicar") {
            criarSugestaoAberto = false;
            if (criarSugestaoBotao) {
                criarSugestaoBotao.textContent = "+ Criar sugestão";
                criarSugestaoBotao.classList.remove("ativo");
            }
            status.textContent = "Sugestão criada e publicada com sucesso.";
        }

        await carregar();
    });

    sugestoesTabela.addEventListener("focusout", function (event) {
        const campo = event.target.closest("[data-id][name]");
        if (!campo) return;

        if (campo.name === "email" || campo.name === "site" || campo.name === "booking_url") {
            validarFormatoCampoAdmin(campo.dataset.id, campo.name, true);
        } else if (campo.name === "telefone") {
            validarTelefoneCampoAdmin(campo.dataset.id, true);
        } else if (campo.name === "nome") {
            validarTextoObrigatorioAdmin(campo.dataset.id, "nome", 3, 25, true);
        } else if (campo.name === "descricao") {
            validarTextoObrigatorioAdmin(campo.dataset.id, "descricao", 10, 110, true);
        } else if (campo.name === "lat" || campo.name === "lon") {
            validarCoordenadasAdmin(campo.dataset.id, true);
        }
    });

    sugestoesTabela.addEventListener("change", function (event) {
        const checkbox = event.target.closest("[data-remover-sugestao]");
        if (!checkbox) return;

        if (checkbox.checked) {
            sugestoesSelecionadasRemocao.add(checkbox.dataset.removerSugestao);
        } else {
            sugestoesSelecionadasRemocao.delete(checkbox.dataset.removerSugestao);
        }
        atualizarBotaoRemocao();
    });

    sugestoesTabela.addEventListener("input", function (event) {
        const zoomInput = event.target.closest("[data-crop-zoom-input]");
        if (zoomInput) {
            const id = zoomInput.dataset.cropZoomInput;
            const frame = sugestoesTabela.querySelector(`[data-crop-frame="${id}"]`);
            if (frame) {
                const zoom = Number(zoomInput.value);
                const crop = limitarCrop(
                    frame,
                    Number(frame.dataset.cropX || "0"),
                    Number(frame.dataset.cropY || "0"),
                    zoom
                );
                aplicarCrop(frame, crop.x, crop.y, zoom);
            }
            return;
        }

        const campo = event.target.closest("[data-id][name]");
        if (!campo || campo.type === "file") return;

        if (campo.name === "descricao") {
            const contador = sugestoesTabela.querySelector(`[data-contador-descricao="${campo.dataset.id}"]`);
            if (contador) {
                const tamanho = campo.value.length;
                contador.textContent = `${tamanho} / 110 caracteres`;
                contador.classList.toggle("admin-contador-limite", tamanho >= 110);
            }
        }

        if (campo.name === "nome") {
            const contador = sugestoesTabela.querySelector(`[data-contador-nome="${campo.dataset.id}"]`);
            if (contador) {
                const tamanho = campo.value.length;
                contador.textContent = `${tamanho} / 25 caracteres`;
                contador.classList.toggle("admin-contador-limite", tamanho >= 25);
            }
        }

        if (campo.name === "morada") {
            const contador = sugestoesTabela.querySelector(`[data-contador-morada="${campo.dataset.id}"]`);
            if (contador) {
                const tamanho = campo.value.length;
                contador.textContent = `${tamanho} / 30 caracteres`;
                contador.classList.toggle("admin-contador-limite", tamanho >= 30);
            }
        }

        if (campo.name === "recomendado_por") {
            const contador = sugestoesTabela.querySelector(`[data-contador-recomendado_por="${campo.dataset.id}"]`);
            if (contador) {
                const tamanho = campo.value.length;
                contador.textContent = `${tamanho} / 30 caracteres`;
                contador.classList.toggle("admin-contador-limite", tamanho >= 30);
            }
        }

        if (campo.name === "email" || campo.name === "site" || campo.name === "booking_url") {
            validarFormatoCampoAdmin(campo.dataset.id, campo.name, false);
        } else if (campo.name === "telefone") {
            validarTelefoneCampoAdmin(campo.dataset.id, false);
        } else if (campo.name === "nome") {
            validarTextoObrigatorioAdmin(campo.dataset.id, "nome", 3, 25, false);
        } else if (campo.name === "descricao") {
            validarTextoObrigatorioAdmin(campo.dataset.id, "descricao", 10, 110, false);
        } else if (campo.name === "lat" || campo.name === "lon") {
            validarCoordenadasAdmin(campo.dataset.id, false);
        }

        atualizarPreviewSugestao(campo.dataset.id);
    });

    sugestoesTabela.addEventListener("change", function (event) {
        const campo = event.target.closest("[data-id][name]");
        if (!campo) return;

        if (campo.type === "file") {
            atualizarPreviewFoto(campo);
            return;
        }

        if (campo.name === "categoria") {
            atualizarCamposCategoria(campo.dataset.id, true);
            return;
        }

        atualizarPreviewSugestao(campo.dataset.id);
    });

    contactosTabela.addEventListener("click", async function (event) {
        if (gerirCliqueTabela(event)) return;

        const botao = event.target.closest("button[data-contacto-acao][data-contacto-id]");
        if (!botao) return;

        const acao = botao.dataset.contactoAcao;
        const id = botao.dataset.contactoId;

        if (acao === "apagar" && !confirm("Apagar este contacto?")) return;

        botao.disabled = true;
        status.textContent = acao === "resolver" ? "A resolver contacto..." : "A apagar contacto...";

        const resposta = await fetch(
            `/api/admin/contactos/${encodeURIComponent(id)}/${encodeURIComponent(acao)}`,
            opcoesAdmin({ method: "POST" })
        );

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => ({}));
            status.textContent = erro.erro || "Não foi possível atualizar o contacto.";
            botao.disabled = false;
            return;
        }

        await carregar();
    });

    sugestoesTabela.addEventListener("pointerdown", iniciarArrastoCrop);
    if (darkModeBotao) {
        darkModeBotao.addEventListener("click", darkModeToggle);
    }
    if (exportarContactosBotao) {
        exportarContactosBotao.addEventListener("click", async function () {
            if (!token) {
                status.textContent = "Token em falta no link.";
                return;
            }

            this.disabled = true;
            status.textContent = "A exportar contactos...";
            try {
                const resposta = await fetch("/api/admin/contactos/exportar.xlsx", opcoesAdmin());
                if (!resposta.ok) {
                    status.textContent = "Não foi possível exportar os contactos.";
                    return;
                }

                const blob = await resposta.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "contactos-sesimbra.xlsx";
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(url);
                status.textContent = "";
            } catch (erro) {
                status.textContent = "Não foi possível exportar os contactos.";
            } finally {
                this.disabled = false;
            }
        });
    }
    // ── Vista Toggle ─────────────────────────────────────────────
    (function iniciarVistaTabs() {
        const vistaTabs = document.getElementById("adminVistaTabs");
        const vistaGrid = document.getElementById("vistaGrid");
        const painelConteudoToggle = document.getElementById("painelConteudo");
        if (!vistaTabs || !vistaGrid || !painelConteudoToggle) return;
        vistaTabs.addEventListener("click", function (e) {
            const tab = e.target.closest(".admin-vista-tab");
            if (!tab) return;
            const vista = tab.dataset.vista;
            vistaTabs.querySelectorAll(".admin-vista-tab").forEach(t => {
                t.classList.remove("ativo");
                t.setAttribute("aria-selected", "false");
            });
            tab.classList.add("ativo");
            tab.setAttribute("aria-selected", "true");
            if (vista === "conteudo") {
                vistaGrid.hidden = true;
                if (adminResumo) adminResumo.style.display = "none";
                painelConteudoToggle.hidden = false;
                painelConteudoToggle.dispatchEvent(new CustomEvent("vista-aberta"));
                carregarCss("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/css/intlTelInput.css");
                carregarScript("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/js/intlTelInput.min.js").catch(() => {});
            } else {
                vistaGrid.hidden = false;
                if (adminResumo) adminResumo.style.display = "";
                painelConteudoToggle.hidden = true;
            }
            vistaTabs.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }());

    // ── Conteúdo da Página ───────────────────────────────────────
    (function iniciarGestaoConteudo() {
        const painelConteudo = document.getElementById("painelConteudo");
        const conteudoTabs = document.getElementById("conteudoTabs");
        const conteudoLista = document.getElementById("conteudoLista");
        if (!painelConteudo || !conteudoTabs || !conteudoLista) return;

        let tabelaAtiva = "pontos_interesse";
        let itemEmEdicao = null;
        let dadosConteudo = [];
        let sortColuna = null;
        let sortAsc = true;

        function dadosOrdenados() {
            if (!sortColuna) return dadosConteudo;
            return [...dadosConteudo].sort((a, b) => {
                let va = a[sortColuna] ?? "";
                let vb = b[sortColuna] ?? "";
                if (typeof va === "string") va = va.toLowerCase();
                if (typeof vb === "string") vb = vb.toLowerCase();
                if (va < vb) return sortAsc ? -1 : 1;
                if (va > vb) return sortAsc ? 1 : -1;
                return 0;
            });
        }

        function thSort(rotulo, campo) {
            const ativo = sortColuna === campo;
            const direcao = ativo ? (sortAsc ? "asc" : "desc") : "";
            return `<th><div class="admin-th-conteudo"><span>${rotulo}</span><span class="admin-th-acoes"><button type="button" class="admin-th-botao admin-th-ordenar${ativo ? " ativo" : ""}" data-sort="${campo}" data-direcao="${direcao}" aria-label="Ordenar por ${rotulo}" title="Ordenar por ${rotulo}"><span class="admin-th-ordenar-setas" aria-hidden="true"><svg class="admin-sort-asc" viewBox="0 0 12 8"><path d="M2 6l4-4 4 4"></path></svg><svg class="admin-sort-desc" viewBox="0 0 12 8"><path d="M2 2l4 4 4-4"></path></svg></span></button></span></div></th>`;
        }

        const categoriaPorTabela = {
            pontos_interesse: "Ponto turistico",
            atividades: "Atividade",
            restaurantes: "Gastronomia",
            alojamentos: "Alojamento"
        };

        const camposConteudo = {
            pontos_interesse: [
                { campo: "nome", label: "Nome", tipo: "text", maxlength: 100, required: true, span2: true },
                { campo: "descricao", label: "Descrição", tipo: "textarea", maxlength: 500, required: true, span2: true },
                { campo: "local", label: "Localização", tipo: "text", maxlength: 100 },
                { campo: "telefone", label: "Telefone", tipo: "text", maxlength: 20 },
                { campo: "site_url", label: "Website", tipo: "url", maxlength: 220 },
                { campo: "aviso", label: "Aviso na página", tipo: "text", maxlength: 200 },
            ],
            restaurantes: [
                { campo: "nome", label: "Nome", tipo: "text", maxlength: 100, required: true, span2: true },
                { campo: "descricao", label: "Descrição", tipo: "textarea", maxlength: 500, span2: true },
                { campo: "tipo", label: "Tipo", tipo: "text", maxlength: 50 },
                { campo: "local", label: "Localização", tipo: "text", maxlength: 100 },
                { campo: "telefone", label: "Telefone", tipo: "text", maxlength: 20 },
                { campo: "email", label: "Email", tipo: "email", maxlength: 120 },
                { campo: "site_url", label: "Website", tipo: "url", maxlength: 220 },
            ],
            alojamentos: [
                { campo: "nome", label: "Nome", tipo: "text", maxlength: 100, required: true, span2: true },
                { campo: "descricao", label: "Descrição", tipo: "textarea", maxlength: 500, span2: true },
                { campo: "local", label: "Localização", tipo: "text", maxlength: 100 },
                { campo: "telefone", label: "Telefone", tipo: "text", maxlength: 20 },
                { campo: "site_url", label: "Website", tipo: "url", maxlength: 220 },
                { campo: "booking_url", label: "Link de reserva", tipo: "url", maxlength: 220 },
            ],
            atividades: [
                { campo: "nome", label: "Nome", tipo: "text", maxlength: 100, required: true, span2: true },
                { campo: "descricao", label: "Descrição", tipo: "textarea", maxlength: 500, span2: true },
                { campo: "local", label: "Localização", tipo: "text", maxlength: 100 },
                { campo: "telefone", label: "Telefone", tipo: "text", maxlength: 20 },
                { campo: "site_url", label: "Website", tipo: "url", maxlength: 220 },
            ],
        };


        function esc(v) {
            return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }

        function temCoordenadas(item) {
            return Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)) && item.lat !== null && item.lon !== null;
        }

        function sugestaoDeConteudo(item, itemId) {
            return {
                id: `conteudo-${itemId}`,
                estado: "pendente",
                categoria: categoriaPorTabela[tabelaAtiva] || "Ponto turistico",
                origem: item.origem || "oficial",
                nome: item.nome || "",
                descricao: item.descricao || "",
                tipo: item.tipo || "",
                morada: item.local || "",
                telefone: item.telefone || "",
                email: item.email || "",
                site: item.site_url || "",
                booking_url: item.booking_url || "",
                recomendado_por: item.recomendado_por || "",
                aviso: item.aviso || "",
                foto_path: item.imagem || "",
                icone: item.icone || "compass",
                categoria_ativ: item.categoria || "",
                links_json: item.links_json || "[]"
            };
        }

        function renderizarLista() {
            const dados = dadosOrdenados();
            if (!dados.length) {
                conteudoLista.innerHTML = `<p class="admin-conteudo-vazio">Nenhum item encontrado.</p>`;
                return;
            }
            conteudoLista.innerHTML = `
                <table class="admin-conteudo-table">
                    <thead><tr>
                        ${thSort("ID", "id")}
                        ${thSort("Nome", "nome")}
                        ${thSort("Localização", "local")}
                        <th>Mapa</th>
                        ${thSort("Ordem", "ordem")}
                        <th></th>
                    </tr></thead>
                    <tbody id="conteudoTbody">
                        ${dados.map(item => `
                            <tr class="conteudo-linha" data-id="${esc(item.id)}">
                                <td>${esc(item.id)}</td>
                                <td>${esc(item.nome)}</td>
                                <td>${esc(item.local || "—")}</td>
                                <td>${temCoordenadas(item) ? '<span class="admin-conteudo-mapa-sim">✓</span>' : '<span class="admin-conteudo-mapa-nao">—</span>'}</td>
                                <td>${esc(item.ordem ?? 0)}</td>
                                <td><button class="admin-btn-editar" data-editar-id="${esc(item.id)}">Editar</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>`;
        }

        function fecharForm() {
            if (itemEmEdicao === null) return;
            destruirTelefoneAdmin(`conteudo-${itemEmEdicao}`);
            const formRow = document.getElementById(`conteudoFormRow-${itemEmEdicao}`);
            if (formRow) formRow.remove();
            const tbody = document.getElementById("conteudoTbody");
            if (tbody) {
                const linhaAtiva = tbody.querySelector(".conteudo-linha-ativa");
                if (linhaAtiva) {
                    linhaAtiva.classList.remove("conteudo-linha-ativa");
                    const btn = linhaAtiva.querySelector(".admin-btn-editar");
                    if (btn) btn.classList.remove("ativo");
                }
            }
            itemEmEdicao = null;
        }

        function renderLinkRow(nome, url) {
            return `<div class="acf-link-row">
                <input type="text" class="acf-link-nome" placeholder="Nome" value="${esc(nome)}" maxlength="100">
                <input type="url" class="acf-link-url" placeholder="https://..." value="${esc(url)}" maxlength="220">
                <button type="button" class="acf-link-remover" aria-label="Remover link">×</button>
            </div>`;
        }

        function renderLinksEditor(linksJson, previewId) {
            let links = [];
            try { links = JSON.parse(linksJson || "[]"); } catch (e) { links = []; }
            return `<div class="acf-links-editor" data-links-editor="${esc(previewId)}">
                <p class="acf-links-label">Links</p>
                <div class="acf-links-lista">
                    ${links.map(l => renderLinkRow(l.name || "", l.url || "")).join("")}
                </div>
                <button type="button" class="acf-link-adicionar" data-add-link="${esc(previewId)}">+ Adicionar link</button>
            </div>`;
        }

        function abrirForm(itemId) {
            fecharForm();
            itemEmEdicao = itemId;
            const item = dadosConteudo.find(i => String(i.id) === String(itemId));
            if (!item) return;
            const campos = camposConteudo[tabelaAtiva] || [];
            const tbody = document.getElementById("conteudoTbody");
            if (!tbody) return;
            const linhaAlvo = tbody.querySelector(`tr[data-id="${itemId}"]`);
            if (linhaAlvo) {
                linhaAlvo.classList.add("conteudo-linha-ativa");
                const btn = linhaAlvo.querySelector(".admin-btn-editar");
                if (btn) btn.classList.add("ativo");
            }
            const previewId = `conteudo-${itemId}`;
            const camposPrincipais = campos.filter(f => f.span2);
            const camposDireita = campos.filter(f => ["local", "telefone", "site_url", "aviso", "booking_url", "email"].includes(f.campo));
            const camposOutros = campos.filter(f => !f.span2 && !camposDireita.includes(f));
            const renderCampo = f => {
                const limite = f.maxlength || (f.tipo === "textarea" ? 500 : 200);
                const valorAtual = String(item[f.campo] ?? "");
                const rotulo = f.campo === "telefone" ? "Telemóvel" : f.label;
                const contador = f.maxlength ? `<span class="admin-contador-caracteres" data-contador-conteudo="${esc(f.campo)}-${esc(previewId)}">${valorAtual.length} / ${limite} caracteres</span>` : "";
                const erroTelefone = f.campo === "telefone" ? `<small class="campo-erro-msg" data-erro-campo="telefone-${esc(previewId)}">Por favor, insira um telemóvel válido.</small>` : "";
                const erroFormato = ["email", "site_url", "booking_url"].includes(f.campo)
                    ? `<small class="campo-erro-msg" data-erro-campo="${esc(f.campo)}-${esc(previewId)}">Por favor, insira um valor válido.</small>`
                    : "";

                return `
                <label class="acf-field acf-field-${esc(f.campo)}${f.span2 ? " acf-field-wide" : ""}${f.tipo === "textarea" ? " acf-field-textarea" : ""}">
                    ${esc(rotulo)}${f.required ? " *" : ""}
                    ${f.tipo === "textarea"
                        ? `<textarea name="${esc(f.campo)}" data-id="${esc(previewId)}" maxlength="${limite}"${f.required ? " required" : ""}>${esc(valorAtual)}</textarea>`
                        : `<input type="${esc(f.tipo)}" name="${esc(f.campo)}" data-id="${esc(previewId)}" value="${esc(valorAtual)}" maxlength="${limite}"${f.required ? " required" : ""}>`
                    }
                    ${contador}
                    ${erroTelefone || erroFormato}
                </label>`;
            };
            const formRow = document.createElement("tr");
            formRow.id = `conteudoFormRow-${itemId}`;
            const previewConteudo = sugestaoDeConteudo(item, itemId);
            formRow.innerHTML = `
                <td colspan="6" class="admin-conteudo-form-row">
                    <form class="admin-conteudo-form" id="formConteudo-${esc(itemId)}" novalidate>

                        <div class="acf-preview admin-conteudo-preview-wrap">
                            <p class="admin-preview-titulo">Prévia na página</p>
                            <article class="admin-preview-card recomendacao-malta-card admin-conteudo-preview-card">
                                ${tabelaAtiva !== "atividades" ? fotoPreview(previewConteudo) : ""}
                                ${tabelaAtiva !== "atividades" ? `<h3 data-conteudo-preview-nome="${esc(previewId)}">${esc(previewConteudo.nome)}</h3>` : ""}
                                <div data-conteudo-preview-corpo="${esc(previewId)}">${conteudoPreviewCategoria(previewConteudo)}</div>
                            </article>
                            ${tabelaAtiva !== "atividades" ? `
                            <label class="admin-foto-label">${item.imagem ? "Substituir foto" : "Inserir foto"} *
                                <span class="admin-file-input">
                                    <span class="admin-file-btn">Escolher ficheiro</span>
                                    <span class="admin-file-name" data-file-name="${esc(previewId)}">Nenhum ficheiro selecionado</span>
                                    <input type="file" name="foto" data-id="${esc(previewId)}" data-has-foto="${item.imagem ? "1" : "0"}" accept="image/jpeg,image/png,image/webp">
                                </span>
                            </label>
                            <small class="sugestao-campo-ajuda">Máx. 3 MB. JPG, PNG ou WebP.</small>
                            <div class="admin-crop-controls" data-crop-controls="${esc(previewId)}">
                                <label>Zoom
                                    <input type="range" min="1" max="2.4" step="0.05" value="1" data-crop-zoom-input="${esc(previewId)}">
                                </label>
                            </div>` : ""}
                            <div class="admin-conteudo-preview-meta">
                                <label class="acf-field acf-field-ordem">Ordem
                                    <input type="number" name="ordem" value="${esc(item.ordem ?? 0)}" min="0" step="1" class="acf-ordem-input">
                                </label>
                            </div>
                        </div>

                        <div class="acf-fields">
                            ${camposPrincipais.map(renderCampo).join("")}
                            <div class="acf-side-fields">
                                ${camposDireita.map(renderCampo).join("")}
                            </div>
                            <div class="acf-center-coords">
                                <label>Latitude
                                    <input type="number" name="lat" value="${esc(item.lat ?? "")}" step="any" min="-90" max="90" placeholder="38.4445">
                                </label>
                                <label>Longitude
                                    <input type="number" name="lon" value="${esc(item.lon ?? "")}" step="any" min="-180" max="180" placeholder="-9.1015">
                                </label>
                                <small class="admin-conteudo-form-coords-dica">Deixa os campos de coordenadas vazios para remover o ponto do mapa.</small>
                            </div>
                            ${camposOutros.map(renderCampo).join("")}
                            ${tabelaAtiva === "atividades" ? renderLinksEditor(item.links_json, previewId) : ""}
                        </div>

                        <div class="admin-conteudo-form-acoes">
                            <div class="admin-acoes">
                                <button type="submit" class="admin-aceitar admin-btn-guardar">Guardar alterações</button>
                                <button type="button" class="admin-recusar admin-btn-cancelar-edicao" data-cancelar-edicao="${esc(itemId)}">Cancelar</button>
                                <span class="admin-conteudo-form-status" id="conteudoStatus-${esc(itemId)}"></span>
                            </div>
                        </div>
                    </form>
                </td>`;
            if (linhaAlvo && linhaAlvo.nextSibling) {
                tbody.insertBefore(formRow, linhaAlvo.nextSibling);
            } else if (tbody) {
                tbody.appendChild(formRow);
            }
            const btnCancelarEdicao = formRow.querySelector(".admin-btn-cancelar-edicao");
            if (btnCancelarEdicao) btnCancelarEdicao.addEventListener("click", fecharForm);
            formRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
            requestAnimationFrame(() => {
                try { formRow.querySelectorAll("[data-crop-frame]").forEach(ajustarImagemCrop); } catch (_) {}
                iniciarTelefoneAdmin(previewId, formRow);
            });
        }

        function atualizarPreviewConteudo(form) {
            if (!form || itemEmEdicao === null) return;
            const item = dadosConteudo.find(i => String(i.id) === String(itemEmEdicao));
            if (!item) return;
            const valor = (nome) => form.querySelector(`[name="${nome}"]`)?.value.trim() || "";
            const previewId = `conteudo-${itemEmEdicao}`;
            const preview = sugestaoDeConteudo({
                ...item,
                nome: valor("nome") || item.nome,
                descricao: valor("descricao"),
                tipo: valor("tipo"),
                local: valor("local"),
                telefone: valor("telefone"),
                email: valor("email"),
                site_url: valor("site_url"),
                booking_url: valor("booking_url"),
                aviso: valor("aviso")
            }, itemEmEdicao);

            const nomePreview = form.querySelector(`[data-conteudo-preview-nome="${previewId}"]`);
            if (nomePreview) nomePreview.textContent = preview.nome || "Conteúdo";

            const corpoPreview = form.querySelector(`[data-conteudo-preview-corpo="${previewId}"]`);
            if (corpoPreview) corpoPreview.innerHTML = conteudoPreviewCategoria(preview);
        }

        async function carregarConteudo(tabela) {
            conteudoLista.innerHTML = `<p class="admin-conteudo-vazio">A carregar...</p>`;
            try {
                const resposta = await fetch(`/api/admin/conteudo/${tabela}`, opcoesAdmin());
                if (!resposta.ok) throw new Error("Erro ao carregar conteúdo.");
                dadosConteudo = await resposta.json();
                renderizarLista();
            } catch (e) {
                conteudoLista.innerHTML = `<p class="admin-conteudo-vazio">${esc(e.message)}</p>`;
            }
        }

        conteudoTabs.addEventListener("click", function (e) {
            const tab = e.target.closest(".admin-conteudo-tab");
            if (!tab) return;
            conteudoTabs.querySelectorAll(".admin-conteudo-tab").forEach(t => {
                t.classList.remove("ativo");
                t.setAttribute("aria-selected", "false");
            });
            tab.classList.add("ativo");
            tab.setAttribute("aria-selected", "true");
            tabelaAtiva = tab.dataset.tabela;
            itemEmEdicao = null;
            sortColuna = null;
            sortAsc = true;
            carregarConteudo(tabelaAtiva);
        });

        conteudoLista.addEventListener("click", function (e) {
            const btnSort = e.target.closest(".admin-th-botao[data-sort]");
            if (btnSort) {
                const col = btnSort.dataset.sort;
                if (sortColuna === col) { sortAsc = !sortAsc; } else { sortColuna = col; sortAsc = true; }
                fecharForm();
                renderizarLista();
                return;
            }
            const btnEditar = e.target.closest("[data-editar-id]");
            if (btnEditar) {
                const id = btnEditar.dataset.editarId;
                if (String(itemEmEdicao) === String(id)) {
                    fecharForm();
                } else {
                    abrirForm(id);
                }
                return;
            }
            const btnCancelar = e.target.closest("[data-cancelar-edicao]");
            if (btnCancelar) fecharForm();

            const btnAddLink = e.target.closest("[data-add-link]");
            if (btnAddLink) {
                const editor = conteudoLista.querySelector(`[data-links-editor="${btnAddLink.dataset.addLink}"]`);
                if (editor) editor.querySelector(".acf-links-lista").insertAdjacentHTML("beforeend", renderLinkRow("", ""));
                return;
            }
            const btnRemLink = e.target.closest(".acf-link-remover");
            if (btnRemLink) { btnRemLink.closest(".acf-link-row").remove(); return; }

            const adicionarFoto = e.target.closest("[data-adicionar-foto]");
            if (adicionarFoto) {
                const form = adicionarFoto.closest(".admin-conteudo-form");
                const input = form?.querySelector(`input[type="file"][data-id="${adicionarFoto.dataset.adicionarFoto}"]`);
                input?.click();
            }
        });

        conteudoLista.addEventListener("pointerdown", iniciarArrastoCrop);

        conteudoLista.addEventListener("input", function (e) {
            const zoomInput = e.target.closest("[data-crop-zoom-input]");
            if (zoomInput) {
                const form = zoomInput.closest(".admin-conteudo-form");
                const id = zoomInput.dataset.cropZoomInput;
                const frame = form?.querySelector(`[data-crop-frame="${id}"]`);
                if (frame) {
                    const zoom = Number(zoomInput.value);
                    const crop = limitarCrop(
                        frame,
                        Number(frame.dataset.cropX || "0"),
                        Number(frame.dataset.cropY || "0"),
                        zoom
                    );
                    aplicarCrop(frame, crop.x, crop.y, zoom);
                }
                return;
            }

            const form = e.target.closest(".admin-conteudo-form");
            if (!form || !e.target.name || e.target.type === "file") return;

            const contador = form.querySelector(`[data-contador-conteudo="${e.target.name}-${e.target.dataset.id}"]`);
            if (contador && e.target.maxLength > 0) {
                const tamanho = e.target.value.length;
                contador.textContent = `${tamanho} / ${e.target.maxLength} caracteres`;
                contador.classList.toggle("admin-contador-limite", tamanho >= e.target.maxLength);
            }

            if (e.target.name === "telefone") {
                validarTelefoneCampoAdmin(e.target.dataset.id, false, form);
            } else if (e.target.name === "email" || e.target.name === "site_url" || e.target.name === "booking_url") {
                validarFormatoCampoAdmin(e.target.dataset.id, e.target.name, false, form);
            }

            atualizarPreviewConteudo(form);
        });

        conteudoLista.addEventListener("focusout", function (e) {
            const form = e.target.closest(".admin-conteudo-form");
            if (!form || !e.target.name || !e.target.dataset.id) return;

            if (e.target.name === "telefone") {
                const id = e.target.dataset.id;
                const instancia = telefonesAdminIntl[id];
                const rawTelFocus = e.target.value.trim();
                const validar = () => {
                    if (rawTelFocus.startsWith("+")) instancia?.setNumber(rawTelFocus);
                    validarTelefoneCampoAdmin(id, true, form);
                };
                if (instancia?.promise) {
                    instancia.promise.then(validar).catch(validar);
                } else {
                    validar();
                }
            } else if (e.target.name === "email" || e.target.name === "site_url" || e.target.name === "booking_url") {
                validarFormatoCampoAdmin(e.target.dataset.id, e.target.name, true, form);
            }
        });

        conteudoLista.addEventListener("focusin", function (e) {
            const form = e.target.closest(".admin-conteudo-form");
            if (!form || e.target.name !== "telefone" || !e.target.dataset.id) return;
            iniciarTelefoneAdmin(e.target.dataset.id, form);
        });

        conteudoLista.addEventListener("change", function (e) {
            const foto = e.target.closest('input[type="file"][data-id]');
            if (foto) {
                atualizarPreviewFoto(foto);
            }
        });

        conteudoLista.addEventListener("submit", async function (e) {
            const form = e.target.closest(".admin-conteudo-form");
            if (!form) return;
            e.preventDefault();
            const itemId = itemEmEdicao;
            const statusEl = document.getElementById(`conteudoStatus-${itemId}`);
            const submitBtn = form.querySelector(".admin-btn-guardar");
            const dados = new FormData(form);
            const previewId = `conteudo-${itemId}`;
            const fotoInput = form.querySelector(`input[type="file"][data-id="${previewId}"]`);
            if (submitBtn) submitBtn.disabled = true;
            if (statusEl) statusEl.textContent = "A guardar...";
            try {
                const telefoneCampo = form.querySelector(`[name="telefone"][data-id="${previewId}"]`);
                if (telefoneCampo?.value.trim()) {
                    await iniciarTelefoneAdmin(previewId, form);
                    if (telefonesAdminIntl[previewId]?.promise) {
                        await telefonesAdminIntl[previewId].promise.catch(() => {});
                    }
                    const rawTel = telefoneCampo.value.trim();
                    if (rawTel.startsWith("+")) {
                        telefonesAdminIntl[previewId]?.setNumber(rawTel);
                    }
                    if (!validarTelefoneCampoAdmin(previewId, true, form)) {
                        throw new Error("Verifica o telemóvel antes de guardar.");
                    }
                    dados.set("telefone", obterTelefoneAdmin(previewId, form));
                }
                if (tabelaAtiva === "atividades") {
                    const editor = form.querySelector(".acf-links-editor");
                    if (editor) {
                        const linksArray = Array.from(editor.querySelectorAll(".acf-link-row")).map(row => ({
                            name: row.querySelector(".acf-link-nome")?.value.trim() || "",
                            url: row.querySelector(".acf-link-url")?.value.trim() || ""
                        })).filter(l => l.name || l.url);
                        dados.set("links_json", JSON.stringify(linksArray));
                    }
                }
                const fotoRecortada = await criarFotoRecortada(previewId, form);
                if (fotoRecortada) {
                    dados.set("foto", fotoRecortada, `conteudo-${itemId}.jpg`);
                } else if (fotoInput?.files[0] && fotoInput.files[0].size > 3 * 1024 * 1024) {
                    throw new Error("A foto deve ter no máximo 3 MB.");
                }
                const resposta = await fetch(`/api/admin/conteudo/${tabelaAtiva}/${itemId}`, {
                    ...opcoesAdmin({ method: "PATCH" }),
                    body: dados,
                });
                const json = await resposta.json().catch(() => ({}));
                if (!resposta.ok) throw new Error(json.erro || "Não foi possível guardar.");
                const idx = dadosConteudo.findIndex(i => String(i.id) === String(itemId));
                if (idx !== -1) {
                    dados.forEach((v, k) => {
                        if (k !== "foto") dadosConteudo[idx][k] = v;
                    });
                }
                if (statusEl) statusEl.textContent = "Guardado com sucesso.";
                setTimeout(() => { carregarConteudo(tabelaAtiva); }, 900);
            } catch (err) {
                if (statusEl) statusEl.textContent = err.message;
                if (submitBtn) submitBtn.disabled = false;
            }
        });

        let carregado = false;
        painelConteudo.addEventListener("vista-aberta", function () {
            if (!carregado) {
                carregado = true;
                carregarConteudo(tabelaAtiva);
            }
        });
    }());

    carregarDarkMode();
    carregar().catch(function () {
        status.textContent = "Não foi possível carregar os dados.";
    });
}());
