// --- CONFIGURAÇÃO CAMPANHAS ---
const GET_ACTIVE_LEADS_PATH = "/active-leads"; 
const SCHEDULE_CAMPAIGN_PATH = "/schedule-campaign"; 
const GET_CAMPAIGNS_PATH = "/get-campaigns"; // Endpoint para buscar campanhas
const DELETE_CAMPAIGN_PATH = "/delete-campaign"; // Base path para deletar

// --- ELEMENTOS DA PÁGINA ---
const leadsListUl = document.getElementById('leads-list');
const selectAllCheckbox = document.getElementById('select-all-leads');
const selectedCountSpan = document.getElementById('selected-count');
const scheduleForm = document.getElementById('schedule-campaign-form');
const campaignMessageTextarea = document.getElementById('campaign-message');
const scheduleDateTimeField = document.getElementById('schedule-datetime');
const scheduleStatusP = document.getElementById('schedule-status');
const submitButton = scheduleForm.querySelector('button[type="submit"]');
const campaignsTableBody = document.getElementById('campaigns-table-body'); // Tabela de campanhas

let allLeads = []; // Guarda todos os leads carregados para filtrar

// --- LÓGICA PRINCIPAL ---

document.addEventListener("DOMContentLoaded", () => {
    // Só executa se estivermos na página correta
    if (scheduleForm && campaignsTableBody) {
        loadLeadsAndPopulateList(); // Carrega leads para seleção
        loadCampaigns(); // Carrega campanhas existentes para a tabela

        // Listeners para interatividade
        if (selectAllCheckbox) { selectAllCheckbox.addEventListener('change', handleSelectAllToggle); }
        scheduleForm.addEventListener('submit', handleScheduleCampaign);
        leadsListUl.addEventListener('change', handleIndividualCheckboxChange);
        campaignsTableBody.addEventListener('click', handleDeleteCampaignClick); // Listener para delete
    }
});

// --- FUNÇÕES DE CARREGAMENTO DE DADOS ---

// 1. Busca leads e popula a lista inicial de seleção
async function loadLeadsAndPopulateList() {
    console.log("Carregando leads para campanha...");
    if (!leadsListUl) return;
    leadsListUl.innerHTML = '<li class="p-4 text-sm text-gray-500 text-center">Carregando leads...</li>'; 
    try {
        const leads = await apiFetch(GET_ACTIVE_LEADS_PATH);
        console.log("Leads recebidos:", leads);
        allLeads = leads || []; 
        filterAndDisplayLeads(); 
    } catch (error) {
        console.error("Erro ao carregar leads:", error);
        leadsListUl.innerHTML = '<li class="p-4 text-sm text-red-500 text-center">Erro ao carregar leads.</li>';
        showStatus('Erro ao carregar a lista de leads.', true, scheduleStatusP); // Mostra erro no formulário
    }
}

// 2. Filtra (se necessário) e exibe os leads na lista com checkboxes
function filterAndDisplayLeads() {
    if (!leadsListUl) return;
    leadsListUl.innerHTML = ''; // Limpa a lista
    if (selectAllCheckbox) selectAllCheckbox.checked = false; 

    // [LÓGICA DE FILTRO - PENDENTE] - Implementar filtro real se necessário
    const leadsToDisplay = allLeads; 

    if (leadsToDisplay.length > 0) {
        leadsToDisplay.forEach(lead => {
            const li = document.createElement('li');
            li.className = 'px-4 py-3 flex items-center';
            li.innerHTML = `
                <input id="lead-${lead.id}" name="selected_leads" type="checkbox" value="${lead.id}" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3 lead-checkbox">
                <label for="lead-${lead.id}" class="flex-1 text-sm cursor-pointer">
                    <span class="font-medium text-gray-900">${lead.nome || 'Lead sem nome'}</span>
                    <span class="text-gray-500 ml-2">(${lead.contato || 'Sem contato'})</span>
                </label>
            `;
            leadsListUl.appendChild(li);
        });
    } else {
        leadsListUl.innerHTML = '<li class="p-4 text-sm text-gray-500 text-center">Nenhum lead encontrado.</li>';
    }
    updateSelectedCount(); 
}

