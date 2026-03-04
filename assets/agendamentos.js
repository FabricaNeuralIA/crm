// --- assets/agendamentos.js ---

// ============================================
// INICIALIZAÇÃO E CONSTANTES
// ============================================

const STORAGE_AGENDAMENTOS_KEY = 'fn_crm_agendamentos';

let agendas = [];
let agendasFiltradas = [];
let agendamentos = [];
let currentEditingAgendaId = null;
let currentEditingAgendamentoId = null;
let agendamentoParaCancelar = null;

// ============================================
// CARREGAR DADOS DO BACKEND
// ============================================

async function carregarAgendasDoBackend() {
  try {
    const dados = await apiFetch('/listar-agendas', {
      method: 'POST'
    });
    
    console.log('Dados brutos do backend:', dados);
    
    // Processa diferentes formatos de resposta
    let agendasArray = [];
    
    if (Array.isArray(dados)) {
      // Se é array, processar cada item
      agendasArray = dados.map(item => {
        // Se o item tem a estrutura n8n {json: {...}, pairedItem: {...}}
        if (item && typeof item === 'object' && item.json) {
          console.log('Extraindo json da resposta n8n:', item.json);
          return item.json;
        }
        // Senão, usa o item como está
        return item;
      });
    } else if (dados && Array.isArray(dados.agendas)) {
      agendasArray = dados.agendas;
    } else if (dados && dados.json && Array.isArray(dados.json)) {
      agendasArray = dados.json;
    } else {
      agendasArray = [];
    }
    
    // Filtra itens inválidos
    agendas = agendasArray.map(agenda => agenda.json);
    
    console.log('Agendas processadas:', agendas);
    
    // Log adicional para debug da estrutura
    if (agendas.length > 0) {
      console.log('Primeira agenda:', agendas[0]);
      console.log('Estrutura da primeira agenda:', {
        nome: agendas[0].nome,
        dias_atendimento: agendas[0].dias_atendimento,
        horarios_personalizados: agendas[0].horarios_personalizados,
        horarios: agendas[0].horarios
      });
    }
    
    return agendas;
  } catch (erro) {
    console.error('Erro ao carregar agendas:', erro);
    agendas = [];
    alert('Erro ao carregar agendas do servidor: ' + erro.message);
    return [];
  }
}

async function carregarAgendas() {
  await carregarAgendasDoBackend();
  agendasFiltradas = []; // Resetar filtro
  atualizarSelectsAgendas();
}

// ============================================
// FUNÇÕES DE BACKEND
// ============================================

async function enviarAgendaParaBackend(dados) {
  try {
    const resultado = await apiFetch('/criar-agenda', {
      method: 'POST',
      body: dados
    });
    console.log('Agenda enviada para backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição ao backend:', erro);
    alert('Erro ao enviar agenda para o servidor: ' + erro.message);
    return null;
  }
}

async function enviarAtualizacaoAgendaParaBackend(agendaId, dados) {
  try {
    const resultado = await apiFetch('/atualizar-agenda', {
      method: 'POST',
      body: {
        ...dados,
        id: agendaId
      }
    });
    console.log('Agenda atualizada no backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição de atualização ao backend:', erro);
    alert('Erro ao atualizar agenda no servidor: ' + erro.message);
    return null;
  }
}

async function enviarDeletacaoAgendaParaBackend(agendaId) {
  try {
    const resultado = await apiFetch('/deletar-agenda', {
      method: 'POST',
      body: {
        id: agendaId
      }
    });
    console.log('Agenda deletada no backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição de deleção ao backend:', erro);
    alert('Erro ao deletar agenda no servidor: ' + erro.message);
    return null;
  }
}

// ============================================
// FUNÇÕES DE AGENDAMENTOS (BACKEND)
// ============================================

async function carregarAgendamentosDoBackend() {
  try {
    const dados = await apiFetch('/listar-agendamentos', {
      method: 'POST'
    });
    
    console.log('Dados brutos de agendamentos:', dados);
    
    // Processa diferentes formatos de resposta
    let agendamentosArray = [];
    
    if (Array.isArray(dados)) {
      agendamentosArray = dados.map(item => {
        if (item && typeof item === 'object' && item.json) {
          console.log('Extraindo json da resposta n8n:', item.json);
          return item.json;
        }
        return item;
      });
    } else if (dados && Array.isArray(dados.agendamentos)) {
      agendamentosArray = dados.agendamentos;
    } else if (dados && dados.json && Array.isArray(dados.json)) {
      agendamentosArray = dados.json;
    } else {
      agendamentosArray = [];
    }
    
    // Filtra itens válidos
    agendamentos = agendamentosArray.filter(agendamento => agendamento && agendamento.id);
    
    console.log('Agendamentos processados:', agendamentos);
    console.log('Total de agendamentos carregados:', agendamentos.length);
    
    if (agendamentos.length > 0) {
      console.log('Primeiro agendamento:', agendamentos[0]);
      console.log('IDs dos agendamentos:', agendamentos.map(a => ({ id: a.id, tipo: typeof a.id, nome: a.nome_paciente })));
    }
    
    return agendamentos;
  } catch (erro) {
    console.error('Erro ao carregar agendamentos:', erro);
    agendamentos = [];
    console.error('Erro ao carregar agendamentos do servidor: ' + erro.message);
    return [];
  }
}

async function enviarAgendamentoParaBackend(dados) {
  try {
    const resultado = await apiFetch('/criar-agendamento', {
      method: 'POST',
      body: dados
    });
    console.log('Agendamento enviado para backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição ao backend:', erro);
    console.error('Erro ao enviar agendamento para o servidor: ' + erro.message);
    return null;
  }
}

async function enviarAtualizacaoAgendamentoParaBackend(agendamentoId, dados) {
  try {
    const resultado = await apiFetch('/atualizar-agendamento', {
      method: 'POST',
      body: {
        ...dados,
        id: agendamentoId
      }
    });
    console.log('Agendamento atualizado no backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição de atualização ao backend:', erro);
    console.error('Erro ao atualizar agendamento no servidor: ' + erro.message);
    return null;
  }
}

async function atualizarStatusAgendamento(agendamentoId, novoStatus) {
  try {
    const agendamento = obterAgendamentoPorId(agendamentoId);
    if (!agendamento) {
      console.error('Agendamento não encontrado');
      return false;
    }

    const dados = {
      agenda_id: agendamento.agenda_id,
      data_agendamento: agendamento.data_agendamento,
      hora_agendamento: agendamento.hora_agendamento,
      especialidade: agendamento.especialidade || '',
      medico: agendamento.medico || '',
      status: novoStatus
    };

    const resultado = await enviarAtualizacaoAgendamentoParaBackend(agendamentoId, dados);
    
    if (resultado && resultado.success !== false) {
      exibirSucesso('Status atualizado com sucesso!');
      // Recarregar agendamentos do backend para sincronizar
      await carregarAgendamentosDoBackend();
      renderizarAgendamentos();
      return true;
    } else {
      exibirErroBackend(resultado?.message || 'Erro ao atualizar status');
      return false;
    }
  } catch (erro) {
    console.error('Erro ao atualizar status:', erro);
    alert('Erro ao atualizar status: ' + erro.message);
    return false;
  }
}

async function enviarDeletacaoAgendamentoParaBackend(agendamentoId) {
  try {
    const resultado = await apiFetch('/deletar-agendamento', {
      method: 'POST',
      body: {
        id: agendamentoId
      }
    });
    console.log('Agendamento deletado no backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição de deleção ao backend:', erro);
    console.error('Erro ao deletar agendamento no servidor: ' + erro.message);
    return null;
  }
}

