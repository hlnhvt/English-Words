export function renderWordModal(word) {
  if (!word) return '';

  return `
    <div id="word-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-surface-950/80 backdrop-blur-sm fade-in">
      <div class="glass rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10 slide-up">
        <!-- Modal Header -->
        <div class="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
          <div class="flex items-center gap-3">
            <span class="text-[10px] px-2 py-1 rounded-full level-${word.level.toLowerCase()} text-white font-medium uppercase">${word.level}</span>
            <span class="text-[10px] px-2 py-1 rounded-full bg-white/10 text-surface-400 font-medium">${word.pos.join(', ')}</span>
          </div>
          <button id="close-modal" class="w-8 h-8 rounded-full flex items-center justify-center text-surface-400 hover:text-white hover:bg-white/10 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <div class="text-center mb-8">
            <h2 class="text-4xl font-bold text-surface-100 mb-2">${word.word}</h2>
            <div class="flex items-center justify-center gap-3">
              <span class="text-lg text-surface-400 font-medium">${word.phonetic || ''}</span>
              <button id="modal-pronounce" class="w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center hover:bg-primary-600/30 transition-all" title="Phát âm">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Meanings -->
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-surface-500 uppercase">Ý nghĩa</h3>
              <div class="glass bg-white/3 rounded-2xl p-4">
                ${word.meaning_vi ? `
                  <p class="text-base font-semibold text-primary-400 ${word.meaning_en || word.meaning_vi_detail ? 'mb-3 pb-3 border-b border-white/5' : ''}">${word.meaning_vi}</p>
                ` : ''}
                ${word.meaning_en ? `<p class="text-base font-bold text-surface-100 mb-1">${word.meaning_en}</p>` : ''}
                ${word.meaning_vi_detail ? `<p class="text-sm text-surface-300 leading-relaxed">${word.meaning_vi_detail}</p>` : ''}
              </div>
            </div>

            <!-- Examples -->
            ${word.examples && word.examples.length > 0 ? `
              <div class="space-y-3">
                <h3 class="text-xs font-bold text-surface-500 uppercase">Ví dụ</h3>
                <div class="space-y-3">
                  ${word.examples.map(ex => `
                    <div class="pl-4 border-l-2 border-primary-500/30">
                      <p class="text-sm text-surface-200 italic mb-1">"${ex.en}"</p>
                      ${ex.vi ? `<p class="text-sm text-surface-400">${ex.vi}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 bg-white/2 border-t border-white/5 text-center">
          <p class="text-[10px] text-surface-500">Oxford 5000 Vocabulary System</p>
        </div>
      </div>
    </div>
  `;
}

export function initWordModalEvents(word) {
  const modal = document.getElementById('word-modal');
  const closeBtn = document.getElementById('close-modal');
  const pronounceBtn = document.getElementById('modal-pronounce');

  if (!modal) return;

  const closeModal = () => {
    modal.classList.add('fade-out');
    modal.querySelector('.slide-up')?.classList.replace('slide-up', 'slide-down');
    setTimeout(() => {
      modal.remove();
    }, 300);
  };

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  pronounceBtn?.addEventListener('click', () => {
    if (word && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(word.word);
      utter.lang = 'en-US';
      utter.rate = 0.8;
      speechSynthesis.speak(utter);
    }
  });

  // ESC key to close
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEsc);
    }
  };
  document.addEventListener('keydown', handleEsc);
}
