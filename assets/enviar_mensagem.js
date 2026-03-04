// assets/enviar_mensagem.js - WhatsApp CRM
const WhatsApp = {
    leadSelecionado: null,
    leads: [],
    mensagensAtuais: [],
    _isLoadingMessages: false,
    _isReadingHistory: false,
    _isMobile: false,

    init() {
      // Mostrar loading com texto de carregando conversas
      this.showLoading('Carregando conversas...');

      // Detectar se é mobile
      this._isMobile = window.innerWidth <= 768;
      this.bindResizeListener();
      this.bindBackButton();

      // Carregar leads e esconder loading quando terminar
      this.loadLeads().then(() => {
        this.hideLoading();
      }).catch(() => {
        this.hideLoading();
      });

      setInterval(() => this.autoUpdate(), 5000);
      this.bindSearch();
      this.bindMessageEvents();
      this.bindChatScroll();
    },

    // Mostrar loading
    showLoading(text = 'Carregando...') {
      const loading = document.getElementById('whatsapp-loading');
      if (loading) {
        const textEl = loading.querySelector('div');
        if (textEl) textEl.textContent = text;
        loading.style.display = 'flex';
      }
    },

    // Esconder loading
    hideLoading() {
      const loading = document.getElementById('whatsapp-loading');
      if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => {
          loading.style.display = 'none';
          loading.style.opacity = '1';
        }, 300);
      }
    },

    // Escutar resize para atualizar flag mobile
    bindResizeListener() {
      window.addEventListener('resize', () => {
        this._isMobile = window.innerWidth <= 768;
      });
    },

    // Bind do botão voltar no mobile
    bindBackButton() {
      const backBtn = document.getElementById('backButton');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showLeadsList();
        });
      }
    },

    // Mostrar chat (esconder lista no mobile)
    showChat() {
      if (!this._isMobile) return;
      
      const leadsPanel = document.getElementById('leadsPanelWrapper');
      const chatPanel = document.getElementById('chatPanelWrapper');
      
      if (leadsPanel) leadsPanel.classList.add('hidden');
      if (chatPanel) chatPanel.classList.add('active');
      
      // Aguardar a animação terminar e então fazer scroll
      setTimeout(() => {
        this.forceScrollToBottom();
      }, 350);
    },

    // Mostrar lista de leads (esconder chat no mobile)
    showLeadsList() {
      if (!this._isMobile) return;
      
      const leadsPanel = document.getElementById('leadsPanelWrapper');
      const chatPanel = document.getElementById('chatPanelWrapper');
      
      if (leadsPanel) leadsPanel.classList.remove('hidden');
      if (chatPanel) chatPanel.classList.remove('active');
    },

    bindMessageEvents() {
      const input = document.getElementById('mensagemInput');
      const btn = document.getElementById('enviarBtn');
      
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.sendMessage();
        });
      }
      
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.sendMessage();
          }
        });
      }
    },

    bindChatScroll() {
      const chat = document.getElementById('chatMessages');
      if (!chat) return;

      chat.addEventListener('scroll', () => {
        const pertoDoFinal = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 120;
        this._isReadingHistory = !pertoDoFinal;
      });
    },

    bindSearch() {
      const input = document.getElementById('searchInput');
      if (input) input.addEventListener('input', () => this.searchLeads());
    },

    async loadLeads() {
      try {
        const novos = await apiFetch('/whatsapp-leads');
        
        // Se as etiquetas não vieram junto, buscar separadamente
        if (novos.length > 0 && !novos[0].hasOwnProperty('etiquetas')) {
          const allTags = await apiFetch('/api/all-lead-tags');
          
          // Mapear etiquetas para cada lead
          novos.forEach(lead => {
            lead.etiquetas = allTags
              .filter(tag => tag.lead_id === lead.id)
              .map(tag => ({
                id: tag.etiqueta_id,
                nome: tag.nome,
                cor: tag.cor
              }));
          });
        }
        
        if (JSON.stringify(novos) !== JSON.stringify(this.leads)) {
          this.leads = novos;
          this.renderLeads();
        }
      } catch (err) {
        console.error('Erro ao carregar leads:', err);
      }
    },

    renderLeads() {
      const panel = document.getElementById('leadsPanel');
      const validos = this.leads.filter(l => l.numero_whatsapp && !['SEM_DADOS', 'nao_informado', 'desconhecido'].includes(l.numero_whatsapp));
      const termoBusca = document.getElementById('searchInput')?.value.toLowerCase().replace(/\D/g, '') || '';

      panel.innerHTML = '';
      validos.forEach(lead => {
        const item = document.createElement('div');
        item.className = 'lead-item';
        item.dataset.leadId = lead.id;
        item.onclick = () => this.selectLead(lead);

        const inicial = ((lead.nome || 'L')[0] || 'L').toUpperCase();
        const avatar = lead.foto_url ? `background-image: url('${lead.foto_url}');` : '';
        const data = new Date(lead.ultima_mensagem_data);
        const hoje = new Date();
        const ehHoje = data.toDateString() === hoje.toDateString();
        const horario = ehHoje
          ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const iconeAudio = lead.ultima_mensagem_tipo?.startsWith('audio/') ? '<i class="fa-solid fa-microphone" style="font-size: 12px; margin-right: 4px;"></i>' : '';
        const ultimaMsg = lead.ultima_mensagem
          ? (lead.ultima_mensagem.length > 32 ? lead.ultima_mensagem.substring(0, 32) + '...' : lead.ultima_mensagem)
          : 'Nenhuma mensagem';

        // Se está buscando por número, mostra o número abaixo do nome
        const numeroLimpo = (lead.numero_whatsapp || '').replace(/\D/g, '');
        const estaBuscandoPorNumero = termoBusca.length >= 3 && numeroLimpo.includes(termoBusca);
        const numeroFormatado = lead.numero_whatsapp ? this.formatarNumero(lead.numero_whatsapp) : '';
        
        // Mostra o número se: está buscando por número OU se não tem nome
        const mostrarNumero = estaBuscandoPorNumero || !lead.nome;
        const nomeExibido = lead.nome || numeroFormatado;

        // Renderizar etiquetas se existirem
        let tagsHTML = '';
        if (lead.etiquetas && lead.etiquetas.length > 0) {
          const tagsArray = lead.etiquetas.slice(0, 2).map(tag => {
            const textColor = this.getContrastColor(tag.cor);
            return `<span class="tag-badge" style="background-color: ${tag.cor}; color: ${textColor};">
              <i class="bi bi-tag-fill"></i>${tag.nome}
            </span>`;
          });
          
          const maisEtiquetas = lead.etiquetas.length > 2 ? `<span class="tag-badge" style="background-color: #6b7280; color: white;">+${lead.etiquetas.length - 2}</span>` : '';
          
          tagsHTML = `<div class="lead-tags" style="margin-top: 4px;">${tagsArray.join('')}${maisEtiquetas}</div>`;
        }

        item.innerHTML = `
          <div class="lead-avatar" style="${avatar}">${lead.foto_url ? '' : inicial}</div>
          <div class="lead-info">
            <div class="lead-nome">${nomeExibido}</div>
            ${mostrarNumero && lead.nome ? `<div class="lead-numero" style="font-size: 12px; color: #667781; margin-bottom: 2px;">${numeroFormatado}</div>` : ''}
            ${tagsHTML}
            <div class="lead-ultima-mensagem">
              <span class="msg-preview">${iconeAudio}${ultimaMsg}</span>
              <span class="lead-horario">${horario}</span>
            </div>
          </div>
        `;
        panel.appendChild(item);
      });

      if (this.leadSelecionado) {
        const ativo = document.querySelector(`[data-lead-id="${this.leadSelecionado.id}"]`);
        if (ativo) ativo.classList.add('active');
      }
    },

    // Formatar número para exibição
    formatarNumero(numero) {
      const limpo = numero.replace(/\D/g, '');
      if (limpo.length === 13) {
        // 5511999887766 -> +55 (11) 99988-7766
        return `+${limpo.slice(0,2)} (${limpo.slice(2,4)}) ${limpo.slice(4,9)}-${limpo.slice(9)}`;
      } else if (limpo.length === 12) {
        // 551199887766 -> +55 (11) 9988-7766
        return `+${limpo.slice(0,2)} (${limpo.slice(2,4)}) ${limpo.slice(4,8)}-${limpo.slice(8)}`;
      } else if (limpo.length === 11) {
        // 11999887766 -> (11) 99988-7766
        return `(${limpo.slice(0,2)}) ${limpo.slice(2,7)}-${limpo.slice(7)}`;
      }
      return numero;
    },

    async selectLead(lead) {
      if (this.leadSelecionado?.id === lead.id) return;

      this.leadSelecionado = lead;
      this.mensagensAtuais = [];
      this._isReadingHistory = false;

      document.getElementById('chatNome').textContent = lead.nome || lead.numero_whatsapp;
      const avatar = document.getElementById('chatAvatar');
      if (lead.foto_url) {
        avatar.style.backgroundImage = `url('${lead.foto_url}')`;
        avatar.textContent = '';
      } else {
        avatar.style.backgroundImage = '';
        avatar.textContent = ((lead.nome || 'L')[0] || 'L').toUpperCase();
      }

      // Exibir etiquetas no cabeçalho do chat
      this.renderChatHeaderTags(lead);

      // Mostrar botão de etiquetas
      const tagsBtn = document.getElementById('tagsBtn');
      if (tagsBtn) {
        tagsBtn.style.display = 'flex';
      }

      // Atualiza o toggle do bot
      const botToggleContainer = document.getElementById('botToggleContainer');
      const botToggle = document.getElementById('botToggle');
      
      if (botToggleContainer && botToggle) {
        botToggleContainer.style.display = 'flex';
        botToggle.disabled = false;
        botToggle.checked = lead.bot_ativado || false;
        
        // Remove listener antigo se existir
        const newToggle = botToggle.cloneNode(true);
        botToggle.parentNode.replaceChild(newToggle, botToggle);
        
        // Adiciona novo listener
        newToggle.addEventListener('change', (e) => {
          this.toggleBot(lead.id, e.target.checked);
        });
      }

      document.getElementById('mensagemInput').disabled = false;
      document.getElementById('enviarBtn').disabled = false;

      const chat = document.getElementById('chatMessages');
      chat.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Carregando mensagens...</div>';

      this.renderLeads();
      this.showChat();
      await this.loadMessages(lead.id, false, true);
    },

    // Renderizar etiquetas no cabeçalho do chat
    renderChatHeaderTags(lead) {
      const chatTagsContainer = document.getElementById('chatTags');
      
      if (!chatTagsContainer) return;
      
      chatTagsContainer.innerHTML = '';
      
      if (!lead.etiquetas || lead.etiquetas.length === 0) {
        chatTagsContainer.style.display = 'none';
        return;
      }
      
      chatTagsContainer.style.display = 'flex';
      
      lead.etiquetas.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.style.backgroundColor = tag.cor;
        badge.style.color = this.getContrastColor(tag.cor);
        badge.innerHTML = `<i class="bi bi-tag-fill"></i>${tag.nome}`;
        chatTagsContainer.appendChild(badge);
      });
    },

    async toggleBot(leadId, newStatus) {
      console.log(`🤖 Alterando bot para ${newStatus} no lead ${leadId}`);
      
      try {
        await apiFetch('/api/leads/toggle-bot', {
          method: 'POST',
          body: JSON.stringify({
            leadId: leadId,
            botStatus: newStatus
          })
        });
        
        // Atualiza o cache local
        if (this.leadSelecionado && this.leadSelecionado.id === leadId) {
          this.leadSelecionado.bot_ativado = newStatus;
        }
        
        const leadInCache = this.leads.find(l => l.id === leadId);
        if (leadInCache) {
          leadInCache.bot_ativado = newStatus;
        }
        
        console.log(`✅ Bot ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
        
      } catch (error) {
        console.error('❌ Erro ao atualizar status do bot:', error);
        alert('Erro ao alterar status do bot. A página será recarregada.');
        location.reload();
      }
    },

    async loadMessages(leadId, manterScroll = false, scrollToBottom = false) {
      this._isLoadingMessages = true;
      
      try {
        const msgs = await apiFetch('/whatsapp-conversas', {
          method: 'POST',
          body: { lead_id: leadId }
        });
        this.mensagensAtuais = msgs;
        this.renderMessages(msgs, true, manterScroll, scrollToBottom);
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
      } finally {
        this._isLoadingMessages = false;
      }
    },

    renderMessages(msgs, clear = false, manterScroll = false, scrollToBottom = false) {
      const chat = document.getElementById('chatMessages');
      
      let scrollAnterior = null;
      if (manterScroll && !scrollToBottom) {
        scrollAnterior = chat.scrollHeight - chat.scrollTop;
      }
      
      if (clear) chat.innerHTML = '';

      if (!msgs || msgs.length === 0) {
        chat.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Nenhuma mensagem</div>';
        return;
      }

      msgs.forEach(msg => this.createMessageElement(msg, chat));

      if (scrollToBottom) {
        this.forceScrollToBottom();
      } else if (manterScroll && scrollAnterior !== null) {
        requestAnimationFrame(() => {
          chat.scrollTop = chat.scrollHeight - scrollAnterior;
        });
      }
    },

    createMessageElement(msg, container) {
      const el = document.createElement('div');
      const tipo = (msg.tipo_remetente || 'cliente').toLowerCase();
      el.className = `message ${tipo}`;
      el.dataset.msgId = msg.id || Date.now();

      const conteudo = msg.conteudo || msg.mensagem;
      const tipoMsg = (msg.tipo_mensagem || 'texto').toLowerCase();
      
      // Formatar horário da mensagem usando created_at
      const horario = this.formatarHorarioMensagem(msg.created_at);

      if (tipoMsg.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = conteudo;
        img.className = 'chat-image';
        img.onclick = () => this.openImage(conteudo);
        el.appendChild(img);
        el.classList.add('media');
        // Adiciona horário após a imagem
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = horario;
        el.appendChild(timeSpan);
      } else if (tipoMsg.startsWith('audio/')) {
        el.innerHTML = this.createAudioPlayer(conteudo);
        el.classList.add('media');
        // Adiciona horário após o player
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = horario;
        el.appendChild(timeSpan);
        // Bind dos eventos do player após inserir no DOM
        setTimeout(() => this.bindAudioPlayer(el), 0);
      } else if (tipoMsg === 'application/pdf') {
        const nome = conteudo.split('/').pop() || 'documento.pdf';
        el.innerHTML = `<a href="${conteudo}" target="_blank" class="chat-document"><i class="fa-solid fa-file-pdf"></i><span>${nome}</span></a><span class="message-time">${horario}</span>`;
      } else {
        el.textContent = conteudo || 'Mensagem vazia';
        // Adiciona horário para mensagens de texto
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = horario;
        el.appendChild(timeSpan);
      }
      container.appendChild(el);
    },

    // Formatar horário da mensagem (created_at vem no formato ISO)
    formatarHorarioMensagem(createdAt) {
      if (!createdAt) return '';
      const data = new Date(createdAt);
      if (isNaN(data.getTime())) return '';
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    // Criar HTML do player de áudio customizado
    createAudioPlayer(src) {
      const playerId = 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      return `
        <div class="audio-player" data-player-id="${playerId}">
          <audio src="${src}" preload="metadata" style="display: none;"></audio>
          <button class="audio-play-btn" title="Play/Pause">
            <i class="fa-solid fa-play"></i>
          </button>
          <div class="audio-content">
            <div class="audio-waveform">
              <div class="audio-progress-container">
                <div class="audio-progress"></div>
              </div>
            </div>
            <div class="audio-info">
              <span class="audio-time">0:00 / 0:00</span>
              <button class="audio-speed-btn" title="Velocidade">1x</button>
            </div>
          </div>
        </div>
      `;
    },

    // Bind eventos do player de áudio
    bindAudioPlayer(container) {
      const player = container.querySelector('.audio-player');
      if (!player) return;

      const audio = player.querySelector('audio');
      const playBtn = player.querySelector('.audio-play-btn');
      const progressContainer = player.querySelector('.audio-progress-container');
      const progress = player.querySelector('.audio-progress');
      const timeDisplay = player.querySelector('.audio-time');
      const speedBtn = player.querySelector('.audio-speed-btn');

      const speeds = [1, 1.5, 2, 0.5];
      let currentSpeedIndex = 0;

      // Formatar tempo
      const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      // Atualizar display de tempo
      const updateTime = () => {
        const current = formatTime(audio.currentTime);
        const duration = formatTime(audio.duration);
        timeDisplay.textContent = `${current} / ${duration}`;
      };

      // Play/Pause
      playBtn.addEventListener('click', () => {
        // Pausar outros áudios
        document.querySelectorAll('.audio-player audio').forEach(a => {
          if (a !== audio && !a.paused) {
            a.pause();
            a.closest('.audio-player').querySelector('.audio-play-btn i').className = 'fa-solid fa-play';
          }
        });

        if (audio.paused) {
          audio.play();
          playBtn.querySelector('i').className = 'fa-solid fa-pause';
        } else {
          audio.pause();
          playBtn.querySelector('i').className = 'fa-solid fa-play';
        }
      });

      // Atualizar progresso
      audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = percent + '%';
        updateTime();
      });

      // Quando carregar metadata
      audio.addEventListener('loadedmetadata', () => {
        updateTime();
      });

      // Quando terminar
      audio.addEventListener('ended', () => {
        playBtn.querySelector('i').className = 'fa-solid fa-play';
        progress.style.width = '0%';
        audio.currentTime = 0;
      });

      // Click na barra de progresso para seek
      progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
      });

      // Mudar velocidade
      speedBtn.addEventListener('click', () => {
        currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
        const speed = speeds[currentSpeedIndex];
        audio.playbackRate = speed;
        speedBtn.textContent = speed + 'x';
        
        // Destacar quando não é 1x
        if (speed !== 1) {
          speedBtn.classList.add('active');
        } else {
          speedBtn.classList.remove('active');
        }
      });
    },

    async sendMessage() {
      const input = document.getElementById('mensagemInput');
      const texto = input.value.trim();
      if (!texto || !this.leadSelecionado) return;

      const btn = document.getElementById('enviarBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

      input.value = '';

      try {
        await apiFetch('/whatsapp-enviar', {
          method: 'POST',
          body: { lead_id: this.leadSelecionado.id, mensagem: texto }
        });
        
        setTimeout(() => {
          this.loadMessages(this.leadSelecionado.id, false, true);
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        }, 800);
        
      } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        alert('Erro ao enviar mensagem: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
      }
    },

    forceScrollToBottom() {
      const chat = document.getElementById('chatMessages');
      if (!chat) return;
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    },

    openNewChat() { 
      document.getElementById('modalNovaConversa').style.display = 'flex'; 
      document.getElementById('novoNumero').focus(); 
    },
    
    closeNewChat() { 
      document.getElementById('modalNovaConversa').style.display = 'none'; 
      document.getElementById('novoNumero').value = ''; 
      document.getElementById('novaMensagem').value = ''; 
    },
    
    async sendNewChat() {
      const numero = document.getElementById('novoNumero').value.replace(/\D/g, '');
      const msg = document.getElementById('novaMensagem').value.trim();
      if (!numero || numero.length < 11 || !msg) return alert('Preencha corretamente!');
      
      const btn = document.getElementById('btnEnviarNova');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
      
      try {
        await apiFetch('/whatsapp-enviar-novo', {
          method: 'POST',
          body: { numero_whatsapp: numero, mensagem: msg }
        });
        
        setTimeout(() => {
          this.loadLeads();
          this.closeNewChat();
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar';
        }, 1500);
      } catch (err) {
        console.error('Erro ao enviar nova conversa:', err);
        alert('Erro ao iniciar conversa: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar';
      }
    },
    
    openImage(src) { 
      document.getElementById('imagemAmpliada').src = src; 
      document.getElementById('modalImagem').style.display = 'flex'; 
    },
    
    closeImage() { 
      document.getElementById('modalImagem').style.display = 'none'; 
    },
    
    openProfile() {
      if (!this.leadSelecionado) return;
      const modal = document.getElementById('modalPerfil');
      document.getElementById('editNome').value = this.leadSelecionado.nome || '';
      document.getElementById('editNumero').value = this.leadSelecionado.numero_whatsapp || '';
      
      const avatar = document.getElementById('perfilAvatar');
      if (this.leadSelecionado.foto_url) {
        avatar.style.backgroundImage = `url('${this.leadSelecionado.foto_url}')`;
        avatar.textContent = '';
      } else {
        avatar.style.backgroundImage = '';
        avatar.textContent = (this.leadSelecionado.nome?.[0] || 'L').toUpperCase();
      }
      
      const info = new Date(this.leadSelecionado.ultima_mensagem_data).toLocaleString('pt-BR');
      document.getElementById('perfilInfo').innerHTML = `Última: <strong>${info}</strong><br>ID: <code>${this.leadSelecionado.id}</code>`;
      modal.style.display = 'flex';
    },
    
    closeProfile() { 
      document.getElementById('modalPerfil').style.display = 'none'; 
    },
    
    async saveProfile() {
      const nome = document.getElementById('editNome').value.trim();
      const numero = document.getElementById('editNumero').value.replace(/\D/g, '');
      if (!numero || numero.length < 11) return alert('Número inválido!');
      
      try {
        await apiFetch('/whatsapp-atualizar-lead', {
          method: 'POST',
          body: { lead_id: this.leadSelecionado.id, nome: nome || null, numero_whatsapp: numero }
        });
        
        this.leadSelecionado.nome = nome || null;
        this.leadSelecionado.numero_whatsapp = numero;
        document.getElementById('chatNome').textContent = nome || numero;
        this.renderLeads();
        alert('Salvo!');
        this.closeProfile();
      } catch (err) {
        console.error('Erro ao salvar perfil:', err);
        alert('Erro ao salvar: ' + err.message);
      }
    },
    
    copyNumber() {
      navigator.clipboard.writeText(this.leadSelecionado.numero_whatsapp).then(() => alert('Copiado!'));
    },
    
    searchLeads() {
      const termo = document.getElementById('searchInput').value.toLowerCase().replace(/\D/g, '');
      const termoOriginal = document.getElementById('searchInput').value.toLowerCase();
      
      // Se mudou o termo de busca, re-renderiza para mostrar/esconder números
      this.renderLeads();
      
      document.querySelectorAll('.lead-item').forEach(item => {
        const leadId = item.dataset.leadId;
        const lead = this.leads.find(l => String(l.id) === leadId);
        
        if (!lead) {
          item.style.display = 'none';
          return;
        }
        
        const nome = (lead.nome || '').toLowerCase();
        const numero = (lead.numero_whatsapp || '').replace(/\D/g, '');
        
        // Busca por nome de etiqueta
        let encontrouEtiqueta = false;
        if (lead.etiquetas && lead.etiquetas.length > 0 && termoOriginal.length > 0) {
          encontrouEtiqueta = lead.etiquetas.some(tag => 
            tag.nome.toLowerCase().includes(termoOriginal)
          );
        }
        
        // Busca por nome OU por número OU por etiqueta
        const encontrouNome = nome.includes(termoOriginal);
        const encontrouNumero = termo.length > 0 && numero.includes(termo);
        
        item.style.display = (encontrouNome || encontrouNumero || encontrouEtiqueta) ? '' : 'none';
      });
    },
    
    autoUpdate() {
      if (this._isLoadingMessages) return;
      
      const audioTocando = Array.from(document.querySelectorAll('audio')).some(a => !a.paused);
      const videoTocando = Array.from(document.querySelectorAll('video')).some(v => !v.paused);
      const modalImagemAberto = document.getElementById('modalImagem')?.style.display === 'flex';
      
      if (audioTocando || videoTocando || modalImagemAberto) return;
      
      this.loadLeads();
      
      if (!this.leadSelecionado) return;

      const chat = document.getElementById('chatMessages');
      const estaNoFinal = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 100;

      if (this._isReadingHistory && !estaNoFinal) return;

      this.loadMessages(this.leadSelecionado.id, false, true);
    },

    // ============================================
    // FUNÇÕES DE GERENCIAMENTO DE ETIQUETAS
    // ============================================

    // Abrir modal de etiquetas
    async openTags() {
      if (!this.leadSelecionado) return;
      
      const modal = document.getElementById('modalTags');
      const tagsGrid = document.getElementById('tagsGrid');
      
      // Mostrar loading
      tagsGrid.innerHTML = `
        <div class="no-tags-message">
          <i class="bi bi-hourglass-split"></i>
          <p>Carregando etiquetas...</p>
        </div>
      `;
      
      modal.style.display = 'flex';
      
      try {
        // Buscar todas as etiquetas disponíveis
        const todasEtiquetas = await apiFetch('/api/tags');
        
        // Buscar etiquetas do lead atual
        const etiquetasDoLead = await apiFetch('/api/lead-tags', {
          method: 'POST',
          body: JSON.stringify({ leadId: this.leadSelecionado.id })
        });
        
        const idsEtiquetasDoLead = etiquetasDoLead.map(t => t.etiqueta_id || t.id);
        
        if (todasEtiquetas.length === 0) {
          tagsGrid.innerHTML = `
            <div class="no-tags-message">
              <i class="bi bi-tags"></i>
              <p>Nenhuma etiqueta criada ainda</p>
              <a href="etiquetas.html" style="color: var(--cor-header); margin-top: 8px; display: inline-block; text-decoration: none;">
                <i class="bi bi-plus-circle"></i>
                Criar primeira etiqueta
              </a>
            </div>
          `;
        } else {
          tagsGrid.innerHTML = '';
          todasEtiquetas.forEach(tag => {
            const isSelected = idsEtiquetasDoLead.includes(tag.id);
            const tagEl = document.createElement('div');
            tagEl.className = `tag-option ${isSelected ? 'selected' : ''}`;
            tagEl.style.backgroundColor = tag.cor;
            tagEl.dataset.tagId = tag.id;
            tagEl.onclick = () => this.toggleTag(tag.id);
            
            // Calcular cor do texto
            const textColor = this.getContrastColor(tag.cor);
            tagEl.style.color = textColor;
            
            tagEl.innerHTML = `
              ${isSelected ? '<i class="bi bi-check-circle-fill"></i>' : '<i class="bi bi-tag-fill"></i>'}
              <span>${tag.nome}</span>
            `;
            
            tagsGrid.appendChild(tagEl);
          });
        }
        
      } catch (error) {
        console.error('Erro ao carregar etiquetas:', error);
        tagsGrid.innerHTML = `
          <div class="no-tags-message">
            <i class="bi bi-exclamation-triangle"></i>
            <p>Erro ao carregar etiquetas</p>
          </div>
        `;
      }
    },

    // Fechar modal de etiquetas
    async closeTags() {
      document.getElementById('modalTags').style.display = 'none';
      
      // Recarregar etiquetas do lead atual em tempo real
      if (this.leadSelecionado) {
        try {
          const etiquetasAtualizadas = await apiFetch('/api/lead-tags', {
            method: 'POST',
            body: JSON.stringify({ leadId: this.leadSelecionado.id })
          });
          
          // Atualizar etiquetas do lead selecionado
          this.leadSelecionado.etiquetas = etiquetasAtualizadas.map(t => ({
            id: t.etiqueta_id || t.id,
            nome: t.nome,
            cor: t.cor
          }));
          
          // Atualizar etiquetas no cache de leads
          const leadInCache = this.leads.find(l => l.id === this.leadSelecionado.id);
          if (leadInCache) {
            leadInCache.etiquetas = this.leadSelecionado.etiquetas;
          }
          
          // Re-renderizar etiquetas no cabeçalho do chat
          this.renderChatHeaderTags(this.leadSelecionado);
          
          // Re-renderizar lista de leads para atualizar os cards
          this.renderLeads();
          
        } catch (error) {
          console.error('Erro ao atualizar etiquetas:', error);
        }
      }
    },

    // Adicionar ou remover etiqueta do lead
    async toggleTag(tagId) {
      if (!this.leadSelecionado) return;
      
      const tagEl = document.querySelector(`.tag-option[data-tag-id="${tagId}"]`);
      if (!tagEl) return;
      
      const isSelected = tagEl.classList.contains('selected');
      
      try {
        if (isSelected) {
          // Remover etiqueta
          await apiFetch('/api/lead-tags/remove', {
            method: 'POST',
            body: JSON.stringify({
              leadId: this.leadSelecionado.id,
              tagId: tagId
            })
          });
          
          tagEl.classList.remove('selected');
          tagEl.querySelector('i').className = 'bi bi-tag-fill';
          
        } else {
          // Adicionar etiqueta
          await apiFetch('/api/lead-tags/add', {
            method: 'POST',
            body: JSON.stringify({
              leadId: this.leadSelecionado.id,
              tagId: tagId
            })
          });
          
          tagEl.classList.add('selected');
          tagEl.querySelector('i').className = 'bi bi-check-circle-fill';
        }
        
      } catch (error) {
        console.error('Erro ao alternar etiqueta:', error);
        alert('Erro ao atualizar etiqueta: ' + error.message);
      }
    },

    // Calcular cor de texto com melhor contraste
    getContrastColor(hexColor) {
      // Converter hex para RGB
      const r = parseInt(hexColor.substr(1, 2), 16);
      const g = parseInt(hexColor.substr(3, 2), 16);
      const b = parseInt(hexColor.substr(5, 2), 16);
      
      // Calcular luminância
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      return luminance > 0.5 ? '#1f2937' : '#ffffff';
    },

    // Renderizar etiquetas no card do lead
    renderLeadTags(lead, container) {
      if (!lead.etiquetas || lead.etiquetas.length === 0) return;
      
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'lead-tags';
      
      lead.etiquetas.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.style.backgroundColor = tag.cor;
        badge.style.color = this.getContrastColor(tag.cor);
        badge.innerHTML = `<i class="bi bi-tag-fill"></i>${tag.nome}`;
        tagsDiv.appendChild(badge);
      });
      
      container.appendChild(tagsDiv);
    }
};

// Iniciar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  WhatsApp.init();
});
