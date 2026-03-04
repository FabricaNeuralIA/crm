// --- assets/leads.js (CORRIGIDO) ---

// URLs dos seus webhooks
const GET_LEADS_PATH = "/api/leads";
const TOGGLE_BOT_PATH = "/api/leads/toggle-bot";
const UPDATE_LEAD_PATH = "/api/leads/update";
const DELETE_LEAD_PATH = "/api/leads/delete";

let allLeads = []; // Cache de todos os leads

// Seletores para os elementos
const searchInput = document.getElementById("search-leads");
const dateStartInput = document.getElementById("date-start");
const dateEndInput = document.getElementById("date-end");
const leadsTableBody = document.getElementById("leads-table-body");
const leadsCountDisplay = document.getElementById("leads-count-display");
const loadingRow = document.getElementById("loading-row");

// Seletores do Modal de Visualização
const viewLeadModal = document.getElementById("view-lead-modal");
const viewModalClose = document.getElementById("view-modal-close");
const viewModalCloseBtn = document.getElementById("view-modal-close-btn");
const viewModalEditBtn = document.getElementById("view-modal-edit-btn");
const viewToggleBotCheckbox = document.getElementById("view-toggle-bot");

// Seletores do Modal de Edição
const editModal = document.getElementById("edit-lead-modal");
const editForm = document.getElementById("edit-lead-form");
const editLeadId = document.getElementById("edit-lead-id");
const editNome = document.getElementById("edit-nome");
const editContato = document.getElementById("edit-contato");
const editCampanha = document.getElementById("edit-campanha");
const modalCancelButton = document.getElementById("modal-cancel-button");
const modalSaveButton = document.getElementById("modal-save-button");

// Seletores do Modal de Exclusão
const deleteModal = document.getElementById("delete-lead-modal");
const deleteLeadId = document.getElementById("delete-lead-id");
const deleteLeadName = document.getElementById("delete-lead-name");
const deleteCancelButton = document.getElementById("delete-cancel-button");
const deleteConfirmButton = document.getElementById("delete-confirm-button");

// Variável para rastrear qual lead está sendo visualizado
let currentViewingLeadId = null;


document.addEventListener("DOMContentLoaded", () => {
  fetchLeads();

  // Listeners para todos os filtros
  searchInput.addEventListener("input", applyFilters);
  dateStartInput.addEventListener("change", applyFilters);
  dateEndInput.addEventListener("change", applyFilters);

  // Listener para o botão de exportar
  const exportBtn = document.getElementById("export-leads-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportLeadsToCSV);
  }

  // Listeners do Modal de Visualização
  viewModalClose.addEventListener("click", () => {
    viewLeadModal.classList.add("hidden");
  });
  
  viewModalCloseBtn.addEventListener("click", () => {
    viewLeadModal.classList.add("hidden");
  });

  viewModalEditBtn.addEventListener("click", () => {
    viewLeadModal.classList.add("hidden");
    if (currentViewingLeadId) {
      openEditModal(currentViewingLeadId);
    }
  });

  // Listener para o toggle do Bot no modal de visualização
  viewToggleBotCheckbox.addEventListener("change", (e) => {
    if (currentViewingLeadId) {
      handleToggleBot(currentViewingLeadId, e.target.checked);
    }
  });

  // Listener para o botão de editar/excluir ações
  leadsTableBody.addEventListener("click", (e) => {
    const editButton = e.target.closest(".edit-btn");
    const deleteButton = e.target.closest(".delete-btn");

    if (editButton) {
      const leadId = editButton.dataset.id;
      openEditModal(leadId);
    } else if (deleteButton) {
      const leadId = deleteButton.dataset.id;
      openDeleteModal(leadId);
    }
  });

  // Listener para clicar na linha do lead para visualizar detalhes
  leadsTableBody.addEventListener("click", (e) => {
    // Se clicou em um botão de ação, não abre o modal de visualização
    if (e.target.closest(".edit-btn") || e.target.closest(".delete-btn")) {
      return;
    }
    
    const row = e.target.closest("tr");
    if (row) {
      const leadId = row.dataset.leadId;
      if (leadId) {
        openViewLeadModal(leadId);
      }
    }
  });

  // Listeners do Modal de Edição
  modalCancelButton.addEventListener("click", () => {
    editModal.classList.add("hidden");
  });

  const modalCloseX = document.getElementById("modal-close-x");
  if (modalCloseX) {
    modalCloseX.addEventListener("click", () => {
      editModal.classList.add("hidden");
    });
  }

  editForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveLeadChanges();
  });

  // Listeners do Modal de Exclusão
  deleteCancelButton.addEventListener("click", () => {
    deleteModal.classList.add("hidden");
  });

  deleteConfirmButton.addEventListener("click", () => {
    const leadId = deleteLeadId.value;
    if (leadId) {
      confirmDeleteLead(leadId);
    }
  });
});

