import { router } from '../router.js';
import store from '../store.js';
import { navItems } from './sidebar.js';
import { renderWordModal, initWordModalEvents } from './modal.js';
import { showStreakPopup } from './streak-popup.js';

export function renderHeader(allWords = []) {
  const settings = store.getSettings();
  const streak = store.getStreak();
  const currentRoute = router.getCurrentRoute();

  const themeIcon = settings.darkMode 
    ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>' 
    : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>';

  return `
    <header class="sticky top-0 z-40 glass border-b border-white/5 w-full">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <!-- Mobile Logo (Hidden on Desktop) -->
        <a href="#/" class="flex md:hidden items-center gap-2 group shrink-0">
          <img src="/Screenshot%202026-05-06%20172948.png"
               class="w-9 h-9 rounded-xl object-cover group-hover:scale-110 transition-transform"
               alt="Foxlearn">
          <span class="font-bold text-lg hidden sm:block">
            <span class="text-primary-400">Fox</span><span class="text-surface-300">learn</span>
          </span>
        </a>

        <!-- Word Ticker -->
        <div id="header-word-ticker" class="flex flex-1 mx-2 sm:mx-4 items-center justify-center overflow-hidden min-w-0">
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3 shrink-0 ml-auto">
          <!-- Streak -->
          ${streak.current > 0 ? `
            <div id="header-streak-badge" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-500/15 text-warning-400 text-sm font-medium cursor-pointer hover:bg-warning-500/25 transition-colors">
              <span class="flex items-center"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg></span>
              <span>${streak.current}</span>
            </div>
          ` : ''}
          
          <!-- Desktop Dark mode toggle -->
          <button id="theme-toggle" 
                  class="hidden md:flex w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all"
                  title="Chuyển đổi giao diện">
            ${themeIcon}
          </button>

          <!-- Mobile menu btn -->
          <button id="mobile-menu-btn" class="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-white/5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Nav -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-white/5 pb-3 bg-surface-950/95 backdrop-blur-xl absolute w-full left-0 top-16 shadow-xl">
        <div class="max-w-6xl mx-auto px-4 pt-2 flex flex-col gap-1">
          ${navItems.map((item, idx) => {
            // Check if this item is in a section group (has section, or follows an item that had one)
            const inSection = item.section || (idx > 0 && !item.section && navItems.slice(0, idx).reverse().some((prev, i) => {
              if (prev.section) return true;
              if (i > 0) return false; // only check consecutive items without section after one that has it
              return false;
            }));
            // Simpler: an item is "in section" if it has .section or if it has no .section but the nearest preceding item with .section exists and no non-section item is between them
            const isSubItem = !!item.section || (idx > 0 && navItems[idx-1].section) || (idx > 0 && !navItems[idx-1].section && navItems[idx-1].path && (() => { for(let j=idx-1;j>=0;j--){ if(navItems[j].section) return true; if(!navItems[j].section && j < idx-1) return false; } return false; })());
            return `
            ${item.section ? `<div class="px-4 pt-3 pb-1 text-xs font-semibold text-surface-500 uppercase tracking-wider border-t border-white/5 mt-2">${item.section}</div>` : ''}
            <a href="#${item.path}" 
               class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center
                      ${isSubItem ? 'pl-7' : ''}
                      ${currentRoute === item.path 
                        ? 'bg-primary-600/20 text-primary-400' 
                        : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'}">
              <span class="mr-3 inline-flex shrink-0">${item.icon}</span>${item.label}
            </a>`;
          }).join('')}
          
          <!-- Mobile Theme Toggle -->
          <button id="theme-toggle-mobile" class="mt-2 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 text-surface-400 hover:text-surface-200 hover:bg-white/5 border-t border-white/10 pt-4">
             <span class="shrink-0">${themeIcon}</span>
             <span>Giao diện: ${settings.darkMode ? 'Sáng' : 'Tối'}</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

let headerTickerInterval = null;

export function initHeaderEvents(allWords = []) {
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  const handleThemeToggle = () => {
    const settings = store.getSettings();
    store.updateSettings({ darkMode: !settings.darkMode });
    document.body.classList.toggle('light-mode', !settings.darkMode);
    // Re-render header
    const headerEl = document.querySelector('header');
    if (headerEl) {
      headerEl.outerHTML = renderHeader(allWords);
      initHeaderEvents(allWords);
    }
  };

  themeToggle?.addEventListener('click', handleThemeToggle);
  themeToggleMobile?.addEventListener('click', handleThemeToggle);

  const streakBadge = document.getElementById('header-streak-badge');
  if (streakBadge) {
    streakBadge.addEventListener('click', () => {
      const streak = store.getStreak();
      showStreakPopup(streak.current);
    });
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    // Close mobile menu on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
  }

  // Init word ticker
  if (allWords.length > 0) {
    const learnedWords = store.getLearnedWords(allWords).filter(w => w.status && w.status !== 'new');
    const tickerContainer = document.getElementById('header-word-ticker');

    if (tickerContainer && learnedWords.length > 0) {
      if (headerTickerInterval) clearInterval(headerTickerInterval);

      // Weighted pool: B1/B2/C1 có trọng số 4×, A2 2×, A1 1×
      const weightedPool = [];
      for (const w of learnedWords) {
        const weight = ['B1', 'B2', 'C1'].includes(w.level) ? 4 : w.level === 'A2' ? 2 : 1;
        for (let i = 0; i < weight; i++) weightedPool.push(w);
      }
      const pickWord = () => weightedPool[Math.floor(Math.random() * weightedPool.length)];

      let currentWord = pickWord();
      let lastWord = currentWord;

      const renderTicker = () => {
        // tránh lặp lại từ vừa hiển thị
        let next = pickWord();
        if (weightedPool.length > 1) {
          while (next.word === lastWord.word) next = pickWord();
        }
        currentWord = next;
        lastWord = currentWord;
        tickerContainer.innerHTML = `
          <div class="fade-in flex items-center gap-2 px-3 py-1 rounded-full bg-surface-800/50 border border-white/5 shadow-sm max-w-full group/ticker transition-all">
            <div class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded-full" id="header-ticker-info">
              <span class="font-bold text-primary-400 whitespace-nowrap text-sm sm:text-base">${currentWord.word}</span>
              <span class="text-surface-400 text-xs sm:text-sm whitespace-nowrap hidden sm:inline">${currentWord.phonetic || ''}</span>
              <span class="text-surface-300 text-xs sm:text-sm ml-1 truncate max-w-[80px] sm:max-w-[200px] lg:max-w-[400px]">- ${currentWord.meaning_vi || ''}</span>
            </div>
            <button id="header-ticker-audio" class="w-7 h-7 rounded-full bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 flex items-center justify-center transition-all shrink-0" title="Phát âm">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
            </button>
          </div>
        `;
        
        const info = tickerContainer.querySelector('#header-ticker-info');
        const audio = tickerContainer.querySelector('#header-ticker-audio');
        
        if (info) {
          info.onclick = () => {
            const modalRoot = document.getElementById('modal-root') || document.createElement('div');
            modalRoot.id = 'modal-root';
            if (!document.getElementById('modal-root')) document.body.appendChild(modalRoot);
            modalRoot.innerHTML = renderWordModal(currentWord);
            initWordModalEvents(currentWord);
          };
        }
        
        if (audio) {
          audio.onclick = (e) => {
            e.stopPropagation();
            const utterance = new SpeechSynthesisUtterance(currentWord.word);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
          };
        }
        
      };

      renderTicker();
      headerTickerInterval = setInterval(renderTicker, 6000);
    }
  }
}
