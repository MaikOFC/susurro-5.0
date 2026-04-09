class VLibrasService {
  private queue: string[] = [];
  private isProcessing = false;

  public translate(text: string) {
    if (!text || !text.trim()) return;
    
    this.queue.push(text.trim());
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const text = this.queue.shift();
      if (text) {
        await this.sendToVLibras(text);
        
        // Estima o tempo da animação baseado no tamanho do texto
        // Aumentado para ~300ms por caractere, com um mínimo de 3s e máximo de 15s
        const estimatedTime = Math.min(Math.max(3000, text.length * 300), 15000);
        await new Promise(resolve => setTimeout(resolve, estimatedTime));
      }
    }
    
    this.isProcessing = false;
  }

  private sendToVLibras(text: string): Promise<void> {
    return new Promise((resolve) => {
      // Tentativa 1: Usar a API interna do VLibras (se exposta)
      const w = window as any;
      if (w.vp && typeof w.vp.translate === 'function') {
        try {
          w.vp.translate(text);
          resolve();
          return;
        } catch (e) {
          console.warn('Falha ao usar API interna do VLibras, usando fallback DOM', e);
        }
      }

      // Tentativa 2: Manipulação do DOM (Fallback)
      const translator = document.querySelector('[vp-translator-screen]');
      
      // Se a tela de tradução não estiver habilitada, tenta habilitar abrindo o menu
      if (translator && !translator.classList.contains('vp-enabled')) {
        const moreOptions = document.querySelector('.vpw-more-options-button') as HTMLElement;
        if (moreOptions) {
          moreOptions.click();
          setTimeout(() => {
            const translatorBtn = document.querySelector('.vp-translator-button') as HTMLElement;
            if (translatorBtn) translatorBtn.click();
          }, 300);
        }
      }

      // Aguarda um pouco para a interface estar pronta e envia o texto
      setTimeout(() => {
        const textarea = document.querySelector('[vp-translator-screen] .vp-user-textarea') as HTMLTextAreaElement;
        const btn = document.querySelector('[vp-translator-screen] .vp-play-gloss-button') as HTMLButtonElement;
        
        if (textarea && btn) {
          // Limpa o textarea primeiro
          textarea.value = '';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));

          // Função para digitar o texto caractere por caractere
          let i = 0;
          const typeWriter = () => {
            if (i < text.length) {
              textarea.value += text.charAt(i);
              textarea.dispatchEvent(new Event('input', { bubbles: true }));
              i++;
              setTimeout(typeWriter, 30); // Velocidade de digitação (30ms por caractere)
            } else {
              // Quando terminar de digitar, espera um pouco mais e clica no botão de traduzir
              setTimeout(() => {
                 btn.click();
                 resolve();
              }, 800); // Aumentado para 800ms para garantir o processamento
            }
          };

          // Inicia a digitação
          typeWriter();
        } else {
          // Se não encontrou os elementos, resolve para não travar a fila
          resolve();
        }
      }, 500);
    });
  }
}

export const vlibrasService = new VLibrasService();