/**
 * Busca e ordena os leads.
 */
async function fetchLeads() {
  loadingRow.style.display = "table-row";
  try {
    const leads = await apiFetch(GET_LEADS_PATH);

    // **** CORREÇÃO AQUI ****
    // Ordena os leads por 'created_at' (mais recentes primeiro)
    allLeads = leads.sort((a, b) => {
      // Coloque 'nulls' no final
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    applyFilters(); // Aplica filtros (vazios) e renderiza
    loadingRow.style.display = "none";
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    loadingRow.innerHTML = `<td colspan="6" class="px-6 py-4 text-center text-red-500">Erro ao carregar leads.</td>`;
    leadsCountDisplay.textContent = "Erro ao carregar.";
  }
}

/**
 * Aplica todos os filtros (busca, data-início, data-fim)
 */
function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const startDate = dateStartInput.value ? new Date(dateStartInput.value + "T00:00:00") : null;
  const endDate = dateEndInput.value ? new Date(dateEndInput.value + "T23:59:59") : null;

  const filteredLeads = allLeads.filter(lead => {
    // 1. Filtro de Palavra-chave
    const matchesQuery = (
      lead.nome?.toLowerCase().includes(query) ||
      lead.contato?.toLowerCase().includes(query) ||
      lead.campanha?.toLowerCase().includes(query)
    );

    // 2. Filtro de Data (**** CORREÇÃO AQUI ****)
    let matchesDate = true;
    if (lead.created_at) { // Usando created_at
      const leadDate = new Date(lead.created_at);
      if (startDate && leadDate < startDate) {
        matchesDate = false;
      }
      if (endDate && leadDate > endDate) {
        matchesDate = false;
      }
    } else if (startDate || endDate) {
        matchesDate = false;
    }

    return matchesQuery && matchesDate;
  });

  renderLeads(filteredLeads);
}

/**
 * Renderiza os leads filtrados na tabela.
 */
function renderLeads(leads) {
  leadsTableBody.innerHTML = ""; // Limpa a tabela

  // Atualiza o contador
  if (leads.length === 1) {
    leadsCountDisplay.textContent = "Exibindo 1 lead.";
  } else {
    leadsCountDisplay.textContent = `Exibindo ${leads.length} leads.`;
  }

  if (leads.length === 0) {
    leadsTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Nenhum lead encontrado.</td></tr>`;
    return;
  }

  leads.forEach((lead) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 cursor-pointer transition-colors";
    row.dataset.leadId = lead.id;

    // Formata a data de "Criado em" 
    const criadoEm = lead.created_at
      ? new Date(lead.created_at).toLocaleString("pt-BR")
      : "N/A";
    
    // Etiqueta (usa o campo etiqueta ou etiquetas)
    const etiqueta = lead.etiqueta || lead.etiquetas || 'Sem etiqueta';
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${lead.nome || 'Lead sem nome'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-600">${lead.contato || 'Sem contato'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-600">${etiqueta}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-600">${criadoEm}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        ${createToggleSwitch(lead.id, lead.bot_ativado)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button data-id="${lead.id}" class="edit-btn text-indigo-600 hover:text-indigo-900" title="Editar lead">
            <i class="bi bi-pencil-square" style="pointer-events: none;"></i>
        </button>
        <button data-id="${lead.id}" class="delete-btn text-red-600 hover:text-red-900" title="Excluir lead">
            <i class="bi bi-trash" style="pointer-events: none;"></i>
        </button>
      </td>
    `;
    
    // Adiciona o listener para o toggle
    const toggle = row.querySelector(`#toggle-${lead.id}`);
    toggle.addEventListener('change', (e) => {
        handleToggleBot(lead.id, e.target.checked);
    });

    leadsTableBody.appendChild(row);
  });
}

/**
 * Cria o HTML para o switch de toggle. (Sem alterações)
 */
