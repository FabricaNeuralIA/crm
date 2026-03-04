// --- CONFIGURAÇÃO KANBAN ---
const GET_LEADS_PATH = '/get-leads'
const UPDATE_STATUS_PATH = '/update-status'
const UPDATE_BOT_STATUS_PATH = '/update-bot-status' // [NOVO!]

// Mapeia o 'lead.status' para o ID da coluna no HTML
const STATUS_COLUNAS = {
  'Sem retorno': 'col-sem-retorno',
  Encaminhado: 'col-encaminhado',
  Ganho: 'col-ganho',
  Perdido: 'col-perdido'
}
const COLUNA_PADRAO = 'col-outro-status' // Para status não listados

// 1. Executa quando a página termina de carregar
document.addEventListener('DOMContentLoaded', () => {
  // Só executa a lógica se ESTIVERMOS na página do kanban
  if (document.getElementById('kanban-board')) {
    // 1. Busca os leads IMEDIATAMENTE quando a página carrega
    fetchLeads()

    // 2. [NOVO!] Configura um "timer" para atualizar o board a cada 30 segundos
    setInterval(fetchLeads, 30000) // 30000 milissegundos = 30 segundos
  }
})

// 2. Busca os leads no n8n (agora usando apiFetch)
async function fetchLeads() {
  console.log('Buscando leads...')
  try {
    const leads = await apiFetch(GET_LEADS_PATH) // NÃO PRECISA MAIS DE METHOD 'GET'
    console.log('Leads recebidos:', leads)
    renderKanban(leads)
  } catch (error) {
    console.error('Erro ao buscar leads:', error)
    alert('Não foi possível carregar os leads. Verifique o console (F12).')
  }
}

// 3. Renderiza os leads no Kanban (VERSÃO FINAL DO FUNIL)
function renderKanban(leads) {
  // Limpa todas as colunas
  document.querySelectorAll('[id^="col-"]').forEach(col => {
    col.innerHTML = '' // Limpa a coluna inteira
  })

  leads.forEach(lead => {
    const cardElement = createLeadCard(lead)
    let colunaAlvo

    // --- LÓGICA DO FUNIL (FINAL) ---

    // REGRA 1: Perdido (Manual) OU Finalizado (Bot)
    if (
      lead.status === 'Perdido' ||
      lead.status === 'Sem retorno' ||
      lead.atendimento === 'Sem retorno'
    ) {
      colunaAlvo = 'col-perdido'

      // REGRA 2: Encaminhado (Sucesso)
    } else if (lead.encaminhado === true) {
      colunaAlvo = 'col-encaminhado'

      // REGRA 3: Atendimento Humano (Bot parado)
    } else if (lead.bot_ativado === false) {
      colunaAlvo = 'col-atendimento'

      // REGRA 4: Bot trabalhando (Novos, FollowUps, E AGENDADOS)
    } else if (
      lead.status === null ||
      lead.status === 'Sem retorno' ||
      lead.status === 'FollowUp 5m' ||
      lead.status === 'FollowUp 1h' ||
      lead.agendado === true || // <-- 'Agendado' agora vive aqui
      lead.atendimento === 'Aberto'
    ) {
      colunaAlvo = 'col-atendimento-maia'

      // REGRA 5: Coringa
    } else {
      colunaAlvo = 'col-outro-status'
    }
    // --- FIM DA LÓGICA ---

    const colunaElement = document.getElementById(colunaAlvo)
    if (colunaElement) {
      colunaElement.appendChild(cardElement)
    } else {
      console.warn(
        `Coluna não encontrada para o lead ${lead.id}: ${colunaAlvo}`
      )
    }
  })
}

