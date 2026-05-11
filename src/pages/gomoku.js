import { playDing, playError } from '../utils/sound.js';

let gomokuState = {
  phase: 'setup', // setup | playing | finished
  boardSize: 15,
  mode: 'pvp', // pvp | ai
  aiDifficulty: 'medium', // easy | medium | hard
  pieceStyle: 'xo', // xo | stone
  player1: 'Người chơi 1',
  player2: 'Người chơi 2',
  board: [],
  currentPlayer: 1, // 1 or 2
  winner: 0,
  winCells: [],
  lastMove: null,
  moveCount: 0,
};

function resetBoard() {
  const s = gomokuState.boardSize;
  gomokuState.board = Array.from({ length: s }, () => Array(s).fill(0));
  gomokuState.currentPlayer = 1;
  gomokuState.winner = 0;
  gomokuState.winCells = [];
  gomokuState.lastMove = null;
  gomokuState.moveCount = 0;
}

function checkWin(board, r, c, player) {
  const s = board.length;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    let count = 1;
    const cells = [[r, c]];
    for (let d = 1; d < 5; d++) { const nr = r+dr*d, nc = c+dc*d; if (nr>=0&&nr<s&&nc>=0&&nc<s&&board[nr][nc]===player) { count++; cells.push([nr,nc]); } else break; }
    for (let d = 1; d < 5; d++) { const nr = r-dr*d, nc = c-dc*d; if (nr>=0&&nr<s&&nc>=0&&nc<s&&board[nr][nc]===player) { count++; cells.push([nr,nc]); } else break; }
    if (count >= 5) return cells;
  }
  return null;
}

// ─── AI Logic ────────────────────────────────────────────────────────────────

function scorePattern(board, r, c, player, size) {
  const opp = player === 1 ? 2 : 1;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  let totalScore = 0;
  for (const [dr, dc] of dirs) {
    let count = 1, openEnds = 0;
    // Forward
    let fr = r + dr, fc = c + dc;
    while (fr>=0&&fr<size&&fc>=0&&fc<size&&board[fr][fc]===player) { count++; fr+=dr; fc+=dc; }
    if (fr>=0&&fr<size&&fc>=0&&fc<size&&board[fr][fc]===0) openEnds++;
    // Backward
    let br = r - dr, bc = c - dc;
    while (br>=0&&br<size&&bc>=0&&bc<size&&board[br][bc]===player) { count++; br-=dr; bc-=dc; }
    if (br>=0&&br<size&&bc>=0&&bc<size&&board[br][bc]===0) openEnds++;

    if (count >= 5) totalScore += 100000;
    else if (count === 4 && openEnds === 2) totalScore += 10000;
    else if (count === 4 && openEnds === 1) totalScore += 1000;
    else if (count === 3 && openEnds === 2) totalScore += 1000;
    else if (count === 3 && openEnds === 1) totalScore += 100;
    else if (count === 2 && openEnds === 2) totalScore += 100;
    else if (count === 2 && openEnds === 1) totalScore += 10;
  }
  return totalScore;
}

function getAiMove(board, aiPlayer, difficulty) {
  const size = board.length;
  const human = aiPlayer === 1 ? 2 : 1;
  const candidates = new Set();

  // Collect cells near existing moves
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== 0) {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r+dr, nc = c+dc;
            if (nr>=0&&nr<size&&nc>=0&&nc<size&&board[nr][nc]===0) candidates.add(nr*size+nc);
          }
        }
      }
    }
  }

  if (candidates.size === 0) return { r: Math.floor(size/2), c: Math.floor(size/2) };

  let bestScore = -Infinity, bestMove = null;
  const moves = [];

  for (const key of candidates) {
    const r = Math.floor(key / size), c = key % size;
    board[r][c] = aiPlayer;
    const attackScore = scorePattern(board, r, c, aiPlayer, size);
    board[r][c] = human;
    const defenseScore = scorePattern(board, r, c, human, size);
    board[r][c] = 0;

    let diffMultiplier;
    if (difficulty === 'easy') diffMultiplier = { attack: 1, defense: 0.8 };
    else if (difficulty === 'medium') diffMultiplier = { attack: 1.1, defense: 1.0 };
    else diffMultiplier = { attack: 1.2, defense: 1.15 };

    let score = attackScore * diffMultiplier.attack + defenseScore * diffMultiplier.defense;

    // Add randomness for easy mode
    if (difficulty === 'easy') score += Math.random() * 200;
    else if (difficulty === 'medium') score += Math.random() * 20;

    moves.push({ r, c, score });
    if (score > bestScore) { bestScore = score; bestMove = { r, c }; }
  }

  return bestMove || { r: Math.floor(size/2), c: Math.floor(size/2) };
}

// ─── Rendering ───────────────────────────────────────────────────────────────