function createToggleSwitch(id, isChecked) {
  const checkedAttr = isChecked ? 'checked' : '';
  return `
    <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
      <input type="checkbox" name="toggle-${id}" id="toggle-${id}" ${checkedAttr} class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
      <label for="toggle-${id}" class="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
    </div>
  `;
}

/**
 * Envia a mudança do status do bot para a API. (Sem alterações)
 */
async function handleToggleBot(leadId, newStatus) {
  console.log(`Alterando bot para ${newStatus} no lead ${leadId}`);
  try {
    await apiFetch(TOGGLE_BOT_PATH, {
      method: 'POST',
      body: JSON.stringify({
        leadId: leadId,
        botStatus: newStatus
      })
    });
    const leadInCache = allLeads.find(l => l.id === leadId);
    if (leadInCache) {
      leadInCache.bot_ativado = newStatus;
    }
  } catch (error) {
    console.error('Erro ao atualizar status do bot:', error);
    alert('Erro ao salvar alteração. A página será recarregada.');
    location.reload(); 
  }
}

// --- NOVAS FUNÇÕES ---

/**
 * Abre o modal de visualização com os detalhes do lead
 */
function openViewLeadModal(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  if (!lead) return;

  currentViewingLeadId = leadId;

  // Formata as datas
  const criadoEm = lead.created_at
    ? new Date(lead.created_at).toLocaleString("pt-BR")
    : "N/A";
  
  const ultimaInteracao = lead.ultimo_contato || lead.ultima_interacao
    ? new Date(lead.ultimo_contato || lead.ultima_interacao).toLocaleString("pt-BR")
    : "Sem interação";

  // Preenche os campos do modal
  document.getElementById("view-nome").textContent = lead.nome || "N/A";
  document.getElementById("view-contato").textContent = lead.contato || "N/A";
  document.getElementById("view-etiqueta").textContent = lead.etiqueta || "Sem etiqueta";
  document.getElementById("view-criadoem").textContent = criadoEm;
  document.getElementById("view-campanha").textContent = lead.campanha || "N/A";
  document.getElementById("view-encaminhamento").textContent = lead.encaminhado || "Não encaminhado";
  document.getElementById("view-resumo").textContent = lead.resumo || "Sem resumo";
  document.getElementById("view-ultimainteracao").textContent = ultimaInteracao;
  
  // Seta o estado do toggle do bot
  viewToggleBotCheckbox.checked = lead.bot_ativado ? true : false;

  // Abre o modal
  viewLeadModal.classList.remove("hidden");
}

/**
 * Abre o modal de edição com os dados do lead.
 */
function openEditModal(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  if (!lead) return;

  editLeadId.value = lead.id;
  editNome.value = lead.nome || '';
  editContato.value = lead.contato || '';
  editCampanha.value = lead.campanha || '';

  editModal.classList.remove("hidden");
}

/**
 * Salva as alterações do modal. (Sem alterações)
 */
async function saveLeadChanges() {
  modalSaveButton.disabled = true;
  modalSaveButton.textContent = "Salvando...";
  
  const leadId = editLeadId.value;
  const updatedData = {
    leadId: leadId,
    nome: editNome.value,
    contato: editContato.value,
    campanha: editCampanha.value
  };

  try {
    const result = await apiFetch(UPDATE_LEAD_PATH, {
      method: 'POST',
      body: JSON.stringify(updatedData)
    });

    // Atualiza o cache local (allLeads)
    const index = allLeads.findIndex(l => l.id == leadId);
    if (index !== -1) {
      allLeads[index] = { ...allLeads[index], ...updatedData };
    }
    
    applyFilters(); // Re-renderiza a tabela
    editModal.classList.add("hidden");

  } catch (error) {
    console.error('Erro ao salvar alterações:', error);
    alert('Não foi possível salvar as alterações.');
  } finally {
    modalSaveButton.disabled = false;
    modalSaveButton.textContent = "Salvar Alterações";
  }
}

/**
 * Abre o modal de confirmação de exclusão
 */
function openDeleteModal(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  if (!lead) return;

  // Preenche os dados no modal
  deleteLeadId.value = lead.id;
  deleteLeadName.textContent = lead.nome || lead.contato || 'Lead sem nome';

  // Mostra o modal
  deleteModal.classList.remove("hidden");
}

/**
 * Confirma e executa a exclusão do lead
 */
