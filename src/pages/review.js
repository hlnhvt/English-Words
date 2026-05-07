import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';

function getToday() { return new Date().toISOString().split('T')[0]; }
function getFirstDayOfMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
}

let reviewConfig = {
  questionCount: 20,
  wordSource: 'learned', // learned | all
  levelFilter: 'all',
  dateFilter: 'all',   // all | today | week | month | range
  dateFrom: getFirstDayOfMonth(),
  dateTo: getToday(),
  bookmarkedOnly: false,
  mode: 'quiz',
  quizTypes: ['en_to_vi'], // 'en_to_vi' | 'vi_short_to_en' | 'vi_detail_to_en' | 'fill_blank' (multi-select)
  showResultImmediately: true,
  timeLimit: null,     // null = no limit, number = seconds
};

let reviewSession = {
  phase: 'setup',      // setup | reviewing | complete
  words: [],
  currentIndex: 0,
  score: { correct: 0, wrong: 0 },
  answered: false,
  answers: [],         // [{word, correct, selectedMeaning, correctMeaning, qType}]
  startTime: null,
  questionTypes: [],   // pre-computed type per question
};

let reviewTimerInterval = null;

// ─── Pool builder ────────────────────────────────────────────────────────────

function buildWordPool(allWords) {
  const progress = store.getAllProgress();
  const bookmarkSet = new Set(store.getBookmarks());

  let pool = allWords.filter(word => {
    const p = progress[word.word];
    const hasProgress = !!p;
    const isBookmarked = bookmarkSet.has(word.word);
    if (reviewConfig.wordSource === 'learned' && !hasProgress && !isBookmarked) return false;
    if (reviewConfig.levelFilter !== 'all' && word.level !== reviewConfig.levelFilter) return false;
    if (reviewConfig.bookmarkedOnly && !isBookmarked) return false;

    if (reviewConfig.dateFilter !== 'all') {
      if (!hasProgress) return true; // unlearned words pass date filter when wordSource=all
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
    <div class="max-w-xl mx-auto px-4 pt-10 pb-24">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Thiết lập ôn tập</h2>
        <div class="flex items-center justify-between gap-4">
          <p class="text-sm text-surface-400">Chọn phạm vi từ vựng và cách ôn tập</p>
          <div class="text-sm px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 ${canStart ? 'text-surface-300' : 'text-red-400/80'}">
            ${canStart
              ? `<span class="font-bold text-primary-400">${poolSize}</span> từ`
              : '0 từ'}
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <!-- Word source -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.05s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Nguồn từ vựng</h3>
          <div class="grid grid-cols-2 gap-2">
            <button data-setup-word-source="learned"
                    class="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all
                           ${reviewConfig.wordSource === 'learned'
                             ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                             : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              Từ đã học
            </button>
            <button data-setup-word-source="all"
                    class="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all
                           ${reviewConfig.wordSource === 'all'
                             ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                             : 'bg-white/5 text-surface-400 hover:bg-white/10'}">
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              Tất cả từ vựng
            </button>
          </div>
        </div>

        <!-- Question Count -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.1s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Số câu hỏi</h3>
          <div class="flex flex-wrap gap-2">
            ${[10, 20, 30, 50, 'all'].map(n => `
              <button data-q-count="${n}" ${pill(reviewConfig.questionCount === n)}>
                ${n === 'all' ? 'Tất cả' : n}
              </button>`).join('')}
          </div>
        </div>

        <!-- Level -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.15s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Cấp độ từ</h3>
          <div class="flex flex-wrap gap-2">
            ${['all','A1','A2','B1','B2','C1'].map(lvl => `
              <button data-setup-level="${lvl}" ${pill(reviewConfig.levelFilter === lvl)}>
                ${lvl === 'all' ? 'Tất cả' : lvl}
              </button>`).join('')}
          </div>
        </div>

        <!-- Date -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.2s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Thời gian học</h3>
          <div class="flex flex-wrap gap-2 mb-3">
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

        <!-- Timer -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.25s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Thời gian làm bài</h3>
          <div class="flex flex-wrap gap-2">
            ${[
              { value: null,  label: 'Không giới hạn' },
              { value: 60,    label: '1 phút' },
              { value: 120,   label: '2 phút' },
              { value: 180,   label: '3 phút' },
              { value: 300,   label: '5 phút' },
              { value: 600,   label: '10 phút' },
            ].map(t => `
              <button data-setup-timer="${t.value === null ? 'null' : t.value}" ${pill(reviewConfig.timeLimit === t.value)}>
                ${t.label}
              </button>`).join('')}
          </div>
        </div>

        <!-- Mode + extras -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.3s">
          <!-- Mode + Bookmark row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            </div>
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

          <!-- Quiz sub-options: full width below -->
          ${reviewConfig.mode === 'quiz' ? `
            <div class="mt-4 pt-4 border-t border-white/5">
              <p class="text-xs text-surface-500 mb-2">Dạng câu hỏi <span class="text-surface-600">(chọn nhiều)</span></p>
              ${(() => {
                const ALL_TYPES = ['en_to_vi', 'vi_short_to_en', 'vi_detail_to_en', 'fill_blank'];
                const allOn = ALL_TYPES.every(id => reviewConfig.quizTypes.includes(id));
                const types = [
                  { id: 'en_to_vi',       label: 'Từ → Nghĩa',          desc: 'Nhìn từ, chọn nghĩa tiếng Việt' },
                  { id: 'vi_short_to_en', label: 'Nghĩa ngắn → Từ',     desc: 'Nhìn nghĩa ngắn, chọn từ tiếng Anh' },
                  { id: 'vi_detail_to_en',label: 'Nghĩa chi tiết → Từ', desc: 'Nhìn nghĩa đầy đủ, chọn từ tiếng Anh' },
                  { id: 'fill_blank',     label: 'Điền vào chỗ trống',  desc: 'Nhìn câu ví dụ, chọn từ còn thiếu' },
                ];
                const checkBtn = (id, on, label, desc) => `
                  <button data-quiz-type="${id}"
                          class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
                                 ${on ? 'bg-primary-600/15 text-primary-300 border border-primary-500/30' : 'bg-white/5 text-surface-400 hover:bg-white/8 border border-white/5'}">
                    <span class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                                 ${on ? 'bg-primary-600 border-primary-600' : 'border-surface-600'}">
                      ${on ? '<svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                    </span>
                    <div class="text-left">
                      <p class="font-semibold leading-tight">${label}</p>
                      <p class="text-[10px] text-surface-500 leading-tight">${desc}</p>
                    </div>
                  </button>`;
                return `
                  <div class="mb-1.5">
                    ${checkBtn('all', allOn, 'Tất cả dạng câu hỏi', 'Bật tất cả các dạng bên dưới')}
                  </div>
                  <div class="grid grid-cols-2 gap-1.5">
                    ${types.map(t => checkBtn(t.id, reviewConfig.quizTypes.includes(t.id), t.label, t.desc)).join('')}
                  </div>`;
              })()}
            </div>
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

      <!-- Fixed Start Button -->
      <div class="fixed bottom-8 right-8 z-50">
        <button id="btn-start-review" ${canStart ? '' : 'disabled'}
                class="group flex items-center justify-center gap-0 hover:gap-3 h-14 px-4 rounded-2xl font-bold text-base transition-all shadow-2xl overflow-hidden
                       ${canStart
                         ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-primary-600/40 hover:scale-[1.05] active:scale-[0.95]'
                         : 'bg-surface-800 text-surface-600 cursor-not-allowed border border-white/5 opacity-50'}">
          <svg class="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <!-- Rocket Body -->
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
            <!-- Left Wing -->
            <path d="M9 12H4s.5-1 1-4c2 1 3 3 3 3z"/>
            <!-- Right Wing -->
            <path d="M12 15v5s1 .5 4 1c-1-2-3-3-3-3z"/>
            <!-- Window -->
            <circle cx="14.5" cy="9.5" r="1.5" />
            <!-- Exhaust Lines -->
            <line x1="2" y1="22" x2="6" y2="18" />
            <line x1="6" y1="22" x2="9" y2="19" />
            <line x1="2" y1="18" x2="5" y2="15" />
          </svg>
          <span class="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 group-hover:max-w-[200px]">
            ${canStart ? 'Bắt đầu ôn tập' : 'Không có từ phù hợp'}
          </span>
        </button>
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
    <div class="max-w-2xl mx-auto px-4 pt-10 pb-10">
      <div class="fade-in mb-6">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-bold text-surface-100">Ôn tập</h2>
            <p class="text-xs text-surface-400">${current} / ${total}${reviewConfig.quizTypes.length > 1 ? ` · ${
              { en_to_vi: 'Từ→Nghĩa', vi_short_to_en: 'Nghĩa ngắn→Từ', vi_detail_to_en: 'Nghĩa chi tiết→Từ', fill_blank: 'Điền từ' }[reviewSession.questionTypes[reviewSession.currentIndex]] || ''
            }` : ''}</p>
          </div>
          <div class="flex items-center gap-3">
            ${reviewConfig.timeLimit !== null ? (() => {
              const elapsed = reviewSession.startTime ? Math.floor((Date.now() - reviewSession.startTime) / 1000) : 0;
              const remaining = Math.max(0, reviewConfig.timeLimit - elapsed);
              const m = Math.floor(remaining / 60);
              const s = remaining % 60;
              const urgent = remaining <= 10;
              return `<div id="timer-display" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-xs tabular-nums
                             ${urgent ? 'bg-red-500/15 text-red-400' : 'bg-surface-700/60 text-surface-300'}">
                <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span id="timer-text">${m}:${String(s).padStart(2, '0')}</span>
              </div>`;
            })() : ''}
            <span class="px-2.5 py-1 rounded-lg bg-success-500/15 text-success-400 font-semibold text-xs">${reviewSession.score.correct} đúng</span>
            <span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 font-semibold text-xs">${reviewSession.score.wrong} sai</span>
            <button id="btn-review-bookmark" data-word="${word.word}"
                    class="w-8 h-8 rounded-lg flex items-center justify-center transition-all
                           ${store.isBookmarked(word.word) ? 'text-amber-400 bg-amber-500/15' : 'text-surface-500 hover:text-amber-400 hover:bg-amber-500/10'}">
              <svg class="w-4 h-4" fill="${store.isBookmarked(word.word) ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </button>
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

// ─── Quiz mode dispatcher ─────────────────────────────────────────────────────

function renderQuizMode(word, allWords) {
  const type = reviewSession.questionTypes[reviewSession.currentIndex] || 'en_to_vi';
  if (type === 'vi_short_to_en')  return renderViToEnQuiz(word, allWords, 'short');
  if (type === 'vi_detail_to_en') return renderViToEnQuiz(word, allWords, 'detail');
  if (type === 'fill_blank')      return renderFillBlankQuiz(word, allWords);
  return renderEnToViQuiz(word, allWords);
}

// Build 4 options (1 correct + 3 wrong same-POS, fallback random)
function _buildOptions(word, allWords) {
  let wrong = allWords
    .filter(w => w.word !== word.word && w.pos.some(p => word.pos.includes(p)))
    .sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
  if (wrong.length < 3) {
    wrong.push(...allWords
      .filter(w => w.word !== word.word && !wrong.includes(w.word))
      .sort(() => Math.random() - 0.5).slice(0, 3 - wrong.length).map(w => w.word));
  }
  return [...wrong, word.word].sort(() => Math.random() - 0.5);
}

function _quizOptionsList(options, getLabel) {
  return `
    <div class="space-y-2.5" id="quiz-options">
      ${options.map((opt, i) => `
        <button data-answer="${opt}"
                class="quiz-option w-full text-left px-5 py-3.5 rounded-xl glass hover:bg-white/8 transition-all
                       border border-white/5 text-sm text-surface-200 font-medium flex items-center gap-3">
          <span class="option-letter shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full
                       bg-white/8 text-surface-400 text-xs font-bold"
                data-letter="${String.fromCharCode(65 + i)}">
            ${String.fromCharCode(65 + i)}
          </span>
          <span class="option-text">${getLabel(opt)}</span>
        </button>`).join('')}
    </div>
    <div id="quiz-next" class="hidden mt-6 text-center">
      <button id="btn-quiz-next"
              class="btn-hover px-8 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium text-sm transition-all">
        Tiếp theo →
      </button>
    </div>`;
}

// ─── En → Vi quiz ─────────────────────────────────────────────────────────────

function renderEnToViQuiz(word, allWords) {
  const options = _buildOptions(word, allWords);
  window._reviewCorrectAnswer = word.word;

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
      ${_quizOptionsList(options, opt => {
        const w = allWords.find(x => x.word === opt);
        return w?.meaning_vi || w?.meaning_en || opt;
      })}
    </div>`;
}

// ─── Vi → En quiz ─────────────────────────────────────────────────────────────

function renderViToEnQuiz(word, allWords, variant) {
  const options = _buildOptions(word, allWords);
  window._reviewCorrectAnswer = word.word;

  const meaning = variant === 'short'
    ? (word.meaning_vi || word.meaning_vi_detail || '')
    : (word.meaning_vi_detail || word.meaning_vi || '');

  const typeLabel = variant === 'short' ? 'Nghĩa ngắn → Từ' : 'Nghĩa chi tiết → Từ';

  return `
    <div class="fade-in">
      <div class="glass rounded-3xl p-6 sm:p-8 text-center mb-5">
        <div class="mb-3 flex items-center justify-center gap-2">
          <span class="text-[10px] px-2 py-1 rounded-full level-${word.level.toLowerCase()} text-white font-medium">${word.level}</span>
          <span class="text-[10px] px-2 py-1 rounded-full bg-white/10 text-surface-300">${word.pos.join(', ')}</span>
          <span class="text-[10px] px-2 py-1 rounded-full bg-accent-500/15 text-accent-400">${typeLabel}</span>
        </div>
        <p class="text-xs text-surface-500 mb-3">Từ tiếng Anh nào có nghĩa này?</p>
        <p class="text-base sm:text-lg font-semibold text-surface-100 leading-relaxed px-2">${meaning}</p>
      </div>
      ${_quizOptionsList(options, opt => opt)}
    </div>`;
}

// ─── Fill-in-the-blank quiz ───────────────────────────────────────────────────

function _blankSentence(sentence, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the word and any suffixes (e.g. "abandon" → "abandoned"), case-insensitive
  return sentence.replace(new RegExp(`\\b${escaped}\\w*`, 'gi'), '<span class="inline-block min-w-[80px] border-b-2 border-primary-400/60 text-transparent select-none">_____</span>');
}

function renderFillBlankQuiz(word, allWords) {
  // Fallback if no examples: use en_to_vi (always works)
  const examples = word.examples?.filter(e => e.en);
  if (!examples || examples.length === 0) return renderEnToViQuiz(word, allWords);

  const ex = examples[Math.floor(Math.random() * examples.length)];
  const blanked = _blankSentence(ex.en, word.word);
  const options = _buildOptions(word, allWords);
  window._reviewCorrectAnswer = word.word;

  return `
    <div class="fade-in">
      <div class="glass rounded-3xl p-6 sm:p-8 text-center mb-5">
        <div class="mb-3 flex items-center justify-center gap-2">
          <span class="text-[10px] px-2 py-1 rounded-full level-${word.level.toLowerCase()} text-white font-medium">${word.level}</span>
          <span class="text-[10px] px-2 py-1 rounded-full bg-white/10 text-surface-300">${word.pos.join(', ')}</span>
          <span class="text-[10px] px-2 py-1 rounded-full bg-violet-500/15 text-violet-400">Điền vào chỗ trống</span>
        </div>
        <p class="text-xs text-surface-500 mb-4">Chọn từ thích hợp điền vào chỗ trống</p>
        <p class="text-base sm:text-lg font-medium text-surface-100 leading-loose px-2">${blanked}</p>
        ${ex.vi ? `<p class="text-sm text-surface-400 mt-3 italic">${ex.vi.replace(new RegExp(word.word, 'gi'), '…')}</p>` : ''}
      </div>
      ${_quizOptionsList(options, opt => opt)}
    </div>`;
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
              ${(word.meaning_en || word.meaning_vi || word.meaning_vi_detail) ? `
                <div class="glass bg-white/3 rounded-2xl p-4">
                  ${word.meaning_vi ? `
                    <p class="text-[15px] font-semibold text-primary-400 ${word.meaning_en || word.meaning_vi_detail ? 'mb-3 pb-3 border-b border-white/5' : ''}">${word.meaning_vi}</p>
                  ` : ''}
                  ${word.meaning_en ? `<p class="text-base font-bold text-surface-100 mb-1">${word.meaning_en}</p>` : ''}
                  ${word.meaning_vi_detail ? `<p class="text-sm text-surface-300 leading-relaxed">${word.meaning_vi_detail}</p>` : ''}
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

  const showDetail = reviewSession.answers.length > 0 && reviewConfig.mode === 'quiz';

  if (!reviewSession.sessionLogged) {
    reviewSession.sessionLogged = true;
    const correct = reviewSession.score.correct;
    const total = reviewSession.score.correct + reviewSession.score.wrong;
    if (total > 0) {
      store.logReviewSession({ score: pct, correct, total });
    }
  }

  return `
    <div class="max-w-2xl mx-auto px-4 pt-10 pb-10">
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
                <div data-result-word="${a.word}"
                     class="flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:brightness-110 active:scale-[0.99]
                            ${a.correct ? 'bg-success-500/8 border border-success-500/15' : 'bg-red-500/8 border border-red-500/15'}">
                  <span class="mt-0.5 text-sm font-bold shrink-0 ${a.correct ? 'text-success-400' : 'text-red-400'}">
                    ${a.correct
                      ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>'
                      : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>'}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold text-surface-100">${a.word}</p>
                    ${a.correct
                      ? `<p class="text-xs text-surface-500 truncate">${a.correctMeaning}</p>`
                      : `<p class="text-xs text-red-400/80 truncate">Bạn chọn: ${a.selectedMeaning}</p>
                         <p class="text-xs text-success-400/80 truncate">Đúng: ${a.correctMeaning}</p>`}
                  </div>
                  <svg class="w-4 h-4 text-surface-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
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

  // Clear any running timer when re-initializing
  if (reviewTimerInterval) { clearInterval(reviewTimerInterval); reviewTimerInterval = null; }

  // ── Setup events ──────────────────────────────────────────────────────────

  document.querySelectorAll('[data-setup-word-source]').forEach(btn => {
    btn.addEventListener('click', () => { reviewConfig.wordSource = btn.dataset.setupWordSource; rerenderFn(); });
  });
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
  document.querySelectorAll('[data-setup-timer]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.setupTimer;
      reviewConfig.timeLimit = v === 'null' ? null : parseInt(v);
      rerenderFn();
    });
  });
  document.querySelectorAll('[data-quiz-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.quizType;
      const ALL_TYPES = ['en_to_vi', 'vi_short_to_en', 'vi_detail_to_en', 'fill_blank'];
      if (t === 'all') {
        const allOn = ALL_TYPES.every(id => reviewConfig.quizTypes.includes(id));
        reviewConfig.quizTypes = allOn ? ['en_to_vi'] : [...ALL_TYPES];
      } else if (reviewConfig.quizTypes.includes(t)) {
        if (reviewConfig.quizTypes.length > 1) {
          reviewConfig.quizTypes = reviewConfig.quizTypes.filter(x => x !== t);
        }
      } else {
        reviewConfig.quizTypes = [...reviewConfig.quizTypes, t];
      }
      rerenderFn();
    });
  });
  document.getElementById('toggle-bookmarked')?.addEventListener('click', () => {
    reviewConfig.bookmarkedOnly = !reviewConfig.bookmarkedOnly; rerenderFn();
  });
  document.getElementById('btn-start-review')?.addEventListener('click', () => {
    const pool = buildWordPool(allWords);
    if (!pool.length) return;
    const types = reviewConfig.quizTypes;
    reviewSession = {
      phase: 'reviewing', words: pool, currentIndex: 0,
      score: { correct: 0, wrong: 0 }, answered: false, answers: [],
      startTime: Date.now(), sessionLogged: false,
      questionTypes: pool.map(() => types[Math.floor(Math.random() * types.length)]),
    };
    rerenderFn();
  });

  // ── Timer ─────────────────────────────────────────────────────────────────

  if (reviewConfig.timeLimit !== null && reviewSession.phase === 'reviewing') {
    reviewTimerInterval = setInterval(() => {
      const timerEl = document.getElementById('timer-display');
      const timerText = document.getElementById('timer-text');
      if (!timerEl || !timerText) { clearInterval(reviewTimerInterval); reviewTimerInterval = null; return; }
      const elapsed = Math.floor((Date.now() - reviewSession.startTime) / 1000);
      const remaining = Math.max(0, reviewConfig.timeLimit - elapsed);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      timerText.textContent = `${m}:${String(s).padStart(2, '0')}`;
      if (remaining <= 10) {
        timerEl.classList.remove('bg-surface-700/60', 'text-surface-300');
        timerEl.classList.add('bg-red-500/15', 'text-red-400');
      }
      if (remaining === 0) {
        clearInterval(reviewTimerInterval); reviewTimerInterval = null;
        reviewSession.phase = 'complete';
        rerenderFn();
      }
    }, 1000);
  }

  // ── Review screen events ──────────────────────────────────────────────────

  document.getElementById('btn-review-bookmark')?.addEventListener('click', () => {
    const word = reviewSession.words?.[reviewSession.currentIndex];
    if (!word) return;
    if (store.isBookmarked(word.word)) store.unbookmarkWord(word.word);
    else store.bookmarkWord(word.word);
    const btn = document.getElementById('btn-review-bookmark');
    if (!btn) return;
    const on = store.isBookmarked(word.word);
    btn.className = `w-8 h-8 rounded-lg flex items-center justify-center transition-all ${on ? 'text-amber-400 bg-amber-500/15' : 'text-surface-500 hover:text-amber-400 hover:bg-amber-500/10'}`;
    btn.querySelector('svg').setAttribute('fill', on ? 'currentColor' : 'none');
  });

  document.getElementById('btn-exit-review')?.addEventListener('click', () => {
    if (reviewTimerInterval) { clearInterval(reviewTimerInterval); reviewTimerInterval = null; }
    reviewSession = { phase: 'setup', words: [], currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [], startTime: null, questionTypes: [] };
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

          // Auto-advance after 1.3s (guard against stale closure if user exits)
          const questionIndex = reviewSession.currentIndex;
          setTimeout(() => {
            if (reviewSession.currentIndex === questionIndex && reviewSession.phase === 'reviewing') {
              reviewSession.currentIndex++;
              reviewSession.answered = false;
              rerenderFn();
            }
          }, 1300);
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

  // Complete — click result item to open word detail modal
  document.querySelectorAll('[data-result-word]').forEach(item => {
    item.addEventListener('click', () => {
      const wordStr = item.dataset.resultWord;
      const wordData = allWords.find(w => w.word === wordStr);
      if (!wordData) return;
      document.getElementById('word-modal')?.remove();
      document.body.insertAdjacentHTML('beforeend', renderWordModal(wordData));
      initWordModalEvents(wordData);
    });
  });

  document.getElementById('btn-review-again')?.addEventListener('click', () => {
    if (reviewTimerInterval) { clearInterval(reviewTimerInterval); reviewTimerInterval = null; }
    const pool = buildWordPool(allWords);
    const types = reviewConfig.quizTypes;
    reviewSession = {
      phase: 'reviewing', words: pool, currentIndex: 0,
      score: { correct: 0, wrong: 0 }, answered: false, answers: [],
      startTime: Date.now(), sessionLogged: false,
      questionTypes: pool.map(() => types[Math.floor(Math.random() * types.length)]),
    };
    rerenderFn();
  });
  document.getElementById('btn-back-setup')?.addEventListener('click', () => {
    if (reviewTimerInterval) { clearInterval(reviewTimerInterval); reviewTimerInterval = null; }
    reviewSession = { phase: 'setup', words: [], currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [], startTime: null, questionTypes: [] };
    rerenderFn();
  });
}

// ─── Answer recording helper ─────────────────────────────────────────────────

function _recordAnswer(word, selectedAnswer, isCorrect, allWords) {
  const qType = reviewSession.questionTypes[reviewSession.currentIndex] || 'en_to_vi';
  const isViToEn = qType === 'vi_short_to_en' || qType === 'vi_detail_to_en' || qType === 'fill_blank';

  let correctDisplay, selectedDisplay;
  if (isViToEn) {
    correctDisplay = word.word;
    selectedDisplay = selectedAnswer;
  } else {
    const cw = allWords.find(w => w.word === window._reviewCorrectAnswer);
    correctDisplay = cw?.meaning_vi || cw?.meaning_en || window._reviewCorrectAnswer;
    const sw = allWords.find(w => w.word === selectedAnswer);
    selectedDisplay = sw?.meaning_vi || sw?.meaning_en || selectedAnswer;
  }

  reviewSession.answers.push({ word: word.word, correct: isCorrect, qType, selectedMeaning: selectedDisplay, correctMeaning: correctDisplay });
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
  reviewSession = { phase: 'setup', words: [], currentIndex: 0, score: { correct: 0, wrong: 0 }, answered: false, answers: [], startTime: null, questionTypes: [] };
}
