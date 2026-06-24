// referências aos campos do formulário de contacto
const inputNome = document.getElementById("inputNome")
const inputEmail = document.getElementById("inputEmail")
const inputTelefone = document.getElementById("inputTelefone")
const inputTelefoneCompleto = document.getElementById("inputTelefoneCompleto")
const inputMensagem = document.getElementById("inputMensagem")

// mensagens de erro por campo
const nomeErro = document.getElementById("nomeErro")
const emailErro = document.getElementById("emailErro")
const telefoneErro = document.getElementById("telefoneErro")

// botão de envio e área de feedback ao utilizador
const botaoSubmit = document.getElementById("botaoSubmit")
const respostaValidacao = document.getElementById("respostaValidacao")
const mensagemLength = document.getElementById("mensagemLength")

// navegação, formulário e botão de dark mode
const navLinks = document.getElementById("navLinks")
const formularioContacto = document.getElementById("formularioContacto")
const darkModeBotao = document.getElementById("darkModeBotao")

// filtros e containers das listas de conteúdo dinâmico
const inputPontosFiltro = document.getElementById("inputPontosFiltro")
const pontoCard = document.getElementById("pontoCard")
const actividadeCard = document.getElementById("actividadeCard")
const hospedagemCard = document.getElementById("hospedagemCard")
const mapaPontos = document.getElementById("mapaPontos")

// lista de pontos que está atualmente a ser mostrada (pode ser filtrada)
let pontosFiltrados = pontosTuristicosLista;
// instância do plugin intl-tel-input, iniciada em main.js quando disponível
let telefoneInternacional = null;