async function cancelarAgendamentoNoBackend(agendamentoId) {
  try {
    const resultado = await apiFetch('/cancelar-agendamento', {
      method: 'POST',
      body: {
        id: agendamentoId
      }
    });
    console.log('Agendamento cancelado no backend com sucesso:', resultado);
    return resultado;
  } catch (erro) {
    console.error('Erro na requisição de cancelamento ao backend:', erro);
    console.error('Erro ao cancelar agendamento no servidor: ' + erro.message);
    return null;
  }
}

// ============================================
// FUNÇÕES DE AGENDAS
// ============================================

function obterAgendaPorId(id) {
  return agendas.find(a => String(a.id) === String(id));
}

// ============================================
// FUNÇÕES DE AGENDAMENTOS
// ============================================

function obterAgendamentoPorId(id) {
  console.log('Procurando agendamento com ID:', id, 'tipo:', typeof id);
  console.log('Agendamentos disponíveis:', agendamentos.length);
  
  const resultado = agendamentos.find(a => {
    const match = String(a.id) === String(id) || Number(a.id) === Number(id);
    if (match) {
      console.log('Agendamento encontrado:', a);
    }
    return match;
  });
  
  if (!resultado) {
    console.warn('Agendamento NÃO encontrado. IDs disponíveis:', agendamentos.map(a => a.id));
  }
  
  return resultado;
}

function obterAgendamentosPorAgenda(agenda_id) {
  return agendamentos.filter(a => a.agenda_id === agenda_id && a.status !== 'cancelado');
}

// ============================================
// EXIBIR MODAL DE DIAS DE ATENDIMENTO
// ============================================

function exibirModalDiasAtendimento(dias_atendimento) {
  const diasDisponiveis = dias_atendimento.join(', ');
  document.getElementById('modal-dias-lista').textContent = diasDisponiveis;
  abrirModal('modal-dias-atendimento');
}

// ============================================
// FUNÇÃO AUXILIAR PARA OBTER DIA DA SEMANA
// ============================================

function obterDiaDaSemanaDeData(dataStr) {
  // dataStr está no formato "YYYY-MM-DD" (vindo do input de data)
  // Fazer parsing manual para evitar problemas de timezone
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  // Criar data no fuso horário local (não UTC)
  const dataObj = new Date(ano, mes - 1, dia);
  const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return dias[dataObj.getDay()];
}

// ============================================
// VALIDAR DIA DE ATENDIMENTO
// ============================================

function validarDiaAtendimento(data, agendaId) {
  const agenda = obterAgendaPorId(agendaId);
  if (!agenda) return false;
  
  const diaDaSemana = obterDiaDaSemanaDeData(data);
  
  return agenda.dias_atendimento.includes(diaDaSemana);
}

// ============================================
// VALIDAÇÕES
// ============================================

function validarCPF(cpf) {
  const cpfLimpo = cpf.replace(/\D/g, '');
  return cpfLimpo.length === 11;
}

function formatarCPF(cpf) {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function validarData(data) {
  const dataObj = new Date(data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return dataObj >= hoje;
}

// ============================================
// RESPONSIVIDADE - SIDEBAR MOBILE
// ============================================

function setupResponsividade() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.querySelector('.sidebar');
  
  hamburgerBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar') && !e.target.closest('.hamburger')) {
      sidebar?.classList.remove('open');
    }
  });
}

// ============================================
// GERENCIAR ABAS
// ============================================

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Remover classe active de todos os botões e conteúdos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.add('hidden'));
      
      // Adicionar classe active ao botão e mostrar conteúdo
      button.classList.add('active');
      document.getElementById(`tab-${tabName}`)?.classList.remove('hidden');
      
      // Se for a aba de visualizar, recarregar agendamentos
      if (tabName === 'visualizar') {
        renderizarAgendamentos();
        carregarFilteroAgendas();
      }
      
      // Se for a aba de criar agendamento, recarregar selects
      if (tabName === 'criar-agendamento') {
        carregarAgendas();
      }
    });
  });
}

// ============================================
// RENDERIZAR AGENDAS
// ============================================

function obterTipoAtendimento(agenda) {
  if (!agenda.horarios) return '';
  
  let tipo = '';
  if (agenda.horarios_personalizados) {
    // Verificar tipos nos dias personalizados
    const tipos = Object.keys(agenda.horarios)
      .filter(dia => dia !== 'padrao' && agenda.horarios[dia])
      .map(dia => agenda.horarios[dia].tipoAtendimento || '');
    tipo = tipos.length > 0 ? tipos[0] : '';
  } else if (agenda.horarios.padrao) {
    tipo = agenda.horarios.padrao.tipoAtendimento || '';
  }
  
  return tipo === 'marcado' ? 'hora marcada' : tipo === 'ordem' ? 'ordem de chegada' : '';
}

function filtrarAgendas(termo) {
  if (!termo.trim()) {
    agendasFiltradas = [];
  } else {
    const termoLower = termo.toLowerCase();
    agendasFiltradas = agendas.filter(agenda => {
      const nome = (agenda.nome || '').toLowerCase();
      const especialidade = (agenda.especialidade || '').toLowerCase();
      const tipo = obterTipoAtendimento(agenda).toLowerCase();
      return nome.includes(termoLower) || especialidade.includes(termoLower) || tipo.includes(termoLower);
    });
  }
  renderizarAgendas();
}

function renderizarAgendas() {
  const grid = document.getElementById('agendas-grid');
  const empty = document.getElementById('agendas-empty');
  
  // Se não houver filtro, usar todas as agendas
  const agendasParaRenderizar = agendasFiltradas.length > 0 ? agendasFiltradas : agendas;
  
  console.log('Renderizando agendas. Total:', agendasParaRenderizar.length);
  
  if (!agendasParaRenderizar.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  
  empty.classList.add('hidden');
  grid.innerHTML = agendasParaRenderizar.map(agenda => {
    let horarioInfo = '';
    
    // Validação defensiva da estrutura de horários
    const temHorarios = agenda.horarios && typeof agenda.horarios === 'object';
    const horarios_personalizados = agenda.horarios_personalizados === true;
    
    if (horarios_personalizados) {
      horarioInfo = '<p class="text-sm"><strong>Horários:</strong> Personalizados por dia</p>';
    } else if (temHorarios && agenda.horarios.padrao) {
      const config = agenda.horarios.padrao;
      const tipoAtendimento = config.tipoAtendimento === 'marcado' ? 'Hora Marcada' : 'Ordem de Chegada';
      horarioInfo = `
        <p class="text-sm"><strong>Tipo:</strong> ${tipoAtendimento}</p>
        ${config.tipoAtendimento === 'marcado' ? `<p class="text-sm"><strong>Intervalo:</strong> ${config.intervalo}min</p>` : ''}
        <p class="text-sm"><strong>Horários:</strong> ${config.horarioInicio} às ${config.horarioFim}</p>
      `;
    } else {
      horarioInfo = '<p class="text-sm text-gray-400"><em>Horários não configurados</em></p>';
    }
    
    return `
    <div class="card p-6">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold ">${agenda.nome}</h3>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary btn-small edit-agenda-btn" data-id="${agenda.id}">Editar</button>
          <button class="btn-danger btn-small delete-agenda-btn" data-id="${agenda.id}">Deletar</button>
        </div>
      </div>
      
      ${agenda.descricao ? `<p class="text-gray-600 text-sm mb-3">${agenda.descricao}</p>` : ''}
      
      <div class="space-y-2">
        ${agenda.nome_medico ? `<p class="text-sm"><strong>Médico:</strong> ${agenda.nome_medico}</p>` : ''}
        ${agenda.especialidade ? `<p class="text-sm"><strong>Especialidade:</strong> ${agenda.especialidade}</p>` : ''}
        <p class="text-sm"><strong>Dias:</strong> ${Array.isArray(agenda.dias_atendimento) ? agenda.dias_atendimento.join(', ') : 'Não configurado'}</p>
        ${horarioInfo}
        <p class="text-xs text-gray-400 mt-3">
          Agendamentos: ${obterAgendamentosPorAgenda(agenda.id).length}
        </p>
      </div>
    </div>
    `;
  }).join('');
  
  // Adicionar event listeners
  document.querySelectorAll('.edit-agenda-btn').forEach(btn => {
    btn.addEventListener('click', () => abrirEditarAgenda(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-agenda-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Tem certeza que deseja deletar essa agenda? Todos os agendamentos serão cancelados.')) {
        // Enviar para backend
        await enviarDeletacaoAgendaParaBackend(btn.dataset.id);
        
        // Recarregar agendas do backend
        await carregarAgendas();
        renderizarAgendas();
        renderizarAgendamentos();
      }
    });
  });
}

