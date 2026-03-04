// --- ESTADO LOCAL ---
let userProfile = {
    name: 'Carregando...',
    email: 'carregando@...',
    imageUrl: 'https://placehold.co/128x128/4f46e5/ffffff?text=FN'
};

// --- FUNÇÕES DE LÓGICA DE PERFIL ---

/**
 * Carrega os dados do perfil do backend (N8N).
 */
async function loadProfileData() {
    const GET_PROFILE_PATH = "/get-profile-data";

    console.log("[Perfil] Tentando carregar dados do perfil...");
    
    document.getElementById('user-name').value = 'Carregando...';
    document.getElementById('user-email').value = 'carregando@...';

    try {
        const response = await apiFetch(GET_PROFILE_PATH);
        let data = Array.isArray(response) && response.length > 0 ? response[0] : response;

        if (data && data.nome) {
            userProfile = {
                name: data.nome || 'Nome Não Encontrado',
                email: data.email || 'email@naoencontrado.com',
                imageUrl: data.image_url || 'https://placehold.co/128x128/4f46e5/ffffff?text=FN'
            };

            document.getElementById('user-name').value = userProfile.name;
            document.getElementById('user-email').value = userProfile.email;
            document.getElementById('profile-image-preview').src = userProfile.imageUrl;
            if (typeof updateSidebarTitle === 'function' && typeof updateProfileImage === 'function') {
                updateSidebarTitle(userProfile.name);
                updateProfileImage(userProfile.imageUrl, userProfile.name);
            }
            showStatus('', false);
        } else {
            document.getElementById('user-name').value = 'Erro ao Carregar';
            document.getElementById('user-email').value = 'erro@api.com';
            showStatus('Erro: Resposta da API inválida.', true);
        }
    } catch (error) {
        console.error("[Perfil Erro] Falha ao carregar perfil. Causa:", error);
        document.getElementById('user-name').value = 'Falha de Conexão';
        document.getElementById('user-email').value = 'verificar@console.com';
        showStatus('Erro ao carregar o perfil. Verifique o N8N e o console.', true);
    }
}

/**
 * Lida com a pré-visualização da imagem localmente.
 */
window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    const statusElement = document.getElementById('profile-status');
    
    if (file) {
        if (file.size > 4 * 1024 * 1024) {
            showStatus('O arquivo é muito grande (máx. 4MB).', true);
            event.target.value = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
            showStatus('Erro: Por favor, selecione uma imagem válida.', true);
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profile-image-preview').src = e.target.result;
            userProfile.imageUrl = e.target.result; // Armazena Base64 temporariamente
            showStatus('Pré-visualização OK. Clique em Salvar para atualizar.', false);
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Salva as alterações de perfil enviando JSON com nome e Base64.
 */
document.getElementById('profile-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const UPDATE_PROFILE_PATH = "/update-profile";
    const newName = document.getElementById('user-name').value.trim();
    const saveButton = document.getElementById('save-button');
    const fileInput = document.getElementById('file-upload');
    const originalButtonText = 'Salvar Alterações';

    saveButton.disabled = true;
    saveButton.textContent = 'Salvando...';
    showStatus('Salvando perfil...', false);

    const body = {
        nome: newName,
        image_url: userProfile.imageUrl // Envia o Base64 atual ou a URL antiga
    };

    // Se houver novo arquivo, atualiza o Base64 antes de enviar
    if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            body.image_url = e.target.result;
            await sendUpdate(body);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        await sendUpdate(body);
    }

    async function sendUpdate(body) {
        console.log('[Enviando ao n8n] Body:', body); // Depuração
        try {
            const result = await apiFetch(UPDATE_PROFILE_PATH, {
                method: 'POST',
                body: body
            });

            if (result.success) {
                userProfile.name = newName;
                userProfile.imageUrl = result.image_url || userProfile.imageUrl;
                localStorage.setItem('user_name', newName);
                localStorage.setItem('profile_image', userProfile.imageUrl);

                document.getElementById('user-name').value = userProfile.name;
                document.getElementById('profile-image-preview').src = userProfile.imageUrl;
                if (typeof updateSidebarTitle === 'function' && typeof updateProfileImage === 'function') {
                    updateSidebarTitle(userProfile.name);
                    updateProfileImage(userProfile.imageUrl, userProfile.name);
                }
                showStatus('Perfil atualizado com sucesso!', false);
            } else {
                showStatus('Erro: Falha ao atualizar perfil. Verifique o console.', true);
            }
        } catch (error) {
            console.error('[Perfil Erro] Falha ao atualizar perfil. Causa:', error);
            showStatus('Erro ao salvar o perfil. Verifique o N8N e o console.', true);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalButtonText;
        }
    }
});

// --- Funções Auxiliares (showStatus) ---

function showStatus(message, isError = false) {
    const statusElement = document.getElementById('profile-status');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = 'mt-4 text-center text-sm font-medium';
    
    if (isError) {
        statusElement.classList.add('text-red-600');
    } else {
        statusElement.classList.add('text-green-700');
    }
    
    setTimeout(() => {
        if (statusElement.textContent === message) {
            statusElement.textContent = 'Carregue um novo avatar (max 4MB)';
            statusElement.classList.remove('text-red-600', 'text-green-700');
            statusElement.classList.add('text-gray-500');
        }
    }, 5000);
}