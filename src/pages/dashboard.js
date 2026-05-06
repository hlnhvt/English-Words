import store from '../store.js';

/**
 * Render the Dashboard page
 */
export function renderDashboard(allWords) {
  const stats = store.getStats(allWords);
  const todayLog = store.getTodayLog();
  const settings = store.getSettings();
  const reviewDue = store.getWordsForReview();
  const progress = store.getAllProgress();

  // Get recent words (last 8 learned)
  const recentWords = Object.entries(progress)
    .filter(([, p]) => p.lastReviewed)
    .sort((a, b) => b[1].lastReviewed.localeCompare(a[1].lastReviewed))
    .slice(0, 8)
    .map(([word, p]) => {
      const wordData = allWords.find(w => w.word === word);
      return { ...p, word, level: wordData?.level || 'B2', pos: wordData?.pos || [] };
    });

  const progressPercent = Math.round((stats.learnedWords / stats.totalWords) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  // Greeting based on time
  const hour = new Date().getHours();
  let greeting = 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) greeting = 'Chào buổi chiều';
  else if (hour >= 18) greeting = 'Chào buổi tối';

  return `
    <div class="max-w-6xl mx-auto px-4 pt-20 pb-10">
      <!-- Hero Section -->
      <div class="fade-in mb-8">
        <div class="relative overflow-hidden rounded-3xl hero-bg border border-white/5 p-6 sm:p-8">
          <div class="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
          
          <div class="relative flex flex-col md:flex-row items-center gap-6">
            <div class="flex-1">
              <p class="text-surface-400 text-sm mb-1 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ${greeting}
              </p>
              <h1 class="text-2xl sm:text-4xl font-bold mb-3 pb-2 leading-tight">
                <span class="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  Oxford 5000
                </span>
                <span class="text-surface-200"> Vocabulary</span>
              </h1>
              <p class="text-surface-400 text-sm mb-5">
                Hành trình chinh phục ${stats.totalWords.toLocaleString()} từ vựng tiếng Anh
              </p>
              <div class="flex flex-wrap gap-3">
                <a href="#/learn" class="btn-hover inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-primary-600/25">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> Học từ mới
                </a>
                <a href="#/review" class="btn-hover inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-surface-200 rounded-xl font-medium text-sm border border-white/10">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Ôn tập ${reviewDue.length > 0 ? `<span class="ml-1 px-2 py-0.5 bg-warning-500/20 text-warning-400 rounded-full text-xs">${reviewDue.length}</span>` : ''}
                </a>
              </div>
            </div>

            <!-- Progress Ring -->
            <div class="flex-shrink-0">
              <div class="relative w-36 h-36">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" class="text-surface-800" stroke-width="6" fill="none"/>
                  <circle cx="50" cy="50" r="45" stroke="url(#progressGradient)" stroke-width="6" fill="none"
                          stroke-linecap="round"
                          stroke-dasharray="${circumference}"
                          stroke-dashoffset="${strokeOffset}"
                          class="progress-ring"/>
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#6366f1"/>
                      <stop offset="100%" style="stop-color:#8b5cf6"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-2xl font-bold text-surface-100">${progressPercent}%</span>
                  <span class="text-xs text-surface-400">${stats.learnedWords}/${stats.totalWords}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        ${renderStatCard('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>', 'Đã học', stats.learnedWords, 'từ', 'from-primary-600/15 to-primary-600/5', 'text-primary-400', 0)}
        ${renderStatCard('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', 'Thành thạo', stats.masteredWords, 'từ', 'from-success-600/15 to-success-600/5', 'text-success-400', 1)}
        ${renderStatCard('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>', 'Cần ôn', reviewDue.length, 'từ', 'from-warning-500/15 to-warning-500/5', 'text-warning-400', 2)}
        ${renderStatCard('<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>', 'Chuỗi ngày', stats.streak.current, 'ngày', 'from-red-500/15 to-red-500/5', 'text-red-400', 3)}
      </div>

      <!-- Today's Progress & CEFR Levels -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <!-- Today -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay: 0.3s">
          <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Hôm nay
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white/5 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-primary-400">${todayLog.wordsLearned}</div>
              <div class="text-xs text-surface-400 mt-1">Từ mới học</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 text-center">
              <div class="text-2xl font-bold text-accent-400">${todayLog.wordsReviewed}</div>
              <div class="text-xs text-surface-400 mt-1">Từ đã ôn</div>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex justify-between text-xs text-surface-400 mb-1.5">
              <span>Tiến độ hôm nay</span>
              <span>${todayLog.wordsLearned}/${settings.wordsPerDay} từ</span>
            </div>
            <div class="w-full h-2 bg-surface-800 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                   style="width: ${Math.min(100, (todayLog.wordsLearned / settings.wordsPerDay) * 100)}%"></div>
            </div>
          </div>
        </div>

        <!-- CEFR Progress -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay: 0.4s">
          <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Tiến độ theo cấp độ
          </h3>
          <div class="space-y-3">
            ${['A1', 'A2', 'B1', 'B2', 'C1'].map(level => {
              const data = stats.byLevel[level];
              const pct = data.total > 0 ? Math.round((data.learned / data.total) * 100) : 0;
              const colors = {
                A1: 'from-emerald-500 to-emerald-400',
                A2: 'from-blue-500 to-blue-400',
                B1: 'from-amber-500 to-amber-400',
                B2: 'from-violet-500 to-violet-400',
                C1: 'from-red-500 to-red-400',
              };
              return `
                <div>
                  <div class="flex justify-between items-center text-xs mb-1">
                    <span class="font-medium text-surface-200">${level}</span>
                    <span class="text-surface-400">${data.learned}/${data.total}</span>
                  </div>
                  <div class="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r ${colors[level]} rounded-full transition-all duration-700"
                         style="width: ${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Recent Words -->
      ${recentWords.length > 0 ? `
        <div class="fade-in" style="animation-delay: 0.5s">
          <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Từ vựng gần đây
          </h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${recentWords.map((w, i) => `
              <div class="glass rounded-xl p-3 hover:bg-white/8 transition-all cursor-default group" style="animation-delay: ${0.5 + i * 0.05}s">
                <div class="flex items-start justify-between mb-1">
                  <span class="font-semibold text-surface-100 group-hover:text-primary-400 transition-colors">${w.word}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded level-${w.level.toLowerCase()} text-white font-medium">${w.level}</span>
                </div>
                <div class="text-xs text-surface-500">${w.pos.join(', ')}</div>
                <div class="mt-1.5 flex items-center gap-1">
                  <div class="w-1.5 h-1.5 rounded-full ${w.status === 'mastered' ? 'bg-success-500' : w.status === 'learning' ? 'bg-warning-500' : 'bg-surface-600'}"></div>
                  <span class="text-[10px] text-surface-500">${w.status === 'mastered' ? 'Thành thạo' : w.status === 'learning' ? 'Đang học' : 'Mới'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="fade-in text-center py-12" style="animation-delay: 0.5s">
          <div class="text-primary-400 mb-3 flex justify-center"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></div>
          <h3 class="text-lg font-semibold text-surface-200 mb-2">Bắt đầu hành trình học từ vựng!</h3>
          <p class="text-surface-400 text-sm mb-4">Hãy bắt đầu học những từ đầu tiên ngay hôm nay</p>
          <a href="#/learn" class="btn-hover inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-medium shadow-lg shadow-primary-600/25">
            Bắt đầu học ngay →
          </a>
        </div>
      `}
    </div>
  `;
}

function renderStatCard(icon, label, value, unit, bgGradient, textColor, delay) {
  return `
    <div class="fade-in glass rounded-2xl p-4 hover:scale-[1.02] transition-transform" style="animation-delay: ${0.1 + delay * 0.1}s">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br ${bgGradient} flex items-center justify-center text-sm">
          ${icon}
        </div>
        <span class="text-xs text-surface-400">${label}</span>
      </div>
      <div class="flex items-baseline gap-1">
        <span class="text-xl font-bold ${textColor}">${value.toLocaleString()}</span>
        <span class="text-xs text-surface-500">${unit}</span>
      </div>
    </div>
  `;
}

export function initDashboardEvents() {
  // No special events needed for dashboard
}
