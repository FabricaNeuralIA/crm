/* ========================================
   🎨 CONTROLADOR DE TEMAS - DARK & LIGHT MODE
   Fabrica Neural CRM
   ======================================== */

(function() {
  'use strict';

  // Constantes
  const THEME_KEY = 'fabricaneural-theme';
  const DARK_MODE_CLASS = 'dark-mode';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';

  // Elementos
  let themeToggleBtn = null;
  let iconElement = null;

  /**
   * Inicializa o sistema de temas
   */
  function init() {
    createToggleButton();
    loadSavedTheme();
    attachEventListeners();
  }

  /**
   * Cria o botão de toggle de tema
   */
  function createToggleButton() {
    // Verifica se já existe
    if (document.getElementById('theme-toggle')) return;

    // Cria o botão
    themeToggleBtn = document.createElement('button');
    themeToggleBtn.id = 'theme-toggle';
    themeToggleBtn.className = 'theme-toggle-btn';
    themeToggleBtn.setAttribute('aria-label', 'Alternar tema');
    themeToggleBtn.setAttribute('title', 'Alternar entre modo claro e escuro');

    // Cria o ícone
    iconElement = document.createElement('i');
    iconElement.className = 'bi bi-moon-stars-fill';
    
    themeToggleBtn.appendChild(iconElement);
    document.body.appendChild(themeToggleBtn);
  }

  /**
   * Carrega o tema salvo no localStorage
   */
  function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    
    if (savedTheme === THEME_DARK) {
      enableDarkMode();
    } else {
      enableLightMode();
    }
  }

  /**
   * Ativa o modo escuro
   */
  function enableDarkMode() {
    document.body.classList.add(DARK_MODE_CLASS);
    document.documentElement.classList.add(DARK_MODE_CLASS);
    updateIcon(THEME_DARK);
    localStorage.setItem(THEME_KEY, THEME_DARK);
  }

  /**
   * Ativa o modo claro
   */
  function enableLightMode() {
    document.body.classList.remove(DARK_MODE_CLASS);
    document.documentElement.classList.remove(DARK_MODE_CLASS);
    updateIcon(THEME_LIGHT);
    localStorage.setItem(THEME_KEY, THEME_LIGHT);
  }

  /**
   * Atualiza o ícone do botão
   */
  function updateIcon(theme) {
    if (!iconElement) return;

    if (theme === THEME_DARK) {
      // Modo escuro ativado = mostra ícone de sol (para voltar ao claro)
      iconElement.className = 'bi bi-sun-fill';
      themeToggleBtn.setAttribute('title', 'Ativar modo claro');
    } else {
      // Modo claro ativado = mostra ícone de lua (para ir ao escuro)
      iconElement.className = 'bi bi-moon-stars-fill';
      themeToggleBtn.setAttribute('title', 'Ativar modo escuro');
    }
  }

  /**
   * Alterna entre os temas
   */
  function toggleTheme() {
    const isDarkMode = document.body.classList.contains(DARK_MODE_CLASS);
    
    if (isDarkMode) {
      enableLightMode();
      showNotification('☀️ Modo Claro Ativado');
    } else {
      enableDarkMode();
      showNotification('🌙 Modo Escuro Ativado');
    }
  }

  /**
   * Mostra uma notificação temporária
   */
  function showNotification(message) {
    // Remove notificação anterior se existir
    const existingNotification = document.getElementById('theme-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Cria nova notificação
    const notification = document.createElement('div');
    notification.id = 'theme-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 90px;
      right: 20px;
      z-index: 9998;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
      animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
      pointer-events: none;
    `;

    document.body.appendChild(notification);

    // Remove após 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Adiciona os event listeners
   */
  function attachEventListeners() {
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Atalho de teclado: Ctrl/Cmd + Shift + D
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  /**
   * API Pública
   */
  window.ThemeController = {
    toggle: toggleTheme,
    enableDark: enableDarkMode,
    enableLight: enableLightMode,
    getCurrentTheme: () => {
      return document.body.classList.contains(DARK_MODE_CLASS) ? THEME_DARK : THEME_LIGHT;
    }
  };

  // Inicializa quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Adiciona as animações CSS para a notificação
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

})();
