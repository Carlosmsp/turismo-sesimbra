const adminLista = document.getElementById('adminLista')
const adminStatus = document.getElementById('adminStatus')

async function carregarMensagens() {
    adminStatus.textContent = 'A carregar mensagens...'
    try {
        const apiUrl = 'http://127.0.0.1:5000/api/contacts'
        const response = await fetch(apiUrl)
        if (!response.ok) {
            throw new Error('Não foi possível carregar as mensagens.')
        }
        const mensagens = await response.json()
        if (mensagens.length === 0) {
            adminLista.innerHTML = '<p>Nenhuma mensagem encontrada.</p>'
            adminStatus.textContent = 'Sem mensagens no momento.'
            return
        }

        adminStatus.textContent = `${mensagens.length} mensagem(s) encontradas.`
        adminLista.innerHTML = mensagens.map(mensagem => {
            return `
                <article class="admin-card">
                    <h3>${mensagem.nome}</h3>
                    <p><strong>Email:</strong> ${mensagem.email}</p>
                    <p><strong>Telefone:</strong> ${mensagem.telefone || 'Não informado'}</p>
                    <p><strong>Mensagem:</strong> ${mensagem.mensagem}</p>
                    <p><strong>Recebido em:</strong> ${mensagem.criado_em}</p>
                </article>
            `
        }).join('')
    } catch (error) {
        adminStatus.textContent = 'Erro ao carregar mensagens.'
        adminLista.innerHTML = `<p class="erro">${error.message}</p>`
    }
}

carregarMensagens()