// ============================================
// RENDERIZAR AGENDAMENTOS
// ============================================

function renderizarAgendamentos() {
  console.log('renderizarAgendamentos - Total de agendamentos:', agendamentos.length);
  
  const tbody = document.getElementById('agendamentos-tbody');
  let agendamentosParaMostrar = agendamentos;
  
  // Aplicar filtro de agenda se houver
  const filtroSelect = document.getElementById('filtro-agenda');
  if (filtroSelect && filtroSelect.value) {
    const agendaIdFiltro = parseInt(filtroSelect.value, 10);
    agendamentosParaMostrar = agendamentosParaMostrar.filter(a => parseInt(a.agenda_id, 10) === agendaIdFiltro);
  }
  
  // Aplicar filtro de status se houver
  const filtroStatus = document.getElementById('filtro-status');
  if (filtroStatus && filtroStatus.value) {
    agendamentosParaMostrar = agendamentosParaMostrar.filter(a => a.status === filtroStatus.value);
  }
  
  console.log('Agendamentos para mostrar (após filtros):', agendamentosParaMostrar.length);
  
  if (!agendamentosParaMostrar.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
          Nenhum agendamento encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  function getStatusBadge(status) {
    const statusMap = {
      'agendado': { class: 'badge-success', label: 'Agendado' },
      'remarcado': { class: 'badge-warning', label: 'Remarcado' },
      'cancelado': { class: 'badge-danger', label: 'Cancelado' },
      'compareceu': { class: 'badge-success', label: 'Compareceu' },
      'falta': { class: 'badge-danger', label: 'Falta' }
    };
    const info = statusMap[status] || statusMap['agendado'];
    return `<span class="badge ${info.class}" style="cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px;" title="Clique para alterar status">${info.label} <span style="font-size: 0.75em;">▼</span></span>`;
  }
  
  tbody.innerHTML = agendamentosParaMostrar.map(agendamento => {
    const agenda = obterAgendaPorId(agendamento.agenda_id);
    
    // Extrair apenas a data (YYYY-MM-DD) e formatar
    const dataStr = agendamento.data_agendamento.split('T')[0];
    const dataObj = new Date(dataStr + 'T00:00:00');
    const dataFormatada = dataObj.toLocaleDateString('pt-BR');
    
    // Extrair apenas HH:mm do horário
    const horaFormatada = agendamento.hora_agendamento.substring(0, 5);
    
    // Formatar data de criação
    const dataCriacaoObj = new Date(agendamento.criado_em);
    const dia = String(dataCriacaoObj.getDate()).padStart(2, '0');
    const mes = String(dataCriacaoObj.getMonth() + 1).padStart(2, '0');
    const ano = dataCriacaoObj.getFullYear();
    const horas = String(dataCriacaoObj.getHours()).padStart(2, '0');
    const minutos = String(dataCriacaoObj.getMinutes()).padStart(2, '0');
    const dataCriacaoFormatada = `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    
    return `
      <tr class="table-row">
        <td class="px-6 py-4">
          <div>
            <p class="font-semibold text-gray-700">${agendamento.nome_paciente}</p>
            <p class="text-sm text-gray-500">${agendamento.cpf || 'N/A'}</p>
          </div>
        </td>
        <td class="px-6 py-4 text-sm">${agenda?.nome || 'N/A'}</td>
        <td class="px-6 py-4 text-sm">
          <span class="badge badge-success">${dataFormatada} ${horaFormatada}</span>
        </td>
        <td class="px-6 py-4 text-sm">${agendamento.medico || '-'}</td>
        <td class="px-6 py-4">
          <div class="relative inline-block" data-agendamento-id="${agendamento.id}" data-status-selector>
            ${getStatusBadge(agendamento.status)}
            <div class="status-dropdown absolute left-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-max" style="display: none; min-width: 150px;">
              <button class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-600 status-option" data-status="agendado">Agendado</button>
              <button class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-yellow-600 status-option" data-status="remarcado">Remarcado</button>
              <button class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-600 status-option" data-status="compareceu">Compareceu</button>
              <button class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-600 status-option" data-status="falta">Falta</button>
              <button class="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 status-option" data-status="cancelado">Cancelado</button>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${dataCriacaoFormatada}</td>
        <td class="px-6 py-4">
          <button class="btn-secondary btn-small edit-agendamento-btn mr-2" data-id="${agendamento.id}">Editar</button>
          <button class="btn-danger btn-small cancel-agendamento-btn" data-id="${agendamento.id}">Cancelar</button>
        </td>
      </tr>
    `;
  }).join('');
  
  // Event listeners
  document.querySelectorAll('.edit-agendamento-btn').forEach(btn => {
    btn.addEventListener('click', () => abrirEditarAgendamento(btn.dataset.id));
  });
  
  // Status selector click handler
  document.querySelectorAll('[data-status-selector]').forEach(statusDiv => {
    const badge = statusDiv.querySelector('.badge');
    const dropdown = statusDiv.querySelector('.status-dropdown');
    
    if (!badge || !dropdown) {
      console.error('Dropdown ou badge não encontrado');
      return;
    }
    
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      // Toggle dropdown
      const isHidden = dropdown.style.display === 'none';
      dropdown.style.display = isHidden ? 'block' : 'none';
    });
    
    // Status option click
    statusDiv.querySelectorAll('.status-option').forEach(option => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        const novoStatus = option.dataset.status;
        const agendamentoId = statusDiv.dataset.agendamentoId;
        
        // Fechar dropdown
        dropdown.style.display = 'none';
        
        // Atualizar status
        await atualizarStatusAgendamento(agendamentoId, novoStatus);
      });
    });
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', (e) => {
    document.querySelectorAll('[data-status-selector]').forEach(statusDiv => {
      const dropdown = statusDiv.querySelector('.status-dropdown');
      if (!statusDiv.contains(e.target) && dropdown) {
        dropdown.style.display = 'none';
      }
    });
  });
  
  document.querySelectorAll('.cancel-agendamento-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const agendamento = obterAgendamentoPorId(id);
      if (agendamento) {
        agendamentoParaCancelar = id;
        document.getElementById('modal-cancelamento-paciente').textContent = agendamento.nome_paciente;
        abrirModal('modal-confirmar-cancelamento');
      }
    });
  });
}

// ============================================
// CARREGAR AGENDAS NOS SELECTS
// ============================================

function atualizarSelectsAgendas() {
  const select = document.getElementById('agenda-escolhida');
  const editarSelect = document.getElementById('edit-agendamento-agenda');
  const filtroSelect = document.getElementById('filtro-agenda');
  
  const options = agendas.map(agenda => `<option value="${agenda.id}">${agenda.nome}</option>`).join('');
  
  if (select) {
    select.innerHTML = '<option value="">Selecione uma agenda...</option>' + options;
  }
  
  if (editarSelect) {
    editarSelect.innerHTML = '<option value="">Selecione uma agenda...</option>' + options;
  }
  
  if (filtroSelect) {
    filtroSelect.innerHTML = '<option value="">Todas as Agendas</option>' + options;
  }
}

function carregarFilteroAgendas() {
  const filtroSelect = document.getElementById('filtro-agenda');
  const options = agendas.map(agenda => `<option value="${agenda.id}">${agenda.nome}</option>`).join('');
  filtroSelect.innerHTML = '<option value="">Todas as Agendas</option>' + options;
}

// ============================================
// GERAR HORÁRIOS DISPONÍVEIS
// ============================================

function gerarHorariosDisponiveis(agendaId, data) {
  console.log('gerarHorariosDisponiveis - agendaId:', agendaId, 'data:', data);
  
  const agenda = obterAgendaPorId(agendaId);
  if (!agenda) {
    console.warn('Agenda não encontrada para ID:', agendaId);
    return [];
  }
  
  console.log('Agenda encontrada:', agenda);
  
  // Validação defensiva da estrutura de horários
  if (!agenda.horarios || typeof agenda.horarios !== 'object') {
    console.warn('Agenda sem horários configurados:', agenda.id, agenda);
    return [];
  }
  
  // Verificar se a data é um dia válido
  const diaDaSemana = obterDiaDaSemanaDeData(data);
  
  console.log('Dia da semana:', diaDaSemana, 'Dias de atendimento:', agenda.dias_atendimento);
  
  if (!agenda.dias_atendimento.includes(diaDaSemana)) {
    console.warn('Dia não é um dia de atendimento');
    return [];
  }
  
  const horarios = [];
  let config;
  
  // Obter configuração do dia
  if (agenda.horarios_personalizados) {
    config = agenda.horarios[diaDaSemana];
    if (!config) {
      console.warn('Config não encontrada para dia personalizado:', diaDaSemana);
      return [];
    }
  } else {
    config = agenda.horarios.padrao;
    if (!config) {
      console.warn('Config padrão não encontrada');
      return [];
    }
  }
  
  console.log('Config do dia:', config);
  
  if (config.tipoAtendimento === 'ordem') {
    // Ordem de chegada - uma única hora
    horarios.push(config.horarioInicio);
  } else {
    // Hora marcada - gerar slots
    const intervalo = parseInt(config.intervalo) || 30;
    const [horaInicio, minInicio] = config.horarioInicio.split(':').map(Number);
    const [horaFim, minFim] = config.horarioFim.split(':').map(Number);
    
    let totalMinutosInicio = horaInicio * 60 + minInicio;
    const totalMinutosFim = horaFim * 60 + minFim;
    
    while (totalMinutosInicio < totalMinutosFim) {
      const horas = String(Math.floor(totalMinutosInicio / 60)).padStart(2, '0');
      const minutos = String(totalMinutosInicio % 60).padStart(2, '0');
      horarios.push(`${horas}:${minutos}`);
      totalMinutosInicio += intervalo;
    }
  }
  
  return horarios;
}

// ============================================
// GERAR HORÁRIOS COM SLOTS INCLUSOS
// ============================================

function gerarHorariosComSlots(dias_atendimento, horarios_config, horarios_personalizados) {
  // Clonar o objeto horarios para não modificar o original
  const horariosComSlots = JSON.parse(JSON.stringify(horarios_config));
  
  // Para cada dia de atendimento, adicionar os slots
  dias_atendimento.forEach(dia => {
    let config;
    
    if (horarios_personalizados) {
      config = horariosComSlots[dia];
      if (!config) {
        console.warn('Config não encontrada para dia personalizado:', dia);
        return;
      }
    } else {
      config = horariosComSlots.padrao;
      if (!config) {
        console.warn('Config padrão não encontrada');
        return;
      }
    }
    
    const slots = [];
    
    if (config.tipoAtendimento === 'ordem') {
      // Ordem de chegada - uma única hora
      slots.push(config.horarioInicio);
    } else {
      // Hora marcada - gerar slots
      const intervalo = parseInt(config.intervalo) || 30;
      const [horaInicio, minInicio] = config.horarioInicio.split(':').map(Number);
      const [horaFim, minFim] = config.horarioFim.split(':').map(Number);
      
      let totalMinutosInicio = horaInicio * 60 + minInicio;
      const totalMinutosFim = horaFim * 60 + minFim;
      
      while (totalMinutosInicio < totalMinutosFim) {
        const horas = String(Math.floor(totalMinutosInicio / 60)).padStart(2, '0');
        const minutos = String(totalMinutosInicio % 60).padStart(2, '0');
        slots.push(`${horas}:${minutos}`);
        totalMinutosInicio += intervalo;
      }
    }
    
    // Adicionar slots ao dia
    if (horarios_personalizados) {
      horariosComSlots[dia].slots = slots;
    } else {
      horariosComSlots.padrao.slots = slots;
    }
  });
  
  return horariosComSlots;
}

// ============================================
// GERAR SLOTS DE HORÁRIOS A PARTIR DOS DADOS
// ============================================

function gerarSlotsDosDados(dias_atendimento, horarios_config, horarios_personalizados) {
  const slots = {};
  
  // Para cada dia de atendimento, gerar os slots
  dias_atendimento.forEach(dia => {
    // Obter configuração do dia
    let config;
    
    if (horarios_personalizados) {
      config = horarios_config[dia];
      if (!config) {
        console.warn('Config não encontrada para dia personalizado:', dia);
        slots[dia] = [];
        return;
      }
    } else {
      config = horarios_config.padrao;
      if (!config) {
        console.warn('Config padrão não encontrada');
        slots[dia] = [];
        return;
      }
    }
    
    const horarios = [];
    
    if (config.tipoAtendimento === 'ordem') {
      // Ordem de chegada - uma única hora
      horarios.push(config.horarioInicio);
    } else {
      // Hora marcada - gerar slots
      const intervalo = parseInt(config.intervalo) || 30;
      const [horaInicio, minInicio] = config.horarioInicio.split(':').map(Number);
      const [horaFim, minFim] = config.horarioFim.split(':').map(Number);
      
      let totalMinutosInicio = horaInicio * 60 + minInicio;
      const totalMinutosFim = horaFim * 60 + minFim;
      
      while (totalMinutosInicio < totalMinutosFim) {
        const horas = String(Math.floor(totalMinutosInicio / 60)).padStart(2, '0');
        const minutos = String(totalMinutosInicio % 60).padStart(2, '0');
        horarios.push(`${horas}:${minutos}`);
        totalMinutosInicio += intervalo;
      }
    }
    
    slots[dia] = horarios;
  });
  
  return slots;
}

// ============================================
// GERAR SLOTS DE HORÁRIOS PARA TODOS OS DIAS (AGENDA EXISTENTE)
// ============================================

function gerarSlotsAgenda(agendaId) {
  const agenda = obterAgendaPorId(agendaId);
  if (!agenda) {
    console.warn('Agenda não encontrada para ID:', agendaId);
    return {};
  }

  return gerarSlotsDosDados(agenda.dias_atendimento, agenda.horarios, agenda.horarios_personalizados);
}

// ============================================
// GERAR FORMULÁRIOS DE HORÁRIOS PERSONALIZADOS
// ============================================

function gerarFormularioshorarios_personalizados(diasSelecionados, isEdit = false) {
  const prefix = isEdit ? 'edit-' : '';
  const containerId = `${prefix}container-horarios-personalizados`;
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  container.innerHTML = diasSelecionados.map(dia => `
    <div class="horario-dia-section border border-indigo-200 rounded-lg p-6">
      <h4 class="font-semibold text-gray-900 mb-4 capitalize">${dia}</h4>
      
      <div class="space-y-4">
        <!-- Tipo de Atendimento por Dia -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Atendimento</label>
          <div class="space-y-2">
            <label class="flex items-center gap-2">
              <input type="radio" name="${prefix}tipo-${dia}" value="marcado" class="w-4 h-4" checked>
              <span class="text-sm font-medium text-gray-900">Hora Marcada</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" name="${prefix}tipo-${dia}" value="ordem" class="w-4 h-4">
              <span class="text-sm font-medium text-gray-900">Ordem de Chegada</span>
            </label>
          </div>
        </div>
        
        <!-- Intervalo por Dia -->
        <div class="intervalo-personalizado hidden">
          <label class="block text-sm font-semibold text-gray-800 mb-2">Intervalo (minutos)</label>
          <input type="number" class="${prefix}intervalo-${dia} input-field w-full" value="30" min="5" max="240">
        </div>
        
        <!-- Horários por Dia -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Início</label>
            <input type="time" class="${prefix}inicio-${dia} input-field w-full" value="08:00">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Fim</label>
            <input type="time" class="${prefix}fim-${dia} input-field w-full" value="17:00">
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // Adicionar event listeners para os radios
  diasSelecionados.forEach(dia => {
    const radios = document.querySelectorAll(`input[name="${prefix}tipo-${dia}"]`);
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const container = e.target.closest('.horario-dia-section');
        const intervaloDiv = container.querySelector('.intervalo-personalizado');
        
        if (e.target.value === 'marcado') {
          intervaloDiv.classList.remove('hidden');
        } else {
          intervaloDiv.classList.add('hidden');
        }
      });
    });
  });
}

