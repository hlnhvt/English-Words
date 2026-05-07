import { router } from '../router.js';
import store from '../store.js';

export const navItems = [
  { path: '/', label: 'Trang chủ', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>' },
  { path: '/learn', label: 'Học từ mới', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>' },
  { path: '/review', label: 'Ôn tập', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>' },
  { path: '/conversation', label: 'Giao tiếp', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>' },
  { path: '/write-sentence', label: 'Viết câu', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>' },
  { path: '/learned', label: 'Từ đã học', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>' },
  { path: '/bookmarks', label: 'Từ đã lưu', icon: '<svg class="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>' },
  { path: '/all-words', label: 'Tất cả từ vựng', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>' },
  { path: '/stats', label: 'Thống kê', icon: '<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>' },
];

export function renderSidebar() {
  const settings = store.getSettings();
  const currentRoute = router.getCurrentRoute();
  const isCollapsed = settings.sidebarCollapsed;

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const logoTextClass = isCollapsed ? 'hidden' : 'block';

  return `
    <aside id="desktop-sidebar" class="hidden md:flex flex-col ${sidebarWidth} transition-all duration-300 ease-in-out h-screen glass border-r border-white/5 relative z-40 bg-surface-950/50">
      <!-- Logo Area -->
      <div class="h-16 flex items-center shrink-0 px-4 gap-3 border-b border-white/5">
        <a href="#/" class="flex items-center gap-3 group mx-auto md:mx-0 ${isCollapsed ? 'justify-center w-full' : ''}">
          <img src="/Screenshot%202026-05-06%20172948.png"
               class="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform shrink-0"
               alt="Foxlearn">
          <span class="font-bold text-xl ${logoTextClass} whitespace-nowrap overflow-hidden">
            <span class="text-primary-400">Fox</span><span class="text-surface-300">learn</span>
          </span>
        </a>
      </div>

      <!-- Navigation Links -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-4 px-3 flex flex-col gap-1.5">
        ${navItems.map(item => `
          <a href="#${item.path}" 
             class="group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${currentRoute === item.path 
                      ? 'bg-primary-600/20 text-primary-400 shadow-sm shadow-primary-600/10' 
                      : 'text-surface-400 hover:text-surface-200 hover:bg-white/5'} ${isCollapsed ? 'justify-center' : ''}">
            <div class="flex items-center ${isCollapsed ? '' : 'w-full'}">
              <span class="inline-flex shrink-0 ${isCollapsed ? '' : 'mr-3'}">${item.icon}</span>
              <span class="${isCollapsed ? 'hidden' : 'block'} whitespace-nowrap overflow-hidden text-ellipsis">${item.label}</span>
            </div>
            
            ${isCollapsed ? `
              <!-- Tooltip for collapsed state -->
              <div class="absolute left-full ml-3 px-3 py-1.5 bg-surface-800 text-surface-100 text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-white/10 before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-surface-800">
                ${item.label}
              </div>
            ` : ''}
          </a>
        `).join('')}
      </div>

      <!-- Toggle Button -->
      <div class="p-3 border-t border-white/5">
        <button id="sidebar-toggle" class="w-full flex items-center justify-center py-2.5 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-white/5 transition-all">
          <svg class="w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </aside>
  `;
}

export function initSidebarEvents() {
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const settings = store.getSettings();
      const newCollapsedState = !settings.sidebarCollapsed;
      store.updateSettings({ sidebarCollapsed: newCollapsedState });
      
      // Re-render sidebar to apply changes immediately
      const sidebarEl = document.getElementById('desktop-sidebar');
      if (sidebarEl) {
        sidebarEl.outerHTML = renderSidebar();
        initSidebarEvents();
      }
    });
  }
}
