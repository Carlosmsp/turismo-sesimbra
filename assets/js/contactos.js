// valida e envia o formulário de contacto para a api do servidor
async function validarForm(event){
    event.preventDefault();
    const erros = [];
    const obrigatoriosEmFalta = [];
    respostaValidacao.innerHTML = "";
    respostaValidacao.className = "";

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const mensagem = inputMensagem.value.trim();

    inputNome.classList.remove("campo-invalido");
    inputEmail.classList.remove("campo-invalido");
    inputMensagem.classList.remove("campo-invalido");

    // verifica quais dos campos obrigatórios estão em falta antes de qualquer outra validação
    if (!nome) obrigatoriosEmFalta.push("nome");
    if (!email) obrigatoriosEmFalta.push("email");
    if (!mensagem) obrigatoriosEmFalta.push("mensagem");

    if (obrigatoriosEmFalta.length > 0) {
        if (!nome) inputNome.classList.add("campo-invalido");
        if (!email) inputEmail.classList.add("campo-invalido");
        if (!mensagem) inputMensagem.classList.add("campo-invalido");

        respostaValidacao.className = "erro";
        respostaValidacao.textContent = obrigatoriosEmFalta.length > 1
            ? `Por favor, preenche os campos obrigatórios: ${formatarListaCampos(obrigatoriosEmFalta)}.`
            : `Por favor, preenche o campo obrigatório: ${formatarListaCampos(obrigatoriosEmFalta)}.`;
        return;
    }

    if (nome.length < 3) {
        erros.push("Nome deve ter pelo menos 3 caracteres.");
        inputNome.classList.add("campo-invalido");
    }
    if (nome.length > 100) {
        erros.push("Nome deve ter menos de 100 caracteres.");
        inputNome.classList.add("campo-invalido");
    }
    if (/\d/.test(nome)) {
        erros.push("O nome não pode ter números.");
        inputNome.classList.add("campo-invalido");
    }
    else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nome)) {
        erros.push("Nome inválido.");
        inputNome.classList.add("campo-invalido");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erros.push("Email inválido.");
        inputEmail.classList.add("campo-invalido");
    }
    if (email.length > 100) {
        erros.push("Email deve ter menos de 100 caracteres.");
        inputEmail.classList.add("campo-invalido");
    }
    if (mensagem.length < 3) {
        erros.push("Mensagem deve ter pelo menos 3 caracteres.");
        inputMensagem.classList.add("campo-invalido");
    }
    if (mensagem.length > 300) {
        erros.push("Mensagem deve ter menos de 300 caracteres.");
        inputMensagem.classList.add("campo-invalido");
    }
    validarEmailVisual(true);
    let telefoneValido = true;
    try {
        telefoneValido = validarTelefoneVisual(true);
    }
    catch (erro) {
        // o plugin de telefone pode não estar disponível; usa validação simples como fallback
        telefoneValido = validarTelefoneFallback(inputTelefone.value.trim(), "pt");
    }
    if (!telefoneValido) {
        erros.push("Telemóvel inválido.");
    }

    if (erros.length > 0){
        respostaValidacao.className = "erro";
        respostaValidacao.textContent = erros.join(" ");
    }
    else{
        // monta o número completo com indicativo antes de enviar
        if (inputTelefoneCompleto && telefoneInternacional && inputTelefone.value.trim() !== "") {
            inputTelefoneCompleto.value = telefoneInternacional.getNumber();
        }

        const telefone = inputTelefoneCompleto && inputTelefoneCompleto.value
            ? inputTelefoneCompleto.value
            : inputTelefone.value.trim();

        if (botaoSubmit) {
            botaoSubmit.disabled = true;
            botaoSubmit.textContent = "A enviar...";
        }
        respostaValidacao.className = "a-enviar";
        respostaValidacao.textContent = "A contactar o servidor...";

        try {
            const csrfToken = await obterCsrfToken();
            const resposta = await fetch(formularioContacto.action, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                body: JSON.stringify({
                    nome,
                    email,
                    telefone,
                    mensagem
                })
            });
            const dados = await resposta.json().catch(function () {
                return {};
            });

            if (!resposta.ok) {
                const errosServidor = Array.isArray(dados.erros)
                    ? dados.erros
                    : ["Não foi possível guardar a mensagem. Tente novamente."];
                respostaValidacao.className = "erro";
                const elemUl = document.createElement("ul");
                for (const e of errosServidor) {
                    const elemLi = document.createElement("li");
                    elemLi.textContent = e;
                    elemUl.appendChild(elemLi);
                }
                respostaValidacao.replaceChildren(elemUl);
                return;
            }

            respostaValidacao.className = "sucesso";
            respostaValidacao.textContent = "Mensagem enviada com sucesso.";
            formularioContacto.reset();
            inputNome.classList.remove("campo-invalido");
            inputEmail.classList.remove("campo-invalido");
            inputTelefone.classList.remove("campo-invalido");
            inputMensagem.classList.remove("campo-invalido");
            if (inputTelefoneCompleto) {
                inputTelefoneCompleto.value = "";
            }
            if (emailErro) {
                emailErro.classList.remove("visivel");
            }
            if (telefoneErro) {
                telefoneErro.classList.remove("visivel");
            }
            if (mensagemLength) {
                mensagemLength.textContent = "0";
            }
        }
        catch (erro) {
            respostaValidacao.className = "erro";
            respostaValidacao.textContent = "Não foi possível enviar a mensagem. Tente novamente.";
        }
        finally {
            if (botaoSubmit) {
                botaoSubmit.disabled = false;
                botaoSubmit.textContent = "Enviar";
            }
        }
    }
}

