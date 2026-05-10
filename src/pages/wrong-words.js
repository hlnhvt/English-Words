import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';

let searchQuery = '';

export function renderWrongWords(allWords) {
  const wrongData = store.getWrongWords(); // { word: { wrongCount, correctStreak } }
  const wrongSet = new Set(Object.keys(wrongData));

  const wrongWords = allWords
    .filter(w => wrongSet.has(w.word))
    .filter(w => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return w.word.toLowerCase().includes(q) ||
             (w.meaning_vi && w.meaning_vi.toLowerCase().includes(q));
    })
    .map(w => ({ ...w, wrongCount: wrongData[w.word]?.wrongCount || 1, correctStreak: wrongData[w.word]?.correctStreak || 0 }))
    .sort((a, b) => b.wrongCount - a.wrongCount);

  return `
    <div class="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <!-- Header -->
      <div class="fade-in mb-8">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-3xl font-bold text-surface-100">Từ làm sai</h1>
          ${wrongWords.length > 0 ? `
            <span class="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-sm font-semibold border border-red-500/20">
              ${wrongSet.size}
            </span>` : ''}
        </div>
        <p class="text-surface-400">Các từ bạn đã trả lời sai trong quá trình ôn tập.</p>
      </div>

      <!-- Controls -->
      <div class="fade-in glass rounded-2xl p-4 mb-8 flex items-center gap-4" style="animation-delay: 0.1s">
        <div class="relative flex-1 max-w-xs">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input type="text" id="wrong-search" placeholder="Tìm kiếm từ vựng..." value="${searchQuery}"
                 class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-all">
        </div>
        <div class="flex items-center gap-2 ml-auto">
          ${wrongSet.size > 0 ? `
            <a href="#/review" data-start-wrong-review
               class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/20 text-sm font-medium hover:bg-red-500/25 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Ôn tập ngay
            </a>
            <button id="btn-clear-all-wrong"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-surface-500 border border-white/10 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Xóa tất cả
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Word List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${wrongWords.length > 0 ? wrongWords.map((word, index) => `
          <div class="fade-in glass rounded-2xl p-5 hover:bg-white/8 transition-all border border-red-500/15 hover:border-red-500/30 group cursor-pointer"
               data-word="${word.word}"
               style="animation-delay: ${0.2 + (index % 10) * 0.05}s">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[10px] px-2 py-0.5 rounded-full level-${word.level.toLowerCase()} text-white font-medium uppercase">${word.level}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-surface-400">${word.pos[0]}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold border border-red-500/20">
                  ✗ ${word.wrongCount}
                </span>
                ${word.correctStreak > 0 ? `
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-success-500/15 text-success-400 font-semibold border border-success-500/20" title="Đúng liên tiếp ${word.correctStreak}/6 — đạt 6 sẽ tự xóa">
                    ✓ ${word.correctStreak}/6
                  </span>
                ` : ''}
                <button data-remove-wrong="${word.word}" title="Xóa khỏi danh sách sai"
                  class="w-6 h-6 rounded-lg flex items-center justify-center text-surface-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <h3 class="text-xl font-bold text-surface-100 mb-1 group-hover:text-red-400 transition-colors">${word.word}</h3>
            <p class="text-xs text-surface-500 italic mb-3">${word.phonetic || ''}</p>
            <div class="space-y-1">
              ${word.meaning_en ? `<p class="text-sm text-surface-200 line-clamp-1">${word.meaning_en}</p>` : ''}
              ${word.meaning_vi ? `<p class="text-sm text-red-400/70 font-medium line-clamp-1">${word.meaning_vi}</p>` : ''}
            </div>
          </div>
        `).join('') : `
          <div class="col-span-full py-20 text-center glass rounded-3xl">
            <div class="text-surface-600 mb-4 flex justify-center">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            ${wrongSet.size === 0
              ? `<p class="text-surface-400 mb-2">Chưa có từ nào làm sai.</p>
                 <p class="text-surface-500 text-sm">Khi ôn tập, các từ trả lời sai sẽ được lưu lại ở đây.</p>`
              : `<p class="text-surface-400">Không tìm thấy từ phù hợp.</p>`
            }
          </div>
        `}
      </div>
    </div>
  `;
}

export function initWrongWordsEvents(allWords, rerenderFn) {
  const searchInput = document.getElementById('wrong-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      rerenderFn();
    });
    searchInput.focus();
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }

  document.getElementById('btn-clear-all-wrong')?.addEventListener('click', () => {
    if (confirm('Xóa toàn bộ danh sách từ làm sai?')) {
      store.clearWrongWords();
      rerenderFn();
    }
  });

  document.querySelectorAll('[data-remove-wrong]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      store.removeWrongWord(btn.dataset.removeWrong);
      rerenderFn();
    });
  });

  document.querySelectorAll('[data-word]').forEach(card => {
    card.addEventListener('click', () => {
      const wordData = allWords.find(w => w.word === card.dataset.word);
      if (wordData) {
        document.getElementById('modal-root')?.remove();
        const root = document.createElement('div');
        root.id = 'modal-root';
        document.body.appendChild(root);
        root.innerHTML = renderWordModal(wordData);
        initWordModalEvents(wordData);
      }
    });
  });
}
