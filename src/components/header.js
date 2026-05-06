import { router } from '../router.js';
import store from '../store.js';

export function renderHeader() {
  const settings = store.getSettings();
  const streak = store.getStreak();
  const currentRoute = router.getCurrentRoute();

  const navItems = [
    { path: '/', label: 'Trang chủ', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' },
    { path: '/learn', label: 'Học từ mới', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
    { path: '/review', label: 'Ôn tập', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>' },
    { path: '/learned', label: 'Từ đã học', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>' },
    { path: '/bookmarks', label: 'Từ đã lưu', icon: '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>' },
    { path: '/all-words', label: 'Tất cả từ vựng', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>' },
    { path: '/stats', label: 'Thống kê', icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>' },
  ];

  return `
    <header class="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <!-- Logo -->
        <a href="#/" class="flex items-center gap-2 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
            Ox
          </div>
          <span class="font-bold text-lg hidden sm:block">
            <span class="text-primary-400">Oxford</span>
            <span class="text-surface-300">5000</span>
          </span>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1">
          ${navItems.map(item => `
            <a href="#${item.path}" 
               class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${currentRoute === item.path 
                        ? 'bg-primary-600/20 text-primary-400 shadow-lg shadow-primary-600/10' 
                        : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'}">
              <span class="mr-1.5 inline-flex">${item.icon}</span>${item.label}
            </a>
          `).join('')}
        </nav>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <!-- Streak -->
          ${streak.current > 0 ? `
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-500/15 text-warning-400 text-sm font-medium">
              <span class="flex items-center"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg></span>
              <span>${streak.current}</span>
            </div>
          ` : ''}
          
          <!-- Dark mode toggle -->
          <button id="theme-toggle" 
                  class="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all"
                  title="Chuyển đổi giao diện">
            ${settings.darkMode ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>'}
          </button>

          <!-- Mobile menu -->
          <button id="mobile-menu-btn" class="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-white/5">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Nav -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-white/5 pb-3">
        <div class="max-w-6xl mx-auto px-4 pt-2 flex flex-col gap-1">
          ${navItems.map(item => `
            <a href="#${item.path}" 
               class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                      ${currentRoute === item.path 
                        ? 'bg-primary-600/20 text-primary-400' 
                        : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'}">
              <span class="mr-2 inline-flex">${item.icon}</span>${item.label}
            </a>
          `).join('')}
        </div>
      </div>
    </header>
  `;
}

export function initHeaderEvents() {
  const themeToggle = document.getElementById('theme-toggle');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const settings = store.getSettings();
      store.updateSettings({ darkMode: !settings.darkMode });
      document.body.classList.toggle('light-mode', !settings.darkMode);
      // Re-render header to update icon
      const headerEl = document.querySelector('header');
      if (headerEl) {
        headerEl.outerHTML = renderHeader();
        initHeaderEvents();
      }
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
}
