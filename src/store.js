/**
 * localStorage-based store for vocabulary learning progress.
 * Uses a simplified SM-2 spaced repetition algorithm.
 */

const STORE_KEYS = {
  SETTINGS: 'vocab_settings',
  PROGRESS: 'vocab_progress',
  DAILY_LOG: 'vocab_daily_log',
  STREAK: 'vocab_streak',
  BOOKMARKS: 'vocab_bookmarks',
  CONVERSATION: 'vocab_conversation_sessions',
  REVIEW_SESSIONS: 'vocab_review_sessions',
  SENTENCE_WRITING: 'vocab_sentence_writing',
};

const DEFAULT_SETTINGS = {
  wordsPerDay: 15,
  darkMode: true,
  currentLevelFilter: 'all', // all, A1, A2, B1, B2, C1
  sidebarCollapsed: false,
};

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

class Store {
  constructor() {
    this._cache = {};
    this._initDefaults();
  }

  _initDefaults() {
    if (!this._get(STORE_KEYS.SETTINGS)) {
      this._set(STORE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!this._get(STORE_KEYS.PROGRESS)) {
      this._set(STORE_KEYS.PROGRESS, {});
    }
    if (!this._get(STORE_KEYS.DAILY_LOG)) {
      this._set(STORE_KEYS.DAILY_LOG, {});
    }
    if (!this._get(STORE_KEYS.STREAK)) {
      this._set(STORE_KEYS.STREAK, { current: 0, longest: 0, lastActive: null });
    }
    if (!this._get(STORE_KEYS.BOOKMARKS)) {
      this._set(STORE_KEYS.BOOKMARKS, []);
    }
  }

  _get(key) {
    if (this._cache[key]) return this._cache[key];
    try {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : null;
      this._cache[key] = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  _set(key, value) {
    this._cache[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Settings
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...this._get(STORE_KEYS.SETTINGS) };
  }

  updateSettings(updates) {
    const current = this.getSettings();
    this._set(STORE_KEYS.SETTINGS, { ...current, ...updates });
  }

  // Word Progress
  getWordProgress(word) {
    const progress = this._get(STORE_KEYS.PROGRESS);
    return progress[word] || null;
  }

  getAllProgress() {
    return this._get(STORE_KEYS.PROGRESS) || {};
  }

  markWordLearned(word, quality) {
    // quality: 0-5 (SM-2 scale), simplified to: 1=hard, 3=medium, 5=easy
    const progress = this._get(STORE_KEYS.PROGRESS);
    const today = getToday();

    const existing = progress[word] || {
      status: 'new',
      ease: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: today,
      lastReviewed: null,
      firstLearned: today,
    };

    // SM-2 Algorithm (simplified)
    let { ease, interval, repetitions } = existing;

    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * ease);
      }
      repetitions++;
    } else {
      // Incorrect/hard - reset
      repetitions = 0;
      interval = 1;
    }

    // Update ease factor
    ease = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Determine status
    let status = 'learning';
    if (repetitions >= 5 && interval >= 21) {
      status = 'mastered';
    } else if (repetitions === 0) {
      status = 'learning';
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    progress[word] = {
      status,
      ease: Math.round(ease * 100) / 100,
      interval,
      repetitions,
      nextReview: nextReviewDate.toISOString().split('T')[0],
      lastReviewed: today,
      firstLearned: existing.firstLearned || today,
      lastRating: quality,
    };

    this._set(STORE_KEYS.PROGRESS, progress);
    this._updateDailyLog('learned');
    this._updateStreak();
  }

  // Get words due for review today
  getWordsForReview() {
    const progress = this._get(STORE_KEYS.PROGRESS);
    const today = getToday();
    const dueWords = [];

    for (const [word, data] of Object.entries(progress)) {
      if (data.nextReview <= today && data.status !== 'new') {
        dueWords.push({ word, ...data });
      }
    }

    // Sort by urgency (most overdue first)
    dueWords.sort((a, b) => a.nextReview.localeCompare(b.nextReview));
    return dueWords;
  }

  // Get new words to learn (randomized)
  getNewWordsToLearn(allWords, count) {
    const progress = this._get(STORE_KEYS.PROGRESS);
    const settings = this.getSettings();
    
    // Filter out words already in progress and apply level filter
    const pool = allWords.filter(word => {
      const notInProgress = !progress[word.word];
      const matchesLevel = settings.currentLevelFilter === 'all' || word.level === settings.currentLevelFilter;
      return notInProgress && matchesLevel;
    });

    // Shuffle the pool using Fisher-Yates algorithm
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, count);
  }

