import store from '../store.js';

/**
 * Render the Statistics page
 */
export function renderStats(allWords) {
  const stats = store.getStats(allWords);
  const dailyLog = store.getDailyLog();
  const streak = store.getStreak();

  // Calculate mastery distribution
  const progress = store.getAllProgress();
  const masteryDist = { new: 0, learning: 0, mastered: 0 };
  masteryDist.new = stats.totalWords - stats.learnedWords;
  for (const p of Object.values(progress)) {
    if (p.status === 'mastered') masteryDist.mastered++;
    else if (p.status === 'learning') masteryDist.learning++;
  }

  // Generate heatmap data (last 16 weeks)
  const heatmapData = generateHeatmapData(dailyLog);

  // Weekly data for chart
  const weeklyData = generateWeeklyData(dailyLog);

  return `
    <div class="max-w-6xl mx-auto px-4 pt-20 pb-10">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100">Thống kê học tập</h2>
        <p class="text-sm text-surface-400">Theo dõi tiến trình học từ vựng của bạn</p>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        ${renderOverviewCard('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>', 'Tổng đã học', stats.learnedWords, stats.totalWords, 'primary')}
        ${renderOverviewCard('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>', 'Thành thạo', stats.masteredWords, stats.learnedWords || 1, 'success')}
        ${renderOverviewCard('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>', 'Đang học', stats.learningWords, stats.learnedWords || 1, 'accent')}
        ${renderOverviewCard('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>', 'Chuỗi ngày', streak.current, null, 'warning')}
        ${renderOverviewCard('<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>', 'Dài nhất', streak.longest, null, 'red')}
      </div>

      <!-- Heatmap + Mastery Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- Heatmap -->
        <div class="lg:col-span-2 fade-in glass rounded-2xl p-5" style="animation-delay: 0.2s">
          <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Hoạt động học tập
          </h3>
          <div class="overflow-x-auto">
            <div class="flex gap-[3px] min-w-fit">
              ${heatmapData.map(week => `
                <div class="flex flex-col gap-[3px]">
                  ${week.map(day => `
                    <div class="w-3 h-3 rounded-sm ${getHeatmapColor(day.count)} cursor-default" 
                         title="${day.date}: ${day.count} từ"></div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
            <div class="flex items-center gap-2 mt-3">
              <span class="text-[10px] text-surface-500">Ít</span>
              <div class="flex gap-[2px]">
                <div class="w-3 h-3 rounded-sm bg-surface-800"></div>
                <div class="w-3 h-3 rounded-sm bg-primary-900/60"></div>
                <div class="w-3 h-3 rounded-sm bg-primary-700/60"></div>
                <div class="w-3 h-3 rounded-sm bg-primary-500/60"></div>
                <div class="w-3 h-3 rounded-sm bg-primary-400"></div>
              </div>
              <span class="text-[10px] text-surface-500">Nhiều</span>
            </div>
          </div>
        </div>

        <!-- Mastery Distribution -->
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay: 0.3s">
          <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg> Phân bố kiến thức
          </h3>
          <div class="flex items-center justify-center mb-4">
            <canvas id="mastery-chart" width="160" height="160"></canvas>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2 text-xs">
              <div class="w-3 h-3 rounded-full bg-surface-600"></div>
              <span class="text-surface-400 flex-1">Chưa học</span>
              <span class="text-surface-300 font-medium">${masteryDist.new.toLocaleString()}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-3 h-3 rounded-full bg-warning-500"></div>
              <span class="text-surface-400 flex-1">Đang học</span>
              <span class="text-surface-300 font-medium">${masteryDist.learning.toLocaleString()}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <div class="w-3 h-3 rounded-full bg-success-500"></div>
              <span class="text-surface-400 flex-1">Thành thạo</span>
              <span class="text-surface-300 font-medium">${masteryDist.mastered.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CEFR Level Progress -->
      <div class="fade-in glass rounded-2xl p-5 mb-6" style="animation-delay: 0.4s">
        <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Tiến độ theo cấp độ CEFR
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-4">
          ${['A1', 'A2', 'B1', 'B2', 'C1'].map(level => {
            const data = stats.byLevel[level];
            const pct = data.total > 0 ? Math.round((data.learned / data.total) * 100) : 0;
            const masteredPct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0;
            return `
              <div class="text-center">
                <div class="relative w-20 h-20 mx-auto mb-2">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" class="text-surface-800" stroke-width="8" fill="none"/>
                    <circle cx="50" cy="50" r="40" stroke="currentColor" class="text-primary-500" stroke-width="8" fill="none"
                            stroke-linecap="round"
                            stroke-dasharray="${2 * Math.PI * 40}"
                            stroke-dashoffset="${2 * Math.PI * 40 * (1 - pct / 100)}"/>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-sm font-bold text-surface-100">${pct}%</span>
                  </div>
                </div>
                <span class="inline-block text-xs px-2 py-0.5 rounded-full level-${level.toLowerCase()} text-white font-bold mb-1">${level}</span>
                <div class="text-[10px] text-surface-400">${data.learned}/${data.total} từ</div>
                <div class="text-[10px] text-success-400">${masteredPct}% thành thạo</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Weekly Trend -->
      <div class="fade-in glass rounded-2xl p-5 mb-6" style="animation-delay: 0.5s">
        <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg> Xu hướng học tập (8 tuần gần đây)
        </h3>
        <div class="overflow-x-auto">
          <canvas id="weekly-chart" width="700" height="200"></canvas>
        </div>
      </div>

      <!-- Data Management -->
      <div class="fade-in glass rounded-2xl p-5" style="animation-delay: 0.6s">
        <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Quản lý dữ liệu
        </h3>
        <div class="flex flex-wrap gap-3">
          <button id="btn-export" class="btn-hover flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-surface-300 rounded-xl text-sm border border-white/10">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> Xuất dữ liệu
          </button>
          <label class="btn-hover flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-surface-300 rounded-xl text-sm border border-white/10 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> Nhập dữ liệu
            <input type="file" id="btn-import" class="hidden" accept=".json" />
          </label>
          <button id="btn-reset" class="btn-hover flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm border border-red-500/20">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Xóa tất cả
          </button>
        </div>
      </div>

      <!-- Settings -->
      <div class="fade-in glass rounded-2xl p-5 mt-4" style="animation-delay: 0.7s">
        <h3 class="text-sm font-semibold text-surface-300 mb-4 flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> Cài đặt
        </h3>
        <div class="flex items-center gap-4">
          <label class="text-sm text-surface-400">Số từ học mỗi ngày:</label>
          <div class="flex items-center gap-2">
            <input id="words-per-day" type="range" min="5" max="50" step="5" 
                   value="${store.getSettings().wordsPerDay}"
                   class="w-32 accent-primary-500"/>
            <span id="words-per-day-label" class="text-sm font-medium text-primary-400 w-8">${store.getSettings().wordsPerDay}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOverviewCard(icon, label, value, total, color) {
  const colors = {
    primary: 'text-primary-400',
    success: 'text-success-400',
    accent: 'text-accent-400',
    warning: 'text-warning-400',
    red: 'text-red-400',
  };
  return `
    <div class="fade-in glass rounded-2xl p-4 text-center">
      <div class="text-lg mb-1">${icon}</div>
      <div class="text-xl font-bold ${colors[color]}">${value.toLocaleString()}</div>
      <div class="text-[10px] text-surface-400">${label}</div>
      ${total ? `<div class="text-[10px] text-surface-500">/ ${total.toLocaleString()}</div>` : ''}
    </div>
  `;
}

function generateHeatmapData(dailyLog) {
  const weeks = [];
  const today = new Date();
  // Go back 16 weeks
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (16 * 7 - 1) - startDate.getDay());

  let currentWeek = [];
  const d = new Date(startDate);
  
  while (d <= today) {
    const dateStr = d.toISOString().split('T')[0];
    const log = dailyLog[dateStr];
    const count = log ? (log.wordsLearned + log.wordsReviewed) : 0;
    currentWeek.push({ date: dateStr, count });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    d.setDate(d.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getHeatmapColor(count) {
  if (count === 0) return 'bg-surface-800';
  if (count <= 5) return 'bg-primary-900/60';
  if (count <= 10) return 'bg-primary-700/60';
  if (count <= 20) return 'bg-primary-500/60';
  return 'bg-primary-400';
}

function generateWeeklyData(dailyLog) {
  const weeks = [];
  const today = new Date();

  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (w * 7) - weekStart.getDay());
    
    let totalLearned = 0;
    let totalReviewed = 0;

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      const dateStr = day.toISOString().split('T')[0];
      const log = dailyLog[dateStr];
      if (log) {
        totalLearned += log.wordsLearned || 0;
        totalReviewed += log.wordsReviewed || 0;
      }
    }

    const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeks.push({ label: weekLabel, learned: totalLearned, reviewed: totalReviewed });
  }

  return weeks;
}

function drawMasteryChart(canvas, dist) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = dist.new + dist.learning + dist.mastered;
  if (total === 0) return;

  const cx = 80, cy = 80, r = 60;
  const slices = [
    { value: dist.mastered, color: '#10b981' },
    { value: dist.learning, color: '#f59e0b' },
    { value: dist.new, color: '#475569' },
  ];

  let startAngle = -Math.PI / 2;
  for (const slice of slices) {
    const sliceAngle = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.fillStyle = slice.color;
    ctx.fill();
    startAngle += sliceAngle;
  }

  // Center hole (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#020617';
  ctx.fill();

  // Center text
  const pct = total > 0 ? Math.round(((dist.learning + dist.mastered) / total) * 100) : 0;
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${pct}%`, cx, cy - 5);
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('đã học', cx, cy + 12);
}

function drawWeeklyChart(canvas, dailyLog) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = generateWeeklyData(dailyLog);
  
  const w = canvas.width;
  const h = canvas.height;
  const padding = { top: 10, right: 20, bottom: 30, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  ctx.clearRect(0, 0, w, h);

  const maxVal = Math.max(...data.map(d => d.learned + d.reviewed), 10);
  const barWidth = (chartW / data.length) * 0.6;
  const gap = (chartW / data.length) * 0.4;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH - (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round((maxVal / 4) * i).toString(), padding.left - 8, y + 3);
  }

  // Bars
  data.forEach((d, i) => {
    const x = padding.left + (chartW / data.length) * i + gap / 2;
    const totalH = ((d.learned + d.reviewed) / maxVal) * chartH;
    const learnedH = (d.learned / maxVal) * chartH;

    // Reviewed bar (bottom)
    const reviewedH = totalH - learnedH;
    if (reviewedH > 0) {
      const gradient = ctx.createLinearGradient(x, padding.top + chartH - totalH, x, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.2)');
      ctx.fillStyle = gradient;
      roundRect(ctx, x, padding.top + chartH - totalH, barWidth, reviewedH, 3);
    }

    // Learned bar (top)
    if (learnedH > 0) {
      const gradient = ctx.createLinearGradient(x, padding.top + chartH - learnedH, x, padding.top + chartH);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
      ctx.fillStyle = gradient;
      roundRect(ctx, x, padding.top + chartH - learnedH, barWidth, learnedH, 3);
    }

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, h - 8);
  });

  // Legend
  ctx.fillStyle = 'rgba(99, 102, 241, 0.8)';
  ctx.fillRect(w - 160, 8, 10, 10);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Học mới', w - 145, 17);

  ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
  ctx.fillRect(w - 80, 8, 10, 10);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Ôn tập', w - 65, 17);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

export function initStatsEvents(allWords, rerenderFn) {
  // Draw charts
  const masteryCanvas = document.getElementById('mastery-chart');
  const progress = store.getAllProgress();
  const masteryDist = {
    new: allWords.length - Object.keys(progress).length,
    learning: Object.values(progress).filter(p => p.status === 'learning').length,
    mastered: Object.values(progress).filter(p => p.status === 'mastered').length,
  };
  drawMasteryChart(masteryCanvas, masteryDist);

  const weeklyCanvas = document.getElementById('weekly-chart');
  drawWeeklyChart(weeklyCanvas, store.getDailyLog());

  // Export
  document.getElementById('btn-export')?.addEventListener('click', () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oxford5000_progress_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  document.getElementById('btn-import')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = store.importData(ev.target.result);
      if (success) {
        showToast('Nhập dữ liệu thành công!', 'success');
        rerenderFn();
      } else {
        showToast('Lỗi khi nhập dữ liệu!', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Reset
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    showResetConfirmModal(() => {
      store.resetAll();
      showToast('Đã xóa tất cả dữ liệu!', 'success');
      rerenderFn();
    });
  });

  // Words per day slider
  const slider = document.getElementById('words-per-day');
  const label = document.getElementById('words-per-day-label');
  if (slider && label) {
    slider.addEventListener('input', () => {
      label.textContent = slider.value;
      store.updateSettings({ wordsPerDay: parseInt(slider.value) });
    });
  }
}

function showResetConfirmModal(onConfirm) {
  const overlay = document.createElement('div');
  overlay.id = 'reset-confirm-overlay';
  overlay.className = 'fixed inset-0 z-[200] flex items-center justify-center p-4';
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="reset-overlay-bg"></div>
    <div class="relative glass rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-500/20 fade-in">
      <!-- Icon -->
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
      </div>
      <!-- Title -->
      <h3 class="text-lg font-bold text-surface-100 text-center mb-2">Xóa tất cả dữ liệu?</h3>
      <!-- Description -->
      <p class="text-sm text-surface-400 text-center mb-2">Hành động này sẽ xóa vĩnh viễn:</p>
      <ul class="text-sm text-surface-400 mb-5 space-y-1 pl-4">
        <li class="flex items-center gap-2"><span class="text-red-400">•</span> Toàn bộ từ vựng đã học và tiến trình</li>
        <li class="flex items-center gap-2"><span class="text-red-400">•</span> Lịch sử học tập và chuỗi ngày</li>
        <li class="flex items-center gap-2"><span class="text-red-400">•</span> Tất cả số liệu thống kê</li>
      </ul>
      <p class="text-xs text-red-400/80 text-center mb-5 font-medium">Không thể hoàn tác sau khi xóa.</p>
      <!-- Buttons -->
      <div class="flex gap-3">
        <button id="reset-cancel-btn"
          class="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-surface-300 border border-white/10 transition-all">
          Hủy
        </button>
        <button id="reset-confirm-btn"
          class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all">
          Xóa tất cả
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();

  document.getElementById('reset-overlay-bg').addEventListener('click', close);
  document.getElementById('reset-cancel-btn').addEventListener('click', close);
  document.getElementById('reset-confirm-btn').addEventListener('click', () => {
    close();
    onConfirm();
  });

  // Close on Escape
  const onKeyDown = (e) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKeyDown); }
  };
  document.addEventListener('keydown', onKeyDown);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-lg
    ${type === 'success' ? 'bg-success-600 text-white' : 'bg-red-600 text-white'}`;
  toast.style.animation = 'toastIn 0.3s ease-out';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
