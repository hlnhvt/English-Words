import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';

let currentLevel = 'all';
let searchQuery = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 30;

export function renderAllWords(allWords) {
  const progress = store.getAllProgress();
  const bookmarkSet = new Set(store.getBookmarks());

  // Filter words
  const filteredWords = allWords.filter(word => {
    const matchesLevel = currentLevel === 'all' || word.level === currentLevel;
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.meaning_vi && word.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageWords = filteredWords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return `
    <div class="mx-auto px-4 pt-20 pb-10" style="max-width:1286px">
      <!-- Header Section -->
      <div class="fade-in mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-surface-100 mb-2">Tất cả từ vựng</h1>
          <p class="text-surface-400">Khám phá toàn bộ bộ từ vựng Oxford 5000.</p>
        </div>
        <div class="text-sm text-surface-500 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          Tổng cộng: <span class="text-primary-400 font-bold">${filteredWords.length}</span> từ
        </div>
      </div>

      <!-- Controls -->
      <div class="fade-in glass rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between" style="animation-delay: 0.1s">
        <div class="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <!-- Search -->
          <div class="relative w-full sm:w-64">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input type="text" id="all-search" placeholder="Tìm kiếm từ vựng..." value="${searchQuery}"
                   class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-all">
          </div>

          <!-- Level Filters -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            ${['all', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => `
              <button data-level-filter="${level}" 
                      class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                             ${currentLevel === level
      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
      : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                ${level === 'all' ? 'Tất cả' : level}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Mini Pagination -->
        ${totalPages > 1 ? `
          <div class="flex items-center gap-3">
            <button id="mini-prev" ${currentPage === 1 ? 'disabled' : ''} 
                    class="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-surface-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span class="text-xs font-medium text-surface-300">Trang ${currentPage}/${totalPages}</span>
            <button id="mini-next" ${currentPage === totalPages ? 'disabled' : ''} 
                    class="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-surface-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        ` : ''}
      </div>

      <!-- Word Table View -->
      <div class="fade-in overflow-hidden glass rounded-3xl border border-white/5 mb-8 shadow-2xl" style="animation-delay: 0.2s">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/10" style="background:#446ac3">
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Từ vựng</th>
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Phiên âm</th>
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Nghĩa Tiếng Việt</th>
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Loại từ</th>
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Cấp độ</th>
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Trạng thái</th>
                <th class="px-6 py-4 text-[11px] font-semibold uppercase whitespace-nowrap text-white">Chi tiết</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${pageWords.length > 0 ? pageWords.map(word => {
        const wordProgress = progress[word.word];
        let statusBadge = `
                  <div class="flex items-center gap-1.5 text-surface-500 text-[10px] font-bold bg-white/5 px-2.5 py-1 rounded-full w-fit whitespace-nowrap">
                    <span class="w-1.5 h-1.5 rounded-full bg-surface-600 shrink-0"></span> CHƯA HỌC
                  </div>
                `;
        if (wordProgress) {
          if (wordProgress.status === 'mastered') statusBadge = `
                    <div class="flex items-center gap-1.5 text-success-400 text-[10px] font-bold bg-success-500/10 px-2.5 py-1 rounded-full w-fit border border-success-500/20 shadow-[0_0_12px_-3px_rgba(34,197,94,0.3)] whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse shrink-0"></span> THÀNH THẠO
                    </div>
                  `;
          else statusBadge = `
                    <div class="flex items-center gap-1.5 text-warning-400 text-[10px] font-bold bg-warning-500/10 px-2.5 py-1 rounded-full w-fit border border-warning-500/20 whitespace-nowrap">
                      <span class="w-1.5 h-1.5 rounded-full bg-warning-500 shrink-0"></span> ĐANG HỌC
                    </div>
                  `;
        }

        const isBookmarked = bookmarkSet.has(word.word);
        const bookmarkBtn = isBookmarked
          ? `<button data-bookmark-btn="${word.word}" data-active="true"
                     class="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                     title="Bỏ đánh dấu">
               <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
             </button>`
          : `<button data-bookmark-btn="${word.word}" data-active="false"
                     class="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white/5 text-surface-500 hover:bg-amber-500/15 hover:text-amber-400 hover:border hover:border-amber-500/30"
                     title="Đánh dấu từ này">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
             </button>`;

        return `
                  <tr class="hover:bg-primary-600/5 transition-all duration-300 group cursor-pointer" data-word-detail="${word.word}">
                    <td class="px-6 py-5">
                      <div class="flex items-center gap-3">
                        <span class="text-lg font-bold text-surface-100 group-hover:text-primary-400 transition-colors">${word.word}</span>
                        <button data-audio-btn="${word.word}" class="w-8 h-8 rounded-full bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 flex items-center justify-center transition-all" title="Phát âm">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-sm text-surface-400 font-medium">${word.phonetic || ''}</span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-[15px] font-medium text-primary-400/90 line-clamp-1">${word.meaning_vi || '---'}</span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-[11px] px-2.5 py-1 rounded-md bg-white/10 text-surface-300 font-medium whitespace-nowrap">${word.pos[0]}</span>
                    </td>
                    <td class="px-6 py-5">
                      <span class="text-[11px] px-2.5 py-1 rounded-md level-${word.level.toLowerCase()} text-white font-bold">${word.level}</span>
                    </td>
                    <td class="px-6 py-5">
                      ${statusBadge}
                    </td>
                    <td class="px-6 py-5">
                      <div class="flex items-center justify-end gap-2">
                        ${bookmarkBtn}
                        <div class="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;
      }).join('') : `
                <tr>
                  <td colspan="7" class="px-6 py-20 text-center text-surface-500">Không tìm thấy từ vựng nào</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      ${totalPages > 1 ? `
        <div class="fade-in flex items-center justify-center gap-2" style="animation-delay: 0.3s">
          <button id="page-prev" ${currentPage === 1 ? 'disabled' : ''} 
                  class="px-4 py-2 rounded-xl bg-white/5 text-sm text-surface-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Trước
          </button>
          
          <div class="hidden sm:flex items-center gap-2 px-2">
            ${generatePageNumbers(currentPage, totalPages).map(p => `
              <button data-page="${p}" 
                      class="w-10 h-10 rounded-xl text-sm font-medium transition-all
                             ${p === currentPage
          ? 'bg-primary-600 text-white'
          : p === '...'
            ? 'text-surface-500 cursor-default'
            : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                ${p}
              </button>
            `).join('')}
          </div>

          <div class="sm:hidden text-sm text-surface-400 font-medium">
            Trang ${currentPage} / ${totalPages}
          </div>

          <button id="page-next" ${currentPage === totalPages ? 'disabled' : ''} 
                  class="px-4 py-2 rounded-xl bg-white/5 text-sm text-surface-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Sau
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function generatePageNumbers(current, total) {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
}

export function initAllWordsEvents(allWords, rerenderFn) {
  // Search
  const searchInput = document.getElementById('all-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPage = 1; // Reset to page 1 on search
      rerenderFn();
    });
    searchInput.focus();
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }

  // Level filters
  document.querySelectorAll('[data-level-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevel = btn.dataset.levelFilter;
      currentPage = 1;
      rerenderFn();
    });
  });

  // Pagination events
  const totalPages = Math.ceil(allWords.filter(word => {
    const matchesLevel = currentLevel === 'all' || word.level === currentLevel;
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (word.meaning_vi && word.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesSearch;
  }).length / ITEMS_PER_PAGE);

  document.getElementById('page-prev')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      rerenderFn();
    }
  });
  document.getElementById('mini-prev')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      rerenderFn();
    }
  });

  document.getElementById('page-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      rerenderFn();
    }
  });
  document.getElementById('mini-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      rerenderFn();
    }
  });

  document.querySelectorAll('[data-page]').forEach(btn => {
    const page = btn.dataset.page;
    if (page !== '...') {
      btn.addEventListener('click', () => {
        currentPage = parseInt(page);
        rerenderFn();
      });
    }
  });

  // Bookmark buttons — toggle without full rerender
  document.querySelectorAll('[data-bookmark-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wordText = btn.dataset.bookmarkBtn;
      const isActive = btn.dataset.active === 'true';
      if (isActive) {
        store.unbookmarkWord(wordText);
        btn.dataset.active = 'false';
        btn.title = 'Đánh dấu từ này';
        btn.className = 'w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white/5 text-surface-500 hover:bg-amber-500/15 hover:text-amber-400 hover:border hover:border-amber-500/30';
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>`;
      } else {
        store.bookmarkWord(wordText);
        btn.dataset.active = 'true';
        btn.title = 'Bỏ đánh dấu';
        btn.className = 'w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25';
        btn.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>`;
      }
    });
  });

  // Word detail modal
  document.querySelectorAll('[data-word-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      const wordText = btn.dataset.wordDetail;
      const wordData = allWords.find(w => w.word === wordText);
      if (wordData) {
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-root';
        document.body.appendChild(modalContainer);
        modalContainer.innerHTML = renderWordModal(wordData);
        initWordModalEvents(wordData);
      }
    });
  });

  // Audio buttons
  document.querySelectorAll('[data-audio-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const word = btn.dataset.audioBtn;
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    });
  });
}