  // Bookmarks
  getBookmarks() {
    return this._get(STORE_KEYS.BOOKMARKS) || [];
  }

  isBookmarked(word) {
    return this.getBookmarks().includes(word);
  }

  bookmarkWord(word) {
    const bookmarks = this.getBookmarks();
    if (!bookmarks.includes(word)) {
      bookmarks.push(word);
      this._set(STORE_KEYS.BOOKMARKS, bookmarks);
    }
  }

  unbookmarkWord(word) {
    const bookmarks = this.getBookmarks().filter(w => w !== word);
    this._set(STORE_KEYS.BOOKMARKS, bookmarks);
  }

  // Get all words that have been learned/started or bookmarked
  getLearnedWords(allWords) {
    const progress = this._get(STORE_KEYS.PROGRESS);
    const bookmarkSet = new Set(this.getBookmarks());
    const learned = [];

    for (const word of allWords) {
      const hasProgress = !!progress[word.word];
      const isBookmarked = bookmarkSet.has(word.word);
      if (hasProgress || isBookmarked) {
        learned.push({
          ...word,
          ...(progress[word.word] || {}),
          bookmarked: isBookmarked,
        });
      }
    }

    // Sort by most recently learned/reviewed, bookmarked-only words go to top
    return learned.sort((a, b) => {
      const dateA = a.lastReviewed || a.firstLearned || '0000-00-00';
      const dateB = b.lastReviewed || b.firstLearned || '0000-00-00';
      return dateB.localeCompare(dateA);
    });
  }

  // Daily Log
  _updateDailyLog(type) {
    const log = this._get(STORE_KEYS.DAILY_LOG);
    const today = getToday();

    if (!log[today]) {
      log[today] = { wordsLearned: 0, wordsReviewed: 0, correctAnswers: 0, totalAnswers: 0 };
    }

    if (type === 'learned') {
      log[today].wordsLearned++;
    } else if (type === 'reviewed') {
      log[today].wordsReviewed++;
    }

    this._set(STORE_KEYS.DAILY_LOG, log);
  }

  logReview(correct) {
    const log = this._get(STORE_KEYS.DAILY_LOG);
    const today = getToday();
    if (!log[today]) {
      log[today] = { wordsLearned: 0, wordsReviewed: 0, correctAnswers: 0, totalAnswers: 0 };
    }
    log[today].wordsReviewed++;
    log[today].totalAnswers++;
    if (correct) log[today].correctAnswers++;
    this._set(STORE_KEYS.DAILY_LOG, log);
    this._updateStreak();
  }

  getDailyLog() {
    return this._get(STORE_KEYS.DAILY_LOG) || {};
  }

  getTodayLog() {
    const log = this._get(STORE_KEYS.DAILY_LOG);
    return log[getToday()] || { wordsLearned: 0, wordsReviewed: 0, correctAnswers: 0, totalAnswers: 0 };
  }

  // Streak
  _updateStreak() {
    const streak = this._get(STORE_KEYS.STREAK);
    const today = getToday();

    if (streak.lastActive === today) return; // Already active today

    const daysSinceLastActive = streak.lastActive
      ? getDaysBetween(streak.lastActive, today)
      : 999;

    if (daysSinceLastActive === 1) {
      streak.current++;
    } else if (daysSinceLastActive > 1) {
      streak.current = 1;
    } else {
      streak.current = 1;
    }

    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }

