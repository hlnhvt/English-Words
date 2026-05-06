import store from '../store.js';

function getToday() { return new Date().toISOString().split('T')[0]; }
function getFirstDayOfMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
}

let reviewConfig = {
  questionCount: 20,
  levelFilter: 'all',
  dateFilter: 'all',   // all | today | week | month | range
  dateFrom: getFirstDayOfMonth(),
  dateTo: getToday(),
  bookmarkedOnly: false,
  mode: 'quiz',
  showResultImmediately: true,
};

let reviewSession = {
  phase: 'setup',      // setup | reviewing | complete
  words: [],
  currentIndex: 0,
  score: { correct: 0, wrong: 0 },
  answered: false,
  answers: [],         // [{word, correct, selectedMeaning, correctMeaning}]
};

// ─── Pool builder ────────────────────────────────────────────────────────────

function buildWordPool(allWords) {
  const progress = store.getAllProgress();
  const bookmarkSet = new Set(store.getBookmarks());

  let pool = allWords.filter(word => {
    const p = progress[word.word];
    const hasProgress = !!p;
    const isBookmarked = bookmarkSet.has(word.word);
    if (!hasProgress && !isBookmarked) return false;
    if (reviewConfig.levelFilter !== 'all' && word.level !== reviewConfig.levelFilter) return false;
    if (reviewConfig.bookmarkedOnly && !isBookmarked) return false;

    if (reviewConfig.dateFilter !== 'all') {
      if (!hasProgress) return false;
      const learnDate = p.firstLearned;
      if (!learnDate) return false;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d = new Date(learnDate); d.setHours(0, 0, 0, 0);
      const days = Math.round((today - d) / 86400000);
      if (reviewConfig.dateFilter === 'today' && days !== 0) return false;
      if (reviewConfig.dateFilter === 'week' && days > 7) return false;
      if (reviewConfig.dateFilter === 'month' && days > 30) return false;
      if (reviewConfig.dateFilter === 'range') {
        if (reviewConfig.dateFrom && learnDate < reviewConfig.dateFrom) return false;
        if (reviewConfig.dateTo && learnDate > reviewConfig.dateTo) return false;
      }
    }
    return true;
  });

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return reviewConfig.questionCount === 'all' ? pool : pool.slice(0, reviewConfig.questionCount);
}

// ─── Public entry ────────────────────────────────────────────────────────────

