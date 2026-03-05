// assets/etiquetas.js - Gerenciamento de Etiquetas

// URLs dos endpoints
const GET_TAGS_PATH = "/api/tags";
const CREATE_TAG_PATH = "/api/tags/create";
const UPDATE_TAG_PATH = "/api/tags/update";
const DELETE_TAG_PATH = "/api/tags/delete";

let allTags = [];

// 20 cores disponíveis para as etiquetas
const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
  '#6b7280', // gray
  '#78716c'  // stone
];

// Elementos do DOM
const tagsContainer = document.getElementById('tags-container');
const tagModal = document.getElementById('tag-modal');
const tagForm = document.getElementById('tag-form');
const tagIdInput = document.getElementById('tag-id');
const instrucoesEtiqueta = document.getElementById('instrucoes-etiqueta');
const tagNameInput = document.getElementById('tag-name');
const tagInstrucoesInput = document.getElementById('tag-instrucoes');
const tagColorInput = document.getElementById('tag-color');
const tagPreview = document.getElementById('tag-preview');
const colorPicker = document.getElementById('color-picker');
const modalTitle = document.getElementById('modal-title');
const btnNovaEtiqueta = document.getElementById('btn-nova-etiqueta');
const btnCancel = document.getElementById('btn-cancel');
const btnSave = document.getElementById('btn-save');
const btnDeleteTag = document.getElementById('btn-delete-tag');
const modalClose = document.getElementById('modal-close');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  loadTags();
  initColorPicker();
  bindEvents();
});

// Bind de eventos
function bindEvents() {
  btnNovaEtiqueta.addEventListener('click', () => openModal());
  btnCancel.addEventListener('click', () => closeModal());
  modalClose.addEventListener('click', () => closeModal());
  tagForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTag();
  });
  btnDeleteTag.addEventListener('click', () => deleteTag());
  
  // Atualizar prévia ao digitar
  tagNameInput.addEventListener('input', updatePreview);
  
  // Fechar modal ao clicar fora
  tagModal.addEventListener('click', (e) => {
    if (e.target === tagModal) closeModal();
  });
}

// Inicializar seletor de cores
function initColorPicker() {
  colorPicker.innerHTML = '';
  COLORS.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-option';
    colorDiv.style.backgroundColor = color;
    colorDiv.dataset.color = color;
    colorDiv.addEventListener('click', () => selectColor(color));
    colorPicker.appendChild(colorDiv);
  });
}

// Selecionar cor
function selectColor(color) {
  // Remove seleção anterior
  document.querySelectorAll('.color-option').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Adiciona seleção na cor clicada
  const selectedOption = document.querySelector(`[data-color="${color}"]`);
  if (selectedOption) {
    selectedOption.classList.add('selected');
  }
  
  tagColorInput.value = color;
  updatePreview();
}

// Atualizar prévia da etiqueta
function updatePreview() {
  const name = tagNameInput.value || 'Nome da Etiqueta';
  const color = tagColorInput.value || '#6b7280';
  
  // Calcular cor do texto (claro ou escuro) baseado na cor de fundo
  const textColor = getContrastColor(color);
  
  tagPreview.style.backgroundColor = color;
  tagPreview.style.color = textColor;
  tagPreview.querySelector('span').textContent = name;
}