    streak.lastActive = today;
    this._set(STORE_KEYS.STREAK, streak);
  }

  getStreak() {
    return this._get(STORE_KEYS.STREAK) || { current: 0, longest: 0, lastActive: null };
  }

  // Statistics
  getStats(allWords) {
    const progress = this._get(STORE_KEYS.PROGRESS);
    const allProgress = Object.values(progress);

    const totalWords = allWords.length;
    const learnedWords = allProgress.filter(p => p.status !== 'new').length;
    const masteredWords = allProgress.filter(p => p.status === 'mastered').length;
    const learningWords = allProgress.filter(p => p.status === 'learning').length;
    const reviewDue = this.getWordsForReview().length;

    // By level
    const byLevel = {};
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
      const levelWords = allWords.filter(w => w.level === level);
      const levelProgress = levelWords.filter(w => progress[w.word]);
      const levelMastered = levelWords.filter(w => progress[w.word]?.status === 'mastered');
      byLevel[level] = {
        total: levelWords.length,
        learned: levelProgress.length,
        mastered: levelMastered.length,
      };
    }

    return {
      totalWords,
      learnedWords,
      masteredWords,
      learningWords,
      newWords: totalWords - learnedWords,
      reviewDue,
      byLevel,
      streak: this.getStreak(),
    };
  }

  // Conversation sessions
  logConversationSession(data) {
    const sessions = this._get(STORE_KEYS.CONVERSATION) || [];
    sessions.push({ ...data, date: data.date || new Date().toISOString().split('T')[0] });
    if (sessions.length > 200) sessions.splice(0, sessions.length - 200);
    this._set(STORE_KEYS.CONVERSATION, sessions);
  }

  getConversationSessions() {
    return this._get(STORE_KEYS.CONVERSATION) || [];
  }

  getConversationStats() {
    const sessions = this.getConversationSessions();
    if (sessions.length === 0) return { total: 0, avgScore: 0, bestScore: 0, totalLines: 0, correctLines: 0 };
    const scores = sessions.map(s => s.score);
    return {
      total: sessions.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      totalLines: sessions.reduce((a, s) => a + (s.totalLines || 0), 0),
      correctLines: sessions.reduce((a, s) => a + (s.correctLines || 0), 0),
    };
  }

  // Review sessions
  logReviewSession(data) {
    const sessions = this._get(STORE_KEYS.REVIEW_SESSIONS) || [];
    sessions.push({ ...data, date: data.date || new Date().toISOString().split('T')[0] });
    if (sessions.length > 200) sessions.splice(0, sessions.length - 200);
    this._set(STORE_KEYS.REVIEW_SESSIONS, sessions);
  }

  getReviewSessions() {
    return this._get(STORE_KEYS.REVIEW_SESSIONS) || [];
  }

  getReviewStats() {
    const sessions = this.getReviewSessions();
    if (sessions.length === 0) return { total: 0, avgScore: 0, bestScore: 0, totalWords: 0, correctWords: 0 };
    const scores = sessions.map(s => s.score);
    return {
      total: sessions.length,
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      totalWords: sessions.reduce((a, s) => a + (s.total || 0), 0),
      correctWords: sessions.reduce((a, s) => a + (s.correct || 0), 0),
    };
  }

  // Sentence writing
  logSentenceWritten() {
    const data = this._get(STORE_KEYS.SENTENCE_WRITING) || { total: 0 };
    data.total = (data.total || 0) + 1;
    this._set(STORE_KEYS.SENTENCE_WRITING, data);
  }

  getSentenceWritingStats() {
    return this._get(STORE_KEYS.SENTENCE_WRITING) || { total: 0 };
  }

  // Export/Import
  exportData() {
    return JSON.stringify({
      settings: this._get(STORE_KEYS.SETTINGS),
      progress: this._get(STORE_KEYS.PROGRESS),
      dailyLog: this._get(STORE_KEYS.DAILY_LOG),
      streak: this._get(STORE_KEYS.STREAK),
    }, null, 2);
  }

  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.settings) this._set(STORE_KEYS.SETTINGS, data.settings);
      if (data.progress) this._set(STORE_KEYS.PROGRESS, data.progress);
      if (data.dailyLog) this._set(STORE_KEYS.DAILY_LOG, data.dailyLog);
      if (data.streak) this._set(STORE_KEYS.STREAK, data.streak);
      return true;
    } catch {
      return false;
    }
  }

  // Reset all data
  resetAll() {
    for (const key of Object.values(STORE_KEYS)) {
      localStorage.removeItem(key);
    }
    this._cache = {};
    this._initDefaults();
  }
}

export const store = new Store();
export default store;