// ============================================
// EXIBIR SUCESSO DO BACKEND
// ============================================

function exibirSucesso(message) {
  const modalSucesso = document.getElementById('modal-sucesso');
  if (modalSucesso) {
    document.getElementById('modal-sucesso-mensagem').textContent = message;
    abrirModal('modal-sucesso');
  } else {
    console.error('Modal de sucesso não encontrado. Mensagem:', message);
  }
}

// ============================================
// EXIBIR ERRO DO BACKEND
// ============================================

function exibirErroBackend(message) {
  const modalErro = document.getElementById('modal-erro-backend');
  if (modalErro) {
    document.getElementById('modal-erro-mensagem').textContent = message;
    abrirModal('modal-erro-backend');
  } else {
    console.error('Modal de erro não encontrado. Mensagem:', message);
  }
}

// ============================================
// INICIALIZAR MODAL DE NOVA AGENDA
// ============================================

function inicializarModalNovaAgenda() {
  // Garantir que os campos de horários padrão têm required quando a seção está visível
  const secaoPadrao = document.getElementById('secao-horarios-padrao');
  const tipoHorariosRadios = document.querySelectorAll('input[name="tipo-horarios"]');
  
  // Verificar qual tipo está selecionado
  const tipoSelecionado = document.querySelector('input[name="tipo-horarios"]:checked');
  if (tipoSelecionado && tipoSelecionado.value === 'padrao') {
    // Se é padrão, adicionar required
    secaoPadrao.querySelectorAll('input[data-required-field], select[data-required-field]').forEach(field => {
      field.setAttribute('required', '');
    });
  }
}

