import { playDing, playError } from '../utils/sound.js';

export let mathConfig = {
  operation: 'both',
  carryBorrow: 'all',
  range: 100,
  questionCount: 10,
};

export let mathSession = {
  phase: 'setup',
  problems: [],
  score: 0,
  currentIndex: 0,
  status: 'answering',
  focusSequence: [],
};

function checkCarryBorrow(a, b, op) {
  const strA = String(a).split('').reverse();
  const strB = String(b).split('').reverse();
  const len = Math.max(strA.length, strB.length);
  let carry = 0, hasEvent = false;
  let hasBoxArray = Array(len + 1).fill(false);
  for (let i = 0; i < len; i++) {
    const da = parseInt(strA[i] || '0', 10);
    const db = parseInt(strB[i] || '0', 10);
    if (op === 'add') {
      const sum = da + db + carry;
      if (sum >= 10) { hasEvent = true; carry = 1; hasBoxArray[i + 1] = true; }
      else carry = 0;
    } else {
      let top = da - carry;
      if (top < db) { hasEvent = true; carry = 1; hasBoxArray[i] = true; hasBoxArray[i + 1] = true; }
      else carry = 0;
    }
  }
  return { hasEvent, hasBoxArray };
}

function generateProblem(opPref, carryPref, maxVal) {
  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    const op = opPref === 'both' ? (Math.random() < 0.5 ? 'add' : 'sub') : opPref;
    const a = Math.floor(Math.random() * maxVal);
    const b = Math.floor(Math.random() * maxVal);
    let top = Math.max(a, b), bottom = Math.min(a, b);
    if (op === 'add' && Math.random() < 0.5) { let t = top; top = bottom; bottom = t; }
    if (op === 'sub' && top === bottom) continue;
    const { hasEvent, hasBoxArray } = checkCarryBorrow(top, bottom, op);
    let valid = true;
    if (carryPref === 'with' && !hasEvent) valid = false;
    if (carryPref === 'without' && hasEvent) valid = false;
    if (top === 0 && bottom === 0) valid = false;
    if (valid) {
      return { top, bottom, op, answer: op === 'add' ? top + bottom : top - bottom, userAnswer: null, isCorrect: false, hasBoxArray, userInputs: {} };
    }
  }
  return { top: 10, bottom: 5, op: 'add', answer: 15, userAnswer: null, isCorrect: false, hasBoxArray: [false,false,false], userInputs: {} };
}

function generateProblems() {
  const problems = [];
  const maxVal = mathConfig.range === 'all' ? 10000 : mathConfig.range;
  for (let i = 0; i < mathConfig.questionCount; i++) problems.push(generateProblem(mathConfig.operation, mathConfig.carryBorrow, maxVal));
  return problems;
}

const pill = (active) =>
  `class="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
          ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}"`;

export function renderMathPractice() {
  if (mathSession.phase === 'setup') return renderSetup();
  if (mathSession.phase === 'practice') return renderPractice();
  if (mathSession.phase === 'complete') return renderComplete();
}

function renderSetup() {
  return `
    <div class="max-w-xl mx-auto px-4 pt-10 pb-24">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Thiết lập Luyện Tập Phép Tính</h2>
        <p class="text-sm text-surface-400">Chọn cấu hình để sinh các phép toán tự động</p>
      </div>
      <div class="space-y-3">
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.05s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Phép toán</h3>
          <div class="flex flex-wrap gap-2">
            <button data-math-op="add" ${pill(mathConfig.operation === 'add')}>Cộng (+)</button>
            <button data-math-op="sub" ${pill(mathConfig.operation === 'sub')}>Trừ (-)</button>
            <button data-math-op="both" ${pill(mathConfig.operation === 'both')}>Cả hai (+, -)</button>
          </div>
        </div>
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.1s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Nhớ / Mượn</h3>
          <div class="flex flex-wrap gap-2">
            <button data-math-carry="without" ${pill(mathConfig.carryBorrow === 'without')}>Không nhớ / mượn</button>
            <button data-math-carry="with" ${pill(mathConfig.carryBorrow === 'with')}>Có nhớ / mượn</button>
            <button data-math-carry="all" ${pill(mathConfig.carryBorrow === 'all')}>Tất cả</button>
          </div>
        </div>
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.15s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Phạm vi</h3>
          <div class="flex flex-wrap gap-2">
            ${[10, 100, 1000, 10000, 'all'].map(r => `
              <button data-math-range="${r}" ${pill(mathConfig.range === r)}>
                ${r === 'all' ? 'Ngẫu nhiên' : 'Trong phạm vi ' + r}
              </button>`).join('')}
          </div>
        </div>
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.2s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Số câu hỏi</h3>
          <div class="flex flex-wrap gap-2">
            ${[5, 10, 20, 50].map(n => `
              <button data-math-count="${n}" ${pill(mathConfig.questionCount === n)}>
                ${n} câu
              </button>`).join('')}
          </div>
        </div>
      </div>
      <div class="mt-8 flex justify-end">
        <button id="btn-math-start" class="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-bold shadow-xl transition-all">
          Bắt đầu luyện tập
        </button>
      </div>
    </div>
  `;
}

