import store from '../store.js';

let currentSession = {
  words: [],
  currentIndex: 0,
  isFlipped: false,
  results: [],
};

/**
 * Render the Learn page
 */
export function renderLearn(allWords) {
  const settings = store.getSettings();
  const newWords = store.getNewWordsToLearn(allWords, settings.wordsPerDay);
  
  if (currentSession.words.length === 0 || currentSession.currentIndex >= currentSession.words.length) {
    // Start a new session or show completion
    if (newWords.length === 0) {
      return renderNoMoreWords();
    }
    currentSession = {
      words: newWords,
      currentIndex: 0,
      isFlipped: false,
      results: [],
    };
  }

  const word = currentSession.words[currentSession.currentIndex];
  const isBookmarked = store.isBookmarked(word.word);
  const total = currentSession.words.length;
  const current = currentSession.currentIndex + 1;
  const progressPct = (currentSession.currentIndex / total) * 100;

  return `
    <div class="max-w-2xl mx-auto px-4 pt-20 pb-10">
      <!-- Session Header -->
      <div class="fade-in mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-bold text-surface-100">Học từ mới</h2>
            <p class="text-xs text-surface-400">Nhấn vào thẻ để xem nghĩa</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-primary-400">${current}</span>
            <span class="text-xs text-surface-500">/</span>
            <span class="text-sm text-surface-400">${total}</span>
          </div>
        </div>
        <!-- Progress bar -->
        <div class="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
               style="width: ${progressPct}%"></div>
        </div>
      </div>

      <!-- Level Filter -->
      <div class="fade-in flex flex-wrap gap-2 mb-6" style="animation-delay: 0.05s">
        ${['all', 'A1', 'A2', 'B1', 'B2', 'C1'].map(level => `
          <button data-filter-level="${level}" 
                  class="px-3 py-1 rounded-lg text-xs font-medium transition-all
                         ${settings.currentLevelFilter === level 
                           ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' 
                           : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
            ${level === 'all' ? 'Tất cả' : level}
          </button>
        `).join('')}
      </div>

      <!-- Flashcard -->
      <div class="card-flip mb-6" style="min-height: 320px" id="flashcard-container">
        <div id="flashcard-inner" class="card-flip-inner w-full ${currentSession.isFlipped ? 'flipped' : ''}" style="min-height: 320px">
          <!-- Front -->
          <div class="card-front">
            <div class="glass rounded-3xl p-6 sm:p-8 h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/8 transition-all relative"
                 style="min-height: 320px" id="card-front">
              <button id="btn-bookmark-front" data-learn-bookmark="${word.word}" data-active="${isBookmarked}"
                      class="btn-hover absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isBookmarked ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-surface-500 hover:bg-amber-500/10 hover:text-amber-400'}"
                      title="${isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu từ này'}">
                <svg class="w-4 h-4" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
              </button>
              <div class="mb-3">
                <span class="text-[10px] px-2 py-1 rounded-full level-${word.level.toLowerCase()} text-white font-medium">${word.level}</span>
                <span class="text-[10px] px-2 py-1 rounded-full bg-white/10 text-surface-300 ml-1">${word.pos.join(', ')}</span>
              </div>
              <h2 class="text-3xl sm:text-4xl font-bold text-surface-100 mb-2">${word.word}</h2>
              <p class="text-sm text-surface-400 mb-4">${word.phonetic || ''}</p>
              <button id="btn-pronounce" class="btn-hover w-12 h-12 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center hover:bg-primary-600/30 transition-all mb-4" title="Phát âm">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
              </button>
              <p class="text-xs text-surface-500">Nhấn để xem nghĩa ↓</p>
            </div>
          </div>

          <!-- Back -->
          <div class="card-back">
            <div class="glass rounded-3xl p-6 sm:p-8 h-full flex flex-col cursor-pointer hover:bg-white/8 transition-all overflow-y-auto"
                 style="min-height: 320px" id="card-back">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-2xl font-bold text-surface-100">${word.word}</h2>
                  <span class="text-xs text-surface-400">${word.pos.join(', ')} · ${word.level}</span>
                </div>
                <div class="flex items-center gap-2">
                  <button id="btn-bookmark-back" data-learn-bookmark="${word.word}" data-active="${isBookmarked}"
                          class="btn-hover w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isBookmarked ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-surface-500 hover:bg-amber-500/10 hover:text-amber-400'}"
                          title="${isBookmarked ? 'Bỏ đánh dấu' : 'Đánh dấu từ này'}">
                    <svg class="w-4 h-4" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                  </button>
                  <button id="btn-pronounce-back" class="btn-hover w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                  </button>
                </div>
              </div>
              
              <!-- Meanings -->
              <div class="space-y-4 flex-1 text-left">
                ${(word.meaning_en || word.meaning_vi || word.meaning_vi_detail) ? `
                  <div class="glass bg-white/3 rounded-2xl p-4 mb-4">
                    ${word.meaning_vi ? `
                      <p class="text-[15px] font-semibold text-primary-400 ${word.meaning_en || word.meaning_vi_detail ? 'mb-3 pb-3 border-b border-white/5' : ''}">${word.meaning_vi}</p>
                    ` : ''}
                    ${word.meaning_en ? `<p class="text-base font-bold text-surface-100 mb-1">${word.meaning_en}</p>` : ''}
                    ${word.meaning_vi_detail ? `<p class="text-sm text-surface-300 leading-relaxed">${word.meaning_vi_detail}</p>` : ''}
                  </div>
                ` : ''}
                
                ${word.examples && word.examples.length > 0 ? `
                  <div>
                    <ul class="space-y-3">
                      ${word.examples.map(ex => `
                        <li class="flex items-start gap-2">
                          <span class="text-surface-500 mt-1 font-bold">•</span>
                          <div>
                            <p class="text-sm text-surface-200 italic mb-0.5">${ex.en}</p>
                            ${ex.vi ? `<p class="text-sm text-surface-400">${ex.vi}</p>` : ''}
                          </div>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>

              <p class="text-xs text-surface-500 text-center mt-3">Nhấn để quay lại ↑</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rating Buttons -->
      <div class="fade-in flex gap-3 justify-center" style="animation-delay: 0.2s" id="rating-buttons">
        <button data-quality="1" class="btn-hover flex-1 max-w-[140px] py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-medium text-sm border border-red-500/20 transition-all">
          <span class="block text-lg mb-0.5 flex justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></span>
          Khó
        </button>
        <button data-quality="3" class="btn-hover flex-1 max-w-[140px] py-3 px-4 rounded-xl bg-warning-500/15 hover:bg-warning-500/25 text-warning-400 font-medium text-sm border border-warning-500/20 transition-all">
          <span class="block text-lg mb-0.5 flex justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
          Bình thường
        </button>
        <button data-quality="5" class="btn-hover flex-1 max-w-[140px] py-3 px-4 rounded-xl bg-success-500/15 hover:bg-success-500/25 text-success-400 font-medium text-sm border border-success-500/20 transition-all">
          <span class="block text-lg mb-0.5 flex justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
          Dễ
        </button>
      </div>

      <!-- Navigation -->
      <div class="fade-in flex justify-between mt-6" style="animation-delay: 0.25s">
        <button id="btn-prev" class="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all ${currentSession.currentIndex === 0 ? 'invisible' : ''}" >
          ← Trước
        </button>
        <button id="btn-skip" class="px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all">
          Bỏ qua →
        </button>
      </div>
    </div>
  `;
}

function renderNoMoreWords() {
  return `
    <div class="max-w-2xl mx-auto px-4 pt-20 pb-10">
      <div class="fade-in text-center py-16">
        <div class="text-primary-400 mb-4 flex justify-center"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div>
        <h2 class="text-2xl font-bold text-surface-100 mb-3">Tuyệt vời!</h2>
        <p class="text-surface-400 mb-2">Bạn đã hoàn thành tất cả từ mới trong bộ lọc hiện tại.</p>
        <p class="text-surface-500 text-sm mb-6">Hãy thử chọn cấp độ khác hoặc ôn tập các từ đã học.</p>
        <div class="flex gap-3 justify-center flex-wrap">
          <a href="#/review" class="btn-hover flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium shadow-lg shadow-primary-600/25">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Ôn tập ngay
          </a>
          <a href="#/" class="btn-hover flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-surface-200 rounded-xl font-medium border border-white/10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> Về trang chủ
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderSessionComplete() {
  const correct = currentSession.results.filter(r => r >= 3).length;
  const total = currentSession.results.length;
  const pct = Math.round((correct / total) * 100);

  return `
    <div class="max-w-2xl mx-auto px-4 pt-20 pb-10">
      <div class="fade-in text-center py-8">
        <div class="text-primary-400 mb-4 flex justify-center"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>
        <h2 class="text-2xl font-bold text-surface-100 mb-2">Phiên học hoàn thành!</h2>
        <p class="text-surface-400 mb-6">Bạn đã học ${total} từ mới</p>
        
        <div class="glass rounded-2xl p-6 max-w-sm mx-auto mb-6">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-success-400">${correct}</div>
              <div class="text-xs text-surface-400">Dễ hiểu</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-warning-400">${currentSession.results.filter(r => r === 3).length}</div>
              <div class="text-xs text-surface-400">Bình thường</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-red-400">${currentSession.results.filter(r => r < 3).length}</div>
              <div class="text-xs text-surface-400">Cần ôn thêm</div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 justify-center flex-wrap">
          <button id="btn-new-session" class="btn-hover flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium shadow-lg shadow-primary-600/25">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> Học thêm
          </button>
          <a href="#/review" class="btn-hover flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-surface-200 rounded-xl font-medium border border-white/10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Ôn tập
          </a>
          <a href="#/" class="btn-hover flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-surface-200 rounded-xl font-medium border border-white/10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> Trang chủ
          </a>
        </div>
      </div>
    </div>
  `;
}

export function initLearnEvents(allWords, rerenderFn) {
  // Flashcard flip
  const cardFront = document.getElementById('card-front');
  const cardBack = document.getElementById('card-back');
  const cardInner = document.getElementById('flashcard-inner');

  function flipCard() {
    if (cardInner) {
      currentSession.isFlipped = !currentSession.isFlipped;
      cardInner.classList.toggle('flipped', currentSession.isFlipped);
    }
  }

  if (cardFront) cardFront.addEventListener('click', flipCard);
  if (cardBack) cardBack.addEventListener('click', flipCard);

  // Pronunciation
  function pronounce() {
    const word = currentSession.words[currentSession.currentIndex];
    if (word && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(word.word);
      utter.lang = 'en-US';
      utter.rate = 0.8;
      speechSynthesis.speak(utter);
    }
  }

  document.getElementById('btn-pronounce')?.addEventListener('click', (e) => {
    e.stopPropagation();
    pronounce();
  });
  document.getElementById('btn-pronounce-back')?.addEventListener('click', (e) => {
    e.stopPropagation();
    pronounce();
  });

  // Rating buttons
  document.querySelectorAll('[data-quality]').forEach(btn => {
    btn.addEventListener('click', () => {
      const quality = parseInt(btn.dataset.quality);
      const word = currentSession.words[currentSession.currentIndex];
      
      store.markWordLearned(word.word, quality);
      currentSession.results.push(quality);
      currentSession.currentIndex++;
      currentSession.isFlipped = false;

      if (currentSession.currentIndex >= currentSession.words.length) {
        // Session complete
        const app = document.getElementById('app');
        app.innerHTML = renderSessionComplete() ;
        document.getElementById('btn-new-session')?.addEventListener('click', () => {
          currentSession = { words: [], currentIndex: 0, isFlipped: false, results: [] };
          rerenderFn();
        });
      } else {
        rerenderFn();
      }
    });
  });

  // Navigation
  document.getElementById('btn-prev')?.addEventListener('click', () => {
    if (currentSession.currentIndex > 0) {
      currentSession.currentIndex--;
      currentSession.isFlipped = false;
      rerenderFn();
    }
  });

  document.getElementById('btn-skip')?.addEventListener('click', () => {
    currentSession.currentIndex++;
    currentSession.isFlipped = false;
    if (currentSession.currentIndex >= currentSession.words.length) {
      const app = document.getElementById('app');
      app.innerHTML = renderSessionComplete();
      document.getElementById('btn-new-session')?.addEventListener('click', () => {
        currentSession = { words: [], currentIndex: 0, isFlipped: false, results: [] };
        rerenderFn();
      });
    } else {
      rerenderFn();
    }
  });

  // Bookmark toggle
  document.querySelectorAll('[data-learn-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wordText = btn.dataset.learnBookmark;
      const isActive = btn.dataset.active === 'true';
      if (isActive) {
        store.unbookmarkWord(wordText);
      } else {
        store.bookmarkWord(wordText);
      }
      const newActive = !isActive;
      document.querySelectorAll('[data-learn-bookmark]').forEach(b => {
        const isAbsolute = b.id === 'btn-bookmark-front';
        b.dataset.active = String(newActive);
        b.title = newActive ? 'Bỏ đánh dấu' : 'Đánh dấu từ này';
        const base = `btn-hover w-9 h-9 rounded-xl flex items-center justify-center transition-all${isAbsolute ? ' absolute top-3 right-3' : ''}`;
        b.className = newActive ? `${base} bg-amber-500/15 text-amber-400` : `${base} bg-white/5 text-surface-500 hover:bg-amber-500/10 hover:text-amber-400`;
        b.innerHTML = `<svg class="w-4 h-4" fill="${newActive ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>`;
      });
    });
  });

  // Level filter
  document.querySelectorAll('[data-filter-level]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.updateSettings({ currentLevelFilter: btn.dataset.filterLevel });
      currentSession = { words: [], currentIndex: 0, isFlipped: false, results: [] };
      rerenderFn();
    });
  });
}

export function resetLearnSession() {
  currentSession = { words: [], currentIndex: 0, isFlipped: false, results: [] };
}
