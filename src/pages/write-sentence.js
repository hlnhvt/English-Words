import store from '../store.js';
import { renderWordModal, initWordModalEvents } from '../components/modal.js';

let allExamples = [];
let currentExample = null;

function buildExamplePool(allWords) {
  const pool = [];
  for (const w of allWords) {
    if (!w.examples) continue;
    for (const ex of w.examples) {
      if (ex.en && ex.vi && ex.en.trim().length > 15) {
        pool.push({ word: w.word, en: ex.en.trim(), vi: ex.vi.trim(), level: w.level });
      }
    }
  }
  return pool;
}

function pickRandom(excludeEn) {
  if (allExamples.length === 0) return null;
  const pool = excludeEn && allExamples.length > 1
    ? allExamples.filter(e => e.en !== excludeEn)
    : allExamples;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function renderWriteSentence(allWords) {
  if (allExamples.length === 0) {
    allExamples = buildExamplePool(allWords);
  }
  if (!currentExample && allExamples.length > 0) {
    currentExample = pickRandom(null);
  }

  const stats = store.getSentenceWritingStats();

  if (!currentExample) {
    return `
      <div class="flex items-center justify-center min-h-[60vh]">
        <p class="text-surface-400">Không có câu ví dụ nào để luyện tập.</p>
      </div>`;
  }

  return `
    <div class="max-w-2xl mx-auto px-4 pt-10 pb-10">
      <div class="fade-in mb-6 flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-surface-100">Viết câu</h2>
          <p class="text-sm text-surface-400">Luyện viết lại câu từ gợi ý tiếng Việt</p>
        </div>
        <div class="flex items-center gap-2 px-4 py-2 glass rounded-xl border border-white/5">
          <svg class="w-4 h-4 text-success-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="text-lg font-bold text-success-400">${stats.total.toLocaleString()}</span>
          <span class="text-xs text-surface-400">câu thành công</span>
        </div>
      </div>

      <div class="glass rounded-2xl p-6 fade-in" style="animation-delay: 0.1s">
        <!-- Level badge + keyword -->
        <div class="flex items-center gap-2 mb-4">
          <span class="text-[10px] px-2 py-1 rounded-full level-${currentExample.level.toLowerCase()} text-white font-bold">${currentExample.level}</span>
          <span class="text-sm text-surface-400">Từ khóa: <button id="write-keyword-btn" class="text-primary-400 font-semibold hover:text-primary-300 hover:underline underline-offset-2 transition-colors">${currentExample.word}</button></span>
        </div>

        <!-- Vietnamese prompt -->
        <div class="bg-white/5 rounded-xl p-4 mb-4">
          <p class="text-xs text-surface-500 mb-1.5">Nghĩa tiếng Việt:</p>
          <p class="text-surface-100 font-medium text-base leading-relaxed">${currentExample.vi}</p>
        </div>

        <!-- Top row: label + TTS -->
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-surface-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Gõ lại câu tiếng Anh
          </p>
          <button id="write-speak" title="Nghe phát âm"
            class="flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400
                   bg-white/5 hover:bg-primary-500/10 border border-white/5 hover:border-primary-500/30
                   px-3 py-1.5 rounded-lg transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/>
            </svg>
            Nghe
          </button>
        </div>

        <!-- Char-by-char feedback -->
        <div id="write-typing-target"
             class="font-mono text-lg tracking-wider mb-3 min-h-[1.75rem] break-words"></div>

        <!-- Input -->
        <input id="write-input" type="text" autocomplete="off" spellcheck="false"
               placeholder="Gõ câu tiếng Anh vào đây..."
               class="w-full bg-surface-800 border-2 border-surface-700 rounded-xl px-4 py-3
                      text-surface-100 placeholder-surface-600 focus:border-primary-500
                      outline-none transition-all text-base mb-3"/>

        <!-- Feedback banner -->
        <div id="write-feedback"
             class="hidden mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"></div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button id="write-check"
            class="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-bold py-2.5
                   rounded-xl transition-all shadow-lg shadow-primary-600/20">
            Kiểm tra
          </button>
          <button id="write-new"
            class="px-5 bg-white/5 hover:bg-white/10 text-surface-300 font-medium py-2.5
                   rounded-xl border border-white/5 transition-all">
            Câu mới
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initWriteSentenceEvents(allWords, rerenderFn) {
  if (allExamples.length === 0) {
    allExamples = buildExamplePool(allWords);
  }

  const input = document.getElementById('write-input');
  const feedbackEl = document.getElementById('write-feedback');
  const targetEl = document.getElementById('write-typing-target');

  function renderTypingTarget() {
    if (!targetEl || !input || !currentExample) return;
    const target = currentExample.en;
    const typed = input.value;
    targetEl.innerHTML = target.split('').map((ch, i) => {
      const esc = ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '&' ? '&amp;' : ch;
      if (i >= typed.length) return `<span class="text-surface-600">${esc}</span>`;
      return typed[i].toLowerCase() === ch.toLowerCase()
        ? `<span class="text-success-400">${esc}</span>`
        : `<span class="text-red-400">${esc}</span>`;
    }).join('');
  }

  function showFeedback(correct) {
    if (!feedbackEl) return;
    feedbackEl.className = `mb-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2
      ${correct
        ? 'bg-success-500/15 text-success-400 border border-success-500/25'
        : 'bg-red-500/10 text-red-400 border border-red-500/20'}`;
    feedbackEl.innerHTML = correct
      ? `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg> Xuất sắc! Bạn đã viết đúng câu này rồi!`
      : `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg> Chưa đúng, hãy thử lại!`;
  }

  function loadNewSentence() {
    const prev = currentExample?.en || null;
    currentExample = pickRandom(prev);
    rerenderFn();
    setTimeout(() => { document.getElementById('write-input')?.focus(); }, 0);
  }

  function checkAnswer() {
    if (!input || !currentExample || input.disabled) return;
    const typed = input.value.trim();
    const correct = typed.toLowerCase() === currentExample.en.toLowerCase();
    showFeedback(correct);
    if (correct) {
      store.logSentenceWritten();
      input.disabled = true;
      setTimeout(loadNewSentence, 1200);
    }
  }

  // Init typing target on first render
  renderTypingTarget();

  input?.addEventListener('input', renderTypingTarget);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') checkAnswer(); });
  document.getElementById('write-check')?.addEventListener('click', checkAnswer);
  document.getElementById('write-new')?.addEventListener('click', loadNewSentence);

  document.getElementById('write-keyword-btn')?.addEventListener('click', () => {
    const wordData = allWords.find(w => w.word === currentExample?.word);
    if (!wordData) return;
    document.getElementById('word-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', renderWordModal(wordData));
    initWordModalEvents(wordData);
  });

  document.getElementById('write-speak')?.addEventListener('click', () => {
    if (!window.speechSynthesis || !currentExample) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(currentExample.en);
    utt.lang = 'en-US';
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  });

  input?.focus();
}