// 3. Busca campanhas existentes e popula a tabela
async function loadCampaigns() {
    console.log("Carregando campanhas agendadas...");
    if (!campaignsTableBody) return;
    campaignsTableBody.innerHTML = '<tr><td colspan="4" class="whitespace-nowrap py-4 px-3 text-sm text-gray-500 text-center">Carregando campanhas...</td></tr>';

    try {
        const campaigns = await apiFetch(GET_CAMPAIGNS_PATH);
        console.log("Campanhas recebidas:", campaigns);
        campaignsTableBody.innerHTML = ''; // Limpa a tabela

        if (campaigns && campaigns.length > 0) {
            campaigns.forEach(campaign => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-campaign-row-id', campaign.id); // Adiciona ID na linha

                // Formata data e hora
                let formattedDate = 'Data inválida';
                try {
                    const scheduleDate = new Date(campaign.data_agendamento);
                     if (!isNaN(scheduleDate)) {
                        formattedDate = scheduleDate.toLocaleString('pt-BR', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                        });
                     }
                } catch(e) { console.error("Erro formatando data:", e); }

                // Cria badge de status
                let statusBadgeClass = 'status-badge-pendente'; // Default
                const statusLower = campaign.status?.toLowerCase(); // Para comparação segura
                if (statusLower === 'enviando') statusBadgeClass = 'status-badge-enviando';
                else if (statusLower === 'concluído') statusBadgeClass = 'status-badge-concluido';
                else if (statusLower === 'erro') statusBadgeClass = 'status-badge-erro';

                tr.innerHTML = `
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">${campaign.mensagem_inicio || ''}...</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${formattedDate}</td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span class="status-badge ${statusBadgeClass}">${campaign.status || 'Desconhecido'}</span>
                    </td>
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        ${campaign.status === 'Pendente' ? 
                          `<button data-campaign-id="${campaign.id}" class="text-red-600 hover:text-red-900 delete-campaign-btn font-semibold">Excluir</button>` 
                          : '<span class="text-gray-400 text-xs">Não Editável</span>'} 
                    </td>
                `;
                campaignsTableBody.appendChild(tr);
            });
        } else {
            campaignsTableBody.innerHTML = '<tr><td colspan="4" class="whitespace-nowrap py-4 px-3 text-sm text-gray-500 text-center">Nenhuma campanha agendada encontrada.</td></tr>';
        }

    } catch (error) {
        console.error("Erro ao carregar campanhas:", error);
        campaignsTableBody.innerHTML = '<tr><td colspan="4" class="whitespace-nowrap py-4 px-3 text-sm text-red-500 text-center">Erro ao carregar campanhas.</td></tr>';
    }
}


// --- FUNÇÕES DE INTERATIVIDADE (Lista de Leads) ---

// 4. Lida com o clique no "Selecionar Todos"
function handleSelectAllToggle() {
    const isChecked = selectAllCheckbox.checked;
    const leadCheckboxes = leadsListUl.querySelectorAll('.lead-checkbox');
    leadCheckboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
    updateSelectedCount();
}

// 5. Lida com o clique em um checkbox individual
function handleIndividualCheckboxChange(event) {
    if (event.target.classList.contains('lead-checkbox')) {
        updateSelectedCount();
        if (!event.target.checked) {
            selectAllCheckbox.checked = false;
        } else {
            const allCheckboxes = leadsListUl.querySelectorAll('.lead-checkbox');
            const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
            selectAllCheckbox.checked = allChecked;
        }
    }
}

// 6. Atualiza o contador "X selecionados"
function updateSelectedCount() {
    if(!selectedCountSpan || !leadsListUl) return;
    const selectedCheckboxes = leadsListUl.querySelectorAll('.lead-checkbox:checked');
    const count = selectedCheckboxes.length;
    selectedCountSpan.textContent = `${count} selecionados`;
}

// 7. Helper para desmarcar todos os leads
function deselectAllLeads() {
    if(!leadsListUl || !selectAllCheckbox) return;
    const leadCheckboxes = leadsListUl.querySelectorAll('.lead-checkbox');
    leadCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    selectAllCheckbox.checked = false;
    updateSelectedCount();
}


// --- FUNÇÕES DE AGENDAMENTO E EXCLUSÃO ---