async function confirmDeleteLead(leadId) {
  // Desabilita o botão e mostra loading
  deleteConfirmButton.disabled = true;
  deleteConfirmButton.innerHTML = '<i class="bi bi-hourglass-split mr-2 animate-spin"></i>Excluindo...';

  try {
    await apiFetch(DELETE_LEAD_PATH, {
      method: 'POST',
      body: JSON.stringify({ leadId: leadId })
    });

    // Remove do cache local
    allLeads = allLeads.filter(l => l.id != leadId);
    applyFilters(); // Re-renderiza a tabela

    // Fecha o modal
    deleteModal.classList.add("hidden");

  } catch (error) {
    console.error('Erro ao excluir lead:', error);
    alert('Não foi possível excluir o lead.');
  } finally {
    // Restaura o botão
    deleteConfirmButton.disabled = false;
    deleteConfirmButton.innerHTML = '<i class="bi bi-trash mr-2"></i>Excluir';
  }
}

/**
 * Deleta um lead após confirmação. (Sem alterações)
 */
async function handleDeleteLead(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  const confirmation = confirm(`Tem certeza que deseja excluir o lead "${lead.nome || lead.contato}"?\n\nEsta ação não pode ser desfeita.`);

  if (!confirmation) {
    return;
  }

  try {
    await apiFetch(DELETE_LEAD_PATH, {
      method: 'POST',
      body: JSON.stringify({ leadId: leadId })
    });

    // Remove do cache local
    allLeads = allLeads.filter(l => l.id != leadId);
    applyFilters(); // Re-renderiza a tabela

  } catch (error) {
    console.error('Erro ao excluir lead:', error);
    alert('Não foi possível excluir o lead.');
  }
}

/**
 * Exporta os leads filtrados para um arquivo Excel (.xlsx)
 */
function exportLeadsToCSV() {
  // Obtém os leads filtrados atualmente visíveis
  const query = searchInput.value.toLowerCase();
  const startDate = dateStartInput.value ? new Date(dateStartInput.value + "T00:00:00") : null;
  const endDate = dateEndInput.value ? new Date(dateEndInput.value + "T23:59:59") : null;

  const filteredLeads = allLeads.filter(lead => {
    const matchesQuery = (
      lead.nome?.toLowerCase().includes(query) ||
      lead.contato?.toLowerCase().includes(query) ||
      lead.campanha?.toLowerCase().includes(query)
    );

    let matchesDate = true;
    if (lead.created_at) {
      const leadDate = new Date(lead.created_at);
      if (startDate && leadDate < startDate) {
        matchesDate = false;
      }
      if (endDate && leadDate > endDate) {
        matchesDate = false;
      }
    } else if (startDate || endDate) {
        matchesDate = false;
    }

    return matchesQuery && matchesDate;
  });

  if (filteredLeads.length === 0) {
    alert('Nenhum lead para exportar!');
    return;
  }

  // Prepara os dados para o Excel
  const excelData = filteredLeads.map(lead => ({
    'ID': lead.id || '',
    'Nome': lead.nome || 'Lead sem nome',
    'Contato': lead.contato || 'Sem contato',
    'Campanha': lead.campanha || 'Sem campanha',
    'Encaminhamento': lead.encaminhado || "",
    'Resumo': lead.resumo || "",
    'Data de Criação': lead.created_at ? new Date(lead.created_at).toLocaleString('pt-BR') : 'N/A',
    'Último Contato': lead.ultimo_contato ? new Date(lead.ultimo_contato).toLocaleString('pt-BR') : 'N/A',
    'Bot Ativado': lead.bot_ativado ? 'Sim' : 'Não'
  }));

  // Cria a planilha Excel
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Define largura automática das colunas
  const colWidths = [
    { wch: 8 },  // ID
    { wch: 25 }, // Nome
    { wch: 20 }, // Contato
    { wch: 25 }, // Campanha
    { wch: 12 }, // Encaminhados
    { wch: 30 }, // resumo
    { wch: 20 }, // Data de Criação
    { wch: 20 }, // Último Contato
    { wch: 12 }  // Bot Ativado
  ];
  worksheet['!cols'] = colWidths;

  // Cria o workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Define o nome do arquivo com data/hora atual
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_');
  const filename = `leads_export_${timestamp}.xlsx`;

  // Faz o download do arquivo
  XLSX.writeFile(workbook, filename);

  console.log(`✅ ${filteredLeads.length} leads exportados com sucesso para Excel!`);
}