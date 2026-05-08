import './style.css';
import { router } from './router.js';
import store from './store.js';
import { renderHeader, initHeaderEvents } from './components/header.js';
import { renderDashboard, initDashboardEvents } from './pages/dashboard.js';
import { renderLearn, initLearnEvents, resetLearnSession } from './pages/learn.js';
import { renderReview, initReviewEvents, resetReviewSession } from './pages/review.js';
import { renderStats, initStatsEvents } from './pages/stats.js';
import { renderLearned, initLearnedEvents } from './pages/learned.js';
import { renderAllWords, initAllWordsEvents } from './pages/all-words.js';
import { renderBookmarks, initBookmarksEvents } from './pages/bookmarks.js';
import { renderConversation, initConversationEvents, resetConversationSession } from './pages/conversation.js';
import { renderWriteSentence, initWriteSentenceEvents } from './pages/write-sentence.js';
import { renderWrongWords, initWrongWordsEvents } from './pages/wrong-words.js';

let allWords = [];

// Load word data
async function loadWords() {
  try {
    const response = await fetch('/data/words.json');
    allWords = await response.json();
    console.log(`Loaded ${allWords.length} words`);
    initRouter();
  } catch (error) {
    console.error('Failed to load words:', error);
    document.getElementById('app').innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="text-4xl mb-4">❌</div>
          <h2 class="text-xl font-bold text-surface-100 mb-2">Lỗi tải dữ liệu</h2>
          <p class="text-surface-400">Không thể tải danh sách từ vựng. Vui lòng thử lại.</p>
        </div>
      </div>
    `;
  }
}

import { renderSidebar, initSidebarEvents } from './components/sidebar.js';

function renderPage(renderFn, initFn) {
  const app = document.getElementById('app');
  const header = renderHeader(allWords);
  const sidebar = renderSidebar();
  const content = renderFn(allWords);
  app.innerHTML = `
    <div class="flex h-screen overflow-hidden">
      ${sidebar}
      <div class="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative" id="main-scroll-container">
        ${header}
        <main class="flex-1">
          ${content}
        </main>
      </div>
    </div>
  `;
  initSidebarEvents();
  initHeaderEvents(allWords);
  if (initFn) {
    initFn(allWords, () => renderPage(renderFn, initFn));
  }
}

function initRouter() {
  router
    .addRoute('/', () => {
      renderPage(renderDashboard, initDashboardEvents);
    })
    .addRoute('/learn', () => {
      renderPage(renderLearn, initLearnEvents);
    })
    .addRoute('/review', () => {
      renderPage(renderReview, initReviewEvents);
    })
    .addRoute('/stats', () => {
      renderPage(renderStats, initStatsEvents);
    })
    .addRoute('/learned', () => {
      renderPage(renderLearned, initLearnedEvents);
    })
    .addRoute('/all-words', () => {
      renderPage(renderAllWords, initAllWordsEvents);
    })
    .addRoute('/bookmarks', () => {
      renderPage(renderBookmarks, initBookmarksEvents);
    })
    .addRoute('/conversation', () => {
      renderPage(renderConversation, initConversationEvents);
    })
    .addRoute('/write-sentence', () => {
      renderPage(renderWriteSentence, initWriteSentenceEvents);
    })
    .addRoute('/wrong-words', () => {
      renderPage(renderWrongWords, initWrongWordsEvents);
    });

  // Update header on route change
  router.onRouteChange = () => {};

  // Apply initial theme
  const settings = store.getSettings();
  document.body.classList.toggle('light-mode', !settings.darkMode);

  // Trigger initial route
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '/';
  } else {
    // Manually trigger route since hashchange won't fire if hash is already set
    router._handleRoute();
  }
}

// Show loading, then load data
document.getElementById('app').innerHTML = `
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center fade-in">
      <img src="/Screenshot%202026-05-06%20172948.png"
           class="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 pulse-glow"
           alt="Foxlearn">
      <h2 class="text-lg font-bold text-surface-200 mb-2">Foxlearn</h2>
      <p class="text-sm text-surface-400">Đang tải từ vựng...</p>
      <div class="mt-4 w-32 h-1 bg-surface-800 rounded-full mx-auto overflow-hidden">
        <div class="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full shimmer" style="width: 60%"></div>
      </div>
    </div>
  </div>
`;

loadWords();