// ============================================
// EVENT LISTENERS PARA FILTRO DE AGENDAS
// ============================================

function setupFiltroAgendas() {
  const filtroInput = document.getElementById('filtro-agendas-busca');
  if (filtroInput) {
    filtroInput.addEventListener('input', (e) => {
      filtrarAgendas(e.target.value);
    });
  }
}

// ============================================
// EVENT LISTENERS PARA MODAIS
// ============================================

function setupModals() {
  // Abrir modal de nova agenda
  document.getElementById('btn-nova-agenda').addEventListener('click', () => {
    abrirModal('modal-nova-agenda');
    inicializarModalNovaAgenda();
  });
  document.getElementById('btn-nova-agenda-empty').addEventListener('click', () => {
    abrirModal('modal-nova-agenda');
    inicializarModalNovaAgenda();
  });
  
  // Fechar modais
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay').classList.add('hidden');
    });
  });
  
  // Fechar modal ao clicar fora
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
  
  // Form de nova agenda
  document.getElementById('form-nova-agenda').addEventListener('submit', handleNovaAgenda);
  
  // Form de editar agenda
  document.getElementById('form-editar-agenda').addEventListener('submit', handleEditarAgenda);
  
  // Form de novo agendamento
  document.getElementById('form-novo-agendamento').addEventListener('submit', handleNovoAgendamento);
  
  // Form de editar agendamento
  document.getElementById('form-editar-agendamento').addEventListener('submit', handleEditarAgendamento);
  
  // Confirmar cancelamento
  document.getElementById('btn-confirmar-cancelamento').addEventListener('click', async () => {
    if (agendamentoParaCancelar) {
      // Enviar cancelamento para backend
      await cancelarAgendamentoNoBackend(agendamentoParaCancelar);
      
      // Fechar modal e recarregar
      fecharModal('modal-confirmar-cancelamento');
      await carregarAgendamentosDoBackend();
      renderizarAgendamentos();
      agendamentoParaCancelar = null;
    }
  });
}

// ============================================
// HANDLERS DOS FORMULÁRIOS
// ============================================

async function handleNovaAgenda(e) {
  e.preventDefault();
  
  const diasSelecionados = Array.from(document.querySelectorAll('.dia-checkbox:checked')).map(cb => cb.value);
  const tipoHorarios = document.querySelector('input[name="tipo-horarios"]:checked').value;
  
  if (!diasSelecionados.length) {
    alert('Selecione pelo menos um dia de atendimento');
    return;
  }
  
  let horarios = {};
  
  if (tipoHorarios === 'padrao') {
    const tipoAtendimento = document.querySelector('input[name="tipo-atendimento"]:checked').value;
    
    if (tipoAtendimento === 'marcado') {
      const intervalo = document.getElementById('modal-agenda-intervalo').value;
      if (!intervalo) {
        alert('Defina o intervalo entre agendamentos');
        return;
      }
    }
    
    horarios.padrao = {
      tipoAtendimento,
      intervalo: tipoAtendimento === 'marcado' ? parseInt(document.getElementById('modal-agenda-intervalo').value) : null,
      horarioInicio: document.getElementById('modal-agenda-horario-inicio').value,
      horarioFim: document.getElementById('modal-agenda-horario-fim').value
    };
  } else {
    // Horários personalizados
    diasSelecionados.forEach(dia => {
      const tipoAtendimento = document.querySelector(`input[name="tipo-${dia}"]:checked`)?.value || 'marcado';
      const intervalo = document.querySelector(`.intervalo-${dia}`)?.value || 30;
      const horarioInicio = document.querySelector(`.inicio-${dia}`)?.value || '08:00';
      const horarioFim = document.querySelector(`.fim-${dia}`)?.value || '17:00';
      
      horarios[dia] = {
        tipoAtendimento,
        intervalo: tipoAtendimento === 'marcado' ? parseInt(intervalo) : null,
        horarioInicio,
        horarioFim
      };
    });
  }
  
  const dados = {
    nome: document.getElementById('modal-agenda-nome').value,
    descricao: document.getElementById('modal-agenda-descricao').value,
    especialidade: document.getElementById('modal-agenda-especialidade').value,
    nome_medico: document.getElementById('modal-agenda-medico').value,
    dias_atendimento: diasSelecionados,
    horarios_personalizados: tipoHorarios === 'personalizado',
    horarios: gerarHorariosComSlots(diasSelecionados, horarios, tipoHorarios === 'personalizado')
  };
  
  // Enviar para backend
  const resultado = await enviarAgendaParaBackend(dados);
  
  // Verificar se houve erro do backend
  if (resultado && resultado.success === false) {
    exibirErroBackend(resultado.message || 'Erro ao criar agenda');
    return;
  }
  
  // Exibir mensagem de sucesso
  exibirSucesso('Agenda criada com sucesso!');
  
  // Fechar modal de criação
  fecharModal('modal-nova-agenda');
  
  // Carregar agendas do backend e renderizar
  await carregarAgendas();
  renderizarAgendas();
  
  // Resetar formulário
  resetarFormulario('form-nova-agenda');
}

