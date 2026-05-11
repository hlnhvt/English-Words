import { playDing, playError } from '../utils/sound.js';

const PATH = [
  [6,0], [6,1], [6,2], [6,3], [6,4], [6,5],
  [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
  [0,7],
  [0,8], [1,8], [2,8], [3,8], [4,8], [5,8],
  [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
  [7,14],
  [8,14], [8,13], [8,12], [8,11], [8,10], [8,9],
  [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
  [14,7],
  [14,6], [13,6], [12,6], [11,6], [10,6], [9,6],
  [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
  [7,0]
];

const START_INDICES = [1, 14, 27, 40];
const SAFE_ZONES = new Set([1, 14, 27, 40, 9, 22, 35, 48]); // Starts and stars
const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308']; // Red, Green, Blue, Yellow

const HOME_PATHS = [
  [[7,1], [7,2], [7,3], [7,4], [7,5]], // Red
  [[1,7], [2,7], [3,7], [4,7], [5,7]], // Green
  [[7,13], [7,12], [7,11], [7,10], [7,9]], // Blue
  [[13,7], [12,7], [11,7], [10,7], [9,7]]  // Yellow
];

const BASE_CENTERS = [
  [2.5, 2.5], // Red
  [2.5, 12.5], // Green
  [12.5, 12.5], // Blue
  [12.5, 2.5] // Yellow
];

const PIECE_OFFSETS = [
  [-1, -1], [1, -1], [-1, 1], [1, 1]
];

let state = {
  phase: 'setup', // setup, playing, finished
  numPlayers: 4,
  numDice: 2,
  players: [
    { type: 'human', name: 'Đỏ', color: 0 },
    { type: 'ai', name: 'Xanh lá', color: 1 },
    { type: 'ai', name: 'Xanh dương', color: 2 },
    { type: 'ai', name: 'Vàng', color: 3 }
  ],
  pieces: [], // array of 16 pieces: { id, player, pos: -1 (base), 0-50 (path), 51-55 (home), 56 (finish) }
  turn: 0,
  dice: [],
  hasRolled: false,
  winner: null,
  canvasSize: 450,
  isAnimating: false,
  fastForward: false,
  showTurnTransition: false
};

const delay = ms => new Promise(res => setTimeout(res, ms));

function initGame() {
  state.pieces = [];
  for (let p = 0; p < state.numPlayers; p++) {
    for (let i = 0; i < 4; i++) {
      state.pieces.push({ id: p * 4 + i, player: p, pos: -1 });
    }
  }
  state.turn = 0;
  state.dice = [];
  state.hasRolled = false;
  state.isAnimating = false;
  state.showTurnTransition = false;
  state.winner = null;
}

let localRerender = null;

function redrawCanvas() {
  const cvs = document.getElementById('ludo-canvas');
  if (cvs) drawBoard(cvs.getContext('2d'), state.canvasSize);
}

async function rollDice() {
  if (state.hasRolled || state.isAnimating) return;
  state.isAnimating = true;

  if (!state.fastForward) {
    // Dice rolling animation
    for(let i = 0; i < 10; i++) {
      state.dice = Array.from({ length: state.numDice }, () => Math.floor(Math.random() * 6) + 1);
      if (localRerender) localRerender();
      await delay(50);
    }
  }

  state.dice = Array.from({ length: state.numDice }, () => Math.floor(Math.random() * 6) + 1);
  state.hasRolled = true;
  state.isAnimating = false;
  if (localRerender) localRerender();
  
  // Check if any valid moves exist
  const validMoves = getValidMoves(state.turn);
  if (validMoves.length === 0) {
    state.isAnimating = true;
    await delay(state.fastForward ? 500 : 1500);
    state.isAnimating = false;
    await nextTurn();
  } else if (state.players[state.turn].type === 'ai') {
    state.isAnimating = true;
    await delay(state.fastForward ? 300 : 800);
    state.isAnimating = false;
    await playAI();
  }
}

function getValidMoves(playerIdx) {
  if (!state.hasRolled || state.dice.length === 0 || state.isAnimating) return [];
  const moves = [];
  const diceSum = state.dice.reduce((a, b) => a + b, 0);
  const hasSix = state.dice.includes(6);

  for (const piece of state.pieces.filter(p => p.player === playerIdx)) {
    if (piece.pos === 56) continue;
    
    if (piece.pos === -1) {
      if (hasSix) {
        moves.push({ piece, action: 'out', steps: diceSum - 6 }); // get out and move remaining
      }
    } else {
      if (piece.pos + diceSum <= 56) {
        moves.push({ piece, action: 'move', steps: diceSum });
      }
    }
  }
  return moves;
}

async function executeMove(move) {
  if (state.isAnimating) return;
  state.isAnimating = true;
  const { piece, action, steps } = move;
  const player = piece.player;
  const speed = state.fastForward ? 50 : 200;
  
  if (action === 'out') {
    piece.pos = 0; 
    redrawCanvas();
    if (!state.fastForward) await delay(speed * 1.5);
    for (let i = 0; i < steps; i++) {
      piece.pos++;
      redrawCanvas();
      playDing();
      await delay(speed);
    }
  } else if (action === 'move') {
    for (let i = 0; i < steps; i++) {
      piece.pos++;
      redrawCanvas();
      playDing();
      await delay(speed);
    }
  }

  // Handle kicks
  if (piece.pos >= 0 && piece.pos <= 50) {
    const globalPos = (START_INDICES[player] + piece.pos) % 52;
    if (!SAFE_ZONES.has(globalPos)) {
      for (const other of state.pieces) {
        if (other.player !== player && other.pos >= 0 && other.pos <= 50) {
          const otherGlobalPos = (START_INDICES[other.player] + other.pos) % 52;
          if (globalPos === otherGlobalPos) {
            other.pos = -1; // Kick to base
            playDing();
            redrawCanvas();
            await delay(speed * 2);
          }
        }
      }
    }
  }

  state.isAnimating = false;

  // Check win
  const playerPieces = state.pieces.filter(p => p.player === player);
  if (playerPieces.every(p => p.pos === 56)) {
    state.winner = player;
    state.phase = 'finished';
    if (localRerender) localRerender();
  } else {
    // Next turn logic
    if (state.dice.includes(6) || (state.numDice === 2 && state.dice[0] === state.dice[1])) {
      state.hasRolled = false;
      state.dice = [];
      if (localRerender) localRerender();
      if (state.players[state.turn].type === 'ai') {
        state.isAnimating = true;
        await delay(state.fastForward ? 300 : 1000);
        state.isAnimating = false;
        await rollDice();
      }
    } else {
      await nextTurn();
    }
  }
}

async function nextTurn() {
  state.hasRolled = false;
  state.dice = [];
  do {
    state.turn = (state.turn + 1) % state.numPlayers;
  } while (state.pieces.filter(p => p.player === state.turn).every(p => p.pos === 56) && !state.winner);

  if (!state.winner) {
    state.showTurnTransition = true;
    if (localRerender) localRerender();
    
    state.isAnimating = true;
    await delay(state.fastForward ? 400 : 1200);
    
    state.showTurnTransition = false;
    state.isAnimating = false;
    if (localRerender) localRerender();

    if (state.players[state.turn].type === 'ai') {
      await rollDice();
    }
  }
}

async function playAI() {
  const moves = getValidMoves(state.turn);
  if (moves.length > 0) {
    moves.sort((a, b) => {
      if (a.action === 'out') return -1;
      if (b.action === 'out') return 1;
      return b.piece.pos - a.piece.pos;
    });
    await executeMove(moves[0]);
  }
}

// ─── Render UI ───────────────────────────────────────────────────────────────

const pill = (active) =>
  `class="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
          ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}"`;

export function renderLudo() {
  if (state.phase === 'setup') return renderSetup();
  return renderGame();
}

function renderSetup() {
  return `
    <div class="max-w-xl mx-auto px-4 pt-10 pb-24">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Cờ Cá Ngựa</h2>
        <p class="text-sm text-surface-400">Thiết lập ván cờ</p>
      </div>
      <div class="space-y-3">
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.05s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Số lượng xúc xắc</h3>
          <div class="flex flex-wrap gap-2">
            <button data-ludo-dice="1" ${pill(state.numDice === 1)}>1 Xúc xắc</button>
            <button data-ludo-dice="2" ${pill(state.numDice === 2)}>2 Xúc xắc</button>
          </div>
          <p class="text-xs text-surface-500 mt-2">Đổ được 6 để ra quân. 2 xúc xắc sẽ được cộng dồn khoảng cách đi.</p>
        </div>
        
        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.1s">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Người chơi</h3>
          <div class="space-y-3">
            ${[0, 1, 2, 3].map(i => `
              <div class="flex items-center gap-3">
                <span class="w-4 h-4 rounded-full" style="background:${COLORS[i]}"></span>
                <select id="ludo-p${i}-type" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-surface-200 focus:outline-none">
                  <option value="none" ${i >= state.numPlayers ? 'selected' : ''}>Không chơi</option>
                  <option value="human" ${i < state.numPlayers && state.players[i]?.type === 'human' ? 'selected' : ''}>Người</option>
                  <option value="ai" ${i < state.numPlayers && state.players[i]?.type === 'ai' ? 'selected' : ''}>Máy</option>
                </select>
                <input id="ludo-p${i}-name" type="text" value="${state.players[i]?.name || ''}" 
                  class="flex-1 bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-sm text-surface-200 focus:outline-none" 
                  placeholder="Tên..." ${i >= state.numPlayers ? 'disabled' : ''} />
              </div>
            `).join('')}
          </div>
        </div>

        <div class="fade-in glass rounded-2xl p-5" style="animation-delay:.15s">
          <label class="flex items-center gap-3 cursor-pointer w-fit">
            <input type="checkbox" id="ludo-fast-forward" class="w-5 h-5 rounded text-primary-500 focus:ring-primary-500 bg-surface-900 border-white/10" ${state.fastForward ? 'checked' : ''}>
            <span class="text-sm font-medium text-surface-200">Tua nhanh (Bỏ qua hiệu ứng động)</span>
          </label>
        </div>
      </div>
      <div class="mt-8 flex justify-end">
        <button id="btn-ludo-start" class="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-bold shadow-xl transition-all">
          Bắt đầu chơi
        </button>
      </div>
    </div>
  `;
}

function getDiceHtml(val) {
  const dots = {
    1: '<circle cx="50" cy="50" r="10" fill="#ef4444"/>',
    2: '<circle cx="25" cy="25" r="10" fill="#333"/><circle cx="75" cy="75" r="10" fill="#333"/>',
    3: '<circle cx="25" cy="25" r="10" fill="#333"/><circle cx="50" cy="50" r="10" fill="#ef4444"/><circle cx="75" cy="75" r="10" fill="#333"/>',
    4: '<circle cx="25" cy="25" r="10" fill="#333"/><circle cx="75" cy="25" r="10" fill="#333"/><circle cx="25" cy="75" r="10" fill="#333"/><circle cx="75" cy="75" r="10" fill="#333"/>',
    5: '<circle cx="25" cy="25" r="10" fill="#333"/><circle cx="75" cy="25" r="10" fill="#333"/><circle cx="50" cy="50" r="10" fill="#ef4444"/><circle cx="25" cy="75" r="10" fill="#333"/><circle cx="75" cy="75" r="10" fill="#333"/>',
    6: '<circle cx="25" cy="20" r="10" fill="#333"/><circle cx="75" cy="20" r="10" fill="#333"/><circle cx="25" cy="50" r="10" fill="#333"/><circle cx="75" cy="50" r="10" fill="#333"/><circle cx="25" cy="80" r="10" fill="#333"/><circle cx="75" cy="80" r="10" fill="#333"/>'
  };
  return `<svg viewBox="0 0 100 100" class="w-10 h-10 drop-shadow-md bg-white rounded-xl"><rect width="100" height="100" rx="20" fill="white"/>${dots[val]}</svg>`;
}

function renderGame() {
  const cp = state.players[state.turn];
  
  return `
    <div class="max-w-3xl mx-auto px-4 pt-6 pb-24 relative">
      ${state.showTurnTransition ? `
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-md fade-in rounded-2xl">
          <div class="bg-surface-800 p-8 sm:p-12 rounded-3xl shadow-2xl border-2 animate-bounce" style="border-color:${COLORS[state.turn]}">
            <h2 class="text-3xl sm:text-5xl font-black text-white text-center">Đến lượt: <br/> <span class="mt-4 inline-block" style="color:${COLORS[state.turn]}">${state.players[state.turn].name}</span></h2>
          </div>
        </div>
      ` : ''}
      <div class="fade-in flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <span class="w-5 h-5 rounded-full shadow-md" style="background:${COLORS[state.turn]}"></span>
          <div>
            <h2 class="text-lg font-bold text-surface-100">Lượt: ${cp.name} ${cp.type === 'ai' ? '(Máy)' : ''}</h2>
            <div class="text-sm font-medium text-surface-400">
              ${state.hasRolled ? `Đã đổ: <span class="text-white">${state.dice.join(' + ')}${state.numDice===2 ? ' = '+(state.dice[0]+state.dice[1]) : ''}</span>` : 'Chưa đổ xúc xắc'}
            </div>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <label class="hidden sm:flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-all text-xs text-surface-300">
            <input type="checkbox" id="ludo-fast-forward-game" class="rounded text-primary-500 bg-surface-900 border-white/10" ${state.fastForward ? 'checked' : ''}>
            Tua nhanh
          </label>
          ${state.winner !== null ? `
          <button id="btn-ludo-rematch" class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-all shadow-lg">Chơi lại</button>` : ''}
          <button id="btn-ludo-exit" class="px-4 py-2 text-sm text-surface-400 bg-white/5 hover:bg-white/10 rounded-xl transition-all">Thoát</button>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
        <div class="relative bg-white rounded-2xl p-2 shadow-2xl shrink-0">
          <canvas id="ludo-canvas" width="${state.canvasSize}" height="${state.canvasSize}" class="rounded-xl cursor-pointer"></canvas>
          ${state.winner !== null ? `
            <div class="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-col animate-shake">
              <div class="text-6xl mb-2">🏆</div>
              <h2 class="text-3xl font-bold text-white mb-2">${state.players[state.winner].name} THẮNG!</h2>
            </div>
          ` : ''}
        </div>
        
        <div class="glass p-6 rounded-2xl w-full max-w-[200px] flex flex-col items-center">
          <div class="w-full h-24 border-2 border-white/10 rounded-2xl flex items-center justify-center gap-3 bg-surface-900/50 mb-4 shadow-inner">
             ${state.hasRolled || state.dice.length > 0 ? state.dice.map(d => getDiceHtml(d)).join('') : '<span class="text-surface-600 text-5xl">🎲</span>'}
          </div>
          <button id="btn-ludo-roll" class="w-full px-4 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            ${state.hasRolled || cp.type === 'ai' || state.winner !== null || state.isAnimating ? 'disabled' : ''}>
            TUNG XÚC XẮC
          </button>
          ${state.hasRolled && cp.type !== 'ai' && getValidMoves(state.turn).length === 0 && state.winner === null ? `
            <p class="text-red-400 text-sm mt-3 font-medium animate-pulse">Không có nước đi hợp lệ</p>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function drawBoard(ctx, size) {
  const cs = size / 15; // cell size
  ctx.clearRect(0, 0, size, size);
  
  // Draw bases
  const drawBase = (r, c, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(c*cs, r*cs, 6*cs, 6*cs);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(c*cs + cs, r*cs + cs, 4*cs, 4*cs);
  };
  drawBase(0, 0, COLORS[0]); drawBase(0, 9, COLORS[1]);
  drawBase(9, 9, COLORS[2]); drawBase(9, 0, COLORS[3]);

  // Center finish
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(6*cs, 6*cs); ctx.lineTo(9*cs, 6*cs); ctx.lineTo(7.5*cs, 7.5*cs); ctx.fill();
  ctx.fillStyle = COLORS[0];
  ctx.beginPath();
  ctx.moveTo(6*cs, 6*cs); ctx.lineTo(6*cs, 9*cs); ctx.lineTo(7.5*cs, 7.5*cs); ctx.fill();
  ctx.fillStyle = COLORS[1];
  ctx.beginPath();
  ctx.moveTo(6*cs, 9*cs); ctx.lineTo(9*cs, 9*cs); ctx.lineTo(7.5*cs, 7.5*cs); ctx.fill();
  ctx.fillStyle = COLORS[2];
  ctx.beginPath();
  ctx.moveTo(9*cs, 6*cs); ctx.lineTo(9*cs, 9*cs); ctx.lineTo(7.5*cs, 7.5*cs); ctx.fill();

  // Draw path
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  const drawCell = (r, c, bg) => {
    ctx.fillStyle = bg;
    ctx.fillRect(c*cs, r*cs, cs, cs);
    ctx.strokeRect(c*cs, r*cs, cs, cs);
  };

  for (let i = 0; i < PATH.length; i++) {
    const [r, c] = PATH[i];
    let bg = '#ffffff';
    if (SAFE_ZONES.has(i)) bg = '#e2e8f0'; // safe zone
    if (i === START_INDICES[0]) bg = COLORS[0];
    if (i === START_INDICES[1]) bg = COLORS[1];
    if (i === START_INDICES[2]) bg = COLORS[2];
    if (i === START_INDICES[3]) bg = COLORS[3];
    drawCell(r, c, bg);
  }

  // Draw home paths
  for (let p = 0; p < 4; p++) {
    for (let i = 0; i < 5; i++) {
      const [r, c] = HOME_PATHS[p][i];
      drawCell(r, c, COLORS[p]);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(c*cs, r*cs, cs, cs);
    }
  }

  // Draw pieces
  const piecesByTile = {};
  for (const piece of state.pieces) {
    let r, c;
    if (piece.pos === -1) {
      r = BASE_CENTERS[piece.player][0] + PIECE_OFFSETS[piece.id % 4][0];
      c = BASE_CENTERS[piece.player][1] + PIECE_OFFSETS[piece.id % 4][1];
    } else if (piece.pos >= 0 && piece.pos <= 50) {
      const g = (START_INDICES[piece.player] + piece.pos) % 52;
      [r, c] = PATH[g];
    } else if (piece.pos >= 51 && piece.pos <= 55) {
      [r, c] = HOME_PATHS[piece.player][piece.pos - 51];
    } else if (piece.pos === 56) {
      r = 7.5; c = 7.5; // roughly center
    }
    const key = `${r}-${c}`;
    if (!piecesByTile[key]) piecesByTile[key] = [];
    piecesByTile[key].push({ ...piece, r, c });
  }

  for (const key in piecesByTile) {
    const list = piecesByTile[key];
    list.forEach((p, idx) => {
      let x = p.c * cs + cs/2;
      let y = p.r * cs + cs/2;
      if (list.length > 1 && p.pos !== -1 && p.pos !== 56) {
        x += (idx % 2 === 0 ? -4 : 4);
        y += (idx < 2 ? -4 : 4);
      }
      
      // Save pixel coordinates for click detection
      const pieceRef = state.pieces.find(sp => sp.id === p.id);
      if (pieceRef) {
        pieceRef.renderX = x;
        pieceRef.renderY = y;
      }
      
      // Draw shadow
      ctx.beginPath();
      ctx.arc(x, y+2, cs*0.35, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      
      // Draw horse piece
      ctx.save();
      ctx.translate(x, y);
      const size = cs * 0.35;
      
      // Chess Knight Silhouette
      const pColor = COLORS[p.player];
      ctx.fillStyle = pColor;
      
      ctx.beginPath();
      ctx.moveTo(-size*0.6, size); // base left
      ctx.lineTo(size*0.6, size); // base right
      ctx.lineTo(size*0.4, size*0.7); // base top right
      ctx.lineTo(size*0.4, -size*0.3); // back
      ctx.quadraticCurveTo(size*0.4, -size, 0, -size*1.1); // mane to ear
      ctx.lineTo(-size*0.2, -size); // ear to top head
      ctx.lineTo(-size*0.5, -size); // head top
      ctx.quadraticCurveTo(-size*0.9, -size*0.6, -size, -size*0.1); // snout
      ctx.lineTo(-size*0.7, size*0.1); // jaw
      ctx.lineTo(-size*0.4, size*0.1); // neck inner
      ctx.lineTo(-size*0.4, size*0.7); // neck down
      ctx.closePath();
      
      // Shadow and fill
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fill();
      
      // Stroke
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-size*0.3, -size*0.7, size*0.15, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(-size*0.35, -size*0.7, size*0.06, 0, Math.PI*2);
      ctx.fill();
      
      ctx.restore();
    });
  }
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function initLudoEvents(allWords, rerenderFn) {
  localRerender = rerenderFn;
  if (state.phase === 'setup') {
    document.querySelectorAll('[data-ludo-dice]').forEach(btn => btn.addEventListener('click', () => {
      state.numDice = parseInt(btn.dataset.ludoDice);
      rerenderFn();
    }));

    document.querySelectorAll('select[id^="ludo-p"]').forEach((sel, i) => {
      sel.addEventListener('change', () => {
        if (!state.players[i]) state.players[i] = { type: 'human', name: '', color: i };
        state.players[i].type = sel.value;
        const active = Array.from(document.querySelectorAll('select[id^="ludo-p"]')).filter(s => s.value !== 'none').length;
        if (active < 2 && sel.value === 'none') {
          alert('Cần ít nhất 2 người chơi!');
          sel.value = state.players[i]?.type || 'human';
          return;
        }
        rerenderFn();
      });
    });

    document.getElementById('ludo-fast-forward')?.addEventListener('change', (e) => {
      state.fastForward = e.target.checked;
    });

    document.getElementById('btn-ludo-start')?.addEventListener('click', () => {
      const activePlayers = [];
      for (let i = 0; i < 4; i++) {
        const type = document.getElementById(`ludo-p${i}-type`).value;
        const name = document.getElementById(`ludo-p${i}-name`).value || `Người chơi ${i+1}`;
        if (type !== 'none') activePlayers.push({ type, name, color: i });
      }
      state.players = activePlayers;
      state.numPlayers = activePlayers.length;
      initGame();
      state.phase = 'playing';
      rerenderFn();
      // Render canvas immediately after DOM update
      setTimeout(() => {
        const cvs = document.getElementById('ludo-canvas');
        if (cvs) drawBoard(cvs.getContext('2d'), state.canvasSize);
      }, 0);
      
      // Start AI if needed
      if (state.players[state.turn].type === 'ai') {
        setTimeout(() => { rollDice(); }, 1000);
      }
    });
    return;
  }

  document.getElementById('ludo-fast-forward-game')?.addEventListener('change', (e) => {
    state.fastForward = e.target.checked;
  });

  // Draw board initially
  const cvs = document.getElementById('ludo-canvas');
  if (cvs) {
    const ctx = cvs.getContext('2d');
    drawBoard(ctx, state.canvasSize);

    cvs.addEventListener('click', (e) => {
      if (!state.hasRolled || state.players[state.turn].type === 'ai' || state.winner || state.isAnimating) return;
      const rect = cvs.getBoundingClientRect();
      const scaleX = cvs.width / rect.width;
      const scaleY = cvs.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const validMoves = getValidMoves(state.turn);
      if (validMoves.length === 0) return;

      // Find if clicked on a valid piece based on renderX, renderY
      const clickRadius = state.canvasSize / 15 * 0.6; // generous click area
      for (const move of validMoves) {
        if (move.piece.renderX !== undefined && move.piece.renderY !== undefined) {
          const dx = move.piece.renderX - x;
          const dy = move.piece.renderY - y;
          if (Math.sqrt(dx*dx + dy*dy) < clickRadius) {
            executeMove(move);
            return;
          }
        }
      }
    });
  }

  document.getElementById('btn-ludo-roll')?.addEventListener('click', () => {
    rollDice();
  });

  document.getElementById('btn-ludo-rematch')?.addEventListener('click', () => { initGame(); rerenderFn(); });
  document.getElementById('btn-ludo-exit')?.addEventListener('click', () => { state.phase = 'setup'; rerenderFn(); });
}