// valida visualmente o campo nome (apenas letras e espaços, sem números)
function validarNomeVisual(mostrarMensagem){
    const nome = inputNome.value.trim();
    const temNumero = /\d/.test(nome);

    if (!nome || !temNumero) {
        inputNome.classList.remove("campo-invalido");
        inputNome.setCustomValidity("");
        if (nomeErro) {
            nomeErro.classList.remove("visivel");
        }
        return !temNumero;
    }

    inputNome.classList.add("campo-invalido");
    inputNome.setCustomValidity("");
    if (nomeErro) {
        nomeErro.textContent = "O nome não pode ter números.";
        nomeErro.classList.toggle("visivel", mostrarMensagem);
    }
    return false;
}

// valida visualmente o campo email e mostra ou esconde a mensagem de erro
function validarEmailVisual(mostrarMensagem){
    const email = inputEmail.value.trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (email === "") {
        inputEmail.classList.remove("campo-invalido");
        inputEmail.setCustomValidity("");
        if (emailErro) {
            emailErro.textContent = "Por favor, insira o seu email.";
            emailErro.classList.remove("visivel");
        }
    }
    else if (!emailValido) {
        inputEmail.classList.add("campo-invalido");
        inputEmail.setCustomValidity("");
        if (emailErro) {
            emailErro.textContent = "Por favor, insira um email válido.";
            emailErro.classList.toggle("visivel", mostrarMensagem);
        }
    }
    else {
        inputEmail.classList.remove("campo-invalido");
        inputEmail.setCustomValidity("");
        if (emailErro) {
            emailErro.classList.remove("visivel");
        }
    }
}

// valida o telefone com o plugin intl-tel-input e mostra o erro se necessário
function validarTelefoneVisual(mostrarMensagem){
    const telefone = inputTelefone.value.trim();

    if (telefone === "") {
        inputTelefone.classList.remove("campo-invalido");
        if (telefoneErro) {
            telefoneErro.classList.remove("visivel");
        }
        return true;
    }

    const dadosPais = telefoneInternacional
        ? telefoneInternacional.getSelectedCountry()
        : { dialCode: "351", iso2: "pt" };
    const indicativo = `+${dadosPais.dialCode}`;
    const telefoneValido = telefoneInternacional
        ? telefoneInternacional.isValidNumber()
        : validarTelefoneFallback(telefone, dadosPais.iso2);

    if (!telefoneValido) {
        inputTelefone.classList.add("campo-invalido");
        if (telefoneErro) {
            telefoneErro.textContent = `Por favor, insira um telemóvel válido para ${indicativo}.`;
            telefoneErro.classList.toggle("visivel", mostrarMensagem);
        }
        return false;
    }

    inputTelefone.classList.remove("campo-invalido");
    if (telefoneErro) {
        telefoneErro.classList.remove("visivel");
    }
    return true;
}

// validação simples por contagem de dígitos quando o plugin não está disponível
function validarTelefoneFallback(telefone, pais){
    const digitos = telefone.replace(/\D/g, "");
    const tamanhosPorPais = {
        pt: [9],
        br: [10, 11],
        es: [9],
        fr: [9],
        gb: [10]
    };
    const tamanhosValidos = tamanhosPorPais[pais] || [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    return tamanhosValidos.includes(digitos.length);
}

// atualiza o contador de caracteres da mensagem em tempo real
function inputMensagemNumero(){
    mensagemLength.textContent = inputMensagem.value.length;
}

// lê o valor de um cookie pelo nome
function lerCookie(nome){
    const prefixo = `${nome}=`;
    const cookie = document.cookie
        .split(";")
        .map(valor => valor.trim())
        .find(valor => valor.startsWith(prefixo));

    return cookie ? cookie.slice(prefixo.length) : "";
}

// obtém o token csrf, primeiro do cookie e se não existir pede à api
async function obterCsrfToken(){
    const tokenAtual = lerCookie("csrf_token");
    if (tokenAtual) return tokenAtual;

    const resposta = await fetch("/api/csrf");
    const dados = await resposta.json();
    return dados.csrf_token || lerCookie("csrf_token");
}

// formata uma lista de campos como texto corrido em português ("a, b e c")
function formatarListaCampos(campos) {
    if (campos.length <= 1) return campos[0] || "";
    if (campos.length === 2) return campos.join(" e ");
    return `${campos.slice(0, -1).join(", ")} e ${campos[campos.length - 1]}`;
}
