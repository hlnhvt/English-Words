import { playDing, playError } from '../utils/sound.js';
import { MONOPOLY_BOARD, CHANCE_CARDS, CHEST_CARDS } from './monopoly-data.js';

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308']; // Red, Green, Blue, Yellow

let state = {
  phase: 'setup',
  numPlayers: 4,
  winCondition: 2000, // Amount to win, 0 means no limit
  players: [],
  turn: 0,
  dice: [],
  doublesCount: 0,
  hasRolled: false,
  properties: {}, // id -> owner (player index)
  log: [],
  actionPending: null, // { type: 'buy_property', propertyId } or null
  winner: null
};

let localRerender = null;

function addLog(msg) {
  state.log.unshift(msg);
  if (state.log.length > 20) state.log.pop();
}

function initGame() {
  state.players = [];
  for (let i = 0; i < state.numPlayers; i++) {
    const type = document.getElementById(`mnp-p${i}-type`).value;
    const name = document.getElementById(`mnp-p${i}-name`).value || `Người chơi ${i+1}`;
    if (type !== 'none') {
      state.players.push({
        id: i, type, name, color: COLORS[i],
        money: 1500, pos: 0, inJail: false, jailTurns: 0, getOutCards: 0,
        bankrupt: false
      });
    }
  }
  state.numPlayers = state.players.length;
  state.properties = {};
  state.turn = 0;
  state.dice = [];
  state.doublesCount = 0;
  state.hasRolled = false;
  state.actionPending = null;
  state.winner = null;
  state.log = [];
  addLog('Bắt đầu ván Cờ Tỉ Phú mới!');
}

function checkWinCondition() {
  const activePlayers = state.players.filter(p => !p.bankrupt);
  if (activePlayers.length === 1) {
    state.winner = activePlayers[0].id;
    state.phase = 'finished';
    return true;
  }
  if (state.winCondition > 0) {
    for (const p of activePlayers) {
      if (p.money >= state.winCondition) {
        state.winner = p.id;
        state.phase = 'finished';
        addLog(`🎉 ${p.name} đã chiến thắng vì đạt mốc $${state.winCondition}!`);
        return true;
      }
    }
  }
  return false;
}

function bankruptcy(playerIdx, creditorIdx) {
  const p = state.players[playerIdx];
  p.bankrupt = true;
  addLog(`💀 ${p.name} đã PHÁ SẢN!`);
  // Transfer properties to creditor or bank
  for (const propId in state.properties) {
    if (state.properties[propId] === playerIdx) {
      if (creditorIdx !== null) state.properties[propId] = creditorIdx;
      else delete state.properties[propId]; // returns to bank
    }
  }
  checkWinCondition();
}

function payMoney(playerIdx, amount, creditorIdx = null) {
  const p = state.players[playerIdx];
  if (p.money >= amount) {
    p.money -= amount;
    if (creditorIdx !== null) state.players[creditorIdx].money += amount;
    return true;
  }
  // Not enough money -> Bankrupt
  if (creditorIdx !== null) state.players[creditorIdx].money += p.money; // give what's left
  p.money = 0;
  bankruptcy(playerIdx, creditorIdx);
  return false;
}