// 8. Lida com o envio do formulário "Agendar Campanha"
async function handleScheduleCampaign(event) {
    event.preventDefault();
    if (!campaignMessageTextarea || !scheduleDateTimeField || !submitButton || !scheduleStatusP || !leadsListUl) return;

    const selectedCheckboxes = leadsListUl.querySelectorAll('.lead-checkbox:checked');
    const selectedLeadIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    const message = campaignMessageTextarea.value;
    const scheduleTime = scheduleDateTimeField.value;

    // Validações
    if (selectedLeadIds.length === 0) {
        showStatus('Por favor, selecione pelo menos um lead.', true, scheduleStatusP);
        return;
    }
    if (!message.trim()) {
        showStatus('Por favor, escreva a mensagem da campanha.', true, scheduleStatusP);
        return;
    }
    if (!scheduleTime) {
        showStatus('Por favor, selecione a data e hora do envio.', true, scheduleStatusP);
        return;
    }

    // Desabilita botão e mostra status
    submitButton.disabled = true;
    submitButton.textContent = 'Agendando...';
    showStatus('Agendando campanha...', false, scheduleStatusP);

    try {
        const result = await apiFetch(SCHEDULE_CAMPAIGN_PATH, {
            method: 'POST',
            body: {
                lead_ids: selectedLeadIds,
                message_text: message,
                schedule_time: scheduleTime 
            }
        });

        console.log("Resposta do agendamento:", result);
        showStatus(result.message || 'Campanha agendada com sucesso!', false, scheduleStatusP);
        
        // Limpa formulário após sucesso
        deselectAllLeads();
        campaignMessageTextarea.value = '';
        const fpInstance = scheduleDateTimeField._flatpickr; 
        if (fpInstance) { fpInstance.clear(); }

        loadCampaigns(); // Recarrega a lista de campanhas

    } catch (error) {
        console.error("Erro ao agendar campanha:", error);
        showStatus(error.message || 'Falha ao agendar campanha.', true, scheduleStatusP);
    } finally {
        // Reabilita o botão
        submitButton.disabled = false;
        submitButton.textContent = 'Agendar Campanha';
    }
}

// 9. Lida com o clique no botão Excluir na tabela
async function handleDeleteCampaignClick(event) {
    if (event.target.classList.contains('delete-campaign-btn')) {
        const button = event.target;
        const campaignId = button.dataset.campaignId;
        
        if (!campaignId) return;

        // Confirmação (Simples) - Evite usar confirm em produção real
        if (!confirm(`Tem certeza que deseja excluir a campanha agendada #${campaignId}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        console.log(`Excluindo campanha ${campaignId}...`);
        button.disabled = true; 
        button.textContent = 'Excluindo...';
        // Encontra a linha da tabela para feedback visual (opcional)
        const row = button.closest('tr'); 
        if(row) row.style.opacity = '0.5'; 


// ...
        try {
                // CORREÇÃO: Passa o ID como Query Parameter (?id=123)
                const result = await apiFetch(`${DELETE_CAMPAIGN_PATH}?id=${campaignId}`, { // <-- AGORA ESTÁ CERTO
                    method: 'DELETE'
                });
    
                console.log("Resposta da exclusão:", result);
    // ...
            console.log("Resposta da exclusão:", result);
             // Mostra status no topo da página (melhor que no form)
            showGlobalStatus(result.message || `Campanha #${campaignId} excluída com sucesso!`, false);
            loadCampaigns(); // Recarrega a lista para remover a linha

        } catch (error) {
            console.error(`Erro ao excluir campanha ${campaignId}:`, error);
            showGlobalStatus(error.message || `Falha ao excluir campanha #${campaignId}.`, true);
            // Reverte feedback visual se der erro
            if(row) row.style.opacity = '1'; 
            button.disabled = false;
            button.textContent = 'Excluir';
        }
    }
}


// --- FUNÇÕES HELPER ---

// Helper para mostrar mensagens de status (na área do formulário de agendamento)
function showStatus(message, isError = false, element = scheduleStatusP) {
     if (!element) return;
     element.textContent = message;
     if (isError) {
         element.className = 'mt-4 text-center text-sm text-red-600 font-medium';
     } else {
         element.className = 'mt-4 text-center text-sm text-green-700 font-medium';
     }
     // Limpa a mensagem após alguns segundos (opcional)
     /*
     setTimeout(() => {
         if (element.textContent === message) { // Só limpa se a mensagem ainda for a mesma
            element.textContent = '';
         }
     }, 5000); // 5 segundos
     */
}

// [NOVO!] Helper para mostrar mensagens globais (ex: após deletar)
// (Precisa de um elemento no HTML para isso, ex: <div id="global-status"></div> no topo do <main>)
function showGlobalStatus(message, isError = false) {
    // Tenta encontrar um elemento para status global, senão usa o do formulário
    let statusElement = document.getElementById('global-status');
    if (!statusElement) {
        statusElement = scheduleStatusP; // Fallback
        console.warn("Elemento #global-status não encontrado, usando #schedule-status como fallback.");
    }
    showStatus(message, isError, statusElement);
}