export function renderReview(allWords) {
  if (reviewSession.phase === 'setup') return renderSetupScreen(allWords);
  if (reviewSession.phase === 'complete') return renderReviewComplete(allWords);
  if (reviewSession.currentIndex >= reviewSession.words.length) {
    reviewSession.phase = 'complete';
    return renderReviewComplete(allWords);
  }
  return renderReviewScreen(allWords);
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function renderSetupScreen(allWords) {
  const poolSize = buildWordPool(allWords).length;
  const canStart = poolSize > 0;

  const pill = (active) =>
    `class="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
            ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}"`;

  return `
    <div class="max-w-xl mx-auto px-4 pt-20 pb-10">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Thiết lập ôn tập</h2>
        <p class="text-sm text-surface-400">Chọn phạm vi từ vựng và cách ôn tập</p>
      </div>

      <div class="space-y-3">
        <!-- Question Count -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.05s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Số câu hỏi</h3>
          <div class="flex flex-wrap gap-2">
            ${[10, 20, 30, 50, 'all'].map(n => `
              <button data-q-count="${n}" ${pill(reviewConfig.questionCount === n)}>
                ${n === 'all' ? 'Tất cả' : n}
              </button>`).join('')}
          </div>
        </div>

        <!-- Level -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.1s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Cấp độ từ</h3>
          <div class="flex flex-wrap gap-2">
            ${['all','A1','A2','B1','B2','C1'].map(lvl => `
              <button data-setup-level="${lvl}" ${pill(reviewConfig.levelFilter === lvl)}>
                ${lvl === 'all' ? 'Tất cả' : lvl}
              </button>`).join('')}
          </div>
        </div>

        <!-- Date -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.15s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Thời gian học</h3>
          <div class="flex gap-2 overflow-x-auto pb-1 mb-3">
            ${[
              { id: 'all',   label: 'Tất cả' },
              { id: 'today', label: 'Hôm nay' },
              { id: 'week',  label: '7 ngày qua' },
              { id: 'month', label: '30 ngày qua' },
              { id: 'range', label: 'Khoảng ngày' },
            ].map(f => `
              <button data-setup-date="${f.id}" ${pill(reviewConfig.dateFilter === f.id)}>
                ${f.label}
              </button>`).join('')}
          </div>
          ${reviewConfig.dateFilter === 'range' ? `
            <div class="flex items-center gap-2 overflow-x-auto mt-1">
              <span class="text-xs text-surface-500 whitespace-nowrap">Từ ngày</span>
              <input type="date" id="date-from" value="${reviewConfig.dateFrom}"
                     class="bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-surface-300 focus:outline-none focus:border-primary-500 transition-all cursor-pointer">
              <span class="text-xs text-surface-500">đến ngày</span>
              <input type="date" id="date-to" value="${reviewConfig.dateTo}"
                     class="bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-surface-300 focus:outline-none focus:border-primary-500 transition-all cursor-pointer">
            </div>
          ` : ''}
        </div>

        <!-- Mode + extras -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.2s">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Mode -->
            <div>
              <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Chế độ ôn tập</h3>
              <div class="flex gap-2">
                <button data-setup-mode="quiz"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all
                               ${reviewConfig.mode === 'quiz' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Quiz
                </button>
                <button data-setup-mode="flashcard"
                        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all
                               ${reviewConfig.mode === 'flashcard' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"/></svg>
                  Flashcard
                </button>
              </div>
              ${reviewConfig.mode === 'quiz' ? `
                <div class="mt-3 pt-3 border-t border-white/5">
                  <p class="text-xs text-surface-500 mb-2">Công bố kết quả</p>
                  <div class="flex gap-2">
                    <button data-show-result="true"
                            class="flex-1 py-2 rounded-xl text-xs font-medium transition-all
                                   ${reviewConfig.showResultImmediately ? 'bg-primary-600 text-white' : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                      Ngay khi trả lời
                    </button>
                    <button data-show-result="false"
                            class="flex-1 py-2 rounded-xl text-xs font-medium transition-all
                                   ${!reviewConfig.showResultImmediately ? 'bg-primary-600 text-white' : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
                      Sau khi hoàn thành
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Bookmark -->
            <div>
              <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Bộ lọc thêm</h3>
              <button id="toggle-bookmarked"
                      class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                             ${reviewConfig.bookmarkedOnly
                               ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                               : 'bg-white/5 text-surface-400 hover:bg-white/10 border border-white/5'}">
                <svg class="w-4 h-4 shrink-0" fill="${reviewConfig.bookmarkedOnly ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                </svg>
                Chỉ từ đã lưu
                <span class="ml-auto w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                             ${reviewConfig.bookmarkedOnly ? 'bg-amber-500 border-amber-500' : 'border-surface-600'}">
                  ${reviewConfig.bookmarkedOnly
                    ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>'
                    : ''}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Start -->
        <div class="fade-in pt-1" style="animation-delay:.25s">
          <p class="text-sm px-1 mb-3 ${canStart ? 'text-surface-400' : 'text-red-400/80'}">
            ${canStart
              ? `<span class="font-bold text-primary-400">${poolSize}</span> từ phù hợp với bộ lọc`
              : 'Không có từ nào phù hợp — hãy thử thay đổi bộ lọc'}
          </p>
          <button id="btn-start-review" ${canStart ? '' : 'disabled'}
                  class="w-full py-4 rounded-2xl font-bold text-base transition-all
                         ${canStart
                           ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 active:scale-[0.99]'
                           : 'bg-white/5 text-surface-600 cursor-not-allowed'}">
            Bắt đầu ôn tập →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Review screen ────────────────────────────────────────────────────────────

function renderReviewScreen(allWords) {
  const word = reviewSession.words[reviewSession.currentIndex];
  const total = reviewSession.words.length;
  const current = reviewSession.currentIndex + 1;

  return `
    <div class="max-w-2xl mx-auto px-4 pt-20 pb-10">
      <div class="fade-in mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-bold text-surface-100">Ôn tập</h2>
            <p class="text-xs text-surface-400">${current} / ${total}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg bg-success-500/15 text-success-400 font-semibold text-xs">${reviewSession.score.correct} đúng</span>
            <span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 font-semibold text-xs">${reviewSession.score.wrong} sai</span>
            <button id="btn-exit-review" class="px-3 py-1.5 rounded-lg text-xs text-surface-500 hover:text-surface-300 hover:bg-white/5 transition-all">
              Thoát
            </button>
          </div>
        </div>
        <div class="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-accent-500 to-primary-500 rounded-full transition-all duration-500"
               style="width:${(current / total) * 100}%"></div>
        </div>
      </div>

      ${reviewConfig.mode === 'quiz' ? renderQuizMode(word, allWords) : renderFlashcardMode(word)}
    </div>
  `;
}

// ─── Quiz mode ────────────────────────────────────────────────────────────────

function renderQuizMode(word, allWords) {
  const correctAnswer = word.word;
  let wrongOptions = allWords
    .filter(w => w.word !== word.word && w.pos.some(p => word.pos.includes(p)))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.word);

  if (wrongOptions.length < 3) {
    const more = allWords
      .filter(w => w.word !== word.word && !wrongOptions.includes(w.word))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 - wrongOptions.length)
      .map(w => w.word);
    wrongOptions.push(...more);
  }

  const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);
  window._reviewCorrectAnswer = correctAnswer;

  return `
    <div class="fade-in">
      <div class="glass rounded-3xl p-6 sm:p-8 text-center mb-5">
        <div class="mb-3">
          <span class="text-[10px] px-2 py-1 rounded-full level-${word.level.toLowerCase()} text-white font-medium">${word.level}</span>
          <span class="text-[10px] px-2 py-1 rounded-full bg-white/10 text-surface-300 ml-1">${word.pos.join(', ')}</span>
        </div>
        <h2 class="text-3xl font-bold text-surface-100 mb-2">${word.word}</h2>
        <p class="text-sm text-surface-400">${word.phonetic || ''}</p>
        <button id="btn-quiz-pronounce"
                class="btn-hover mt-3 w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center mx-auto hover:bg-primary-600/30">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        </button>
        <p class="text-sm text-surface-300 mt-4">Nghĩa của từ này là gì?</p>
      </div>

      <div class="space-y-2.5" id="quiz-options">
        ${options.map((opt, i) => {
          const optWord = allWords.find(w => w.word === opt);
          const displayMeaning = optWord?.meaning_vi || optWord?.meaning_en || opt;
          return `
            <button data-answer="${opt}"
                    class="quiz-option w-full text-left px-5 py-3.5 rounded-xl glass hover:bg-white/8 transition-all
                           border border-white/5 text-sm text-surface-200 font-medium flex items-center gap-3">
              <span class="option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full
                           bg-white/8 text-surface-400 text-xs font-bold"
                    data-letter="${String.fromCharCode(65 + i)}">
                ${String.fromCharCode(65 + i)}
              </span>
              <span class="option-text">${displayMeaning}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div id="quiz-next" class="hidden mt-6 text-center">
        <button id="btn-quiz-next"
                class="btn-hover px-8 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium text-sm transition-all">
          Tiếp theo →
        </button>
      </div>
    </div>
  `;
}

// ─── Flashcard mode ───────────────────────────────────────────────────────────

function renderFlashcardMode(word) {
  return `
    <div class="card-flip mb-6" style="min-height:300px">
      <div id="review-card-inner" class="card-flip-inner w-full" style="min-height:300px">
        <div class="card-front">
          <div class="glass rounded-3xl p-6 sm:p-8 h-full flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/8 transition-all"
               style="min-height:300px" id="review-card-front">
            <span class="text-[10px] px-2 py-1 rounded-full level-${word.level.toLowerCase()} text-white font-medium mb-3">${word.level}</span>
            <h2 class="text-3xl font-bold text-surface-100 mb-1">${word.word}</h2>
            <p class="text-sm text-surface-400 mb-4">${word.pos.join(', ')}</p>
            <button id="btn-review-pronounce"
                    class="btn-hover w-10 h-10 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center hover:bg-primary-600/30 mb-4">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            </button>
            <p class="text-xs text-surface-500">Nhấn để xem nghĩa</p>
          </div>
        </div>
        <div class="card-back">
          <div class="glass rounded-3xl p-6 sm:p-8 h-full flex flex-col cursor-pointer hover:bg-white/8 transition-all overflow-y-auto"
               style="min-height:300px" id="review-card-back">
            <h2 class="text-2xl font-bold text-surface-100 mb-1">${word.word}</h2>
            <span class="text-xs text-surface-400 mb-4">${word.pos.join(', ')} · ${word.level}</span>
            <div class="space-y-4 flex-1 text-left">
              ${(word.meaning_en || word.meaning_vi) ? `
                <div>
                  ${word.meaning_en ? `<p class="text-lg font-bold text-surface-100 mb-1">${word.meaning_en}</p>` : ''}
                  ${word.meaning_vi ? `<p class="text-[15px] font-medium text-primary-400">${word.meaning_vi}</p>` : ''}
                </div>` : ''}
              ${word.examples?.length > 0 ? `
                <ul class="space-y-3">
                  ${word.examples.map(ex => `
                    <li class="flex items-start gap-2">
                      <span class="text-surface-500 mt-1">•</span>
                      <div>
                        <p class="text-sm text-surface-200 italic mb-0.5">${ex.en}</p>
                        ${ex.vi ? `<p class="text-sm text-surface-400">${ex.vi}</p>` : ''}
                      </div>
                    </li>`).join('')}
                </ul>` : ''}
            </div>
            <p class="text-xs text-surface-500 text-center mt-3">Nhấn để quay lại ↑</p>
          </div>
        </div>
      </div>
    </div>
    <div class="flex gap-3 justify-center">
      <button data-review-quality="1" class="btn-hover flex-1 max-w-[130px] py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 font-medium text-sm border border-red-500/20">
        <span class="block mb-0.5 flex justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></span>Quên
      </button>
      <button data-review-quality="3" class="btn-hover flex-1 max-w-[130px] py-3 px-4 rounded-xl bg-warning-500/15 hover:bg-warning-500/25 text-warning-400 font-medium text-sm border border-warning-500/20">
        <span class="block mb-0.5 flex justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>Mơ hồ
      </button>
      <button data-review-quality="5" class="btn-hover flex-1 max-w-[130px] py-3 px-4 rounded-xl bg-success-500/15 hover:bg-success-500/25 text-success-400 font-medium text-sm border border-success-500/20">
        <span class="block mb-0.5 flex justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>Nhớ rõ
      </button>
    </div>
  `;
}

// ─── Complete screen ──────────────────────────────────────────────────────────

function renderReviewComplete(allWords) {
  const total = reviewSession.score.correct + reviewSession.score.wrong;
  const pct = total > 0 ? Math.round((reviewSession.score.correct / total) * 100) : 0;
  const grade = pct >= 90 ? { label: 'Xuất sắc!', color: 'text-success-400' }
              : pct >= 70 ? { label: 'Tốt lắm!', color: 'text-primary-400' }
              : pct >= 50 ? { label: 'Cố gắng hơn nhé!', color: 'text-warning-400' }
              : { label: 'Cần ôn thêm!', color: 'text-red-400' };

  const showDetail = !reviewConfig.showResultImmediately && reviewSession.answers.length > 0 && reviewConfig.mode === 'quiz';

  return `
    <div class="max-w-2xl mx-auto px-4 pt-20 pb-10">
      <div class="fade-in text-center py-6">
        <div class="${grade.color} mb-4 flex justify-center">
          <svg class="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Ôn tập hoàn thành!</h2>
        <p class="${grade.color} font-medium mb-5">${grade.label}</p>

        <div class="glass rounded-2xl p-5 max-w-xs mx-auto mb-5">
          <div class="text-4xl font-bold ${grade.color} mb-1">${pct}%</div>
          <div class="text-xs text-surface-500 mb-4">Tỉ lệ chính xác</div>
          <div class="grid grid-cols-2 gap-4 text-center border-t border-white/5 pt-4">
            <div><div class="text-2xl font-bold text-success-400">${reviewSession.score.correct}</div><div class="text-xs text-surface-400">Đúng</div></div>
            <div><div class="text-2xl font-bold text-red-400">${reviewSession.score.wrong}</div><div class="text-xs text-surface-400">Sai</div></div>
          </div>
        </div>

        ${showDetail ? `
          <div class="glass rounded-2xl p-4 mb-5 text-left max-h-72 overflow-y-auto">
            <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Chi tiết kết quả</h3>
            <div class="space-y-2">
              ${reviewSession.answers.map(a => `
                <div class="flex items-start gap-3 p-2.5 rounded-xl ${a.correct ? 'bg-success-500/8 border border-success-500/15' : 'bg-red-500/8 border border-red-500/15'}">
                  <span class="mt-0.5 text-sm font-bold shrink-0 ${a.correct ? 'text-success-400' : 'text-red-400'}">
                    ${a.correct
                      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>'
                      : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>'}
                  </span>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-surface-100">${a.word}</p>
                    ${a.correct
                      ? `<p class="text-xs text-surface-500 truncate">${a.correctMeaning}</p>`
                      : `<p class="text-xs text-red-400/80 truncate">Bạn chọn: ${a.selectedMeaning}</p>
                         <p class="text-xs text-success-400/80 truncate">Đúng: ${a.correctMeaning}</p>`}
                  </div>
                </div>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="flex gap-3 justify-center flex-wrap">
          <button id="btn-review-again"
                  class="btn-hover flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium shadow-lg shadow-primary-600/25">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Ôn tiếp
          </button>
          <button id="btn-back-setup"
                  class="btn-hover flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-surface-200 rounded-xl font-medium border border-white/10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Thiết lập mới
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function initReviewEvents(allWords, rerenderFn) {

  // ── Setup events ──────────────────────────────────────────────────────────

  document.querySelectorAll('[data-q-count]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.qCount;
      reviewConfig.questionCount = v === 'all' ? 'all' : parseInt(v);
      rerenderFn();
    });
  });
  document.querySelectorAll('[data-setup-level]').forEach(btn => {
    btn.addEventListener('click', () => { reviewConfig.levelFilter = btn.dataset.setupLevel; rerenderFn(); });
  });
  document.querySelectorAll('[data-setup-date]').forEach(btn => {
    btn.addEventListener('click', () => { reviewConfig.dateFilter = btn.dataset.setupDate; rerenderFn(); });
  });
  document.getElementById('date-from')?.addEventListener('change', e => {
    reviewConfig.dateFrom = e.target.value; rerenderFn();
  });
  document.getElementById('date-to')?.addEventListener('change', e => {
    reviewConfig.dateTo = e.target.value; rerenderFn();
  });
  document.querySelectorAll('[data-setup-mode]').forEach(btn => {
    btn.addEventListener('click', () => { reviewConfig.mode = btn.dataset.setupMode; rerenderFn(); });
  });
  document.querySelectorAll('[data-show-result]').forEach(btn => {
    btn.addEventListener('click', () => {
      reviewConfig.showResultImmediately = btn.dataset.showResult === 'true';
      rerenderFn();
    });
  });
  document.getElementById('toggle-bookmarked')?.addEventListener('click', () => {
    reviewConfig.bookmarkedOnly = !reviewConfig.bookmarkedOnly; rerenderFn();
  });
  document.getElementById('btn-start-review')?.addEventListener('click', () => {
    const pool = buildWordPool(allWords);
    if (!pool.length) return;
    reviewSession = { phase: 'reviewing', words: pool, currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [] };
    rerenderFn();
  });

  // ── Review screen events ──────────────────────────────────────────────────

  document.getElementById('btn-exit-review')?.addEventListener('click', () => {
    reviewSession = { phase: 'setup', words: [], currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [] };
    rerenderFn();
  });

  function pronounce() {
    const word = reviewSession.words?.[reviewSession.currentIndex];
    if (word && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word.word);
      u.lang = 'en-US'; u.rate = 0.8; speechSynthesis.speak(u);
    }
  }
  document.getElementById('btn-quiz-pronounce')?.addEventListener('click', e => { e.stopPropagation(); pronounce(); });
  document.getElementById('btn-review-pronounce')?.addEventListener('click', e => { e.stopPropagation(); pronounce(); });

  // Quiz
  if (reviewConfig.mode === 'quiz') {
    let pendingAnswer = null; // for "show at end" mode

    function clearOptionSelections() {
      document.querySelectorAll('.quiz-option').forEach(b => {
        b.classList.remove(
          'border-primary-400', 'bg-primary-500/20', 'text-primary-300',
          'shadow-sm', 'shadow-primary-500/20', 'border-white/5'
        );
        b.classList.add('border-white/5');
        b.style.opacity = '1';
        b.style.pointerEvents = '';
        const l = b.querySelector('.option-letter');
        if (l) {
          l.className = 'option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/8 text-surface-400 text-xs font-bold';
          l.textContent = l.dataset.letter;
        }
      });
    }

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (reviewSession.answered) return;

        const answer = btn.dataset.answer;

        if (!reviewConfig.showResultImmediately) {
          // ── "Sau khi hoàn thành": highlight selection, allow changing ──────
          pendingAnswer = answer;
          clearOptionSelections();
          _styleOption(btn, 'selected');
          document.getElementById('quiz-next')?.classList.remove('hidden');

        } else {
          // ── "Ngay khi trả lời": lock in, show feedback, auto-advance 2s ──
          reviewSession.answered = true;
          const isCorrect = answer === window._reviewCorrectAnswer;
          const word = reviewSession.words[reviewSession.currentIndex];
          _recordAnswer(word, answer, isCorrect, allWords);

          // Dim all then highlight result
          document.querySelectorAll('.quiz-option').forEach(b => {
            b.style.opacity = '0.35';
            b.style.pointerEvents = 'none';
          });
          if (isCorrect) {
            _styleOption(btn, 'correct');
          } else {
            _styleOption(btn, 'wrong');
            document.querySelectorAll('.quiz-option').forEach(b => {
              if (b.dataset.answer === window._reviewCorrectAnswer) _styleOption(b, 'correct-hint');
            });
          }

          // Auto-advance after 2s (guard against stale closure if user exits)
          const questionIndex = reviewSession.currentIndex;
          setTimeout(() => {
            if (reviewSession.currentIndex === questionIndex && reviewSession.phase === 'reviewing') {
              reviewSession.currentIndex++;
              reviewSession.answered = false;
              rerenderFn();
            }
          }, 2000);
        }
      });
    });

    // "Tiếp theo" — only active in "show at end" mode
    document.getElementById('btn-quiz-next')?.addEventListener('click', () => {
      if (!pendingAnswer) return;
      const isCorrect = pendingAnswer === window._reviewCorrectAnswer;
      const word = reviewSession.words[reviewSession.currentIndex];
      _recordAnswer(word, pendingAnswer, isCorrect, allWords);
      pendingAnswer = null;
      reviewSession.currentIndex++;
      rerenderFn();
    });
  }

  // Flashcard
  if (reviewConfig.mode === 'flashcard') {
    const front = document.getElementById('review-card-front');
    const back = document.getElementById('review-card-back');
    const inner = document.getElementById('review-card-inner');
    front?.addEventListener('click', () => inner?.classList.toggle('flipped'));
    back?.addEventListener('click', () => inner?.classList.toggle('flipped'));

    document.querySelectorAll('[data-review-quality]').forEach(btn => {
      btn.addEventListener('click', () => {
        const quality = parseInt(btn.dataset.reviewQuality);
        const word = reviewSession.words[reviewSession.currentIndex];
        store.markWordLearned(word.word, quality);
        store.logReview(quality >= 3);
        if (quality >= 3) reviewSession.score.correct++;
        else reviewSession.score.wrong++;
        reviewSession.currentIndex++;
        rerenderFn();
      });
    });
  }

  // Complete
  document.getElementById('btn-review-again')?.addEventListener('click', () => {
    const pool = buildWordPool(allWords);
    reviewSession = { phase: 'reviewing', words: pool, currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [] };
    rerenderFn();
  });
  document.getElementById('btn-back-setup')?.addEventListener('click', () => {
    reviewSession = { phase: 'setup', words: [], currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [] };
    rerenderFn();
  });
}