function rollDice() {
  try {
    if (state.hasRolled || state.actionPending) return;
    const p = state.players[state.turn];

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    state.dice = [d1, d2];
    const isDouble = d1 === d2;

    addLog(`🎲 ${p.name} tung được ${d1} và ${d2}`);

    if (p.inJail) {
      if (isDouble) {
        addLog(`✨ ${p.name} tung được xúc xắc đôi và thoát khỏi Tù!`);
        p.inJail = false;
        p.jailTurns = 0;
        movePlayer(p, d1 + d2);
      } else {
        p.jailTurns++;
        if (p.jailTurns >= 3) {
          addLog(`⏳ ${p.name} đã ở tù 3 lượt, phải nộp phạt $50 để ra!`);
          if (payMoney(state.turn, 50)) {
            p.inJail = false;
            p.jailTurns = 0;
            movePlayer(p, d1 + d2);
          }
        } else {
          addLog(`❌ ${p.name} không tung được xúc xắc đôi, vẫn ở trong Tù.`);
          state.hasRolled = true;
        }
      }
    } else {
      if (isDouble) {
        state.doublesCount++;
        if (state.doublesCount === 3) {
          addLog(`🚓 ${p.name} tung xúc xắc đôi 3 lần liên tiếp! Bị bắt vào Tù!`);
          gotoJail(p);
          state.hasRolled = true;
          return;
        }
      }
      movePlayer(p, d1 + d2);
      if (!isDouble && !state.actionPending) {
        state.hasRolled = true;
      } else if (isDouble && !state.actionPending) {
        addLog(`🎲 ${p.name} được tung xúc xắc tiếp!`);
      }
    }

    // AI handling pending action
    if (state.actionPending && p.type === 'ai') {
      setTimeout(() => { handleAIAction(); if(localRerender) localRerender(); }, 1000);
    } else if (!state.actionPending && p.type === 'ai' && state.hasRolled) {
      setTimeout(() => { nextTurn(); if(localRerender) localRerender(); }, 1000);
    }
  } catch(e) {
    console.error("ROLLDICE ERROR:", e);
    alert("ROLLDICE ERROR: " + e.message);
  }
}

function movePlayer(p, steps) {
  p.pos += steps;
  if (p.pos >= 40) {
    p.pos -= 40;
    p.money += 200;
    addLog(`💰 ${p.name} đi qua BẮT ĐẦU. Nhận $200!`);
    playDing();
  }
  resolveSpace(p);
}

function gotoJail(p) {
  p.pos = 10;
  p.inJail = true;
  p.jailTurns = 0;
  state.doublesCount = 0;
  playError();
}

function drawCard(type, p) {
  const cards = type === 'chance' ? CHANCE_CARDS : CHEST_CARDS;
  const card = cards[Math.floor(Math.random() * cards.length)];
  addLog(`🎴 ${p.name} rút thẻ ${type === 'chance' ? 'CƠ HỘI' : 'KHÍ VẬN'}: ${card.text}`);
  
  if (card.action === 'advance') {
    if (p.pos > card.to) {
      p.money += 200; // Passed GO
      addLog(`💰 ${p.name} đi qua BẮT ĐẦU. Nhận $200!`);
    }
    p.pos = card.to;
    resolveSpace(p);
  } else if (card.action === 'pay') {
    if (card.amount < 0) payMoney(state.turn, -card.amount);
    else p.money += card.amount;
  } else if (card.action === 'goto_jail') {
    gotoJail(p);
  } else if (card.action === 'move') {
    p.pos += card.amount;
    if (p.pos < 0) p.pos += 40;
    resolveSpace(p);
  } else if (card.action === 'get_out_of_jail') {
    p.getOutCards++;
  } else if (card.action === 'collect_players') {
    state.players.forEach((other, idx) => {
      if (idx !== state.turn && !other.bankrupt) {
        if (payMoney(idx, card.amount, state.turn)) {}
      }
    });
  } else if (card.action === 'pay_players') {
    state.players.forEach((other, idx) => {
      if (idx !== state.turn && !other.bankrupt) {
        if (payMoney(state.turn, card.amount, idx)) {}
      }
    });
  }
}