// 4. Cria o HTML de um único card (VERSÃO FINAL DO FUNIL)
function createLeadCard(lead) {
  const card = document.createElement('div')
  card.className = 'block w-full rounded-lg bg-white p-4 shadow'
  card.dataset.leadId = lead.id

  const ultimoContato = new Date(lead.ultimo_contato).toLocaleString('pt-BR', {
    timeStyle: 'short',
    dateStyle: 'short'
  })

  // --- Lógica de Status (para saber o que está acontecendo) ---
  let statusTexto = lead.status
  let statusValue = lead.status

  if (lead.status === 'Perdido') {
    statusTexto = 'Perdido'
  } else if (lead.atendimento === 'Finalizado') {
    statusTexto = 'Finalizado (Bot)'
    statusValue = 'Finalizado'
  } else if (lead.encaminhado === true) {
    statusTexto = 'Encaminhado'
    statusValue = 'Encaminhado'
  } else if (lead.bot_ativado === false) {
    statusTexto = 'Aguardando Atendimento'
    statusValue = 'Atendimento'
  } else if (lead.agendado === true) {
    // <-- 'Agendado' é um status virtual
    statusTexto = 'Agendado (Bot)'
    statusValue = 'Agendado'
  } else if (lead.status === 'FollowUp 5m') {
    statusTexto = 'FollowUp 5m'
  } else if (lead.status === 'FollowUp 1h') {
    statusTexto = 'FollowUp 1h'
  } else if (lead.status === 'Sem retorno') {
    statusTexto = 'Engajando (Bot)'
  } else if (lead.status === null) {
    statusTexto = 'Novo Lead'
    statusValue = 'Novo Lead'
  }

  // Mostra o agendamento (continua igual)
  let agendamentoHtml = ''
  if (lead.agendado === true && lead.agendamento) {
    const dataAgendada = new Date(lead.agendamento).toLocaleString('pt-BR', {
      timeStyle: 'short',
      dateStyle: 'short'
    })
    agendamentoHtml = `
            <div class="mt-3 pt-3 border-t border-gray-200">
                <p class="text-sm font-semibold text-indigo-600">
                    <span class="mr-1">🔔</span> Agendado: ${dataAgendada}
                </p>
            </div>
        `
  }

  // --- Mostra o Status do Bot (Texto) ---
  let statusBotHtml = ''
  // [NOVO!] Agendado agora tem prioridade aqui
  if (lead.agendado === true) {
    statusBotHtml = `
            <div>
                <span class="text-sm font-medium text-gray-700">Status do Bot:</span>
                <span class="font-semibold text-blue-600">Agendado</span>
            </div>
        `
  } else if (
    (lead.status === null && lead.bot_ativado === true) ||
    lead.status === 'FollowUp 5m' ||
    lead.status === 'FollowUp 1h' ||
    (lead.status === 'Sem retorno' && lead.atendimento !== 'Finalizado')
  ) {
    let botStatusDisplay = lead.status === null ? 'Novo Lead' : lead.status
    statusBotHtml = `
            <div>
                <span class="text-sm font-medium text-gray-700">Status do Bot:</span>
                <span class="font-semibold text-blue-600">${botStatusDisplay}</span>
            </div>
        `
  }

  card.innerHTML = `
        <h3 class="font-semibold text-gray-900">${
          lead.nome || 'Lead sem nome'
        }</h3>
        <p class="text-sm text-gray-600">${lead.contato}</p>
        <p class="mt-2 text-xs text-gray-500">Últ. Contato: ${ultimoContato}</p>
        
        ${agendamentoHtml}

        <div class="mt-4 pt-4 border-t space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Bot Ativado</span>
                <label class="switch">
                    <input type="checkbox" onchange="handleBotToggle(this, ${
                      lead.id
                    })" ${lead.bot_ativado == true ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            
            ${statusBotHtml} </div>

        <select class="status-select mt-4 block w-full rounded-md border-0 py-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm" 
                onchange="handleStatusChange(this, ${lead.id})">
            
            <option value="${statusValue}" selected disabled>${statusTexto}</option>
            
            <option value="" disabled>--- Ação Humana ---</option>
            <option value="Encaminhado">Encaminhar (Sucesso)</option>
            <option value="" disabled>------------------</option>
            <option value="Perdido">Marcar como PERDIDO</option>
            <option value="" disabled>------------------</option>
            <option value="Sem retorno">Reativar Bot (Mover p/ Prospecção)</option>
        </select>
    `
  return card
}
// 5. Chamado quando o <select> de status é alterado
async function handleStatusChange(selectElement, leadId) {
  const novoStatus = selectElement.value
  console.log(`Atualizando lead ${leadId} para status: ${novoStatus}`)

  try {
    const result = await apiFetch(UPDATE_STATUS_PATH, {
      method: 'POST',
      body: {
        lead_id: leadId,
        novo_status: novoStatus
      }
    })

    console.log('Resposta da atualização:', result)

    // Recarrega o board para mover o card (simples e eficaz)
    fetchLeads()
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    alert('Erro ao atualizar status.')
  }
}

async function handleBotToggle(checkbox, leadId) {
  const novoStatusBot = checkbox.checked // true ou false

  console.log(`Atualizando lead ${leadId} para bot_ativado: ${novoStatusBot}`)

  try {
    const result = await apiFetch(UPDATE_BOT_STATUS_PATH, {
      method: 'POST',
      body: {
        lead_id: leadId,
        bot_ativado: novoStatusBot // [CORRIGIDO!]
      }
    })

    console.log('Resposta da atualização do bot:', result)

    // Recarrega o board para mostrar os dados 100% corretos do banco
    fetchLeads()
  } catch (error) {
    console.error('Erro ao atualizar status do bot:', error)
    alert('Erro ao atualizar o bot. O estado visual pode não ter sido salvo.')
    fetchLeads()
  }
}