const pill = (active) =>
  `class="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
          ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}"`;

export function renderGomoku() {
  if (gomokuState.phase === 'setup') return renderSetup();
  return renderGame();
}

function renderSetup() {
  return `
    <div class="max-w-xl mx-auto px-4 pt-10 pb-24">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Cờ Caro</h2>
        <p class="text-sm text-surface-400">Thiết lập ván cờ mới</p>
      </div>
      <div class="space-y-3">
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.05s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Chế độ chơi</h3>
          <div class="flex flex-wrap gap-2">
            <button data-gomoku-mode="pvp" ${pill(gomokuState.mode === 'pvp')}>2 Người chơi</button>
            <button data-gomoku-mode="ai" ${pill(gomokuState.mode === 'ai')}>Đánh với máy</button>
          </div>
        </div>

        ${gomokuState.mode === 'ai' ? `
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.08s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Cấp độ máy</h3>
          <div class="flex flex-wrap gap-2">
            <button data-gomoku-diff="easy" ${pill(gomokuState.aiDifficulty === 'easy')}>Dễ</button>
            <button data-gomoku-diff="medium" ${pill(gomokuState.aiDifficulty === 'medium')}>Trung bình</button>
            <button data-gomoku-diff="hard" ${pill(gomokuState.aiDifficulty === 'hard')}>Khó</button>
          </div>
        </div>` : ''}

        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.1s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Kích thước bàn cờ</h3>
          <div class="flex flex-wrap gap-2">
            ${[9, 13, 15, 19].map(n => `<button data-gomoku-size="${n}" ${pill(gomokuState.boardSize === n)}>${n}×${n}</button>`).join('')}
          </div>
        </div>

        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.12s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Kiểu quân cờ</h3>
          <div class="flex flex-wrap gap-2">
            <button data-gomoku-piece="xo" ${pill(gomokuState.pieceStyle === 'xo')}>X / O</button>
            <button data-gomoku-piece="stone" ${pill(gomokuState.pieceStyle === 'stone')}>⚫ / ⚪ (quân cờ)</button>
          </div>
        </div>

        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.15s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Tên người chơi</h3>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="text-xs text-surface-500 mb-1 block">X (đi trước)</label>
              <input id="gomoku-p1" type="text" value="${gomokuState.player1}" maxlength="15"
                class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-all" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-surface-500 mb-1 block">${gomokuState.mode === 'ai' ? 'Máy (O)' : 'O'}</label>
              <input id="gomoku-p2" type="text" value="${gomokuState.mode === 'ai' ? 'Máy tính' : gomokuState.player2}" maxlength="15"
                class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-surface-200 focus:outline-none focus:border-primary-500 transition-all" ${gomokuState.mode === 'ai' ? 'disabled' : ''} />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-8 flex justify-end">
        <button id="btn-gomoku-start" class="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-bold shadow-xl transition-all">
          Bắt đầu chơi
        </button>
      </div>
    </div>
  `;
}