function resolveSpace(p) {
  const space = MONOPOLY_BOARD[p.pos];
  addLog(`📍 ${p.name} dừng ở ${space.name}`);

  if (space.type === 'property' || space.type === 'railroad' || space.type === 'utility') {
    const owner = state.properties[space.id];
    if (owner !== undefined) {
      if (owner !== state.turn) {
        let rent = space.rent || (space.price * 0.1); // Simplified rent
        if (space.type === 'railroad') {
          const rrCount = Object.keys(state.properties).filter(k => state.properties[k] === owner && MONOPOLY_BOARD[k].type === 'railroad').length;
          rent = 25 * Math.pow(2, rrCount - 1);
        } else if (space.type === 'utility') {
          const uCount = Object.keys(state.properties).filter(k => state.properties[k] === owner && MONOPOLY_BOARD[k].type === 'utility').length;
          const diceSum = state.dice[0] + state.dice[1];
          rent = uCount === 2 ? diceSum * 10 : diceSum * 4;
        }
        addLog(`💸 ${p.name} phải trả $${rent} tiền thuê cho ${state.players[owner].name}`);
        payMoney(state.turn, rent, owner);
      }
    } else {
      if (p.money >= space.price) {
        state.actionPending = { type: 'buy_property', propertyId: space.id };
      }
    }
  } else if (space.type === 'tax') {
    addLog(`💸 ${p.name} phải nộp thuế $${space.price}`);
    payMoney(state.turn, space.price);
  } else if (space.type === 'chance' || space.type === 'chest') {
    drawCard(space.type, p);
  } else if (space.type === 'go_to_jail') {
    addLog(`🚓 ${p.name} bị cảnh sát bắt!`);
    gotoJail(p);
  }

  checkWinCondition();
}

function handleAIAction() {
  if (!state.actionPending) return;
  const p = state.players[state.turn];
  
  if (state.actionPending.type === 'buy_property') {
    const space = MONOPOLY_BOARD[state.actionPending.propertyId];
    // Simple AI: buy if money > price + 200 (safety buffer)
    if (p.money >= space.price + 200) {
      buyProperty(true);
    } else {
      buyProperty(false);
    }
  }
}

function buyProperty(accept) {
  const p = state.players[state.turn];
  const space = MONOPOLY_BOARD[state.actionPending.propertyId];
  if (accept) {
    if (payMoney(state.turn, space.price)) {
      state.properties[space.id] = state.turn;
      addLog(`🏠 ${p.name} đã mua ${space.name} với giá $${space.price}`);
      playDing();
    }
  } else {
    addLog(`⏭️ ${p.name} từ chối mua ${space.name}`);
  }
  
  state.actionPending = null;
  if (state.dice[0] !== state.dice[1]) {
    state.hasRolled = true;
  }
  
  if (p.type === 'ai' && state.hasRolled) {
    setTimeout(() => { nextTurn(); if(localRerender) localRerender(); }, 1000);
  }
  checkWinCondition();
}

function nextTurn() {
  state.hasRolled = false;
  state.actionPending = null;
  state.doublesCount = 0;
  do {
    state.turn = (state.turn + 1) % state.numPlayers;
  } while (state.players[state.turn].bankrupt && !state.winner);

  if (!state.winner && state.players[state.turn].type === 'ai') {
    setTimeout(() => { rollDice(); if(localRerender) localRerender(); }, 1000);
  }
}

// ─── Render UI ───────────────────────────────────────────────────────────────

const pill = (active) =>
  `class="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
          ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' : 'bg-white/5 text-surface-400 hover:bg-white/10'}"`;

export function renderMonopoly() {
  if (state.phase === 'setup') return renderSetup();
  return renderGame();
}

