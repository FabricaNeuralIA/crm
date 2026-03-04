// URLs dos webhooks de autenticação
const LOGIN_PATH = "/login";
const GET_PROFILE_PATH = "/get-profile-data"; // CRÍTICO: Usado para buscar nome/email/imagem
const UPDATE_PROFILE_PATH = "/update-profile"; // CRÍTICO: Usado para salvar perfil

/**
 * Atualiza o título principal da sidebar (o nome da empresa).
 * @param {string} name 
 */
function updateSidebarTitle(name) {
    const mainTitle = document.getElementById('sidebar-main-title');
    if (mainTitle) {
        mainTitle.textContent = name;
    }
}

/**
 * Atualiza a imagem de perfil ou exibe as iniciais no div.
 * @param {string} imageUrl 
 * @param {string} name - Usado para gerar iniciais se não houver imagem
 */
function updateProfileImage(imageUrl, name = '') {
    const profileDiv = document.getElementById('profile-image');
    if (profileDiv) {
        if (imageUrl && !imageUrl.includes('placehold.co')) {
            profileDiv.style.backgroundImage = `url(${imageUrl})`;
            profileDiv.style.backgroundSize = 'cover';
            profileDiv.style.backgroundPosition = 'center';
            profileDiv.textContent = '';
        } else {
            profileDiv.style.backgroundImage = '';
            profileDiv.style.backgroundColor = '#6366f1';
            const initials = name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
            profileDiv.textContent = initials || 'FN';
        }
    }
    const profileImagePreview = document.getElementById('profile-image-preview');
    if (profileImagePreview) {
        profileImagePreview.src = imageUrl || 'https://placehold.co/128x128/4f46e5/ffffff?text=FN';
    }
}

/**
 * Função global que busca o nome e a imagem do perfil e atualiza a sidebar em todas as páginas.
 */
async function loadAndDisplaySidebarName() {
    updateSidebarTitle('Carregando...');
    
    try {
        const response = await apiFetch(GET_PROFILE_PATH);
        const data = Array.isArray(response) && response.length > 0 ? response[0] : response;

        if (data && data.nome) {
            updateSidebarTitle(data.nome);
            localStorage.setItem('user_name', data.nome);
            if (data.image_url) {
                updateProfileImage(data.image_url, data.nome);
                localStorage.setItem('profile_image', data.image_url);
            } else {
                updateProfileImage(null, data.nome);
            }
        } else {
            const storedName = localStorage.getItem('user_name');
            const storedImage = localStorage.getItem('profile_image');
            updateSidebarTitle(storedName || 'Fabrica Neural');
            updateProfileImage(storedImage, storedName || 'Fabrica Neural');
        }
    } catch (error) {
        console.error('[Auth] Falha ao carregar dados do perfil:', error);
        updateSidebarTitle('Desconectado');
        updateProfileImage(null, 'Desconectado');
    }
}

/**
 * Roda em CADA página segura para verificar se o usuário está logado.
 */
function checkAuth() {
    const token = localStorage.getItem('jwt_token');
    
    if (!token && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (token) {
        loadAndDisplaySidebarName();
        if (typeof loadProfileData === 'function') {
            loadProfileData();
        } else if (typeof fetchLeads === 'function') {
            fetchLeads();
        } else if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    }
}

/**
 * Tenta fazer login na API do n8n
 */
async function login(email, password) {
    try {
        const data = await apiFetch(LOGIN_PATH, {
            method: 'POST',
            body: { email, password }
        });

        if (data.token && data.userName) {
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_name', data.userName);
            if (data.image_url) {
                localStorage.setItem('profile_image', data.image_url);
            }
            window.location.href = 'dashboard.html';
        } else {
            throw new Error('Token ou Nome não recebido da API');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        throw new Error('Email ou senha inválidos.');
    }
}

/**
 * Desloga o usuário
 */
function logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('profile_image');
    window.location.href = 'login.html';
}