// ─── Answer recording helper ─────────────────────────────────────────────────

function _recordAnswer(word, selectedAnswer, isCorrect, allWords) {
  const correctWordObj = allWords.find(w => w.word === window._reviewCorrectAnswer);
  const correctMeaning = correctWordObj?.meaning_vi || correctWordObj?.meaning_en || window._reviewCorrectAnswer;
  const selectedWordObj = allWords.find(w => w.word === selectedAnswer);
  const selectedMeaning = selectedWordObj?.meaning_vi || selectedWordObj?.meaning_en || selectedAnswer;
  reviewSession.answers.push({ word: word.word, correct: isCorrect, selectedMeaning, correctMeaning });
  if (isCorrect) { reviewSession.score.correct++; store.markWordLearned(word.word, 4); }
  else           { reviewSession.score.wrong++;   store.markWordLearned(word.word, 1); }
  store.logReview(isCorrect);
}

// ─── Option styling helper ────────────────────────────────────────────────────

function _styleOption(btn, type) {
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'none';
  const letter = btn.querySelector('.option-letter');

  if (type === 'correct') {
    btn.classList.remove('border-white/5', 'hover:bg-white/8');
    btn.classList.add('border-success-400', 'bg-success-500/20', 'text-success-300', 'shadow-sm', 'shadow-success-500/20');
    if (letter) {
      letter.className = 'option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-success-500 text-white text-xs font-bold';
      letter.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
    }
  } else if (type === 'wrong') {
    btn.classList.remove('border-white/5', 'hover:bg-white/8');
    btn.classList.add('border-red-400', 'bg-red-500/20', 'text-red-300', 'shadow-sm', 'shadow-red-500/20');
    if (letter) {
      letter.className = 'option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold';
      letter.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>';
    }
  } else if (type === 'correct-hint') {
    btn.classList.remove('border-white/5', 'hover:bg-white/8');
    btn.classList.add('border-success-500/50', 'bg-success-500/10', 'text-success-400/80');
    if (letter) {
      letter.className = 'option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-success-500/30 text-success-300 text-xs font-bold';
      letter.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
    }
  } else if (type === 'selected') {
    btn.classList.remove('border-white/5', 'hover:bg-white/8');
    btn.classList.add('border-primary-400', 'bg-primary-500/20', 'text-primary-300', 'shadow-sm', 'shadow-primary-500/20');
    if (letter) {
      letter.className = 'option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold';
    }
  }
}

export function resetReviewSession() {
  reviewSession = { phase: 'setup', words: [], currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [] };
}