async function handleEditarAgenda(e) {
  e.preventDefault();
  
  const diasSelecionados = Array.from(document.querySelectorAll('.edit-dia-checkbox:checked')).map(cb => cb.value);
  const tipoHorarios = document.querySelector('input[name="edit-tipo-horarios"]:checked').value;
  
  if (!diasSelecionados.length) {
    alert('Selecione pelo menos um dia de atendimento');
    return;
  }
  
  let horarios = {};
  
  if (tipoHorarios === 'padrao') {
    const tipoAtendimento = document.querySelector('input[name="edit-tipo-atendimento"]:checked').value;
    
    if (tipoAtendimento === 'marcado') {
      const intervalo = document.getElementById('edit-modal-agenda-intervalo').value;
      if (!intervalo) {
        alert('Defina o intervalo entre agendamentos');
        return;
      }
    }
    
    horarios.padrao = {
      tipoAtendimento,
      intervalo: tipoAtendimento === 'marcado' ? parseInt(document.getElementById('edit-modal-agenda-intervalo').value) : null,
      horarioInicio: document.getElementById('edit-modal-agenda-horario-inicio').value,
      horarioFim: document.getElementById('edit-modal-agenda-horario-fim').value
    };
  } else {
    // Horários personalizados
    diasSelecionados.forEach(dia => {
      const tipoAtendimento = document.querySelector(`input[name="edit-tipo-${dia}"]:checked`)?.value || 'marcado';
      const intervalo = document.querySelector(`.edit-intervalo-${dia}`)?.value || 30;
      const horarioInicio = document.querySelector(`.edit-inicio-${dia}`)?.value || '08:00';
      const horarioFim = document.querySelector(`.edit-fim-${dia}`)?.value || '17:00';
      
      horarios[dia] = {
        tipoAtendimento,
        intervalo: tipoAtendimento === 'marcado' ? parseInt(intervalo) : null,
        horarioInicio,
        horarioFim
      };
    });
  }
  
  const dados = {
    nome: document.getElementById('edit-modal-agenda-nome').value,
    descricao: document.getElementById('edit-modal-agenda-descricao').value,
    especialidade: document.getElementById('edit-modal-agenda-especialidade').value,
    nome_medico: document.getElementById('edit-modal-agenda-medico').value,
    dias_atendimento: diasSelecionados,
    horarios_personalizados: tipoHorarios === 'personalizado',
    horarios: gerarHorariosComSlots(diasSelecionados, horarios, tipoHorarios === 'personalizado')
  };
  
  // Enviar para backend
  const resultado = await enviarAtualizacaoAgendaParaBackend(currentEditingAgendaId, dados);
  
  // Verificar se houve erro do backend
  if (resultado && resultado.success === false) {
    exibirErroBackend(resultado.message || 'Erro ao atualizar agenda');
    return;
  }
  
  // Exibir mensagem de sucesso
  exibirSucesso('Agenda atualizada com sucesso!');
  
  // Fechar modal de edição
  fecharModal('modal-editar-agenda');
  
  // Carregar agendas do backend e renderizar
  await carregarAgendas();
  renderizarAgendas();
}

async function handleNovoAgendamento(e) {
  e.preventDefault();
  
  const agenda_id = document.getElementById('agenda-escolhida').value;
  if (!agenda_id) {
    alert('Selecione uma agenda');
    return;
  }
  
  const nome_paciente = document.getElementById('agenda-paciente-nome').value;
  const cpf = document.getElementById('agenda-paciente-cpf').value;
  const email = document.getElementById('agenda-paciente-email').value;
  const telefone = document.getElementById('agenda-paciente-telefone').value;
  const data_agendamento = document.getElementById('agenda-paciente-data').value;
  const hora_agendamento = document.getElementById('agenda-paciente-hora').value;
  const especialidade = document.getElementById('agenda-paciente-especialidade').value;
  const medico = document.getElementById('agenda-paciente-medico').value;
  
  // Validar campos obrigatórios: nome, email, telefone
  if (!nome_paciente || !email || !telefone || !data_agendamento || !hora_agendamento) {
    alert('Preencha todos os campos obrigatórios (Nome, Email, Telefone, Data e Hora)');
    return;
  }
  
  if (cpf && !validarCPF(cpf)) {
    alert('CPF inválido');
    return;
  }
  
  if (!validarData(data_agendamento)) {
    alert('Data inválida. Selecione uma data futura');
    return;
  }
  
  const dados = {
    agenda_id,
    nome_paciente,
    cpf: cpf ? formatarCPF(cpf) : '',
    email,
    telefone,
    especialidade,
    medico,
    data_agendamento,
    hora_agendamento
  };
  
  // Enviar para backend
  const resultado = await enviarAgendamentoParaBackend(dados);
  
  // Verificar se houve erro do backend
  if (resultado && resultado.success === false) {
    exibirErroBackend(resultado.message || 'Erro ao criar agendamento');
    return;
  }
  
  // Exibir mensagem de sucesso
  exibirSucesso('Agendamento criado com sucesso!');
  
  // Fechar modal de criação
  fecharModal('modal-novo-agendamento');
  
  // Carregar agendamentos do backend e renderizar
  await carregarAgendamentosDoBackend();
  renderizarAgendamentos();
  
  // Resetar formulário
  resetarFormulario('form-novo-agendamento');
}

async function handleEditarAgendamento(e) {
  e.preventDefault();
  
  const agenda_id = document.getElementById('edit-agendamento-agenda').value;
  const data_agendamento = document.getElementById('edit-agendamento-data').value;
  const hora_agendamento = document.getElementById('edit-agendamento-hora').value;
  const medico = document.getElementById('edit-agendamento-medico').value;
  const especialidade = document.getElementById('edit-agendamento-especialidade').value;
  const status = document.getElementById('edit-agendamento-status').value;
  
  if (!agenda_id || !data_agendamento || !hora_agendamento) {
    alert('Preencha todos os campos');
    return;
  }
  
  if (!validarData(data_agendamento)) {
    alert('Data inválida. Selecione uma data futura');
    return;
  }
  
  const dados = {
    agenda_id,
    data_agendamento,
    hora_agendamento,
    especialidade,
    medico,
    status
  };
  
  // Enviar para backend
  const resultado = await enviarAtualizacaoAgendamentoParaBackend(currentEditingAgendamentoId, dados);
  
  // Verificar se houve erro do backend
  if (resultado && resultado.success === false) {
    exibirErroBackend(resultado.message || 'Erro ao atualizar agendamento');
    return;
  }
  
  // Exibir mensagem de sucesso
  exibirSucesso('Agendamento atualizado com sucesso!');
  
  // Fechar modal de edição
  fecharModal('modal-editar-agendamento');
  
  // Carregar agendamentos do backend e renderizar
  await carregarAgendamentosDoBackend();
  renderizarAgendamentos();
}

// ============================================
// ABRIR/FECHAR MODAIS
// ============================================

function abrirModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function fecharModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// ============================================
// ABRIR MODAL EDITAR AGENDA
// ============================================

