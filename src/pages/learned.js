import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';

let currentFilter = 'all'; // all, easy, medium, hard
let currentDateFilter = 'all'; // all, today, yesterday, daybeforeyesterday, week, month, custom
let customDate = '';
let searchQuery = '';

export function renderLearned(allWords) {
  const learnedWords = store.getLearnedWords(allWords);
  
  const filteredWords = learnedWords.filter(word => {
    // Difficulty filter
    let matchesDifficulty = true;
    if (currentFilter === 'easy') matchesDifficulty = word.lastRating === 5;
    else if (currentFilter === 'medium') matchesDifficulty = word.lastRating === 3;
    else if (currentFilter === 'hard') matchesDifficulty = word.lastRating === 1;

    // Date filter
    let matchesDate = true;
    if (currentDateFilter !== 'all') {
      const learnDate = word.firstLearned || word.lastReviewed;
      if (!learnDate) {
        matchesDate = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(learnDate);
        d.setHours(0, 0, 0, 0);
        const daysDiff = Math.round((today - d) / (1000 * 60 * 60 * 24));
        if (currentDateFilter === 'today') matchesDate = daysDiff === 0;
        else if (currentDateFilter === 'yesterday') matchesDate = daysDiff === 1;
        else if (currentDateFilter === 'daybeforeyesterday') matchesDate = daysDiff === 2;
        else if (currentDateFilter === 'week') matchesDate = daysDiff <= 7;
        else if (currentDateFilter === 'month') matchesDate = daysDiff <= 30;
        else if (currentDateFilter === 'custom') matchesDate = learnDate === customDate;
      }
    }

    // Search filter
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (word.meaning_vi && word.meaning_vi.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDifficulty && matchesDate && matchesSearch;
  });

  return `
    <div class="max-w-4xl mx-auto px-4 pt-20 pb-10">
      <!-- Header Section -->
      <div class="fade-in mb-8">
        <h1 class="text-3xl font-bold text-surface-100 mb-2">Từ vựng đã học</h1>
        <p class="text-surface-400">Danh sách các từ bạn đã bắt đầu học và phân loại mức độ.</p>
      </div>

      <!-- Controls -->
      <div class="fade-in glass rounded-2xl p-4 mb-8 flex flex-col gap-3" style="animation-delay: 0.1s">
        <!-- Row 1: Search + Difficulty -->
        <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
          <!-- Search -->
          <div class="relative w-full md:w-64">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span>
            <input type="text" id="learned-search" placeholder="Tìm kiếm từ vựng..." value="${searchQuery}"
                   class="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-all">
          </div>

          <!-- Difficulty Filters -->
          <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span class="text-xs font-medium text-surface-500 uppercase tracking-wider mr-1 whitespace-nowrap">Mức độ:</span>
            ${[
              { id: 'all', label: 'Tất cả' },
              { id: 'easy', label: 'Dễ' },
              { id: 'medium', label: 'Bình thường' },
              { id: 'hard', label: 'Khó' }
            ].map(filter => `
              <button data-filter="${filter.id}"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                             ${currentFilter === filter.id
                               ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                               : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                ${filter.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Row 2: Date Filter -->
        <div class="flex items-center gap-2 overflow-x-auto border-t border-white/5 pt-3">
          <span class="text-xs font-medium text-surface-500 uppercase tracking-wider mr-1 whitespace-nowrap">Ngày học:</span>
          ${[
            { id: 'all', label: 'Tất cả' },
            { id: 'today', label: 'Hôm nay' },
            { id: 'yesterday', label: 'Hôm qua' },
            { id: 'daybeforeyesterday', label: 'Hôm kia' },
            { id: 'week', label: '7 ngày qua' },
            { id: 'month', label: '30 ngày qua' }
          ].map(f => `
            <button data-date-filter="${f.id}"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                           ${currentDateFilter === f.id
                             ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                             : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
              ${f.label}
            </button>
          `).join('')}
          <input type="date" id="date-picker" value="${customDate}"
                 class="ml-1 bg-white/5 border ${currentDateFilter === 'custom' ? 'border-primary-500 text-primary-300' : 'border-white/10 text-surface-400'} rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-primary-500 transition-all cursor-pointer">
        </div>
      </div>

      <!-- Word List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="learned-list">
        ${filteredWords.length > 0 ? filteredWords.map((word, index) => `
          <div class="fade-in glass rounded-2xl p-5 hover:bg-white/8 transition-all border border-white/5 hover:border-primary-500/30 group cursor-pointer${word.bookmarked ? ' border-amber-500/20' : ''}"
               data-word="${word.word}"
               style="animation-delay: ${0.2 + (index % 10) * 0.05}s">
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[10px] px-2 py-0.5 rounded-full level-${word.level.toLowerCase()} text-white font-medium uppercase">${word.level}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-surface-400">${word.pos[0]}</span>
                ${word.bookmarked ? `<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-0.5"><svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg></span>` : ''}
              </div>
              <div class="flex items-center gap-1.5">
                <!-- Difficulty Badge -->
                ${word.lastRating === 5 ? '<span class="text-[10px] font-bold text-success-400 px-2 py-0.5 rounded-lg bg-success-500/10 border border-success-500/20">DỄ</span>' : ''}
                ${word.lastRating === 3 ? '<span class="text-[10px] font-bold text-warning-400 px-2 py-0.5 rounded-lg bg-warning-500/10 border border-warning-500/20">BÌNH THƯỜNG</span>' : ''}
                ${word.lastRating === 1 ? '<span class="text-[10px] font-bold text-red-400 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20">KHÓ</span>' : ''}
                ${word.bookmarked ? `<button data-unbookmark="${word.word}" title="Bỏ đánh dấu"
                  class="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 text-surface-500 hover:bg-red-500/15 hover:text-red-400 transition-all">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>` : ''}
              </div>
            </div>
            <h3 class="text-xl font-bold text-surface-100 mb-1 group-hover:text-primary-400 transition-colors">${word.word}</h3>
            <p class="text-xs text-surface-500 italic mb-3">${word.phonetic || ''}</p>
            <div class="space-y-1">
              ${word.meaning_en ? `<p class="text-sm text-surface-200 line-clamp-1">${word.meaning_en}</p>` : ''}
              ${word.meaning_vi ? `<p class="text-sm text-primary-400/80 font-medium line-clamp-1">${word.meaning_vi}</p>` : ''}
            </div>

            <div class="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-surface-500">
              <span>${word.firstLearned ? `Học ngày: ${word.firstLearned}` : 'Đã đánh dấu'}</span>
              <span>${word.interval ? `Ôn tập: ${word.interval} ngày` : ''}</span>
            </div>
          </div>
        `).join('') : `
          <div class="col-span-full py-20 text-center glass rounded-3xl">
            <div class="text-surface-600 mb-4 flex justify-center">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p class="text-surface-400">Không tìm thấy từ vựng nào phù hợp.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

export function initLearnedEvents(allWords, rerenderFn) {
  // Search event
  const searchInput = document.getElementById('learned-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      rerenderFn();
    });
    // Keep focus after rerender
    searchInput.focus();
    const len = searchInput.value.length;
    searchInput.setSelectionRange(len, len);
  }

  // Difficulty filter events
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      rerenderFn();
    });
  });

  // Date filter button events
  document.querySelectorAll('[data-date-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDateFilter = btn.dataset.dateFilter;
      customDate = '';
      rerenderFn();
    });
  });

  // Date picker event
  const datePicker = document.getElementById('date-picker');
  if (datePicker) {
    datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        customDate = e.target.value;
        currentDateFilter = 'custom';
      } else {
        customDate = '';
        currentDateFilter = 'all';
      }
      rerenderFn();
    });
  }

  // Unbookmark events
  document.querySelectorAll('[data-unbookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wordText = btn.dataset.unbookmark;
      store.unbookmarkWord(wordText);
      rerenderFn();
    });
  });

  // Word click events (Modal)
  document.querySelectorAll('[data-word]').forEach(card => {
    card.addEventListener('click', () => {
      const wordText = card.dataset.word;
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
}
