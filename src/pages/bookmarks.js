import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';

let searchQuery = '';

export function renderBookmarks(allWords) {
  const bookmarkSet = new Set(store.getBookmarks());

  const bookmarkedWords = allWords
    .filter(w => bookmarkSet.has(w.word))
    .filter(w => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return w.word.toLowerCase().includes(q) ||
             (w.meaning_vi && w.meaning_vi.toLowerCase().includes(q));
    });

  return `
    <div class="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <!-- Header -->
      <div class="fade-in mb-8">
        <h1 class="text-3xl font-bold text-surface-100 mb-2">Từ đã lưu</h1>
        <p class="text-surface-400">Danh sách các từ bạn đã đánh dấu để học sau.</p>
      </div>

      <!-- Controls -->
      <div class="fade-in glass rounded-2xl p-4 mb-8 flex items-center gap-4" style="animation-delay: 0.1s">
        <div class="relative flex-1 max-w-xs">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input type="text" id="bookmarks-search" placeholder="Tìm kiếm từ vựng..." value="${searchQuery}"
                 class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-all">
        </div>
        <span class="text-sm text-surface-500 whitespace-nowrap">${bookmarkSet.size} từ đã lưu</span>
      </div>

      <!-- Word List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${bookmarkedWords.length > 0 ? bookmarkedWords.map((word, index) => `
          <div class="fade-in glass rounded-2xl p-5 hover:bg-white/8 transition-all border border-amber-500/15 hover:border-amber-500/35 group cursor-pointer"
               data-word="${word.word}"
               style="animation-delay: ${0.2 + (index % 10) * 0.05}s">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[10px] px-2 py-0.5 rounded-full level-${word.level.toLowerCase()} text-white font-medium uppercase">${word.level}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-surface-400">${word.pos[0]}</span>
              </div>
              <button data-unbookmark="${word.word}" title="Bỏ đánh dấu"
                class="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-400 hover:bg-red-500/15 hover:text-red-400 transition-all border border-amber-500/25">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </button>
            </div>
            <h3 class="text-xl font-bold text-surface-100 mb-1 group-hover:text-amber-400 transition-colors">${word.word}</h3>
            <p class="text-xs text-surface-500 italic mb-3">${word.phonetic || ''}</p>
            <div class="space-y-1">
              ${word.meaning_en ? `<p class="text-sm text-surface-200 line-clamp-1">${word.meaning_en}</p>` : ''}
              ${word.meaning_vi ? `<p class="text-sm text-primary-400/80 font-medium line-clamp-1">${word.meaning_vi}</p>` : ''}
            </div>
          </div>
        `).join('') : `
          <div class="col-span-full py-20 text-center glass rounded-3xl">
            <div class="text-surface-600 mb-4 flex justify-center">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            </div>
            ${bookmarkSet.size === 0
              ? `<p class="text-surface-400 mb-2">Bạn chưa đánh dấu từ nào.</p>
                 <p class="text-surface-500 text-sm">Nhấn biểu tượng đánh dấu ở trang <a href="#/learn" class="text-primary-400 hover:underline">Học từ mới</a> hoặc <a href="#/all-words" class="text-primary-400 hover:underline">Tất cả từ vựng</a> để lưu từ.</p>`
              : `<p class="text-surface-400">Không tìm thấy từ phù hợp.</p>`
            }
          </div>
        `}
      </div>
    </div>
  `;
}

export function initBookmarksEvents(allWords, rerenderFn) {
  const searchInput = document.getElementById('bookmarks-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      rerenderFn();
    });
    searchInput.focus();
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }

  document.querySelectorAll('[data-unbookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.unbookmarkWord(btn.dataset.unbookmark);
      rerenderFn();
    });
  });

  document.querySelectorAll('[data-word]').forEach(card => {
    card.addEventListener('click', () => {
      const wordData = allWords.find(w => w.word === card.dataset.word);
      if (wordData) {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-root';
        document.body.appendChild(modalContainer);
        modalContainer.innerHTML = renderWordModal(wordData);
        initWordModalEvents(wordData);
      }
    });
  });
}
