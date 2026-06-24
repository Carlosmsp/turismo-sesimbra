// chatbot.js — widget do Assistente IA: cria o painel flutuante, gere o histórico
// de conversa em sessionStorage, comunica com /api/chatbot (Gemini) e suporta
// arrastar, redimensionar e persistência entre navegações dentro da sessão

// cria e injeta o widget do assistente ia na página, com histórico de sessão
function iniciarAssistenteIA() {
    if (document.getElementById("assistenteIa")) return;

    const ASSISTENTE_STORAGE_KEY = "assistenteIaEstado";
    const ASSISTENTE_DESCOBERTO_KEY = "assistenteIaDescoberto";
    const ASSISTENTE_VERSAO = 1;
    // tempo máximo de inatividade antes de limpar o histórico (30 minutos)
    const ASSISTENTE_INATIVIDADE_MAX = 30 * 60 * 1000;
    // tempo máximo de vida da sessão (8 horas)
    const ASSISTENTE_IDADE_MAX = 8 * 60 * 60 * 1000;

    // lê o estado guardado e descarta se estiver expirado ou for de uma versão antiga
    function carregarEstadoAssistente() {
        const agora = Date.now();
        const estado = JSON.parse(sessionStorage.getItem(ASSISTENTE_STORAGE_KEY) || "{}");
        const criadoEm = estado.criadoEm || agora;
        const atualizadoEm = estado.atualizadoEm || agora;
        const expirouPorVersao = estado.versao && estado.versao !== ASSISTENTE_VERSAO;
        const expirouPorInatividade = agora - atualizadoEm > ASSISTENTE_INATIVIDADE_MAX;
        const expirouPorIdade = agora - criadoEm > ASSISTENTE_IDADE_MAX;

        if (expirouPorVersao || expirouPorInatividade || expirouPorIdade) {
            sessionStorage.removeItem(ASSISTENTE_STORAGE_KEY);
            return {};
        }

        return estado;
    }

    const estadoGuardado = carregarEstadoAssistente();
    const mensagensGuardadas = Array.isArray(estadoGuardado.mensagens) ? estadoGuardado.mensagens : [];
    const navegacao = performance.getEntriesByType("navigation")[0];
    const paginaRecarregada = navegacao?.type === "reload";
    const assistenteDescoberto = !paginaRecarregada
        && localStorage.getItem(ASSISTENTE_DESCOBERTO_KEY) === "1";

    const wrapper = document.createElement("aside");
    wrapper.id = "assistenteIa";
    wrapper.className = `assistente-ia${assistenteDescoberto ? " descoberto" : " apresentar"}`;
    wrapper.innerHTML = `
        <button type="button" class="assistente-toggle" aria-label="Abrir Assistente IA" aria-expanded="false">
            <span class="assistente-toggle-icone" aria-hidden="true">?</span>
            <span class="assistente-toggle-texto">
                <small>Precisa de ajuda?</small>
                <strong>Assistente IA</strong>
            </span>
        </button>
        <section class="assistente-painel" aria-label="Assistente de viagem com IA">
            <div class="assistente-topo">
                <div>
                    <h2>Assistente IA</h2>
                    <p>Peça um roteiro, tempos, custos, transportes, restaurantes ou pontos a visitar.</p>
                </div>
                <div class="assistente-acoes">
                    <button type="button" class="assistente-minimizar" aria-label="Minimizar assistente">-</button>
                    <button type="button" class="assistente-fechar" aria-label="Fechar assistente">x</button>
                </div>
            </div>
            <div class="assistente-mensagens" aria-live="polite"></div>
            <form class="assistente-form">
                <div class="assistente-form-topo">
                    <label for="assistentePergunta">Faça a sua pergunta</label>
                    <button type="button" class="assistente-limpar" aria-label="Limpar conversa" title="Limpar conversa">🗑</button>
                </div>
                <textarea id="assistentePergunta" name="pergunta" maxlength="700" required placeholder="Ex: Quero visitar o Castelo, Cabo Espichel e almoçar peixe. Faz um plano com tempos e custos."></textarea>
                <button type="submit">Enviar</button>
            </form>
        </section>
    `;

    document.body.appendChild(wrapper);

    const toggle = wrapper.querySelector(".assistente-toggle");
    const painel = wrapper.querySelector(".assistente-painel");
    const fechar = wrapper.querySelector(".assistente-fechar");
    const limpar = wrapper.querySelector(".assistente-limpar");
    const minimizar = wrapper.querySelector(".assistente-minimizar");
    const topo = wrapper.querySelector(".assistente-topo");
    const form = wrapper.querySelector(".assistente-form");
    const textarea = wrapper.querySelector("textarea");
    const mensagens = wrapper.querySelector(".assistente-mensagens");
    const botaoEnviar = form.querySelector("button[type='submit']");

    // recolhe as mensagens visíveis para guardar no sessionstorage
    function obterMensagensGuardadas() {
        return Array.from(mensagens.querySelectorAll(".assistente-msg")).map((msg) => ({
            tipo: msg.classList.contains("assistente-user") ? "user" : "bot",
            texto: msg.dataset.texto || msg.textContent
        }));
    }

    // persiste o estado atual do painel (mensagens, scroll, posição) no sessionstorage
    function guardarEstadoAssistente() {
        const agora = Date.now();
        sessionStorage.setItem(ASSISTENTE_STORAGE_KEY, JSON.stringify({
            versao: ASSISTENTE_VERSAO,
            criadoEm: estadoGuardado.criadoEm || agora,
            atualizadoEm: agora,
            mensagens: obterMensagensGuardadas(),
            scrollTop: mensagens.scrollTop
        }));
    }

    // apaga o histórico e recomeça a conversa com a mensagem de boas-vindas
    function resetarConversaAssistente() {
        sessionStorage.removeItem(ASSISTENTE_STORAGE_KEY);
        mensagens.replaceChildren();
        adicionarMensagem("Olá! Diz-me o que queres visitar em Sesimbra e eu preparo um plano de viagem.", "bot");
        textarea.value = "";
        guardarEstadoAssistente();
    }

    // abre ou fecha o painel e repõe a sua posição e tamanho se estava arrastado/redimensionado
    function definirAberto(aberto) {
        if (!aberto) {
            painel.style.left = "";
            painel.style.top = "";
            painel.style.right = "";
            painel.style.bottom = "";
            painel.style.width = "";
            painel.style.height = "";
            painel.style.maxHeight = "";
            painel.style.transform = "";
        }

        wrapper.classList.toggle("aberto", aberto);
        toggle.setAttribute("aria-expanded", String(aberto));
        if (aberto) {
            localStorage.setItem(ASSISTENTE_DESCOBERTO_KEY, "1");
            wrapper.classList.remove("apresentar");
            wrapper.classList.add("descoberto");
            textarea.focus();
        }
        guardarEstadoAssistente();
    }

    // cria e injeta uma mensagem no painel, com formatação conforme o tipo
    function adicionarMensagem(texto, tipo) {
        const msg = document.createElement("p");
        msg.className = `assistente-msg assistente-${tipo}`;
        msg.dataset.texto = texto;
        msg.innerHTML = tipo === "bot" ? formatarMensagemAssistente(texto) : escaparHtml(texto).replace(/\n/g, "<br>");
        mensagens.appendChild(msg);
        mensagens.scrollTop = mensagens.scrollHeight;
        guardarEstadoAssistente();
        return msg;
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

        const inicioX = event.clientX;
        const inicioY = event.clientY;
        const rect = painel.getBoundingClientRect();
        const leftInicial = rect.left;
        const topInicial = rect.top;

        topo.setPointerCapture(event.pointerId);
        painel.classList.add("arrastando");

        function mover(e) {
            const posicao = limitarPosicao(
                leftInicial + e.clientX - inicioX,
                topInicial + e.clientY - inicioY
            );
            painel.style.left = `${posicao.left}px`;
            painel.style.top = `${posicao.top}px`;
            painel.style.right = "auto";
            painel.style.bottom = "auto";
        }

        function terminar(e) {
            topo.releasePointerCapture(e.pointerId);
            painel.classList.remove("arrastando");
            topo.removeEventListener("pointermove", mover);
            topo.removeEventListener("pointerup", terminar);
            topo.removeEventListener("pointercancel", terminar);
            guardarEstadoAssistente();
        }

        topo.addEventListener("pointermove", mover);
        topo.addEventListener("pointerup", terminar);
        topo.addEventListener("pointercancel", terminar);
    }

    // redimensiona o painel para cima (n) e/ou esquerda (w)
    // os estilos inline só são aplicados no primeiro pointermove real — nunca no pointerdown,
    // para evitar saltos de posição ao simplesmente clicar na borda
    function iniciarResize(event, direcao, handle) {
        event.preventDefault();
        event.stopPropagation();

        const rect = painel.getBoundingClientRect();
        const inicioX = event.clientX;
        const inicioY = event.clientY;
        const wInicial = rect.width;
        const hInicial = rect.height;
        const fixedRight    = rect.left + rect.width;
        const fixedBottom   = window.innerHeight - rect.bottom; // px desde o fundo do viewport
        const maxHViewport  = rect.bottom - 8;
        const MIN_W = 320, MAX_W = 700;
        const MIN_H = 400, MAX_H = 900;

        let inicializado = false;

        handle.setPointerCapture(event.pointerId);

        function mover(e) {
            const dx = e.clientX - inicioX;
            const dy = e.clientY - inicioY;

            // na primeira vez que o rato se move, fixar âncoras sem mover o painel
            if (!inicializado) {
                const r = painel.getBoundingClientRect();
                painel.style.left      = `${r.left}px`;
                painel.style.right     = "auto";
                painel.style.bottom    = `${window.innerHeight - r.bottom}px`;
                painel.style.top       = "auto";
                painel.style.width     = `${r.width}px`;
                painel.style.height    = `${r.height}px`;
                painel.style.maxHeight = "none";
                inicializado = true;
            }

            if (direcao.includes("w")) {
                let w = Math.min(Math.max(MIN_W, wInicial - dx), MAX_W);
                let left = fixedRight - w;
                if (left < 8) { left = 8; w = fixedRight - 8; }
                w = Math.min(w, window.innerWidth - left - 8);
                painel.style.width = `${w}px`;
                painel.style.left  = `${left}px`;
            }

            if (direcao.includes("n")) {
                const h = Math.min(Math.max(MIN_H, hInicial - dy), MAX_H, maxHViewport);
                painel.style.height = `${h}px`;
            }
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

    // handles N, NW, W — chatbot ancorado no canto inferior-direito, cresce para cima e esquerda
    function adicionarHandlesResize() {
        if (window.matchMedia("(max-width: 560px)").matches) return;
        for (const dir of ["n", "nw", "w"]) {
            const h = document.createElement("div");
            h.className = `painel-resize-handle resize-${dir}`;
            h.setAttribute("aria-hidden", "true");
            h.addEventListener("pointerdown", (e) => iniciarResize(e, dir, h));
            painel.appendChild(h);
        }
    }

    // restaura as mensagens guardadas ou mostra a saudação inicial
    if (mensagensGuardadas.length) {
        for (const msg of mensagensGuardadas) {
            adicionarMensagem(msg.texto, msg.tipo);
        }
        mensagens.scrollTop = estadoGuardado.scrollTop || mensagens.scrollHeight;
    }
    else {
        adicionarMensagem("Olá! Diz-me o que queres visitar em Sesimbra e eu preparo um plano de viagem.", "bot");
    }

    toggle.addEventListener("click", () => definirAberto(!wrapper.classList.contains("aberto")));
    fechar.addEventListener("click", () => definirAberto(false));
    limpar.addEventListener("click", resetarConversaAssistente);
    minimizar.addEventListener("click", () => definirAberto(false));
    topo.addEventListener("pointerdown", iniciarArrasto);
    adicionarHandlesResize();
    mensagens.addEventListener("scroll", guardarEstadoAssistente, { passive: true });
    // enter submete o formulário (shift+enter permite nova linha)
    textarea.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" || event.shiftKey) return;

        event.preventDefault();
        if (!botaoEnviar.disabled) {
            form.requestSubmit();
        }
    });

    // envia a pergunta para a api e mostra a resposta do assistente
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const pergunta = textarea.value.trim();
        if (!pergunta) return;

        // guarda as últimas trocas antes de adicionar a pergunta atual, para dar contexto ao assistente
        const historico = obterMensagensGuardadas().slice(-8);

        adicionarMensagem(pergunta, "user");
        textarea.value = "";
        const estado = adicionarMensagem("A preparar uma sugestão para si...", "bot");
        botaoEnviar.disabled = true;

        try {
            const resposta = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pergunta,
                    pagina: window.location.pathname.split("/").pop() || "sesimbra.html",
                    historico
                })
            });

            const dados = await resposta.json();
            if (!resposta.ok) {
                estado.innerHTML = formatarMensagemAssistente(dados.resposta || "Não consegui responder agora. Tente novamente dentro de alguns segundos.");
                estado.dataset.texto = estado.textContent;
                guardarEstadoAssistente();
                return;
            }

            estado.innerHTML = formatarMensagemAssistente(dados.resposta);
            estado.dataset.texto = dados.resposta;
            guardarEstadoAssistente();
        }
        catch (erro) {
            estado.textContent = "Não consegui responder agora. Tente novamente dentro de alguns segundos.";
            estado.dataset.texto = estado.textContent;
            guardarEstadoAssistente();
        }
        finally {
            botaoEnviar.disabled = false;
        }
    });

    // garante que o painel começa fechado e na posição padrão
    painel.style.left = "";
    painel.style.top = "";
    painel.style.right = "";
    painel.style.bottom = "";
    wrapper.classList.remove("aberto");
    toggle.setAttribute("aria-expanded", "false");
}