function abrirEditarAgenda(agendaId) {
  const agenda = obterAgendaPorId(agendaId);
  if (!agenda) return;
  
  currentEditingAgendaId = agendaId;
  
  document.getElementById('edit-agenda-id').value = agenda.id;
  document.getElementById('edit-modal-agenda-nome').value = agenda.nome;
  document.getElementById('edit-modal-agenda-descricao').value = agenda.descricao || '';
  document.getElementById('edit-modal-agenda-especialidade').value = agenda.especialidade || '';
  document.getElementById('edit-modal-agenda-medico').value = agenda.nome_medico || '';
  
  // Validar se a agenda tem dias de atendimento
  if (!Array.isArray(agenda.dias_atendimento)) {
    console.warn('Agenda sem dias de atendimento:', agenda.id);
    agenda.dias_atendimento = [];
  }
  
  // Marcar os dias
  document.querySelectorAll('.edit-dia-checkbox').forEach(cb => {
    cb.checked = agenda.dias_atendimento.includes(cb.value);
  });
  
  // Validar se horarios existe
  if (!agenda.horarios || typeof agenda.horarios !== 'object') {
    console.warn('Agenda sem horários configurados, usando configuração padrão vazia:', agenda.id);
    agenda.horarios = {
      padrao: {
        tipoAtendimento: 'marcado',
        intervalo: 30,
        horarioInicio: '08:00',
        horarioFim: '17:00'
      }
    };
  }
  
  // Marcar tipo de horários (padrão ou personalizado)
  document.querySelector(`input[name="edit-tipo-horarios"][value="${agenda.horarios_personalizados ? 'personalizado' : 'padrao'}"]`).checked = true;
  
  if (agenda.horarios_personalizados) {
    // Modo personalizado
    document.getElementById('edit-secao-horarios-padrao').classList.add('hidden');
    document.getElementById('edit-secao-horarios-personalizado').classList.remove('hidden');
    gerarFormularioshorarios_personalizados(agenda.dias_atendimento, true);
    
    // Carregar dados dos horários personalizados
    if (agenda.horarios && typeof agenda.horarios === 'object') {
      Object.keys(agenda.horarios).forEach(dia => {
        if (dia === 'padrao') return; // Pular a chave 'padrao' se existir
        const config = agenda.horarios[dia];
        if (config) {
          document.querySelector(`input[name="edit-tipo-${dia}"][value="${config.tipoAtendimento}"]`).checked = true;
          const intervaloInput = document.querySelector(`.edit-intervalo-${dia}`);
          if (intervaloInput) intervaloInput.value = config.intervalo || 30;
          document.querySelector(`.edit-inicio-${dia}`).value = config.horarioInicio;
          document.querySelector(`.edit-fim-${dia}`).value = config.horarioFim;
        }
      });
    }
  } else {
    // Modo padrão
    document.getElementById('edit-secao-horarios-padrao').classList.remove('hidden');
    document.getElementById('edit-secao-horarios-personalizado').classList.add('hidden');
    
    const config = agenda.horarios.padrao;
    if (config) {
      document.querySelector(`input[name="edit-tipo-atendimento"][value="${config.tipoAtendimento}"]`).checked = true;
      
      if (config.tipoAtendimento === 'marcado') {
        document.getElementById('edit-intervalo-container').classList.remove('hidden');
        document.getElementById('edit-modal-agenda-intervalo').value = config.intervalo || 30;
      } else {
        document.getElementById('edit-intervalo-container').classList.add('hidden');
      }
      
      document.getElementById('edit-modal-agenda-horario-inicio').value = config.horarioInicio;
      document.getElementById('edit-modal-agenda-horario-fim').value = config.horarioFim;
    }
  }
  
  abrirModal('modal-editar-agenda');
}

// ============================================
// ABRIR MODAL EDITAR AGENDAMENTO
// ============================================

function abrirEditarAgendamento(agendamentoId) {
  console.log('Abrindo edição de agendamento:', agendamentoId);
  
  const agendamento = obterAgendamentoPorId(agendamentoId);
  if (!agendamento) {
    console.error('Agendamento não encontrado:', agendamentoId);
    return;
  }
  
  console.log('Agendamento encontrado:', agendamento);
  
  // Carregar agendas ANTES de preencher o formulário
  carregarAgendas();
  
  const agenda = obterAgendaPorId(agendamento.agenda_id);
  console.log('Agenda encontrada:', agenda);
  
  currentEditingAgendamentoId = agendamentoId;
  
  document.getElementById('edit-agendamento-id').value = agendamento.id;
  document.getElementById('edit-agendamento-paciente-nome').value = agendamento.nome_paciente;
  
  // Setar a agenda selecionada
  const agendaIdFiltro = parseInt(agendamento.agenda_id, 10);
  const editAgendaSelect = document.getElementById('edit-agendamento-agenda');
  if (editAgendaSelect) {
    editAgendaSelect.value = agendaIdFiltro;
  }
  
  document.getElementById('edit-agendamento-especialidade').value = agendamento.especialidade || '';
  document.getElementById('edit-agendamento-medico').value = agendamento.medico || '';
  document.getElementById('edit-agendamento-data').value = agendamento.data_agendamento.split('T')[0];
  document.getElementById('edit-agendamento-status').value = agendamento.status || 'agendado';
  
  // Carregar horários disponíveis
  const dataStr = agendamento.data_agendamento.split('T')[0];
  console.log('Gerando horários para data:', dataStr, 'agenda_id:', agendamento.agenda_id);
  
  const horarios = gerarHorariosDisponiveis(agendamento.agenda_id, dataStr);
  console.log('Horários gerados:', horarios);
  
  const horaSelect = document.getElementById('edit-agendamento-hora');
  const horaAtual = agendamento.hora_agendamento.substring(0, 5);
  console.log('Hora atual a buscar:', horaAtual);
  
  if (horarios.length > 0) {
    horaSelect.innerHTML = horarios.map(h => `
      <option value="${h}" ${h === horaAtual ? 'selected' : ''}>${h}</option>
    `).join('');
  } else {
    horaSelect.innerHTML = '<option value="">Nenhum horário disponível</option>';
  }
  
  console.log('Abrindo modal de edição');
  abrirModal('modal-editar-agendamento');
}

// ============================================
// RESETAR FORMULÁRIO
// ============================================

function resetarFormulario(formId) {
  document.getElementById(formId).reset();
  
  // Desmarcar checkboxes
  if (formId === 'form-nova-agenda') {
    document.querySelectorAll('.dia-checkbox').forEach(cb => cb.checked = false);
  }
}

// ============================================
// EVENT LISTENERS PARA PREENCHIMENTO AUTOMÁTICO
// ============================================

