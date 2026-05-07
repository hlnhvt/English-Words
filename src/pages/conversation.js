import store from '../store.js';

let allDialogues = [];
let filteredDialogues = [];

let convFilters = {
  topics: ['all'],
  levels: ['all'],
  keyword: ''
};

let convCurrentPage = 1;
let convItemsPerPage = 12;
let showAdvancedFilters = false;

let convSession = {
  phase: 'setup',
  dialogue: null,
  lineIndex: 0,
  answers: [],
  startTime: null,
};

const LINE_TIME_SEC = 90;
let convCountdownInterval = null;
let convTimeLeft = LINE_TIME_SEC;

function clearAllTimers() {
  if (convCountdownInterval) {
    clearInterval(convCountdownInterval);
    convCountdownInterval = null;
  }
}

function updateTimerDisplay() {
  const timerText = document.getElementById('conv-timer-text');
  const timerBar = document.getElementById('conv-timer-bar');
  if (!timerText || !timerBar) return;
  timerText.textContent = convTimeLeft;
  const pct = Math.max(0, (convTimeLeft / LINE_TIME_SEC) * 100);
  timerBar.style.width = pct + '%';
  if (convTimeLeft <= 10) {
    timerBar.className = 'bg-red-500 h-1 rounded-full';
  } else if (convTimeLeft <= 20) {
    timerBar.className = 'bg-warning-400 h-1 rounded-full';
  } else {
    timerBar.className = 'bg-primary-500 h-1 rounded-full';
  }
}

function startLineCountdown(rerenderFn) {
  clearAllTimers();
  convTimeLeft = LINE_TIME_SEC;
  updateTimerDisplay();
  convCountdownInterval = setInterval(() => {
    convTimeLeft--;
    updateTimerDisplay();
    if (convTimeLeft <= 0) {
      clearAllTimers();
      autoAdvanceLine(rerenderFn);
    }
  }, 1000);
}

function speakLine(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  utt.rate = 0.9;
  const icon = document.getElementById('conv-speak-icon');
  const btn = document.getElementById('btn-conv-speak');
  if (btn) btn.classList.add('text-primary-400', 'bg-primary-500/10');
  utt.onend = () => {
    if (btn) btn.classList.remove('text-primary-400', 'bg-primary-500/10');
  };
  window.speechSynthesis.speak(utt);
}

function autoAdvanceLine(rerenderFn) {
  const input = document.getElementById('conv-input');
  if (!input || input.disabled) return;
  const typed = input.value.trim();
  const line = convSession.dialogue.lines[convSession.lineIndex];
  const correct = typed.toLowerCase() === line.en.toLowerCase();
  convSession.answers.push({ line, typed, correct });
  const isLast = convSession.lineIndex >= convSession.dialogue.lines.length - 1;
  if (isLast) {
    convSession.phase = 'complete';
    const total = convSession.answers.length;
    const correctCount = convSession.answers.filter(a => a.correct).length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    store.logConversationSession({
      dialogueId: convSession.dialogue.id,
      title: convSession.dialogue.title,
      score, correctLines: correctCount, totalLines: total,
      date: new Date().toISOString(),
    });
    rerenderFn();
  } else {
    convSession.lineIndex++;
    rerenderFn();
    setTimeout(() => {
      renderTypingTarget();
      const newInput = document.getElementById('conv-input');
      if (newInput) newInput.focus();
    }, 0);
  }
}

async function fetchDialogues(rerenderFn) {
  if (allDialogues.length > 0) return allDialogues;
  try {
    const res = await fetch('/data/conversations.json');
    allDialogues = await res.json();
    applyFilters();
    if (rerenderFn) rerenderFn();
    return allDialogues;
  } catch (e) {
    console.error('Failed to load dialogues', e);
    return [];
  }
}

