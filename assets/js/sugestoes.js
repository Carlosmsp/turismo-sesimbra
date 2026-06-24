// sugestoes.js — widget "Sugestão da Malta": painel flutuante com formulário
// para qualquer visitante sugerir um local, restaurante, atividade ou alojamento;
// valida os campos no cliente e envia para /api/sugestoes como multipart/form-data

// cria e injeta o widget de sugestão da comunidade na página
function iniciarSugestaoLocal() {
    if (document.getElementById("sugestaoLocal")) return;

    // determina o texto do botão e a categoria pré-selecionada conforme a página atual
    function obterContextoSugestao() {
        const pagina = window.location.pathname.split("/").pop() || "sesimbra.html";

        const contextos = {
            "sesimbra.html": {
                convite: "Conhece algo que falta no guia?",
                botao: "Sugestão da Malta",
                categoria: ""
            },
            "atividades.html": {
                convite: "Conhece uma atividade que falta aqui?",
                botao: "Sugestão da Malta",
                categoria: "Atividade"
            },
            "pontos-turisticos.html": {
                convite: "Conhece um ponto que falta aqui?",
                botao: "Sugestão da Malta",
                categoria: "Ponto turistico"
            },
            "gastronomia.html": {
                convite: "Tem um restaurante para sugerir?",
                botao: "Sugestão da Malta",
                categoria: "Gastronomia"
            },
            "alojamentos.html": {
                convite: "Conhece um alojamento a acrescentar?",
                botao: "Sugestão da Malta",
                categoria: "Alojamento"
            },
            "historia.html": {
                convite: "Tem uma dica local para acrescentar?",
                botao: "Sugestão da Malta",
                categoria: ""
            }
        };

        return contextos[pagina] || {
            convite: "Conhece algo que falta no guia?",
            botao: "Sugestão da Malta",
            categoria: ""
        };
    }

    const contextoSugestao = obterContextoSugestao();
    if (!contextoSugestao) return;

    const wrapper = document.createElement("aside");
    wrapper.id = "sugestaoLocal";
    wrapper.className = "sugestao-local";
    wrapper.innerHTML = `
        <button type="button" class="sugestao-toggle" aria-label="${contextoSugestao.convite} ${contextoSugestao.botao}" aria-expanded="false">
            <span class="sugestao-toggle-icone" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
            </span>
            <span class="sugestao-toggle-texto">
                <span>${contextoSugestao.convite}</span>
                <strong>${contextoSugestao.botao}</strong>
            </span>
        </button>
        <section class="sugestao-painel" aria-label="Enviar recomendação">
            <div class="sugestao-topo">
                <div>
                    <h2>Recomendar à malta</h2>
                    <p>Partilha um ponto, restaurante ou alojamento que merece destaque.</p>
                </div>
                <div class="sugestao-acoes">
                    <button type="button" class="sugestao-minimizar" aria-label="Minimizar sugestão">-</button>
                    <button type="button" class="sugestao-fechar" aria-label="Fechar sugestão">x</button>
                </div>
            </div>
            <form class="sugestao-form">
                <label for="sugestaoCategoria">Categoria *</label>
                <select id="sugestaoCategoria" name="categoria" required aria-describedby="sugestaoCategoriaErro">
                    <option value="">- Escolhe uma categoria -</option>
                    <option value="Ponto turistico">Ponto turístico</option>
                    <option value="Atividade">Atividade</option>
                    <option value="Gastronomia">Gastronomia</option>
                    <option value="Alojamento">Alojamento</option>
                </select>
                <small id="sugestaoCategoriaErro" class="campo-erro-msg">Escolhe uma categoria.</small>

                <label for="sugestaoNome" id="sugestaoNomeLabel">Nome da recomendação *</label>
                <input type="text" id="sugestaoNome" name="nome" minlength="3" maxlength="25" placeholder="Ex: Restaurante O Mar..." required aria-describedby="sugestaoNomeContador sugestaoNomeErro">
                <p id="sugestaoNomeContador" class="sugestao-campo-ajuda"><span id="sugestaoNomeLength">0</span>/25</p>
                <small id="sugestaoNomeErro" class="campo-erro-msg">O nome deve ter entre 3 e 25 caracteres.</small>

                <label for="sugestaoDescricao">Porque recomendas? *</label>
                <textarea id="sugestaoDescricao" name="descricao" minlength="10" maxlength="110" placeholder="Conta o que vale a pena ver, provar ou fazer..." aria-describedby="sugestaoDescricaoContador sugestaoDescricaoErro" required></textarea>
                <p id="sugestaoDescricaoContador" class="sugestao-campo-ajuda"><span id="sugestaoDescricaoLength">0</span>/110</p>
                <small id="sugestaoDescricaoErro" class="campo-erro-msg">A recomendação deve ter entre 10 e 110 caracteres.</small>

                <label for="sugestaoMorada">Localização</label>
                <input type="text" id="sugestaoMorada" name="morada" maxlength="30" placeholder="Ex: Rua da Praia, Sesimbra" aria-describedby="sugestaoMoradaContador">
                <p id="sugestaoMoradaContador" class="sugestao-campo-ajuda"><span id="sugestaoMoradaLength">0</span>/30</p>

                <label for="sugestaoTelefone">Telemóvel</label>
                <input type="tel" id="sugestaoTelefone" name="telefone" maxlength="20" placeholder="Ex: +351 212 345 678" aria-describedby="sugestaoTelefoneErro">
                <small id="sugestaoTelefoneErro" class="campo-erro-msg">Por favor, insira um telemóvel válido.</small>

                <div class="sugestao-gastronomia-campos" hidden>
                    <label for="sugestaoEmail">Email</label>
                    <input type="email" id="sugestaoEmail" name="email" maxlength="120" placeholder="Ex: geral@restaurante.pt" aria-describedby="sugestaoEmailErro">
                    <small id="sugestaoEmailErro" class="campo-erro-msg">Insere um email válido, por exemplo geral@restaurante.pt.</small>
                </div>

                <div class="sugestao-site-campos" hidden>
                    <label for="sugestaoSite">Website</label>
                    <input type="url" id="sugestaoSite" name="site" maxlength="220" placeholder="Ex: https://exemplo.pt" aria-describedby="sugestaoSiteErro">
                    <small id="sugestaoSiteErro" class="campo-erro-msg">Insere um link completo e válido, começado por https://.</small>
                </div>

                <div class="sugestao-alojamento-campos" hidden>
                    <label for="sugestaoBookingUrl">Link do alojamento</label>
                    <input type="url" id="sugestaoBookingUrl" name="booking_url" maxlength="220" placeholder="Ex: https://www.booking.com/..." aria-describedby="sugestaoBookingErro">
                    <small id="sugestaoBookingErro" class="campo-erro-msg">Insere um link completo e válido do alojamento.</small>
                </div>

                <label for="sugestaoFoto">Foto</label>
                <div class="sugestao-file-input">
                    <span class="sugestao-file-btn">Escolher ficheiro</span>
                    <span class="sugestao-file-name" id="sugestaoFotoNome">Nenhum ficheiro selecionado</span>
                    <input type="file" id="sugestaoFoto" name="foto" accept="image/jpeg,image/png,image/webp">
                </div>
                <small class="sugestao-campo-ajuda">Opcional no envio. Máx. 3 MB. JPG, PNG ou WebP.</small>

                <label for="sugestaoRecomendadoPor">Recomendado por</label>
                <input type="text" id="sugestaoRecomendadoPor" name="recomendado_por" maxlength="30" placeholder="Ex: Maria, João..." aria-describedby="sugestaoRecomendadoPorContador">
                <p id="sugestaoRecomendadoPorContador" class="sugestao-campo-ajuda"><span id="sugestaoRecomendadoPorLength">0</span>/30</p>

                <p class="sugestao-ajuda">A equipa analisa a recomendação e publica se estiver tudo certo.</p>
                <div class="sugestao-estado" aria-live="polite"></div>
                <button type="submit">Enviar sugestão</button>
            </form>
        </section>
    `;

    document.body.appendChild(wrapper);

    const toggle = wrapper.querySelector(".sugestao-toggle");
    const painel = wrapper.querySelector(".sugestao-painel");
    const fechar = wrapper.querySelector(".sugestao-fechar");
    const minimizar = wrapper.querySelector(".sugestao-minimizar");
    const topo = wrapper.querySelector(".sugestao-topo");
    const form = wrapper.querySelector(".sugestao-form");
    const estado = wrapper.querySelector(".sugestao-estado");
    const submit = form.querySelector("button[type='submit']");
    const categoriaSelect = form.elements.categoria;
    const categoriaErro = wrapper.querySelector("#sugestaoCategoriaErro");
    const nomeInput = form.elements.nome;
    const nomeLabel = wrapper.querySelector("#sugestaoNomeLabel");
    const nomeLength = wrapper.querySelector("#sugestaoNomeLength");
    const nomeErro = wrapper.querySelector("#sugestaoNomeErro");
    const descricaoInput = form.elements.descricao;
    const descricaoLength = wrapper.querySelector("#sugestaoDescricaoLength");
    const descricaoErro = wrapper.querySelector("#sugestaoDescricaoErro");
    const moradaInput = form.elements.morada;
    const moradaLength = wrapper.querySelector("#sugestaoMoradaLength");
    const telefoneInput = form.elements.telefone;
    const telefoneErro = wrapper.querySelector("#sugestaoTelefoneErro");
    const emailInput = form.elements.email;
    const emailErro = wrapper.querySelector("#sugestaoEmailErro");
    const bookingInput = form.elements.booking_url;
    const bookingErro = wrapper.querySelector("#sugestaoBookingErro");
    const camposAlojamento = wrapper.querySelector(".sugestao-alojamento-campos");
    const camposGastronomia = wrapper.querySelector(".sugestao-gastronomia-campos");
    const camposSite = wrapper.querySelector(".sugestao-site-campos");
    const siteLabel = wrapper.querySelector('label[for="sugestaoSite"]');
    const siteInput = wrapper.querySelector("#sugestaoSite");
    const siteErro = wrapper.querySelector("#sugestaoSiteErro");
    const fotoInput = wrapper.querySelector("#sugestaoFoto");
    const fotoNome = wrapper.querySelector("#sugestaoFotoNome");
    const recomendadoPorInput = form.elements.recomendado_por;
    const recomendadoPorLength = wrapper.querySelector("#sugestaoRecomendadoPorLength");
    let telefoneSugestaoInternacional = null;
    let temporizadorToastSugestao = null;

    function mostrarToastSugestao(mensagem) {
        document.querySelector(".sugestao-toast")?.remove();
        window.clearTimeout(temporizadorToastSugestao);

        const toast = document.createElement("div");
        const textoToast = document.createElement("span");
        const fecharToast = document.createElement("button");
        toast.className = "sugestao-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        textoToast.textContent = mensagem;
        fecharToast.type = "button";
        fecharToast.setAttribute("aria-label", "Fechar confirmação");
        fecharToast.textContent = "×";
        fecharToast.addEventListener("click", () => toast.remove());
        toast.append(textoToast, fecharToast);
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("visivel"));
        temporizadorToastSugestao = window.setTimeout(() => {
            toast.classList.remove("visivel");
            window.setTimeout(() => toast.remove(), 220);
        }, 5500);
    }

    // mostra o nome do ficheiro escolhido em vez do texto padrão do navegador
    fotoInput.addEventListener("change", () => {
        fotoNome.textContent = fotoInput.files[0]
            ? fotoInput.files[0].name
            : "Nenhum ficheiro selecionado";
    });

    // textos do campo nome adaptados por categoria para melhor clareza
    const nomePorCategoria = {
        "Ponto turistico": {
            label: "Nome do ponto turístico *",
            placeholder: "Ex: Miradouro da Falésia"
        },
        "Atividade": {
            label: "Nome da atividade *",
            placeholder: "Ex: Surf na Praia Grande"
        },
        "Gastronomia": {
            label: "Nome do restaurante *",
            placeholder: "Ex: Restaurante O Mar"
        },
        "Alojamento": {
            label: "Nome do alojamento *",
            placeholder: "Ex: Casa da Praia Guest House"
        }
    };

    // o campo de site pertence às sugestões de gastronomia e alojamento
    const sitePorCategoria = {
        "Gastronomia": {
            label: "Link do restaurante",
            placeholder: "Ex: https://www.restaurante.pt"
        },
        "Alojamento": {
            label: "Website oficial",
            placeholder: "Ex: https://www.casadapraia.pt"
        }
    };

    // atualiza o label e placeholder do campo nome conforme a categoria selecionada
    function atualizarCampoNome() {
        const textos = nomePorCategoria[categoriaSelect.value] || {
            label: "Nome da recomendação *",
            placeholder: "Ex: Restaurante O Mar, Trilho da Arrábida..."
        };
        nomeLabel.textContent = textos.label;
        nomeInput.placeholder = textos.placeholder;

        // o site pertence a gastronomia e alojamento; o link do alojamento fica só no alojamento
        const ehAlojamento = categoriaSelect.value === "Alojamento";
        const ehGastronomia = categoriaSelect.value === "Gastronomia";
        camposSite.hidden = !(ehGastronomia || ehAlojamento);
        camposAlojamento.hidden = !ehAlojamento;
        if (!ehGastronomia && !ehAlojamento) {
            form.elements.site.value = "";
            marcarCampoSugestao(siteInput, siteErro, true);
        }
        const textosSite = sitePorCategoria[categoriaSelect.value];
        if (textosSite) {
            siteLabel.textContent = textosSite.label;
            siteInput.placeholder = textosSite.placeholder;
        }
        if (!ehAlojamento) {
            form.elements.booking_url.value = "";
            marcarCampoSugestao(bookingInput, bookingErro, true);
        }

        // mostra ou esconde o campo de email, exclusivo de gastronomia
        camposGastronomia.hidden = !ehGastronomia;
        if (!ehGastronomia) {
            form.elements.email.value = "";
            marcarCampoSugestao(emailInput, emailErro, true);
        }
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

    // inicializa o plugin de telefone internacional no campo de sugestão (carrega sob demanda)
    async function iniciarTelefoneSugestao() {
        if (!telefoneInput || telefoneSugestaoInternacional) return;

        carregarCss("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/css/intlTelInput.css");

        if (!window.intlTelInput) {
            try {
                await carregarScript("https://cdn.jsdelivr.net/npm/intl-tel-input@29.0.1/dist/js/intlTelInput.min.js");
            } catch (erro) {
                return;
            }
        }

        telefoneSugestaoInternacional = window.intlTelInput(telefoneInput, {
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
        return telefoneSugestaoInternacional;
    }

    function marcarTelefoneSugestaoValido(valido, mostrarMensagem = false) {
        telefoneInput.classList.toggle("campo-invalido", !valido);
        telefoneInput.closest(".iti")?.classList.toggle("campo-invalido", !valido);
        telefoneErro.classList.toggle("visivel", !valido && mostrarMensagem);
    }

    // valida e devolve o número internacional normalizado
    function validarTelefoneSugestao(mostrarMensagem = false) {
        const telefone = telefoneInput.value.trim();
        if (!telefone) {
            marcarTelefoneSugestaoValido(true);
            return { valido: true, telefone: "" };
        }
        if (telefoneSugestaoInternacional && telefoneSugestaoInternacional.isValidNumber()) {
            marcarTelefoneSugestaoValido(true);
            const formato = window.intlTelInputUtils?.numberFormat?.INTERNATIONAL;
            const numero = formato !== undefined
                ? telefoneSugestaoInternacional.getNumber(formato)
                : telefoneSugestaoInternacional.getNumber();
            return { valido: true, telefone: numero };
        }
        if (!telefoneSugestaoInternacional) {
            const normalizado = telefone.replace(/[\s().-]/g, "");
            if (/^\+[1-9]\d{7,14}$/.test(normalizado)) {
                marcarTelefoneSugestaoValido(true);
                return { valido: true, telefone: normalizado };
            }
        }

        marcarTelefoneSugestaoValido(false, mostrarMensagem);
        if (telefoneSugestaoInternacional) {
            const indicativo = `+${telefoneSugestaoInternacional.getSelectedCountry().dialCode}`;
            telefoneErro.textContent = `Por favor, insira um telemóvel válido para ${indicativo}.`;
        }
        return { valido: false, telefone };
    }

    function urlHttpValida(valor) {
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

    function marcarCampoSugestao(campo, erro, valido, mostrarMensagem = false) {
        campo.classList.toggle("campo-invalido", !valido);
        campo.setAttribute("aria-invalid", String(!valido));
        erro?.classList.toggle("visivel", !valido && mostrarMensagem);
        return valido;
    }

    function validarEmailSugestao(mostrarMensagem = false) {
        const valor = emailInput.value.trim();
        const valido = !valor || (
            valor.length <= 120
            && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
        );
        return marcarCampoSugestao(emailInput, emailErro, valido, mostrarMensagem);
    }

    function validarUrlSugestao(campo, erro, mostrarMensagem = false) {
        const valor = campo.value.trim();
        return marcarCampoSugestao(
            campo,
            erro,
            !valor || urlHttpValida(valor),
            mostrarMensagem
        );
    }

    function validarCategoriaSugestao(mostrarMensagem = false) {
        return marcarCampoSugestao(
            categoriaSelect,
            categoriaErro,
            Boolean(categoriaSelect.value),
            mostrarMensagem
        );
    }

    function validarNomeSugestao(mostrarMensagem = false) {
        const tamanho = nomeInput.value.trim().length;
        return marcarCampoSugestao(
            nomeInput,
            nomeErro,
            tamanho >= 3 && tamanho <= 25,
            mostrarMensagem
        );
    }

    function validarDescricaoSugestao(mostrarMensagem = false) {
        const tamanho = descricaoInput.value.trim().length;
        return marcarCampoSugestao(
            descricaoInput,
            descricaoErro,
            tamanho >= 10 && tamanho <= 110,
            mostrarMensagem
        );
    }

    function validarObrigatoriosSugestao(mostrarMensagem = false) {
        return validarCategoriaSugestao(mostrarMensagem)
            && validarNomeSugestao(mostrarMensagem)
            && validarDescricaoSugestao(mostrarMensagem);
    }

    function validarFormatosSugestao(mostrarMensagem = false) {
        const emailValido = validarEmailSugestao(mostrarMensagem);
        const siteValido = validarUrlSugestao(siteInput, siteErro, mostrarMensagem);
        const bookingValido = validarUrlSugestao(bookingInput, bookingErro, mostrarMensagem);
        return emailValido && siteValido && bookingValido;
    }

    // abre o painel, inicializa o plugin de telefone e foca o primeiro campo
    function abrirPainel() {
        wrapper.classList.add("aberto");
        toggle.setAttribute("aria-expanded", "true");
        atualizarCampoNome();
        iniciarTelefoneSugestao();
        painel.querySelector("select").focus();
    }

    // fecha o painel e repõe a sua posição e tamanho para o padrão
    function fecharPainel() {
        painel.style.left = "";
        painel.style.top = "";
        painel.style.right = "";
        painel.style.bottom = "";
        painel.style.transform = "";
        painel.style.width = "";
        painel.style.height = "";
        painel.style.maxHeight = "";
        form.style.overflowY = "";
        form.style.minHeight = "";
        wrapper.classList.remove("aberto");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
    }

    // garante que o painel não sai dos limites do ecrã ao ser arrastado
    function limitarPosicao(left, top) {
        const rect = painel.getBoundingClientRect();
        const margem = 12;
        const maxLeft = window.innerWidth - rect.width - margem;
        const maxTop = window.innerHeight - rect.height - margem;

        return {
            left: Math.min(Math.max(margem, left), Math.max(margem, maxLeft)),
            top: Math.min(Math.max(margem, top), Math.max(margem, maxTop))
        };
    }

    // lógica de arrastar o painel com o rato (pointer events para compatibilidade)
    function iniciarArrasto(event) {
        if (event.target.closest("button")) return;
        event.preventDefault();

        const inicioX = event.clientX;
        const inicioY = event.clientY;
        const rect = painel.getBoundingClientRect();
        const leftInicial = rect.left;
        const topInicial = rect.top;

        painel.style.left = `${leftInicial}px`;
        painel.style.top = `${topInicial}px`;
        painel.style.right = "auto";
        painel.style.bottom = "auto";
        painel.style.transform = "none";

        topo.setPointerCapture(event.pointerId);
        painel.classList.add("arrastando");
        let framePendente = 0;
        let posicaoAtual = { left: leftInicial, top: topInicial };

        function mover(e) {
            posicaoAtual = limitarPosicao(
                leftInicial + e.clientX - inicioX,
                topInicial + e.clientY - inicioY
            );

            if (framePendente) return;
            framePendente = requestAnimationFrame(() => {
                const deltaX = posicaoAtual.left - leftInicial;
                const deltaY = posicaoAtual.top - topInicial;
                painel.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
                framePendente = 0;
            });
        }

        function terminar(e) {
            if (framePendente) {
                cancelAnimationFrame(framePendente);
                framePendente = 0;
            }
            painel.style.transform = "none";
            painel.style.left = `${posicaoAtual.left}px`;
            painel.style.top = `${posicaoAtual.top}px`;
            if (topo.hasPointerCapture(e.pointerId)) {
                topo.releasePointerCapture(e.pointerId);
            }
            painel.classList.remove("arrastando");
            topo.removeEventListener("pointermove", mover);
            topo.removeEventListener("pointerup", terminar);
            topo.removeEventListener("pointercancel", terminar);
        }

        topo.addEventListener("pointermove", mover);
        topo.addEventListener("pointerup", terminar);
        topo.addEventListener("pointercancel", terminar);
    }

    // redimensiona o painel em todas as direções com limites mínimos e máximos
    function iniciarResize(event, direcao, handle) {
        event.preventDefault();
        event.stopPropagation();

        const rect = painel.getBoundingClientRect();
        const inicioX = event.clientX;
        const inicioY = event.clientY;
        const wInicial = rect.width;
        const hInicial = rect.height;
        const leftInicial = rect.left;
        const topInicial = rect.top;
        const MIN_W = 320, MAX_W = 800;
        const MIN_H = 360, MAX_H = 960;

        painel.style.left = `${leftInicial}px`;
        painel.style.top = `${topInicial}px`;
        painel.style.right = "auto";
        painel.style.bottom = "auto";
        painel.style.transform = "none";
        painel.style.width = `${wInicial}px`;
        painel.style.height = `${hInicial}px`;
        painel.style.maxHeight = "none";
        form.style.minHeight = "0";
        form.style.overflowY = "auto";

        handle.setPointerCapture(event.pointerId);

        function mover(e) {
            const dx = e.clientX - inicioX;
            const dy = e.clientY - inicioY;
            let w = wInicial, h = hInicial, left = leftInicial, top = topInicial;

            if (direcao.includes("e")) w = Math.min(Math.max(MIN_W, wInicial + dx), MAX_W);
            if (direcao.includes("w")) { w = Math.min(Math.max(MIN_W, wInicial - dx), MAX_W); left = leftInicial + wInicial - w; }
            if (direcao.includes("s")) h = Math.min(Math.max(MIN_H, hInicial + dy), MAX_H);
            if (direcao.includes("n")) { h = Math.min(Math.max(MIN_H, hInicial - dy), MAX_H); top = topInicial + hInicial - h; }

            const margem = 8;
            // handle W/N bate na borda do viewport: fixar a borda oposta (direita/inferior) em vez de saltar
            if (left < margem) { w = (leftInicial + wInicial) - margem; left = margem; }
            if (top  < margem) { h = (topInicial  + hInicial) - margem; top  = margem; }
            // clamp handle E/S ao viewport
            w = Math.min(w, window.innerWidth  - left - margem);
            h = Math.min(h, window.innerHeight - top  - margem);

            painel.style.width  = `${w}px`;
            painel.style.height = `${h}px`;
            painel.style.left   = `${left}px`;
            painel.style.top    = `${top}px`;
        }

        function terminar(e) {
            if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
            document.removeEventListener("pointermove", mover);
            document.removeEventListener("pointerup", terminar);
            document.removeEventListener("pointercancel", terminar);
        }

        document.addEventListener("pointermove", mover);
        document.addEventListener("pointerup", terminar);
        document.addEventListener("pointercancel", terminar);
    }

    // 8 handles: largura 320-800px, altura 360-960px
    function adicionarHandlesResize() {
        if (window.matchMedia("(max-width: 560px)").matches) return;
        for (const dir of ["n", "ne", "e", "se", "s", "sw", "w", "nw"]) {
            const h = document.createElement("div");
            h.className = `painel-resize-handle resize-${dir}`;
            h.setAttribute("aria-hidden", "true");
            h.addEventListener("pointerdown", (e) => iniciarResize(e, dir, h));
            painel.appendChild(h);
        }
    }

    // lê e limpa o valor de um campo do formulário pelo nome
    function valorCampo(nome) {
        return form.elements[nome].value.trim();
    }

    // atualiza o contador de caracteres da descrição em tempo real
    function atualizarContadorDescricao() {
        if (descricaoLength) {
            descricaoLength.textContent = descricaoInput.value.length;
        }
    }

    // atualiza o contador de caracteres da localização em tempo real
    function atualizarContadorMorada() {
        if (moradaLength) {
            moradaLength.textContent = moradaInput.value.length;
        }
    }

    // atualiza o contador de caracteres do nome em tempo real
    function atualizarContadorNome() {
        if (nomeLength) {
            nomeLength.textContent = nomeInput.value.length;
        }
    }

    // atualiza o contador de caracteres do campo "recomendado por" em tempo real
    function atualizarContadorRecomendadoPor() {
        if (recomendadoPorLength) {
            recomendadoPorLength.textContent = recomendadoPorInput.value.length;
        }
    }

    // pré-seleciona a categoria da página atual se existir
    if (contextoSugestao.categoria) {
        categoriaSelect.value = contextoSugestao.categoria;
        atualizarCampoNome();
    }

    toggle.addEventListener("click", () => {
        if (wrapper.classList.contains("aberto")) {
            fecharPainel();
        } else {
            abrirPainel();
        }
    });

    fechar.addEventListener("click", fecharPainel);
    minimizar.addEventListener("click", fecharPainel);
    topo.addEventListener("pointerdown", iniciarArrasto);
    adicionarHandlesResize();
    categoriaSelect.addEventListener("change", atualizarCampoNome);
    categoriaSelect.addEventListener("change", () => validarCategoriaSugestao(false));
    descricaoInput.addEventListener("input", atualizarContadorDescricao);
    descricaoInput.addEventListener("input", () => validarDescricaoSugestao(false));
    descricaoInput.addEventListener("blur", () => validarDescricaoSugestao(true));
    atualizarContadorDescricao();
    moradaInput.addEventListener("input", atualizarContadorMorada);
    atualizarContadorMorada();
    nomeInput.addEventListener("input", atualizarContadorNome);
    nomeInput.addEventListener("input", () => validarNomeSugestao(false));
    nomeInput.addEventListener("blur", () => validarNomeSugestao(true));
    atualizarContadorNome();
    recomendadoPorInput.addEventListener("input", atualizarContadorRecomendadoPor);
    atualizarContadorRecomendadoPor();
    telefoneInput.addEventListener("input", () => validarTelefoneSugestao(false));
    telefoneInput.addEventListener("blur", () => validarTelefoneSugestao(true));
    emailInput.addEventListener("input", () => validarEmailSugestao(false));
    emailInput.addEventListener("blur", () => validarEmailSugestao(true));
    siteInput.addEventListener("input", () => validarUrlSugestao(siteInput, siteErro, false));
    siteInput.addEventListener("blur", () => validarUrlSugestao(siteInput, siteErro, true));
    bookingInput.addEventListener("input", () => validarUrlSugestao(bookingInput, bookingErro, false));
    bookingInput.addEventListener("blur", () => validarUrlSugestao(bookingInput, bookingErro, true));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && wrapper.classList.contains("aberto")) {
            fecharPainel();
        }
    });

    // envia a sugestão para a api como multipart/form-data (inclui a foto se houver)
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        await iniciarTelefoneSugestao();
        if (telefoneSugestaoInternacional?.promise) {
            await telefoneSugestaoInternacional.promise.catch(() => {});
        }
        const resultadoTelefone = validarTelefoneSugestao(true);
        const obrigatoriosValidos = validarObrigatoriosSugestao(true);
        const formatosValidos = validarFormatosSugestao(true);
        if (!resultadoTelefone.valido || !obrigatoriosValidos || !formatosValidos) {
            form.querySelector(".campo-invalido")?.focus();
            estado.className = "sugestao-estado erro";
            estado.textContent = "Verifica os campos assinalados antes de enviar.";
            return;
        }

        const dados = {
            categoria: valorCampo("categoria"),
            nome: valorCampo("nome"),
            descricao: valorCampo("descricao"),
            morada: valorCampo("morada"),
            telefone: resultadoTelefone.telefone,
            site: (valorCampo("categoria") === "Gastronomia" || valorCampo("categoria") === "Alojamento") ? valorCampo("site") : "",
            booking_url: valorCampo("categoria") === "Alojamento" ? valorCampo("booking_url") : "",
            email: valorCampo("categoria") === "Gastronomia" ? valorCampo("email") : "",
            recomendado_por: valorCampo("recomendado_por")
        };
        const foto = form.elements.foto.files[0];
        const tamanhoMaxFoto = 3 * 1024 * 1024;

        if (foto && foto.size > tamanhoMaxFoto) {
            estado.className = "sugestao-estado erro";
            estado.textContent = "A foto deve ter no máximo 3 MB.";
            return;
        }

        estado.className = "sugestao-estado a-enviar";
        estado.textContent = "A enviar sugestão...";
        submit.disabled = true;

        try {
            const csrfToken = await obterCsrfToken();
            const formData = new FormData();
            Object.entries({
                ...dados,
                pagina_origem: window.location.pathname.split("/").pop() || "sesimbra.html"
            }).forEach(([chave, valor]) => formData.append(chave, valor));
            if (foto) {
                formData.append("foto", foto);
            }

            const resposta = await fetch("/api/sugestoes", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken
                },
                body: formData
            });

            const respostaJson = await resposta.json().catch(() => ({}));
            if (!resposta.ok) {
                const erros = Array.isArray(respostaJson.erros) ? respostaJson.erros.join(" ") : "Não foi possível enviar agora.";
                throw new Error(erros);
            }

            form.reset();
            telefoneSugestaoInternacional?.setNumber("");
            marcarTelefoneSugestaoValido(true);
            marcarCampoSugestao(categoriaSelect, categoriaErro, true);
            marcarCampoSugestao(nomeInput, nomeErro, true);
            marcarCampoSugestao(descricaoInput, descricaoErro, true);
            validarFormatosSugestao(false);
            atualizarCampoNome();
            atualizarContadorDescricao();
            atualizarContadorMorada();
            atualizarContadorNome();
            atualizarContadorRecomendadoPor();
            estado.className = "sugestao-estado sucesso";
            estado.textContent = "Sugestão enviada. Obrigado pela ajuda!";
            mostrarToastSugestao("Sugestão enviada com sucesso. Obrigado pela ajuda!");
        } catch (erro) {
            estado.className = "sugestao-estado erro";
            estado.textContent = erro.message || "Não foi possível enviar agora.";
        } finally {
            submit.disabled = false;
        }
    });
}
