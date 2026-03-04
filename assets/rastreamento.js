// assets/rastreamento.js - Gerenciamento de Frases de Rastreamento

const Rastreamento = {
    dados: [],
    editandoId: null,

    // Inicialização
    init() {
        this.bindEvents();
        this.loadData();
    },

    // Bindear eventos
    bindEvents() {
        // Formulário
        const form = document.getElementById('rastreamento-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Botão cancelar
        const btnCancel = document.getElementById('btn-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => this.resetForm());
        }

        // Modal de exclusão
        const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
        const deleteCancelBtn = document.getElementById('delete-cancel-btn');
        
        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', () => this.confirmDelete());
        }
        if (deleteCancelBtn) {
            deleteCancelBtn.addEventListener('click', () => this.closeDeleteModal());
        }

        // Fechar modal clicando fora
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeDeleteModal();
            });
        }
    },

    // Carregar dados da API
    async loadData() {
        const tableBody = document.getElementById('rastreamento-table-body');
        
        try {
            const response = await apiFetch('/rastreamento', {
                method: 'POST',
                body: { acao: 'listar' }
            });
            
            this.dados = response || [];
            this.renderTable();
        } catch (error) {
            // Mensagem mais amigável
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                        <i class="bi bi-wifi-off text-3xl mb-3 text-amber-500"></i>
                        <p class="font-medium text-gray-700">Não foi possível conectar ao servidor</p>
                        <p class="text-sm mt-1">Verifique se o webhook está ativo</p>
                        <button onclick="Rastreamento.loadData()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                            <i class="bi bi-arrow-clockwise mr-1"></i> Tentar novamente
                        </button>
                    </td>
                </tr>
            `;
        }
    },

    // Renderizar tabela
    renderTable() {
        const tableBody = document.getElementById('rastreamento-table-body');
        const totalCount = document.getElementById('total-count');

        if (!this.dados || this.dados.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                        <i class="bi bi-inbox text-2xl mb-2"></i>
                        <p>Nenhuma frase cadastrada</p>
                    </td>
                </tr>
            `;
            totalCount.textContent = '0 registros';
            return;
        }

        totalCount.textContent = `${this.dados.length} registro${this.dados.length > 1 ? 's' : ''}`;

        tableBody.innerHTML = this.dados.map(item => `
            <tr data-id="${item.id}" class="hover:bg-gray-50 transition-colors border-b border-gray-200 bg-white">
                <td class="px-4 py-4 text-sm font-semibold text-gray-900">
                    ${this.escapeHtml(item.nome || '')}
                </td>
                <td class="px-4 py-4 text-sm text-gray-600">
                    <div class="max-w-[280px]" title="${this.escapeHtml(item.frase || '')}">
                        ${this.escapeHtml(item.frase || '')}
                    </div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <span class="inline-flex items-center px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm">
                        <i class="bi bi-tag-fill mr-1.5"></i>
                        ${this.escapeHtml(item.palavra_chave || '')}
                    </span>
                </td>
                <td class="px-4 py-4 text-sm text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="Rastreamento.editItem(${item.id})" class="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Editar">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button onclick="Rastreamento.openDeleteModal(${item.id}, '${this.escapeHtml(item.nome || '')}')" class="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    // Submit do formulário (criar ou atualizar)
    async handleSubmit(e) {
        e.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const frase = document.getElementById('frase').value.trim();
        const palavra_chave = document.getElementById('palavra_chave').value.trim();

        if (!nome || !frase || !palavra_chave) {
            this.showStatus('Preencha todos os campos obrigatórios!', true);
            return;
        }

        const btnSubmit = document.getElementById('btn-submit');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';

        try {
            if (this.editandoId) {
                // Atualizar
                await apiFetch('/rastreamento', {
                    method: 'POST',
                    body: { 
                        acao: 'atualizar',
                        id: this.editandoId, 
                        nome, 
                        frase, 
                        palavra_chave 
                    }
                });
                this.showStatus('Frase atualizada com sucesso!', false);
            } else {
                // Criar
                await apiFetch('/rastreamento', {
                    method: 'POST',
                    body: { 
                        acao: 'criar',
                        nome, 
                        frase, 
                        palavra_chave 
                    }
                });
                this.showStatus('Frase adicionada com sucesso!', false);
            }

            this.resetForm();
            await this.loadData();

        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showStatus(error.message || 'Erro ao salvar. Tente novamente.', true);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
        }
    },

    // Editar item
    editItem(id) {
        const item = this.dados.find(d => d.id === id);
        if (!item) return;

        this.editandoId = id;

        document.getElementById('edit-id').value = id;
        document.getElementById('nome').value = item.nome || '';
        document.getElementById('frase').value = item.frase || '';
        document.getElementById('palavra_chave').value = item.palavra_chave || '';

        // Atualizar UI
        document.getElementById('form-title').textContent = 'Editar Frase';
        document.getElementById('btn-submit').innerHTML = '<i class="bi bi-check-lg"></i> <span>Salvar</span>';
        document.getElementById('btn-cancel').classList.remove('hidden');

        // Scroll pro formulário
        document.getElementById('rastreamento-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('nome').focus();
    },

    // Reset do formulário
    resetForm() {
        this.editandoId = null;
        document.getElementById('rastreamento-form').reset();
        document.getElementById('edit-id').value = '';
        document.getElementById('form-title').textContent = 'Adicionar Nova Frase';
        document.getElementById('btn-submit').innerHTML = '<i class="bi bi-plus-lg"></i> <span>Adicionar</span>';
        document.getElementById('btn-cancel').classList.add('hidden');
    },

    // Abrir modal de exclusão
    openDeleteModal(id, nome) {
        document.getElementById('delete-id').value = id;
        document.getElementById('delete-nome').textContent = nome;
        document.getElementById('delete-modal').classList.remove('hidden');
    },

    // Fechar modal de exclusão
    closeDeleteModal() {
        document.getElementById('delete-modal').classList.add('hidden');
        document.getElementById('delete-id').value = '';
    },

    // Confirmar exclusão
    async confirmDelete() {
        const id = document.getElementById('delete-id').value;
        if (!id) return;

        const btnConfirm = document.getElementById('delete-confirm-btn');
        const originalText = btnConfirm.innerHTML;
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<i class="bi bi-hourglass-split"></i> Excluindo...';

        try {
            // Tudo via POST
            await apiFetch('/rastreamento', {
                method: 'POST',
                body: { 
                    acao: 'excluir',
                    id: parseInt(id) 
                }
            });

            this.closeDeleteModal();
            this.showStatus('Frase excluída com sucesso!', false);
            
            // Se estava editando esse item, reset o form
            if (this.editandoId === parseInt(id)) {
                this.resetForm();
            }

            await this.loadData();

        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showStatus(error.message || 'Erro ao excluir. Tente novamente.', true);
        } finally {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = originalText;
        }
    },

    // Mostrar status/feedback
    showStatus(message, isError = false) {
        const statusEl = document.getElementById('global-status');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.classList.remove('hidden', 'bg-green-100', 'text-green-700', 'bg-red-100', 'text-red-700');
        
        if (isError) {
            statusEl.classList.add('bg-red-100', 'text-red-700');
        } else {
            statusEl.classList.add('bg-green-100', 'text-green-700');
        }

        // Esconder após 5 segundos
        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    },

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    Rastreamento.init();
});