function applyFilters() {
  filteredDialogues = allDialogues.filter(d => {
    const matchTopic = convFilters.topics.includes('all') || convFilters.topics.includes(d.topic);
    const matchLevel = convFilters.levels.includes('all') || convFilters.levels.includes(d.level);
    const matchKeyword = !convFilters.keyword || 
                         d.title.toLowerCase().includes(convFilters.keyword.toLowerCase()) ||
                         d.topic.toLowerCase().includes(convFilters.keyword.toLowerCase());
    return matchTopic && matchLevel && matchKeyword;
  });
}

export function resetConversationSession() {
  convSession = { phase: 'setup', dialogue: null, lineIndex: 0, answers: [], startTime: null };
}

function getLevelClass(level) {
  return `level-${level.toLowerCase()}`;
}

function getGrade(score) {
  if (score >= 90) return 'Xuất sắc!';
  if (score >= 70) return 'Tốt lắm!';
  if (score >= 50) return 'Cần cố gắng hơn!';
  return 'Hãy luyện tập thêm!';
}

function getGradeColor(score) {
  if (score >= 90) return 'text-success-400';
  if (score >= 70) return 'text-primary-400';
  if (score >= 50) return 'text-warning-400';
  return 'text-red-400';
}

// 20 pairs where index-0 and index-1 are always different files
const AVATAR_PAIRS = [
  ['female_1', 'male_3'],
  ['female_3', 'male_4'],
  ['male_3',   'female_3'],
  ['male_4',   'male_5'],
  ['male_5',   'female_3'],
  ['female_1', 'male_4'],
  ['female_3', 'male_5'],
  ['male_3',   'female_1'],
  ['male_4',   'female_3'],
  ['male_5',   'female_1'],
  ['female_1', 'male_5'],
  ['female_3', 'male_3'],
  ['male_3',   'male_4'],
  ['male_4',   'female_1'],
  ['male_5',   'male_3'],
  ['female_3', 'female_1'],
  ['male_3',   'male_5'],
  ['male_4',   'male_3'],
  ['male_5',   'male_4'],
  ['female_1', 'female_3'],
];

// Build speaker→index map for a dialogue (first seen = 0, second = 1)
function buildSpeakerMap(lines) {
  const map = {};
  for (const line of lines) {
    if (map[line.speaker] === undefined) {
      map[line.speaker] = Object.keys(map).length; // 0 or 1
      if (Object.keys(map).length === 2) break;
    }
  }
  return map;
}

function speakerCircle(speaker, dialogueId, speakerIdx) {
  const pair = AVATAR_PAIRS[((dialogueId || 1) - 1) % AVATAR_PAIRS.length];
  const avatar = pair[speakerIdx ?? 0];
  return `<span title="${speaker}" class="inline-flex items-center justify-center w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 shadow-sm bg-surface-800">
    <img src="/avatar/${avatar}.svg" alt="${speaker}" class="w-full h-full object-cover"/>
  </span>`;
}