function renderGame() {
  const s = gomokuState.boardSize;
  const cellSize = s <= 13 ? 36 : s <= 15 ? 32 : 28;
  const boardPx = s * cellSize;

  const currentName = gomokuState.currentPlayer === 1 ? gomokuState.player1 : gomokuState.player2;
  const currentSymbol = gomokuState.currentPlayer === 1 ? 'X' : 'O';

  let statusText, statusColor;
  if (gomokuState.winner) {
    const winnerName = gomokuState.winner === 1 ? gomokuState.player1 : gomokuState.player2;
    statusText = `${winnerName} thắng!`;
    statusColor = gomokuState.winner === 1 ? 'text-primary-400' : 'text-red-400';
  } else if (gomokuState.moveCount >= s * s) {
    statusText = 'Hòa!';
    statusColor = 'text-warning-400';
  } else {
    statusText = `Lượt của ${currentName} (${currentSymbol})`;
    statusColor = gomokuState.currentPlayer === 1 ? 'text-primary-400' : 'text-red-400';
  }

  let boardHtml = '';
  const winSet = new Set(gomokuState.winCells.map(([r,c]) => `${r}-${c}`));

  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      const val = gomokuState.board[r][c];
      const isWin = winSet.has(`${r}-${c}`);
      const isLast = gomokuState.lastMove && gomokuState.lastMove[0] === r && gomokuState.lastMove[1] === c;

      let cellContent = '';
      let cellClass = 'gomoku-cell';
      const useStone = gomokuState.pieceStyle === 'stone';
      if (val === 1) {
        cellContent = useStone ? '<span class="gomoku-stone-black"></span>' : '<span class="gomoku-x">X</span>';
        cellClass += isWin ? ' gomoku-win-cell' : '';
      } else if (val === 2) {
        cellContent = useStone ? '<span class="gomoku-stone-white"></span>' : '<span class="gomoku-o">O</span>';
        cellClass += isWin ? ' gomoku-win-cell' : '';
      }
      if (isLast) cellClass += ' gomoku-last';

      boardHtml += `<div class="${cellClass}" data-gomoku-r="${r}" data-gomoku-c="${c}" style="width:${cellSize}px;height:${cellSize}px">${cellContent}</div>`;
    }
  }

  // Victory overlay
  let victoryOverlay = '';
  if (gomokuState.winner) {
    const winnerName = gomokuState.winner === 1 ? gomokuState.player1 : gomokuState.player2;
    const winnerSymbol = gomokuState.winner === 1 ? 'X' : 'O';
    const winnerColor = gomokuState.winner === 1 ? 'primary' : 'red';
    
    // Generate confetti particles
    const confettiColors = ['#6366f1','#a78bfa','#f87171','#34d399','#fbbf24','#60a5fa','#f472b6','#38bdf8'];
    let confettiHtml = '';
    for (let i = 0; i < 40; i++) {
      const color = confettiColors[i % confettiColors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      const dur = 2 + Math.random() * 2;
      const size = 6 + Math.random() * 8;
      const rot = Math.random() * 360;
      confettiHtml += `<div class="gomoku-confetti" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;background:${color};width:${size}px;height:${size}px;transform:rotate(${rot}deg);border-radius:${Math.random()>.5?'50%':'2px'}"></div>`;
    }

    victoryOverlay = `
      <div id="gomoku-victory-overlay" class="gomoku-victory-overlay">
        ${confettiHtml}
        <div class="gomoku-victory-card bounce-in">
          <div class="gomoku-victory-trophy">🏆</div>
          <h2 class="text-3xl font-bold text-surface-100 mb-2">Chúc mừng!</h2>
          <div class="flex items-center justify-center gap-3 mb-3">
            ${gomokuState.pieceStyle === 'stone'
              ? `<span class="inline-flex items-center justify-center w-12 h-12"><span class="${gomokuState.winner === 1 ? 'gomoku-stone-black' : 'gomoku-stone-white'}" style="width:36px;height:36px"></span></span>`
              : `<span class="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-2xl font-black
                         ${gomokuState.winner === 1 ? 'bg-primary-600/30 text-primary-400' : 'bg-red-500/30 text-red-400'}">
              ${winnerSymbol}
            </span>`}
            <span class="text-2xl font-bold text-${winnerColor}-400">${winnerName}</span>
          </div>
          <p class="text-surface-400 mb-6">đã giành chiến thắng!</p>
          <div class="flex gap-3 justify-center">
            <button id="btn-victory-rematch" class="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              Chơi lại
            </button>
            <button id="btn-victory-exit" class="px-6 py-3 bg-white/5 hover:bg-white/10 text-surface-300 rounded-2xl font-medium border border-white/10 transition-all">
              Thiết lập mới
            </button>
          </div>
        </div>
      </div>
    `;
  }

  let drawOverlay = '';
  if (!gomokuState.winner && gomokuState.moveCount >= s * s) {
    drawOverlay = `
      <div id="gomoku-victory-overlay" class="gomoku-victory-overlay">
        <div class="gomoku-victory-card bounce-in">
          <div class="gomoku-victory-trophy">🤝</div>
          <h2 class="text-3xl font-bold text-surface-100 mb-2">Hòa!</h2>
          <p class="text-surface-400 mb-6">Không ai giành chiến thắng trong ván này.</p>
          <div class="flex gap-3 justify-center">
            <button id="btn-victory-rematch" class="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              Chơi lại
            </button>
            <button id="btn-victory-exit" class="px-6 py-3 bg-white/5 hover:bg-white/10 text-surface-300 rounded-2xl font-medium border border-white/10 transition-all">
              Thiết lập mới
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="max-w-4xl mx-auto px-4 pt-6 pb-24">
      <div class="fade-in flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold ${statusColor} transition-colors">${statusText}</h2>
          <p class="text-xs text-surface-500">${gomokuState.boardSize}×${gomokuState.boardSize} • ${gomokuState.mode === 'ai' ? 'vs Máy (' + ({easy:'Dễ',medium:'TB',hard:'Khó'}[gomokuState.aiDifficulty]) + ')' : '2 Người'}</p>
        </div>
        <div class="flex gap-2">
          ${gomokuState.winner || gomokuState.moveCount >= s*s ? `
          <button id="btn-gomoku-rematch" class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-all shadow-lg">Chơi lại</button>` : ''}
          <button id="btn-gomoku-exit" class="px-4 py-2 text-sm text-surface-400 hover:text-surface-200 bg-white/5 hover:bg-white/10 rounded-xl transition-all">Thoát</button>
        </div>
      </div>

      <div class="flex justify-center overflow-auto pb-4">
        <div class="gomoku-board" style="width:${boardPx}px; grid-template-columns: repeat(${s}, ${cellSize}px)">
          ${boardHtml}
        </div>
      </div>

      <div class="flex justify-center gap-6 mt-4 text-sm">
        <div class="flex items-center gap-2">
          ${gomokuState.pieceStyle === 'stone'
            ? '<span class="inline-flex items-center justify-center w-7 h-7"><span class="gomoku-stone-black" style="width:20px;height:20px"></span></span>'
            : '<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600/20 text-primary-400 font-bold text-xs">X</span>'}
          <span class="text-surface-300">${gomokuState.player1}</span>
        </div>
        <div class="flex items-center gap-2">
          ${gomokuState.pieceStyle === 'stone'
            ? '<span class="inline-flex items-center justify-center w-7 h-7"><span class="gomoku-stone-white" style="width:20px;height:20px"></span></span>'
            : '<span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/20 text-red-400 font-bold text-xs">O</span>'}
          <span class="text-surface-300">${gomokuState.player2}</span>
        </div>
      </div>
    </div>
    ${victoryOverlay}
    ${drawOverlay}
  `;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function initGomokuEvents(allWords, rerenderFn) {
  if (gomokuState.phase === 'setup') {
    document.querySelectorAll('[data-gomoku-mode]').forEach(btn => btn.addEventListener('click', () => {
      gomokuState.mode = btn.dataset.gomokuMode;
      if (gomokuState.mode === 'ai') gomokuState.player2 = 'Máy tính';
      rerenderFn();
    }));
    document.querySelectorAll('[data-gomoku-diff]').forEach(btn => btn.addEventListener('click', () => { gomokuState.aiDifficulty = btn.dataset.gomokuDiff; rerenderFn(); }));
    document.querySelectorAll('[data-gomoku-size]').forEach(btn => btn.addEventListener('click', () => { gomokuState.boardSize = parseInt(btn.dataset.gomokuSize); rerenderFn(); }));
    document.querySelectorAll('[data-gomoku-piece]').forEach(btn => btn.addEventListener('click', () => { gomokuState.pieceStyle = btn.dataset.gomokuPiece; rerenderFn(); }));

    document.getElementById('btn-gomoku-start')?.addEventListener('click', () => {
      gomokuState.player1 = document.getElementById('gomoku-p1')?.value || 'Người chơi 1';
      gomokuState.player2 = document.getElementById('gomoku-p2')?.value || (gomokuState.mode === 'ai' ? 'Máy tính' : 'Người chơi 2');
      resetBoard();
      gomokuState.phase = 'playing';
      rerenderFn();
    });
    return;
  }

  // Game phase events
  const makeMove = (r, c) => {
    if (gomokuState.winner || gomokuState.board[r][c] !== 0) return;
    const player = gomokuState.currentPlayer;
    gomokuState.board[r][c] = player;
    gomokuState.lastMove = [r, c];
    gomokuState.moveCount++;

    const winCells = checkWin(gomokuState.board, r, c, player);
    if (winCells) {
      gomokuState.winner = player;
      gomokuState.winCells = winCells;
      playDing();
      rerenderFn();
      return;
    }
    if (gomokuState.moveCount >= gomokuState.boardSize * gomokuState.boardSize) {
      rerenderFn();
      return;
    }

    gomokuState.currentPlayer = player === 1 ? 2 : 1;
    rerenderFn();

    // AI move
    if (gomokuState.mode === 'ai' && gomokuState.currentPlayer === 2 && !gomokuState.winner) {
      setTimeout(() => {
        const move = getAiMove(gomokuState.board, 2, gomokuState.aiDifficulty);
        if (move) makeMove(move.r, move.c);
      }, 200);
    }
  };

  document.querySelectorAll('[data-gomoku-r]').forEach(cell => {
    cell.addEventListener('click', () => {
      if (gomokuState.mode === 'ai' && gomokuState.currentPlayer === 2) return; // AI's turn
      const r = parseInt(cell.dataset.gomokuR);
      const c = parseInt(cell.dataset.gomokuC);
      makeMove(r, c);
    });
  });

  document.getElementById('btn-gomoku-rematch')?.addEventListener('click', () => { resetBoard(); rerenderFn(); });
  document.getElementById('btn-gomoku-exit')?.addEventListener('click', () => { gomokuState.phase = 'setup'; rerenderFn(); });
  document.getElementById('btn-victory-rematch')?.addEventListener('click', () => { resetBoard(); rerenderFn(); });
  document.getElementById('btn-victory-exit')?.addEventListener('click', () => { gomokuState.phase = 'setup'; rerenderFn(); });
}