// Calcular cor de texto com melhor contraste
function getContrastColor(hexColor) {
  // Converter hex para RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // Calcular luminância
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

// Carregar etiquetas
async function loadTags() {
  try {
    const tags = await apiFetch(GET_TAGS_PATH);
    
    // Verifica se a resposta é válida
    if (!tags || !Array.isArray(tags)) {
      allTags = [];
    } else {
      allTags = tags;
    }
    
    renderTags();
  } catch (error) {
    console.error('Erro ao carregar etiquetas:', error);
    
    // Se o erro for 404 ou "não encontrado", significa que não há etiquetas
    if (error.message && (error.message.includes('404') || error.message.includes('não encontrado'))) {
      allTags = [];
      renderTags();
    } else {
      // Exibe mensagem amigável em vez de erro vermelho
      tagsContainer.innerHTML = `
        <div class="text-center py-8 w-full">
          <i class="bi bi-exclamation-circle text-gray-400 text-4xl mb-3"></i>
          <p class="text-gray-500">Não foi possível carregar as etiquetas.</p>
          <button onclick="loadTags()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <i class="bi bi-arrow-clockwise mr-2"></i>Tentar novamente
          </button>
        </div>
      `;
    }
  }
}

// Renderizar etiquetas
function renderTags() {
  tagsContainer.innerHTML = '';
  
  if (allTags.length === 0) {
    tagsContainer.innerHTML = '<div class="text-center text-gray-500 py-8 w-full">Nenhuma etiqueta criada ainda. Clique em "Nova Etiqueta" para começar!</div>';
    return;
  }
  
  allTags.forEach(tag => {
    const tagEl = document.createElement('div');
    tagEl.className = 'tag-item';
    tagEl.style.backgroundColor = tag.cor;
    tagEl.style.color = getContrastColor(tag.cor);
    tagEl.onclick = () => openModal(tag);
    
    tagEl.innerHTML = `
      <i class="bi bi-tag-fill"></i>
      <span>${tag.nome}</span>
      <span style="opacity: 0.7; font-size: 11px; margin-left: 6px;">#${tag.id}</span>
    `;
    
    tagsContainer.appendChild(tagEl);
  });
}

// Abrir modal (criar ou editar)
function openModal(tag = null) {
  if (tag) {
    // Modo edição
    modalTitle.textContent = 'Editar Etiqueta';
    tagIdInput.value = tag.id;
    tagNameInput.value = tag.nome;
    tagInstrucoesInput.value = tag.instrucoes || '';
    tagColorInput.value = tag.cor;
    selectColor(tag.cor);
    btnDeleteTag.classList.remove('hidden');
  } else {
    // Modo criação
    modalTitle.textContent = 'Nova Etiqueta';
    tagIdInput.value = '';
    tagNameInput.value = '';
    tagInstrucoesInput.value = '';
    tagColorInput.value = '';
    document.querySelectorAll('.color-option').forEach(el => {
      el.classList.remove('selected');
    });
    btnDeleteTag.classList.add('hidden');
  }
  
  updatePreview();
  tagModal.classList.remove('hidden');
  tagNameInput.focus();
}

// Fechar modal
function closeModal() {
  tagModal.classList.add('hidden');
  tagForm.reset();
}

// Salvar etiqueta
async function saveTag() {
  const tagId = tagIdInput.value;
  const nome = tagNameInput.value.trim();
  const instrucoes = tagInstrucoesInput.value.trim();
  const cor = tagColorInput.value;
  
  if (!nome || !cor) {
    alert('Por favor, preencha o nome e escolha uma cor.');
    return;
  }
  
  btnSave.disabled = true;
  btnSave.innerHTML = '<i class="bi bi-hourglass-split animate-spin mr-2"></i>Salvando...';
  
  try {
    const data = { nome, cor, instrucoes };
    
    if (tagId) {
      // Atualizar
      data.tagId = tagId;
      await apiFetch(UPDATE_TAG_PATH, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } else {
      // Criar
      await apiFetch(CREATE_TAG_PATH, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
    
    closeModal();
    await loadTags();
    
  } catch (error) {
    console.error('Erro ao salvar etiqueta:', error);
    alert('Erro ao salvar etiqueta: ' + error.message);
  } finally {
    btnSave.disabled = false;
    btnSave.innerHTML = '<i class="bi bi-check-circle mr-2"></i>Salvar';
  }
}

// Excluir etiqueta
async function deleteTag() {
  const tagId = tagIdInput.value;
  const tagName = tagNameInput.value;
  
  if (!confirm(`Tem certeza que deseja excluir a etiqueta "${tagName}"?\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }
  
  btnDeleteTag.disabled = true;
  btnDeleteTag.innerHTML = '<i class="bi bi-hourglass-split animate-spin mr-2"></i>Excluindo...';
  
  try {
    await apiFetch(DELETE_TAG_PATH, {
      method: 'POST',
      body: JSON.stringify({ tagId })
    });
    
    closeModal();
    await loadTags();
    
  } catch (error) {
    console.error('Erro ao excluir etiqueta:', error);
    alert('Erro ao excluir etiqueta: ' + error.message);
  } finally {
    btnDeleteTag.disabled = false;
    btnDeleteTag.innerHTML = '<i class="bi bi-trash mr-2"></i>Excluir';
  }
}
