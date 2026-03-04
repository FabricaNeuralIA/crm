// --- CONFIGURAÇÃO GLOBAL DA API ---
const N8N_BASE_URL = "https://auto.fabricaneural.ia.br/webhook"; // URL base dos seus webhooks

/**
 * Função helper para todas as chamadas de API.
 * Ela automaticamente adiciona o token JWT.
 */
async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('jwt_token');

    // Configura os headers
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }
    
    // Prepara o body
    let bodyToSend = null;
    if (options.body) {
        headers.append('Content-Type', 'application/json');
        // Se já for string, usa direto, senão converte
        bodyToSend = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const fullUrl = `${N8N_BASE_URL}${path}`;

    // Monta a requisição
    const response = await fetch(fullUrl, {
        ...options,
        headers: headers,
        body: bodyToSend
    });

    // Se o token for inválido/expirado, desloga o usuário
    if (response.status === 401 || response.status === 403) {
        logout(); // Função do auth.js
        throw new Error('Não autorizado');
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na API');
    }

    return response.json();
}