function renderSetup() {
  const topics = ['all', ...new Set(allDialogues.map(d => d.topic))];
  const levels = ['all', 'A1', 'A2', 'B1', 'B2', 'C1'];
  const perPageOptions = [6, 12, 24, 48];

  const totalPages = Math.ceil(filteredDialogues.length / convItemsPerPage);
  if (convCurrentPage > totalPages && totalPages > 0) convCurrentPage = totalPages;
  if (convCurrentPage < 1) convCurrentPage = 1;
  
  const startIndex = (convCurrentPage - 1) * convItemsPerPage;
  const pagedDialogues = filteredDialogues.slice(startIndex, startIndex + convItemsPerPage);

  const renderMultiSelectDropdown = (id, options, selected, label) => {
    const isAll = selected.includes('all');
    const displayText = isAll ? 'Tất cả' : `${selected.length} đã chọn`;
    
    return `
      <div class="relative h-full" id="dropdown-${id}">
        <label class="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">${label}</label>
        <button class="dropdown-trigger w-full bg-surface-950 border border-surface-800 rounded-xl px-4 py-2.5 text-sm text-surface-200 flex items-center justify-between hover:border-primary-500/50 transition-all focus:border-primary-500 outline-none shadow-sm">
          <span class="${!isAll ? 'text-primary-400 font-medium' : ''}">${displayText}</span>
          <svg class="w-4 h-4 text-surface-500 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div class="dropdown-content absolute z-[100] top-full left-0 mt-2 w-full max-h-80 overflow-y-auto bg-surface-900 border border-surface-700 rounded-xl shadow-2xl hidden p-2 space-y-0.5 shadow-primary-900/50">
          <div class="max-h-60 overflow-y-auto mb-2 custom-scrollbar">
            ${options.map(opt => {
              const isSelected = selected.includes(opt);
              return `
                <div data-filter="${id}" data-value="${opt}" 
                     class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                            ${isSelected ? 'bg-primary-600/20 text-primary-100' : 'hover:bg-white/5 text-surface-400 hover:text-surface-200'}">
                  <div class="w-4 h-4 rounded border transition-colors ${isSelected ? 'bg-primary-600 border-primary-500' : 'border-surface-600'} flex items-center justify-center shrink-0">
                    ${isSelected ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : ''}
                  </div>
                  <span class="text-sm font-medium">${opt === 'all' ? 'Tất cả' : opt}</span>
                </div>
              `;
            }).join('')}
          </div>
          <button class="btn-apply-filter w-full py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary-600/20">
            Áp dụng
          </button>
        </div>
      </div>
    `;
  };

  return `
    <div class="fade-in max-w-5xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-surface-100">Giao tiếp</h1>
          <p class="text-surface-400 mt-1">Luyện tập hội thoại với nhân vật nổi tiếng</p>
        </div>
        <div class="flex gap-3">
          <button id="btn-conv-advanced" class="btn-hover flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-surface-200 font-semibold px-4 py-2.5 rounded-xl transition-all border border-white/5" title="Hiện/Ẩn bộ lọc nâng cao">
            <svg class="w-5 h-5 ${showAdvancedFilters ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            Bộ lọc
          </button>
          <button id="btn-conv-random" class="btn-hover flex items-center gap-2 bg-accent-600 hover:bg-accent-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-600/20" title="Luyện tập ngẫu nhiên dựa trên bộ lọc">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Ngẫu nhiên
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="glass rounded-2xl p-6 mb-8 space-y-6 relative z-20">
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Tìm kiếm bài hội thoại</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input id="conv-filter-search" type="text" placeholder="Tên bài, chủ đề..." value="${convFilters.keyword}"
                     class="w-full bg-surface-950 border border-surface-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-200 focus:border-primary-500/50 outline-none transition-all shadow-sm"/>
            </div>
          </div>
        </div>

        <div class="${showAdvancedFilters ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5 animate-scale-in">
          ${renderMultiSelectDropdown('conv-filter-topics', topics, convFilters.topics, 'Chủ đề')}
          ${renderMultiSelectDropdown('conv-filter-levels', levels, convFilters.levels, 'Trình độ')}
          <div>
            <label class="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Số bài / trang</label>
            <select id="conv-per-page" class="w-full bg-surface-950 border border-surface-800 rounded-xl px-3 py-2.5 text-sm text-surface-200 focus:border-primary-500/50 outline-none transition-all cursor-pointer shadow-sm">
              ${perPageOptions.map(n => `<option value="${n}" ${convItemsPerPage === n ? 'selected' : ''}>${n} bài</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      ${filteredDialogues.length === 0 ? `
        <div class="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
          <p class="text-surface-500">Không tìm thấy bài hội thoại nào phù hợp với bộ lọc.</p>
          <button id="btn-reset-filters" class="mt-4 text-primary-400 hover:underline text-sm font-medium">Đặt lại bộ lọc</button>
        </div>
      ` : `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          ${pagedDialogues.map(d => {
            const previewEn = d.lines[0].en.length > 60 ? d.lines[0].en.substring(0, 60) + '...' : d.lines[0].en;
            const previewVi = d.lines[0].vi.length > 60 ? d.lines[0].vi.substring(0, 60) + '...' : d.lines[0].vi;
            
            return `
              <div class="glass rounded-2xl p-6 cursor-pointer btn-hover dialogue-card border border-white/5 hover:border-primary-500/30 group relative overflow-hidden flex flex-col h-full" data-id="${d.id}">
                <div class="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div class="flex items-start justify-between mb-4 relative">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] px-2.5 py-1 rounded-lg bg-surface-800 text-surface-300 font-bold uppercase tracking-wider">${d.topic}</span>
                    <span class="text-[10px] px-2.5 py-1 rounded-lg ${getLevelClass(d.level)} font-bold text-white shadow-sm">${d.level}</span>
                  </div>
                  <div class="flex -space-x-2">
                    ${(() => {
                      const smap = buildSpeakerMap(d.lines);
                      return Object.keys(smap).map(sp => speakerCircle(sp, d.id, smap[sp])).join('');
                    })()}
                  </div>
                </div>

                <h3 class="font-bold text-surface-100 text-lg leading-tight mb-3 group-hover:text-primary-400 transition-colors relative">${d.title}</h3>
                
                <div class="bg-white/5 rounded-xl p-3 mb-4 relative flex-1">
                  <p class="text-xs text-surface-400 italic mb-1">"${previewEn}"</p>
                  <p class="text-xs text-primary-400/80 font-medium">${previewVi}</p>
                </div>

                <div class="flex items-center justify-between text-surface-500 text-xs relative pt-2">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.827-1.233L3 20l1.326-4.707A10.001 10.001 0 0112 4c4.97 0 9 3.582 9 8z"/></svg>
                    ${d.lines.length} câu thoại
                  </span>
                  <span class="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-primary-400 font-bold flex items-center gap-1">Luyện tập <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Pagination Controls -->
        ${totalPages > 1 ? `
          <div class="flex items-center justify-center gap-3">
            <button id="conv-prev" ${convCurrentPage === 1 ? 'disabled' : ''} 
                    class="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-surface-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            
            <div class="flex items-center gap-2">
              ${generatePageNumbers(convCurrentPage, totalPages).map(p => `
                <button data-conv-page="${p}" 
                        class="w-10 h-10 rounded-xl text-sm font-medium transition-all border
                               ${p === convCurrentPage 
                                 ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-600/25' 
                                 : p === '...' 
                                   ? 'bg-transparent text-surface-600 border-transparent cursor-default' 
                                   : 'bg-white/5 text-surface-400 border-white/5 hover:bg-white/10'}">
                  ${p}
                </button>
              `).join('')}
            </div>

            <button id="conv-next" ${convCurrentPage === totalPages ? 'disabled' : ''} 
                    class="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-surface-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-white/5">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        ` : ''}
      `}
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

function renderPractice() {
  const { dialogue, lineIndex, answers } = convSession;
  const total = dialogue.lines.length;
  const current = dialogue.lines[lineIndex];
  const progress = Math.round((lineIndex / total) * 100);
  const smap = buildSpeakerMap(dialogue.lines);

  const transcript = answers.map((ans, i) => {
    const l = ans.line;
    return `
      <div class="flex items-start gap-3 opacity-60">
        ${speakerCircle(l.speaker, dialogue.id, smap[l.speaker])}
        <div>
          <p class="text-xs font-bold text-surface-400 mb-0.5">${l.speaker}</p>
          <p class="text-surface-300 text-sm">${l.en}</p>
          <p class="text-surface-500 text-xs italic mt-0.5">${l.vi}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="fade-in max-w-2xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-4">
        <div class="flex-1 min-w-0 pr-4">
          <h2 class="text-xl font-bold text-surface-100 truncate">${dialogue.title}</h2>
          <p class="text-surface-400 text-sm">Câu ${lineIndex + 1} / ${total}</p>
        </div>
        <button id="btn-conv-exit" class="btn-hover text-surface-400 hover:text-red-400 text-sm px-3 py-1.5 rounded-lg border border-surface-700 transition-colors shrink-0">
          Thoát
        </button>
      </div>

      <div class="w-full bg-surface-800 rounded-full h-1.5 mb-6">
        <div class="bg-primary-500 h-1.5 rounded-full transition-all" style="width: ${progress}%"></div>
      </div>

      <div class="space-y-4 mb-6">
        ${answers.length > 0 ? `
          <div class="glass rounded-2xl p-5 space-y-4 max-h-60 overflow-y-auto">
            ${transcript}
          </div>
        ` : ''}

        <div class="glass rounded-2xl p-6 border-2 border-primary-500/20 shadow-xl shadow-primary-500/5">
          <div class="flex items-center gap-3 mb-4">
            ${speakerCircle(current.speaker, dialogue.id, smap[current.speaker])}
            <span class="text-surface-400 text-sm font-bold">${current.speaker}</span>
            <button id="btn-conv-speak" title="Nghe phát âm"
              class="ml-auto flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400 bg-white/5 hover:bg-primary-500/10 border border-white/5 hover:border-primary-500/30 px-3 py-1.5 rounded-lg transition-all">
              <svg id="conv-speak-icon" class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"/>
              </svg>
              Nghe
            </button>
          </div>
          
          <div class="bg-white/5 rounded-xl p-4 mb-4">
            <p class="text-surface-100 font-medium text-lg leading-relaxed">${current.vi}</p>
          </div>

          <div class="flex items-center gap-2 mb-4">
            <svg class="w-3.5 h-3.5 text-surface-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div class="flex-1 bg-surface-800 rounded-full h-1 overflow-hidden">
              <div id="conv-timer-bar" class="bg-primary-500 h-1 rounded-full" style="width:100%"></div>
            </div>
            <span id="conv-timer-text" class="text-surface-500 text-xs font-mono w-6 text-right">${LINE_TIME_SEC}</span>
          </div>

          <div id="conv-typing-target" class="font-mono text-xl tracking-wider mb-6 min-h-[1.75rem] break-words"></div>

          <div class="relative">
            <input
              id="conv-input"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Gõ lời thoại của ${current.speaker}..."
              class="w-full bg-surface-800 border-2 border-surface-700 rounded-2xl px-5 py-4 text-surface-100 placeholder-surface-600 focus:border-primary-500 outline-none transition-all text-lg mb-6"
            />
          </div>

          <div class="flex justify-end items-center gap-4">
            <p class="text-xs text-surface-500 hidden sm:block">Nhấn <kbd class="px-1.5 py-0.5 rounded bg-surface-700 text-surface-300">Enter</kbd> để tiếp tục</p>
            <button id="btn-conv-next" class="btn-hover bg-primary-600 hover:bg-primary-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary-600/20">
              Tiếp theo →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderComplete() {
  const { dialogue, answers } = convSession;
  const total = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const grade = getGrade(score);
  const gradeColor = getGradeColor(score);
  const smap = buildSpeakerMap(dialogue.lines);

  const breakdown = answers.map((ans, i) => {
    const statusIcon = ans.correct
      ? `<span class="text-success-400 text-xs font-bold flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg> Đúng</span>`
      : `<span class="text-red-400 text-xs font-bold flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg> Sai</span>`;
    return `
      <div class="p-4 rounded-xl ${ans.correct ? 'bg-success-500/5' : 'bg-red-500/5'} border border-white/5">
        <div class="flex items-center gap-2 mb-2">
          ${speakerCircle(ans.line.speaker, dialogue.id, smap[ans.line.speaker])}
          <span class="text-surface-400 text-xs font-bold">${ans.line.speaker}</span>
          <span class="ml-auto">${statusIcon}</span>
        </div>
        <p class="text-surface-100 text-sm font-medium mb-1">${ans.line.en}</p>
        <p class="text-surface-500 text-xs italic mb-2">${ans.line.vi}</p>
        ${!ans.correct ? `<p class="text-red-400 text-xs mt-2 pt-2 border-t border-white/5">Bạn gõ: <span class="italic">"${ans.typed || '(trống)'}"</span></p>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="fade-in max-w-2xl mx-auto px-4 py-8 pb-20">
      <div class="glass rounded-3xl p-8 mb-8 text-center shadow-2xl relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500"></div>
        <p class="text-surface-400 text-sm font-semibold uppercase tracking-widest mb-2">Kết quả luyện tập</p>
        <p class="text-6xl font-black text-surface-100 mb-2">${score}%</p>
        <p class="text-2xl font-bold ${gradeColor} mb-4">${grade}</p>
        <div class="flex justify-center gap-6 text-sm">
          <div class="text-success-400 font-bold"><span class="text-surface-500 font-normal">Đúng:</span> ${correct}</div>
          <div class="text-red-400 font-bold"><span class="text-surface-500 font-normal">Sai:</span> ${total - correct}</div>
          <div class="text-surface-300 font-bold"><span class="text-surface-500 font-normal">Tổng:</span> ${total}</div>
        </div>
      </div>

      <div class="glass rounded-2xl p-6 mb-8">
        <h3 class="text-surface-200 font-bold mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
          Chi tiết bài nói
        </h3>
        <div class="space-y-3">
          ${breakdown}
        </div>
      </div>

      <div class="flex gap-4 justify-center">
        <button id="btn-conv-retry" class="btn-hover flex-1 max-w-[200px] bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary-600/20">
          Luyện lại
        </button>
        <button id="btn-conv-back" class="btn-hover flex-1 max-w-[200px] bg-surface-700 hover:bg-surface-600 text-surface-100 font-bold py-3 rounded-xl transition-all border border-white/5">
          Chọn bài khác
        </button>
      </div>
    </div>
  `;
}

export function renderConversation() {
  if (allDialogues.length === 0) {
    return `
      <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <div class="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-surface-400">Đang tải dữ liệu hội thoại...</p>
      </div>
    `;
  }

  if (convSession.phase === 'setup') return renderSetup();
  if (convSession.phase === 'practice') return renderPractice();
  if (convSession.phase === 'complete') return renderComplete();
  return renderSetup();
}

function renderTypingTarget() {
  const target = document.getElementById('conv-typing-target');
  const input = document.getElementById('conv-input');
  if (!target || !input || !convSession.dialogue) return;

  const line = convSession.dialogue.lines[convSession.lineIndex];
  const typed = input.value;
  const chars = line.en.split('');

  target.innerHTML = chars.map((ch, i) => {
    if (i < typed.length) {
      const correct = typed[i].toLowerCase() === ch.toLowerCase();
      return `<span class="${correct ? 'text-success-400' : 'text-red-400'}">${ch}</span>`;
    }
    return `<span class="text-surface-600">${ch}</span>`;
  }).join('');
}

function submitLine(rerenderFn) {
  const input = document.getElementById('conv-input');
  if (!input || input.disabled) return;

  const typed = input.value.trim();
  const line = convSession.dialogue.lines[convSession.lineIndex];
  const correct = typed.toLowerCase() === line.en.toLowerCase();

  if (!correct) {
    input.classList.add('border-red-500');
    input.classList.remove('border-surface-700');
    setTimeout(() => {
      input.classList.remove('border-red-500');
      input.classList.add('border-surface-700');
    }, 600);
    return;
  }

  // Correct — stop timer, lock input, wait 1.5s then advance
  clearAllTimers();
  convSession.answers.push({ line, typed, correct });
  input.disabled = true;
  input.classList.add('border-success-500');
  const nextBtn = document.getElementById('btn-conv-next');
  if (nextBtn) nextBtn.disabled = true;

  const isLast = convSession.lineIndex >= convSession.dialogue.lines.length - 1;
  setTimeout(() => {
    if (isLast) {
      convSession.phase = 'complete';
      const total = convSession.answers.length;
      const correctCount = convSession.answers.filter(a => a.correct).length;
      const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      store.logConversationSession({
        dialogueId: convSession.dialogue.id,
        title: convSession.dialogue.title,
        score,
        correctLines: correctCount,
        totalLines: total,
        date: new Date().toISOString(),
      });
      rerenderFn();
    } else {
      convSession.lineIndex++;
      rerenderFn();
      setTimeout(() => {
        renderTypingTarget();
        const newInput = document.getElementById('conv-input');
        if (newInput) newInput.focus();
      }, 0);
    }
  }, 700);
}

function startPractice(dialogue, rerenderFn) {
  convSession = {
    phase: 'practice',
    dialogue,
    lineIndex: 0,
    answers: [],
    startTime: Date.now(),
  };
  rerenderFn();
  setTimeout(() => {
    renderTypingTarget();
    const input = document.getElementById('conv-input');
    if (input) input.focus();
  }, 0);
}

export function initConversationEvents(allWords, rerenderFn) {
  if (allDialogues.length === 0) {
    fetchDialogues(rerenderFn);
    return;
  }

  // Setup Events
  document.getElementById('btn-conv-advanced')?.addEventListener('click', () => {
    showAdvancedFilters = !showAdvancedFilters;
    rerenderFn();
  });

  document.querySelectorAll('.dialogue-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id, 10);
      const dialogue = allDialogues.find(d => d.id === id);
      if (dialogue) startPractice(dialogue, rerenderFn);
    });
  });

  // Filter Events
  const searchInput = document.getElementById('conv-filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      convFilters.keyword = e.target.value;
      convCurrentPage = 1;
      applyFilters();
      rerenderFn();
      const newSearch = document.getElementById('conv-filter-search');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
      }
    });
  }

  // Dropdown Toggle handling
  document.querySelectorAll('.dropdown-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const content = trigger.nextElementSibling;
      const isOpen = !content.classList.contains('hidden');
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d !== content) {
          d.classList.add('hidden');
          d.previousElementSibling.querySelector('svg').classList.remove('rotate-180');
        }
      });
      
      content.classList.toggle('hidden');
      trigger.querySelector('svg').classList.toggle('rotate-180', !isOpen);
    });
  });

  // Close dropdowns when clicking outside
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-content') && !e.target.closest('.dropdown-trigger')) {
      document.querySelectorAll('.dropdown-content').forEach(d => {
        d.classList.add('hidden');
        d.previousElementSibling.querySelector('svg').classList.remove('rotate-180');
      });
    }
  });

  // Tag Selector handling (reused for dropdown items)
  document.querySelectorAll('[data-filter]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const type = item.dataset.filter;
      const value = item.dataset.value;
      const key = type === 'conv-filter-topics' ? 'topics' : 'levels';
      
      if (value === 'all') {
        convFilters[key] = ['all'];
      } else {
        // Remove 'all' if it was selected
        convFilters[key] = convFilters[key].filter(v => v !== 'all');
        if (convFilters[key].includes(value)) {
          convFilters[key] = convFilters[key].filter(v => v !== value);
          if (convFilters[key].length === 0) convFilters[key] = ['all'];
        } else {
          convFilters[key].push(value);
        }
      }
      
      // Visual update inside dropdown only (no rerenderFn yet)
      const dropdown = item.closest('.dropdown-content');
      dropdown.querySelectorAll('[data-filter]').forEach(i => {
        const val = i.dataset.value;
        const isSel = convFilters[key].includes(val);
        i.className = `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isSel ? 'bg-primary-600/20 text-primary-100' : 'hover:bg-white/5 text-surface-400 hover:text-surface-200'}`;
        const box = i.querySelector('.w-4');
        box.className = `w-4 h-4 rounded border transition-colors ${isSel ? 'bg-primary-600 border-primary-500' : 'border-surface-600'} flex items-center justify-center shrink-0`;
        box.innerHTML = isSel ? '<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : '';
      });
      
      // Update trigger text
      const isAll = convFilters[key].includes('all');
      const triggerSpan = dropdown.previousElementSibling.querySelector('span');
      triggerSpan.textContent = isAll ? 'Tất cả' : `${convFilters[key].length} đã chọn`;
      triggerSpan.className = !isAll ? 'text-primary-400 font-medium' : '';
    });
  });

  // Apply button handling
  document.querySelectorAll('.btn-apply-filter').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      convCurrentPage = 1;
      applyFilters();
      rerenderFn();
    });
  });

  const perPageSelect = document.getElementById('conv-per-page');
  if (perPageSelect) {
    perPageSelect.addEventListener('change', (e) => {
      convItemsPerPage = parseInt(e.target.value);
      convCurrentPage = 1;
      rerenderFn();
    });
  }

  // Reset Filters
  const btnReset = document.getElementById('btn-reset-filters');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      convFilters = { topics: ['all'], levels: ['all'], keyword: '' };
      convCurrentPage = 1;
      applyFilters();
      rerenderFn();
    });
  }

  // Pagination Events
  document.getElementById('conv-prev')?.addEventListener('click', () => {
    if (convCurrentPage > 1) {
      convCurrentPage--;
      rerenderFn();
    }
  });

  document.getElementById('conv-next')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredDialogues.length / convItemsPerPage);
    if (convCurrentPage < totalPages) {
      convCurrentPage++;
      rerenderFn();
    }
  });

  document.querySelectorAll('[data-conv-page]').forEach(btn => {
    const p = btn.dataset.convPage;
    if (p !== '...') {
      btn.addEventListener('click', () => {
        convCurrentPage = parseInt(p);
        rerenderFn();
      });
    }
  });

  // Random Button
  const btnRandom = document.getElementById('btn-conv-random');
  if (btnRandom) {
    btnRandom.addEventListener('click', () => {
      const pool = filteredDialogues.length > 0 ? filteredDialogues : allDialogues;
      if (pool.length === 0) return;
      const randomDialogue = pool[Math.floor(Math.random() * pool.length)];
      startPractice(randomDialogue, rerenderFn);
    });
  }

  // Practice Events
  // TTS button
  const btnSpeak = document.getElementById('btn-conv-speak');
  if (btnSpeak && convSession.dialogue) {
    btnSpeak.addEventListener('click', () => {
      speakLine(convSession.dialogue.lines[convSession.lineIndex].en);
    });
  }

  const convInput = document.getElementById('conv-input');
  if (convInput) {
    convInput.addEventListener('input', () => {
      renderTypingTarget();
    });

    convInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitLine(rerenderFn);
      }
    });
  }

  const btnNext = document.getElementById('btn-conv-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      submitLine(rerenderFn);
    });
  }

  const btnExit = document.getElementById('btn-conv-exit');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      clearAllTimers();
      resetConversationSession();
      rerenderFn();
    });
  }

  const btnRetry = document.getElementById('btn-conv-retry');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      clearAllTimers();
      if (convSession.dialogue) startPractice(convSession.dialogue, rerenderFn);
    });
  }

  const btnBack = document.getElementById('btn-conv-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      clearAllTimers();
      resetConversationSession();
      rerenderFn();
    });
  }

  if (convSession.phase === 'practice') {
    setTimeout(() => {
      renderTypingTarget();
      const input = document.getElementById('conv-input');
      if (input) input.focus();
      startLineCountdown(rerenderFn);
    }, 0);
  }
}