function setupAutoPreenchimento() {
  // Agenda selecionada - preenchimento automático na criação
  document.getElementById('agenda-escolhida').addEventListener('change', (e) => {
    const agenda_id = e.target.value;
    const agenda = obterAgendaPorId(agenda_id);
    
    if (agenda) {
      document.getElementById('agenda-paciente-especialidade').value = agenda.especialidade || '';
      if (agenda.nome_medico) {
        document.getElementById('agenda-paciente-medico').value = agenda.nome_medico;
      }
      document.getElementById('agenda-paciente-medico').readOnly = !!agenda.nome_medico;
      
      // Limpar horários anteriores
      document.getElementById('agenda-paciente-hora').innerHTML = '<option value="">Selecione um horário...</option>';
      document.getElementById('agenda-paciente-data').value = '';
    }
  });
  
  // Quando data é selecionada, carregar horários
  document.getElementById('agenda-paciente-data').addEventListener('change', (e) => {
    const agenda_id = document.getElementById('agenda-escolhida').value;
    const data = e.target.value;
    
    if (!agenda_id || !data) return;
    
    const horaSelect = document.getElementById('agenda-paciente-hora');
    
    // Validar se o dia é um dia de atendimento
    if (!validarDiaAtendimento(data, agenda_id)) {
      const agenda = obterAgendaPorId(agenda_id);
      exibirModalDiasAtendimento(agenda.dias_atendimento);
      horaSelect.innerHTML = '<option value="">Nenhum horário disponível para este dia</option>';
      return;
    }
    
    const horarios = gerarHorariosDisponiveis(agenda_id, data);
    
    if (!horarios.length) {
      horaSelect.innerHTML = '<option value="">Sem horários disponíveis para este dia</option>';
      return;
    }
    
    horaSelect.innerHTML = horarios.map(h => `<option value="${h}">${h}</option>`).join('');
  });
  
  // Para edição de agendamento
  document.getElementById('edit-agendamento-agenda').addEventListener('change', (e) => {
    const agenda_id = e.target.value;
    const agenda = obterAgendaPorId(agenda_id);
    
    if (agenda) {
      document.getElementById('edit-agendamento-especialidade').value = agenda.especialidade || '';
      if (agenda.nome_medico) {
        document.getElementById('edit-agendamento-medico').value = agenda.nome_medico;
      }
      
      // Limpar horários
      document.getElementById('edit-agendamento-hora').innerHTML = '<option value="">Selecione um horário...</option>';
    }
  });
  
  document.getElementById('edit-agendamento-data').addEventListener('change', (e) => {
    const agenda_id = document.getElementById('edit-agendamento-agenda').value;
    const data = e.target.value;
    
    if (!agenda_id || !data) return;
    
    const horaSelect = document.getElementById('edit-agendamento-hora');
    
    // Validar se o dia é um dia de atendimento
    if (!validarDiaAtendimento(data, agenda_id)) {
      const agenda = obterAgendaPorId(agenda_id);
      exibirModalDiasAtendimento(agenda.dias_atendimento);
      horaSelect.innerHTML = '<option value="">Nenhum horário disponível para este dia</option>';
      return;
    }
    
    const horarios = gerarHorariosDisponiveis(agenda_id, data);
    
    if (!horarios.length) {
      horaSelect.innerHTML = '<option value="">Sem horários disponíveis para este dia</option>';
      return;
    }
    
    horaSelect.innerHTML = horarios.map(h => `<option value="${h}">${h}</option>`).join('');
  });
}

// ============================================
// EVENT LISTENER PARA VISIBILIDADE DO INTERVALO
// ============================================

function setupIntervalosVisibility() {
  document.querySelectorAll('input[name="tipo-atendimento"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const container = document.getElementById('intervalo-container');
      const intervaloInput = document.getElementById('modal-agenda-intervalo');
      
      if (e.target.value === 'marcado') {
        container.classList.remove('hidden');
        if (intervaloInput) intervaloInput.setAttribute('required', '');
      } else {
        container.classList.add('hidden');
        if (intervaloInput) intervaloInput.removeAttribute('required');
      }
    });
  });
  
  document.querySelectorAll('input[name="edit-tipo-atendimento"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const container = document.getElementById('edit-intervalo-container');
      const intervaloInput = document.getElementById('edit-modal-agenda-intervalo');
      
      if (e.target.value === 'marcado') {
        container.classList.remove('hidden');
        if (intervaloInput) intervaloInput.setAttribute('required', '');
      } else {
        container.classList.add('hidden');
        if (intervaloInput) intervaloInput.removeAttribute('required');
      }
    });
  });
}

// ============================================
// GERENCIAR VISIBILIDADE DE HORÁRIOS
// ============================================

function setupHorariosVisibility() {
  // Criar agenda - tipo de horários
  document.querySelectorAll('input[name="tipo-horarios"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const secaoPadrao = document.getElementById('secao-horarios-padrao');
      const secaoPersonalizado = document.getElementById('secao-horarios-personalizado');
      
      if (e.target.value === 'padrao') {
        secaoPadrao.classList.remove('hidden');
        secaoPersonalizado.classList.add('hidden');
        
        // Adicionar required aos campos visíveis da seção padrão
        secaoPadrao.querySelectorAll('input[data-required-field], select[data-required-field]').forEach(field => {
          field.setAttribute('required', '');
        });
      } else {
        secaoPadrao.classList.add('hidden');
        secaoPersonalizado.classList.remove('hidden');
        
        // Remover required dos campos da seção padrão que fica hidden
        secaoPadrao.querySelectorAll('input[data-required-field], select[data-required-field]').forEach(field => {
          field.removeAttribute('required');
        });
        
        // Gerar formulários para dias selecionados
        const diasSelecionados = Array.from(document.querySelectorAll('.dia-checkbox:checked')).map(cb => cb.value);
        if (diasSelecionados.length > 0) {
          gerarFormularioshorarios_personalizados(diasSelecionados);
        }
      }
    });
  });
  
  // Editar agenda - tipo de horários
  document.querySelectorAll('input[name="edit-tipo-horarios"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const secaoPadrao = document.getElementById('edit-secao-horarios-padrao');
      const secaoPersonalizado = document.getElementById('edit-secao-horarios-personalizado');
      
      if (e.target.value === 'padrao') {
        secaoPadrao.classList.remove('hidden');
        secaoPersonalizado.classList.add('hidden');
        
        // Adicionar required aos campos visíveis da seção padrão
        secaoPadrao.querySelectorAll('input[data-required-field], select[data-required-field]').forEach(field => {
          field.setAttribute('required', '');
        });
      } else {
        secaoPadrao.classList.add('hidden');
        secaoPersonalizado.classList.remove('hidden');
        
        // Remover required dos campos da seção padrão que fica hidden
        secaoPadrao.querySelectorAll('input[data-required-field], select[data-required-field]').forEach(field => {
          field.removeAttribute('required');
        });
        
        // Gerar formulários para dias selecionados
        const diasSelecionados = Array.from(document.querySelectorAll('.edit-dia-checkbox:checked')).map(cb => cb.value);
        if (diasSelecionados.length > 0) {
          gerarFormularioshorarios_personalizados(diasSelecionados, true);
        }
      }
    });
  });
  
  // Atualizar formulários quando dias são selecionados/deseleccionados
  document.addEventListener('change', (e) => {
    if (e.target.matches('.dia-checkbox')) {
      const tipoHorarios = document.querySelector('input[name="tipo-horarios"]:checked');
      if (tipoHorarios && tipoHorarios.value === 'personalizado') {
        const diasSelecionados = Array.from(document.querySelectorAll('.dia-checkbox:checked')).map(cb => cb.value);
        gerarFormularioshorarios_personalizados(diasSelecionados);
      }
    }
    
    if (e.target.matches('.edit-dia-checkbox')) {
      const tipoHorarios = document.querySelector('input[name="edit-tipo-horarios"]:checked');
      if (tipoHorarios && tipoHorarios.value === 'personalizado') {
        const diasSelecionados = Array.from(document.querySelectorAll('.edit-dia-checkbox:checked')).map(cb => cb.value);
        gerarFormularioshorarios_personalizados(diasSelecionados, true);
      }
    }
  });
}

// ============================================
// FORMATADOR DE CPF
// ============================================

function setupCPFFormatter() {
  document.getElementById('agenda-paciente-cpf').addEventListener('blur', (e) => {
    e.target.value = formatarCPF(e.target.value);
  });
}

// ============================================
// INICIALIZAR APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticação
  checkAuth();
  
  setupResponsividade();
  setupTabs();
  setupModals();
  setupAutoPreenchimento();
  setupIntervalosVisibility();
  setupHorariosVisibility();
  setupCPFFormatter();
  setupFiltroAgendas();
  
  // Carregar agendas do backend
  await carregarAgendas();
  renderizarAgendas();
  
  // Carregar agendamentos do backend
  console.log('=== INICIANDO CARREGAMENTO DE AGENDAMENTOS ===');
  await carregarAgendamentosDoBackend();
  console.log('Agendamentos após carregamento:', agendamentos);
  renderizarAgendamentos();
  console.log('=== AGENDAMENTOS CARREGADOS E RENDERIZADOS ===');
  
  // Adicionar listeners aos filtros
  document.getElementById('filtro-agenda').addEventListener('change', renderizarAgendamentos);
  document.getElementById('filtro-status').addEventListener('change', renderizarAgendamentos);
});