function renderPractice() {
  const p = mathSession.problems[mathSession.currentIndex];
  const topStr = String(p.top);
  const bottomStr = String(p.bottom);
  const opSign = p.op === 'add' ? '+' : '-';
  const maxDigits = Math.max(topStr.length, bottomStr.length) + (p.op === 'add' ? 1 : 0);

  // Build focus sequence: answer-0, carry-1 (if exists), answer-1, carry-2 (if exists), ...
  mathSession.focusSequence = [];
  for (let i = 0; i < maxDigits; i++) {
    if (i === 0 && p.hasBoxArray[0]) mathSession.focusSequence.push('carry-0');
    mathSession.focusSequence.push('answer-' + i);
    if (i + 1 < maxDigits && p.hasBoxArray[i + 1]) mathSession.focusSequence.push('carry-' + (i + 1));
  }

  let carryBoxes = '';
  for (let i = maxDigits - 1; i >= 0; i--) {
    if (p.hasBoxArray[i]) {
      const val = p.userInputs['carry-' + i] || '';
      carryBoxes += '<input type="text" inputmode="none" maxlength="1" id="math-input-carry-' + i + '" data-logical-id="carry-' + i + '" class="math-input math-carry-input" value="' + val + '" ' + (mathSession.status !== 'answering' ? 'disabled' : '') + ' />';
    } else {
      carryBoxes += '<div class="math-cell-spacer"></div>';
    }
  }

  let topHtml = '';
  const topPadded = topStr.padStart(maxDigits, ' ');
  for (let i = 0; i < maxDigits; i++) {
    topHtml += '<div class="math-digit-cell">' + (topPadded[i] !== ' ' ? topPadded[i] : '') + '</div>';
  }

  let bottomHtml = '';
  const bottomPadded = bottomStr.padStart(maxDigits, ' ');
  for (let i = 0; i < maxDigits; i++) {
    bottomHtml += '<div class="math-digit-cell">' + (bottomPadded[i] !== ' ' ? bottomPadded[i] : '') + '</div>';
  }

  let answerHtml = '';
  for (let i = maxDigits - 1; i >= 0; i--) {
    const value = p.userInputs['answer-' + i] || '';
    answerHtml += '<input type="text" inputmode="none" maxlength="1" id="math-input-answer-' + i + '" data-logical-id="answer-' + i + '" class="math-input math-answer-input" value="' + value + '" ' + (mathSession.status !== 'answering' ? 'disabled' : '') + ' />';
  }

  const total = mathSession.problems.length;
  const curr = mathSession.currentIndex + 1;

  let statusHtml = '';
  let cardExtra = '';
  if (mathSession.status === 'correct') {
    cardExtra = 'math-card-correct';
    statusHtml = '<div class="math-status-overlay animate-bounce"><svg class="w-24 h-24 text-success-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg><span class="text-3xl font-bold text-success-400">Đúng rồi!</span></div>';
  } else if (mathSession.status === 'wrong') {
    cardExtra = 'math-card-wrong';
    statusHtml = '<div class="math-status-overlay"><div class="animate-shake flex flex-col items-center"><svg class="w-24 h-24 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg><span class="text-3xl font-bold text-red-400">Sai mất rồi</span></div></div>';
  }

  let numpadHtml = '';
  if (mathSession.status === 'answering') {
    numpadHtml = `
      <div class="math-numpad fade-in">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="math-numpad-btn" data-val="${n}">${n}</button>`).join('')}
        <button class="math-numpad-btn" data-val="backspace">
          <svg class="w-7 h-7 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/></svg>
        </button>
        <button class="math-numpad-btn" data-val="0">0</button>
        <button id="btn-math-check" class="math-numpad-btn math-numpad-check">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
        </button>
      </div>
    `;
  }

  return `
    <div class="max-w-md mx-auto px-4 pt-10 pb-24 flex flex-col h-full">
      <div class="fade-in flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-surface-100">Câu ${curr} / ${total}</h2>
        <button id="btn-math-exit" class="px-4 py-2 text-sm text-surface-400 hover:text-surface-200 bg-white/5 hover:bg-white/10 rounded-xl transition-all">Thoát</button>
      </div>
      <div class="flex-1 flex flex-col items-center justify-start">
        <div class="glass p-8 sm:p-10 rounded-3xl flex flex-col items-end relative border border-white/5 transition-all duration-300 min-w-[320px] ${cardExtra}">
          ${statusHtml}
          <div class="font-mono text-4xl font-bold text-surface-100 relative w-full flex flex-col">
            <div class="absolute left-0 bottom-24 text-surface-400 text-4xl select-none flex items-center h-12">${opSign}</div>
            <div class="flex justify-end gap-2 mb-4 w-full">${carryBoxes}</div>
            <div class="flex justify-end gap-2 mb-2 w-full">${topHtml}</div>
            <div class="flex justify-end gap-2 w-full">${bottomHtml}</div>
          </div>
          <div class="w-full border-t-4 border-surface-700 my-6 rounded-full"></div>
          <div class="flex justify-end gap-2 w-full" id="math-answer-row">${answerHtml}</div>
        </div>
        ${numpadHtml}
      </div>
    </div>
  `;
}

function renderComplete() {
  const correctCount = mathSession.problems.filter(p => p.isCorrect).length;
  const total = mathSession.problems.length;
  const pct = Math.round((correctCount / total) * 100);
  const grade = pct === 100 ? { label: 'Tuyệt vời!', color: 'text-success-400' }
              : pct >= 80 ? { label: 'Rất tốt!', color: 'text-primary-400' }
              : pct >= 50 ? { label: 'Cố gắng lên nhé!', color: 'text-warning-400' }
              : { label: 'Cần ôn tập thêm!', color: 'text-red-400' };

  return `
    <div class="max-w-5xl mx-auto px-4 pt-10 pb-24">
      <div class="fade-in text-center mb-8">
        <h2 class="text-3xl font-bold text-surface-100 mb-2">Kết quả</h2>
        <p class="${grade.color} font-medium text-lg">${grade.label}</p>
        <div class="mt-4 text-4xl font-bold text-surface-100">${correctCount} <span class="text-xl text-surface-400">/ ${total}</span></div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 fade-in" style="animation-delay:.1s">
        ${mathSession.problems.map((p, idx) => {
          const topStr = String(p.top), bottomStr = String(p.bottom);
          const opSign = p.op === 'add' ? '+' : '-';
          const ok = p.isCorrect;
          return `
            <div class="glass p-4 rounded-xl flex flex-col items-end relative border ${ok ? 'border-success-500/30' : 'border-red-500/30'}">
              <div class="absolute top-2 left-2 text-xs font-bold text-surface-500">#${idx + 1}</div>
              <div class="absolute top-2 right-2 ${ok ? 'text-success-400' : 'text-red-400'}">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="${ok ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"/></svg>
              </div>
              <div class="text-xl font-bold font-mono tracking-[0.25em] text-surface-200 pr-1 mt-4">${topStr}</div>
              <div class="flex justify-between w-full mt-1 pr-1 text-xl font-bold font-mono text-surface-200">
                <span class="text-surface-400">${opSign}</span><span class="tracking-[0.25em]">${bottomStr}</span>
              </div>
              <div class="w-full border-t-2 ${ok ? 'border-success-500/40' : 'border-red-500/40'} my-2"></div>
              <div class="w-full text-right font-mono font-bold text-xl p-1 ${ok ? 'text-success-400' : 'text-red-400'}">${p.userAnswer !== null ? p.userAnswer : '?'}</div>
              ${!ok ? '<div class="w-full text-right font-mono text-sm text-success-400/80 mt-1">Đúng: ' + p.answer + '</div>' : ''}
            </div>`;
        }).join('')}
      </div>
      <div class="mt-8 flex justify-center gap-4">
        <button id="btn-math-retry" class="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-surface-200 rounded-xl font-medium border border-white/10 transition-all">Luyện tập lại</button>
        <button id="btn-math-setup" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all shadow-lg">Thiết lập mới</button>
      </div>
    </div>
  `;
}

function processCheck(rerenderFn) {
  if (mathSession.status !== 'answering') return;
  const p = mathSession.problems[mathSession.currentIndex];
  const maxDigits = Math.max(String(p.top).length, String(p.bottom).length) + (p.op === 'add' ? 1 : 0);
  let answerStr = '';
  for (let i = maxDigits - 1; i >= 0; i--) answerStr += p.userInputs['answer-' + i] || '';
  if (answerStr === '') return;
  p.userAnswer = parseInt(answerStr, 10);
  p.isCorrect = p.userAnswer === p.answer;
  if (p.isCorrect) { mathSession.status = 'correct'; playDing(); }
  else { mathSession.status = 'wrong'; playError(); }
  rerenderFn();
  setTimeout(() => {
    if (mathSession.currentIndex < mathSession.problems.length - 1) { mathSession.currentIndex++; mathSession.status = 'answering'; }
    else mathSession.phase = 'complete';
    rerenderFn();
  }, 1500);
}

export function initMathPracticeEvents(allWords, rerenderFn) {
  if (mathSession.phase === 'setup') {
    document.querySelectorAll('[data-math-op]').forEach(btn => btn.addEventListener('click', () => { mathConfig.operation = btn.dataset.mathOp; rerenderFn(); }));
    document.querySelectorAll('[data-math-carry]').forEach(btn => btn.addEventListener('click', () => { mathConfig.carryBorrow = btn.dataset.mathCarry; rerenderFn(); }));
    document.querySelectorAll('[data-math-range]').forEach(btn => btn.addEventListener('click', () => { const v = btn.dataset.mathRange; mathConfig.range = v === 'all' ? 'all' : parseInt(v, 10); rerenderFn(); }));
    document.querySelectorAll('[data-math-count]').forEach(btn => btn.addEventListener('click', () => { mathConfig.questionCount = parseInt(btn.dataset.mathCount, 10); rerenderFn(); }));
    document.getElementById('btn-math-start')?.addEventListener('click', () => { mathSession.problems = generateProblems(); mathSession.currentIndex = 0; mathSession.status = 'answering'; mathSession.phase = 'practice'; rerenderFn(); });
  }

  if (mathSession.phase === 'practice') {
    const inputs = Array.from(document.querySelectorAll('.math-input'));
    const p = mathSession.problems[mathSession.currentIndex];

    const advanceFocus = (logicalId) => {
      const idx = mathSession.focusSequence.indexOf(logicalId);
      if (idx !== -1 && idx < mathSession.focusSequence.length - 1) document.getElementById('math-input-' + mathSession.focusSequence[idx + 1])?.focus();
    };
    const reverseFocus = (logicalId) => {
      const idx = mathSession.focusSequence.indexOf(logicalId);
      if (idx > 0) document.getElementById('math-input-' + mathSession.focusSequence[idx - 1])?.focus();
    };

    inputs.forEach(input => {
      input.addEventListener('input', e => {
        if (mathSession.status !== 'answering') return;
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
        const lid = e.target.dataset.logicalId;
        p.userInputs[lid] = val;
        if (val !== '') advanceFocus(lid);
      });
      input.addEventListener('keydown', e => {
        if (mathSession.status !== 'answering') return;
        if (e.key === 'Backspace' && e.target.value === '') reverseFocus(e.target.dataset.logicalId);
        else if (e.key === 'Enter') processCheck(rerenderFn);
      });
    });

    document.querySelectorAll('.math-numpad-btn').forEach(btn => {
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => {
        if (mathSession.status !== 'answering') return;
        const val = btn.dataset.val;
        if (!val) return; // check button handled separately
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('math-input')) {
          const lid = activeEl.dataset.logicalId;
          if (val === 'backspace') { activeEl.value = ''; p.userInputs[lid] = ''; reverseFocus(lid); }
          else { activeEl.value = val; p.userInputs[lid] = val; advanceFocus(lid); }
        } else if (inputs.length > 0) {
          let firstEmpty = mathSession.focusSequence.find(id => !p.userInputs[id]) || mathSession.focusSequence[0];
          const el = document.getElementById('math-input-' + firstEmpty);
          if (el) { el.focus(); if (val !== 'backspace') { el.value = val; p.userInputs[firstEmpty] = val; advanceFocus(firstEmpty); } }
        }
      });
    });

    if (mathSession.status === 'answering' && mathSession.focusSequence.length > 0) {
      setTimeout(() => {
        let first = mathSession.focusSequence.find(id => !p.userInputs[id]) || mathSession.focusSequence[0];
        document.getElementById('math-input-' + first)?.focus();
      }, 50);
    }

    document.getElementById('btn-math-check')?.addEventListener('click', () => processCheck(rerenderFn));
    document.getElementById('btn-math-exit')?.addEventListener('click', () => { mathSession.phase = 'setup'; rerenderFn(); });
  }

  if (mathSession.phase === 'complete') {
    document.getElementById('btn-math-retry')?.addEventListener('click', () => { mathSession.problems = generateProblems(); mathSession.currentIndex = 0; mathSession.status = 'answering'; mathSession.phase = 'practice'; rerenderFn(); });
    document.getElementById('btn-math-setup')?.addEventListener('click', () => { mathSession.phase = 'setup'; rerenderFn(); });
  }
}
