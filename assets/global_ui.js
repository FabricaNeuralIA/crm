// FUNÇÃO GLOBAL DE BUSCA DO NOME PARA A SIDEBAR (Chamada pelo assets/auth.js)

/**
 * Função global que busca o nome do perfil e atualiza o título principal da sidebar.
 */
async function updateSidebarUserName() {
    // Definindo o caminho da API DENTRO da função para evitar conflito de declaração (SyntaxError)
    const GET_PROFILE_PATH = "/get-profile-data"; 
    
    console.log("[Global UI] Tentando carregar dados do perfil para a Sidebar...");
    const mainTitle = document.getElementById('sidebar-main-title');

    // Estado de carregamento
    if (mainTitle) {
        mainTitle.textContent = 'Carregando...';
    }

    try {
        // Usa a função global apiFetch (definida em assets/api.js)
        const response = await apiFetch(GET_PROFILE_PATH);

        // O N8N geralmente retorna um array de objetos [{nome: "...", email: "..."}]
        const data = response && response.length > 0 ? response[0] : null;

        if (data && data.nome) {
            console.log(`[Global UI] Perfil carregado com sucesso: ${data.nome}`);
            
            // 1. Atualiza o TÍTULO PRINCIPAL (que agora tem o ID sidebar-main-title)
            if (mainTitle) {
                mainTitle.textContent = data.nome; 
                // O nome do usuário (teste) será exibido aqui
            }

        } else {
            console.warn("[Global UI] Dados do perfil incompletos. Nome não encontrado na resposta da API.");
            if (mainTitle) {
                mainTitle.textContent = 'Usuário Padrão';
            }
        }
    } catch (error) {
        console.error("[Global UI Error] Falha ao carregar perfil para a sidebar:", error);
        // Em caso de erro, exibe um erro amigável na sidebar
        if (mainTitle) {
            mainTitle.textContent = 'Erro de API';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // A checagem de autenticação (checkAuth em auth.js) é quem chama updateSidebarUserName()
});

/* ========================================
   🌓 CONTROLADOR DE TEMA DARK/LIGHT MODE
   ======================================== */

(function() {
  'use strict';

  // Verifica se há preferência salva no localStorage
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Define o tema inicial
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
  }

  // Cria o botão de toggle quando o DOM carregar
  document.addEventListener('DOMContentLoaded', function() {
    createThemeToggleButton();
  });

  /**
   * Cria e adiciona o botão de toggle de tema
   */
  function createThemeToggleButton() {
    // Verifica se já existe
    if (document.getElementById('theme-toggle-btn')) return;

    const button = document.createElement('button');
    button.id = 'theme-toggle-btn';
    button.className = 'theme-toggle-btn';
    button.setAttribute('aria-label', 'Alternar tema');
    button.setAttribute('title', 'Alternar entre modo claro e escuro');
    
    updateButtonIcon(button);
    
    button.addEventListener('click', toggleTheme);
    
    document.body.appendChild(button);
  }

  /**
   * Atualiza o ícone do botão baseado no tema atual
   */
  function updateButtonIcon(button) {
    const isDark = document.body.classList.contains('dark-mode');
    button.innerHTML = isDark 
      ? '<i class="bi bi-sun-fill"></i>' 
      : '<i class="bi bi-moon-stars-fill"></i>';
  }

  /**
   * Alterna entre dark e light mode
   */
  function toggleTheme() {
    const button = document.getElementById('theme-toggle-btn');
    const isDark = document.body.classList.contains('dark-mode');
    
    if (isDark) {
      // Muda para Light Mode
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    } else {
      // Muda para Dark Mode
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
    
    updateButtonIcon(button);
    
    // Feedback visual
    button.style.transform = 'scale(0.9) rotate(180deg)';
    setTimeout(() => {
      button.style.transform = '';
    }, 300);
  }

  // Exporta para uso global
  window.toggleTheme = toggleTheme;

})();