function renderSetup() {
  return `
    <div class="max-w-xl mx-auto px-4 pt-10 pb-24">
      <div class="fade-in mb-6">
        <h2 class="text-2xl font-bold text-surface-100 mb-1">Cờ Tỉ Phú</h2>
        <p class="text-sm text-surface-400">Phiên bản Việt Nam</p>
      </div>
      <div class="space-y-3">
        <div class="fade-in glass rounded-2xl p-5">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Điều kiện thắng</h3>
          <div class="flex gap-2 mb-2 flex-wrap">
             <button data-mnp-win="0" ${pill(state.winCondition === 0)}>Phá sản hết đối thủ</button>
             <button data-mnp-win="2000" ${pill(state.winCondition === 2000)}>Đạt $2000</button>
             <button data-mnp-win="5000" ${pill(state.winCondition === 5000)}>Đạt $5000</button>
          </div>
          <p class="text-xs text-surface-500">Mặc định thắng khi mọi đối thủ phá sản.</p>
        </div>
        
        <div class="fade-in glass rounded-2xl p-5">
          <h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Người chơi</h3>
          <div class="space-y-3">
            ${[0, 1, 2, 3].map(i => `
              <div class="flex items-center gap-3">
                <span class="w-4 h-4 rounded-full" style="background:${COLORS[i]}"></span>
                <select id="mnp-p${i}-type" class="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-surface-200 focus:outline-none">
                  <option value="none" ${i >= 2 ? 'selected' : ''}>Không chơi</option>
                  <option value="human" ${i === 0 ? 'selected' : ''}>Người</option>
                  <option value="ai" ${i === 1 ? 'selected' : ''}>Máy</option>
                </select>
                <input id="mnp-p${i}-name" type="text" value="Người chơi ${i+1}" 
                  class="flex-1 bg-white/5 border border-white/10 rounded-lg py-1 px-3 text-sm text-surface-200 focus:outline-none" 
                  placeholder="Tên..." />
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="mt-8 flex justify-end">
        <button id="btn-mnp-start" class="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-bold shadow-xl transition-all">
          Bắt đầu chơi
        </button>
      </div>
    </div>
  `;
}

function getGridPos(id) {
  if (id >= 0 && id <= 10) return { col: 11 - id, row: 11 };
  if (id >= 11 && id <= 20) return { col: 1, row: 11 - (id - 10) };
  if (id >= 21 && id <= 30) return { col: 1 + (id - 20), row: 1 };
  if (id >= 31 && id <= 39) return { col: 11, row: 1 + (id - 30) };
  return { col: 1, row: 1 };
}

function renderGame() {
  const cp = state.players[state.turn];

  let actionHtml = '';
  if (state.actionPending && state.actionPending.type === 'buy_property' && cp.type === 'human') {
    const space = MONOPOLY_BOARD[state.actionPending.propertyId];
    actionHtml = `
      <div class="bg-surface-800 p-2 sm:p-4 rounded-xl border border-white/10 mb-2 sm:mb-4 animate-shake text-center">
        <h3 class="font-bold text-sm sm:text-lg mb-1">Mua Bất Động Sản?</h3>
        <p class="text-xs sm:text-sm text-surface-300 mb-2 sm:mb-3">${space.name} <br class="sm:hidden"/> <span class="text-warning-400 font-bold">$${space.price}</span></p>
        <div class="flex gap-2">
          <button id="btn-mnp-buy-yes" class="flex-1 py-1.5 sm:py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white font-bold transition-all text-xs sm:text-base">Mua</button>
          <button id="btn-mnp-buy-no" class="flex-1 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all text-xs sm:text-base">Bỏ qua</button>
        </div>
      </div>
    `;
  }

  let centerHtml = `
    <!-- Players list -->
    <div class="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-4">
      ${state.players.map(p => `
        <div class="bg-white/90 p-2 sm:p-3 rounded-xl border-2 shadow-sm flex items-center gap-2 ${p.bankrupt ? 'opacity-40 grayscale' : ''}" style="border-color:${state.turn === p.id && !p.bankrupt ? p.color : 'transparent'}">
          <span class="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0" style="background:${p.color}"></span>
          <div class="flex-1 min-w-0">
            <div class="text-[10px] sm:text-xs font-bold truncate ${p.bankrupt ? 'line-through text-red-500' : 'text-gray-800'}">${p.name}</div>
            <div class="text-xs sm:text-sm font-black text-green-700">$${p.money}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Action Area -->
    <div class="w-full max-w-sm mx-auto flex flex-col justify-center flex-1 shrink-0 z-50">
      ${actionHtml}
      
      <div class="flex justify-center items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
        ${state.dice.length ? state.dice.map(d => `<div class="w-10 h-10 sm:w-14 sm:h-14 bg-white border-2 border-gray-200 rounded-xl shadow-md flex items-center justify-center text-black text-xl sm:text-3xl font-black">${d}</div>`).join('') : ''}
      </div>

      ${!state.actionPending && !state.winner ? `
        ${!state.hasRolled ? `
          <button id="btn-mnp-roll" class="w-full py-3 sm:py-4 bg-gradient-to-b from-red-500 to-red-600 border-2 border-red-700 rounded-xl text-white font-black text-sm sm:text-base shadow-[0_4px_0_rgb(153,27,27)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(153,27,27)] active:translate-y-[4px] active:shadow-none transition-all" ${cp.type === 'ai' ? 'disabled' : ''}>
            🎲 TUNG XÚC XẮC
          </button>
        ` : `
          <button id="btn-mnp-next" class="w-full py-3 sm:py-4 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-800 font-bold text-sm sm:text-base shadow-[0_4px_0_rgb(209,213,219)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgb(209,213,219)] active:translate-y-[4px] active:shadow-none transition-all" ${cp.type === 'ai' ? 'disabled' : ''}>
            KẾT THÚC LƯỢT
          </button>
        `}
      ` : ''}

      ${state.winner !== null ? `
        <div class="bg-primary-600 border-2 border-primary-700 p-2 sm:p-4 rounded-xl text-center shadow-xl animate-bounce mt-2 sm:mt-4">
          <div class="text-2xl sm:text-4xl mb-1 sm:mb-2">🏆</div>
          <h3 class="text-sm sm:text-lg font-bold text-white mb-1">TRÒ CHƠI KẾT THÚC</h3>
          <p class="text-xs sm:text-sm text-primary-100 font-medium">Người thắng: ${state.players.find(p=>p.id===state.winner)?.name}</p>
        </div>
      ` : ''}
    </div>

    <!-- Log -->
    <div class="mt-auto h-20 sm:h-32 overflow-y-auto bg-white/80 rounded-xl p-2 sm:p-3 border-2 border-gray-200 text-[9px] sm:text-xs space-y-1.5 shadow-inner">
      ${state.log.map(msg => `<div class="text-gray-700 font-medium">${msg}</div>`).join('')}
    </div>
  `;

  // Draw board cells
  let cellsHtml = '';
  for (let i = 0; i < 40; i++) {
    const space = MONOPOLY_BOARD[i];
    const pos = getGridPos(i);
    const owner = state.properties[i];
    const ownerColor = owner !== undefined ? state.players.find(p=>p.id===owner)?.color : null;
    
    // Players on this space
    const playersHere = state.players.filter(p => !p.bankrupt && p.pos === i);
    const piecesHtml = playersHere.map(p => `<span class="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full shadow-md z-10" style="background:${p.color}; border: 1.5px solid white;"></span>`).join('');

    let headerHtml = '';
    if (space.color) {
      headerHtml = `<div class="w-full h-2.5 sm:h-4 shrink-0 border-b border-black/20" style="background:${space.color}"></div>`;
    } else if (space.type === 'railroad') {
      headerHtml = `<div class="text-[10px] sm:text-sm w-full text-center shrink-0 pt-0.5 sm:pt-1">🚌</div>`;
    } else if (space.type === 'chance' || space.type === 'chest') {
      headerHtml = `<div class="text-[10px] sm:text-sm w-full text-center shrink-0 pt-0.5 sm:pt-1 text-red-600">❓</div>`;
    }

    let transform = '';
    let isCorner = (i % 10 === 0);
    if (!isCorner) {
      if (i > 10 && i < 20) transform = 'rotate(90deg)';
      else if (i > 20 && i < 30) transform = 'rotate(180deg)';
      else if (i > 30 && i < 40) transform = 'rotate(-90deg)';
    }

    cellsHtml += `
      <div class="bg-white relative border-[0.5px] border-black/20 flex items-center justify-center overflow-hidden" style="grid-column: ${pos.col}; grid-row: ${pos.row};">
        ${ownerColor ? `<div class="absolute inset-0 opacity-30 z-0 pointer-events-none" style="background:${ownerColor}"></div>` : ''}
        
        <!-- Rotated Content -->
        <div class="absolute inset-0 flex flex-col items-center origin-center z-10" style="transform: ${transform};">
          ${headerHtml}
          <div class="flex-1 flex flex-col items-center ${isCorner ? 'justify-center p-1 sm:p-2' : 'justify-start pt-0.5 sm:pt-1'} text-center w-full">
             <span class="text-[5px] sm:text-[8px] md:text-[10px] font-bold text-black leading-tight block w-full px-0.5" style="${isCorner ? 'font-size: clamp(8px, 1.5vw, 14px)' : ''}">${space.name}</span>
             ${space.price && !isCorner ? `<span class="text-[5px] sm:text-[7px] md:text-[9px] text-gray-700 mt-0.5 font-bold font-mono">$${space.price}</span>` : ''}
          </div>
        </div>

        <!-- Pieces Container (not rotated) -->
        <div class="absolute inset-0 p-0.5 flex justify-center items-end flex-wrap content-end gap-0.5 pointer-events-none z-20">
          ${piecesHtml}
        </div>
      </div>
    `;
  }

  return `
    <div class="max-w-7xl mx-auto p-1 sm:p-2 pb-24">
      <div class="fade-in flex items-center justify-between mb-2">
        <h2 class="text-lg sm:text-xl font-bold text-surface-100">Cờ Tỉ Phú</h2>
        <div class="flex gap-2">
          ${state.winner !== null ? `<button id="btn-mnp-rematch" class="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-primary-600 text-white rounded-xl shadow-lg">Chơi lại</button>` : ''}
          <button id="btn-mnp-exit" class="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-surface-400 bg-white/5 hover:bg-white/10 rounded-xl">Thoát</button>
        </div>
      </div>

      <div class="relative mx-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-[#cde6d0] border-[8px] sm:border-[12px] border-[#222]" style="width: min(100vw - 16px, 100vh - 140px, 900px); height: min(100vw - 16px, 100vh - 140px, 900px);">
        <div class="w-full h-full relative grid" style="grid-template-columns: 1.5fr repeat(9, 1fr) 1.5fr; grid-template-rows: 1.5fr repeat(9, 1fr) 1.5fr;">
          ${cellsHtml}
          
          <!-- Center Area -->
          <div style="grid-column: 2 / 11; grid-row: 2 / 11; display: flex; flex-direction: column;" class="p-3 sm:p-6">
            ${centerHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initMonopolyEvents(allWords, rerenderFn) {
  localRerender = rerenderFn;
  if (state.phase === 'setup') {
    document.querySelectorAll('[data-mnp-win]').forEach(btn => btn.addEventListener('click', () => {
      state.winCondition = parseInt(btn.dataset.mnpWin);
      rerenderFn();
    }));

    document.getElementById('btn-mnp-start')?.addEventListener('click', () => {
      initGame();
      if (state.numPlayers < 2) {
        alert('Cần ít nhất 2 người chơi!');
        return;
      }
      state.phase = 'playing';
      rerenderFn();
      if (state.players[state.turn].type === 'ai') {
        setTimeout(() => { rollDice(); if(localRerender) localRerender(); }, 1000);
      }
    });
    return;
  }

  // Bind game events
  document.getElementById('btn-mnp-roll')?.addEventListener('click', () => { rollDice(); rerenderFn(); });
  document.getElementById('btn-mnp-next')?.addEventListener('click', () => { nextTurn(); rerenderFn(); });
  document.getElementById('btn-mnp-buy-yes')?.addEventListener('click', () => { buyProperty(true); rerenderFn(); });
  document.getElementById('btn-mnp-buy-no')?.addEventListener('click', () => { buyProperty(false); rerenderFn(); });

  document.getElementById('btn-mnp-rematch')?.addEventListener('click', () => { initGame(); state.phase='playing'; rerenderFn(); });
  document.getElementById('btn-mnp-exit')?.addEventListener('click', () => { state.phase = 'setup'; rerenderFn(); });
}
