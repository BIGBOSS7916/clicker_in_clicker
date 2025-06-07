// Dog House Slot Machine — main.js
// Масштабная логика для веб-слота с поддержкой всех правил и красивым UI

// --- КОНСТАНТЫ ---
const EMOJIS = [
    '🐶', '🤡', '😈', '👹', '👽', '🤖', '💀', '👻', '🤬', '😎', '🍔'
];
const WILD_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Индексы для WILD (можно расширить)
const BONUS_INDEX = 0; // Индекс для BONUS (будет отдельный символ)
const WILD_EMOJI = '🐶'; // WILD символ
const BONUS_EMOJI = '🍔'; // BONUS символ
const REELS = 5;
const ROWS = 3;
const PAYLINES = [
    // 20 линий выплат (каждая — массив из 5 позиций: row для каждого reel)
    [0,0,0,0,0], [1,1,1,1,1], [2,2,2,2,2],
    [0,1,2,1,0], [2,1,0,1,2], [0,0,1,0,0], [2,2,1,2,2],
    [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
    [2,1,1,1,2], [1,0,1,2,1], [1,2,1,0,1], [0,1,2,2,2],
    [2,1,0,0,0], [0,0,0,1,2], [2,2,2,1,0], [0,2,0,2,0],
    [2,0,2,0,2], [1,1,0,1,1]
];
const PAYTABLE = [
    // 5, 4, 3 символа подряд (x ставка)
    [37.5, 7.5, 2.5], // 👹
    [25.0, 5.0, 1.75], // 😈
    [15.0, 3.0, 1.25], // 💀
    [10.0, 2.0, 1.0], // 🤖
    [7.5, 1.25, 0.6], // 🐷 (заменено на 🤬)
    [5.0, 1.0, 0.4], // 🦋 (заменено на 👻)
    [2.5, 0.5, 0.25], // 🦍 (заменено на 🤡)
    [2.5, 0.5, 0.25], // 🐯 (заменено на 👽)
    [1.25, 0.25, 0.1], // 🍔 (заменено на 😎)
    [1.25, 0.25, 0.1], // 🍓 (заменено на 🍔)
    [1.25, 0.25, 0.1], // 🍭 (заменено на 🤡)
];
const START_BALANCE = 1_000_000_000;
const MIN_BET = 1_000_000;
const MAX_BET = 100_000_000;
const BET_STEP = 1_000_000;
const AUTOSPIN_LIMIT = 100;
const BONUS_BUY_MULTIPLIER = 100; // x100 от ставки
const BONUS_WIN_MULTIPLIER = 5; // x5 за 3 BONUS
const FREE_SPINS_MIN = 7;
const FREE_SPINS_MAX = 15;

// --- СОСТОЯНИЕ ИГРЫ ---
let state = {
    balance: START_BALANCE,
    bet: MIN_BET,
    reels: [], // 5x3
    history: [],
    autospin: false,
    autospinCount: 0,
    freeSpins: 0,
    inBonus: false,
    stickyWilds: [],
    win: 0,
    lastWinLines: [],
    bonusActive: false,
};

// --- ЭЛЕМЕНТЫ DOM ---
const balanceEl = document.getElementById('balance');
const betAmountEl = document.getElementById('bet-amount');
const reelsEl = document.getElementById('reels');
const spinBtn = document.getElementById('spin-btn');
const autospinBtn = document.getElementById('autospin-btn');
const maxbetBtn = document.getElementById('maxbet-btn');
const buybonusBtn = document.getElementById('buybonus-btn');
const betMinusBtn = document.getElementById('bet-minus');
const betPlusBtn = document.getElementById('bet-plus');
const winMessageEl = document.getElementById('win-message');
const notificationEl = document.getElementById('notification');
const rulesBtn = document.getElementById('rules-btn');
const historyBtn = document.getElementById('history-btn');
const sidebar = document.getElementById('sidebar');
const sidebarContent = document.getElementById('sidebar-content');
const closeSidebarBtn = document.getElementById('close-sidebar');
const showPaylinesBtn = document.getElementById('show-paylines');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const closeModalBtn = document.getElementById('close-modal');

// --- УТИЛИТЫ ---
function formatNumber(num) {
    return num.toLocaleString('ru-RU').replace(/\s/g, '.').replace(/,/g, '.');
}
function showNotification(msg, timeout = 2500) {
    notificationEl.textContent = msg;
    notificationEl.classList.add('show');
    setTimeout(() => notificationEl.classList.remove('show'), timeout);
}
function showModal(html) {
    modalContent.innerHTML = html;
    modal.classList.add('open');
}
function closeModal() {
    modal.classList.remove('open');
}
function openSidebar(html) {
    sidebarContent.innerHTML = html;
    sidebar.classList.add('open');
}
function closeSidebar() {
    sidebar.classList.remove('open');
}

// --- ОТРИСОВКА ---
function renderBalance() {
    balanceEl.textContent = formatNumber(state.balance);
}
function renderBet() {
    betAmountEl.textContent = formatNumber(state.bet);
}
function renderReels() {
    reelsEl.innerHTML = '';
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < REELS; col++) {
            const symbol = state.reels[col][row];
            let cellClass = 'reel-cell';
            if (symbol.type === 'wild') cellClass += ' wild';
            if (symbol.type === 'bonus') cellClass += ' bonus';
            if (symbol.win) cellClass += ' win';
            reelsEl.innerHTML += `<div class="${cellClass}" data-col="${col}" data-row="${row}">${symbol.emoji}</div>`;
        }
    }
}
function renderWinMessage(win, lines) {
    if (win > 0) {
        winMessageEl.textContent = `Выигрыш: +${formatNumber(win)}`;
        winMessageEl.style.color = 'var(--win)';
    } else {
        winMessageEl.textContent = '';
    }
}

// --- ГЕНЕРАЦИЯ СЛОТОВ ---
function getRandomSymbol(col, row, inBonus = false) {
    // WILD только на 2,3,4 барабанах
    if (inBonus && state.stickyWilds.some(w => w.col === col && w.row === row)) {
        return { emoji: WILD_EMOJI, type: 'wild', multiplier: 1 };
    }
    if (col >= 1 && col <= 3 && Math.random() < 0.12) {
        // 12% шанс WILD
        const multiplier = Math.random() < 0.5 ? 2 : 3;
        return { emoji: WILD_EMOJI, type: 'wild', multiplier };
    }
    // BONUS только на 1,3,5 барабанах
    if (!inBonus && (col === 0 || col === 2 || col === 4) && Math.random() < 0.08) {
        return { emoji: BONUS_EMOJI, type: 'bonus' };
    }
    // Обычные символы
    const idx = Math.floor(Math.random() * EMOJIS.length);
    return { emoji: EMOJIS[idx], type: 'normal', index: idx };
}
function spinReels(inBonus = false) {
    let reels = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) {
            reel.push(getRandomSymbol(col, row, inBonus));
        }
        reels.push(reel);
    }
    return reels;
}

// --- ВЫПЛАТЫ И ВЫИГРЫШНЫЕ ЛИНИИ ---
function checkPaylines(reels, bet) {
    let totalWin = 0;
    let winLines = [];
    let winCells = Array.from({length: REELS}, () => Array(ROWS).fill(false));
    for (let i = 0; i < PAYLINES.length; i++) {
        const line = PAYLINES[i];
        let symbols = [];
        let wilds = [];
        for (let col = 0; col < REELS; col++) {
            const row = line[col];
            const symbol = reels[col][row];
            symbols.push(symbol);
            if (symbol.type === 'wild') wilds.push(col);
        }
        // Определяем основной символ (не wild/bonus)
        let mainSymbol = symbols.find(s => s.type === 'normal');
        if (!mainSymbol) continue;
        let count = 0;
        let wildMultiplier = 1;
        for (let col = 0; col < REELS; col++) {
            const symbol = symbols[col];
            if (symbol.type === 'normal' && symbol.emoji === mainSymbol.emoji) {
                count++;
            } else if (symbol.type === 'wild') {
                count++;
                wildMultiplier *= symbol.multiplier || 1;
            } else {
                break;
            }
        }
        if (count >= 3) {
            // Найти индекс символа в EMOJIS
            let idx = EMOJIS.indexOf(mainSymbol.emoji);
            if (idx === -1) continue;
            let pay = PAYTABLE[idx][count-3] * bet * wildMultiplier;
            totalWin += pay;
            winLines.push({ line: i+1, symbol: mainSymbol.emoji, count, pay });
            // Отметить выигрышные ячейки
            for (let col = 0; col < count; col++) {
                winCells[col][line[col]] = true;
            }
        }
    }
    // Пометить выигрышные ячейки
    for (let col = 0; col < REELS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (winCells[col][row]) reels[col][row].win = true;
        }
    }
    return { totalWin, winLines };
}

// --- БОНУСЫ И ФРИСПИНЫ ---
function checkBonus(reels) {
    // 3 BONUS на 1,3,5 барабанах
    let bonusCols = [0,2,4];
    let bonusCount = 0;
    for (let col of bonusCols) {
        for (let row = 0; row < ROWS; row++) {
            if (reels[col][row].type === 'bonus') bonusCount++;
        }
    }
    return bonusCount >= 3;
}
function startBonus() {
    state.inBonus = true;
    state.bonusActive = true;
    state.freeSpins = Math.floor(Math.random() * (FREE_SPINS_MAX - FREE_SPINS_MIN + 1)) + FREE_SPINS_MIN;
    state.stickyWilds = [];
    showModal(`<h2>БОНУСКА!</h2><p>Вам начислено <b>${state.freeSpins}</b> бесплатных спинов!</p>`);
    setTimeout(closeModal, 2000);
    setTimeout(spinBonus, 2200);
}
function spinBonus() {
    if (state.freeSpins <= 0) {
        state.inBonus = false;
        state.bonusActive = false;
        state.stickyWilds = [];
        showModal(`<h2>БОНУСКА завершена!</h2><p>Ваш выигрыш: <b>${formatNumber(state.win)}</b></p>`);
        setTimeout(closeModal, 2500);
        return;
    }
    // Генерируем слоты с учетом sticky wilds
    let reels = [];
    for (let col = 0; col < REELS; col++) {
        let reel = [];
        for (let row = 0; row < ROWS; row++) {
            // Если sticky wild — всегда wild
            if (state.stickyWilds.some(w => w.col === col && w.row === row)) {
                reel.push({ emoji: WILD_EMOJI, type: 'wild', multiplier: 2 });
            } else if (col >= 1 && col <= 3 && Math.random() < 0.18) {
                // 18% шанс нового sticky wild
                state.stickyWilds.push({ col, row });
                reel.push({ emoji: WILD_EMOJI, type: 'wild', multiplier: 2 });
            } else {
                // Обычный символ
                const idx = Math.floor(Math.random() * EMOJIS.length);
                reel.push({ emoji: EMOJIS[idx], type: 'normal', index: idx });
            }
        }
        reels.push(reel);
    }
    state.reels = reels;
    // Проверяем выигрышные линии
    let { totalWin, winLines } = checkPaylines(reels, state.bet);
    state.balance += totalWin;
    state.win += totalWin;
    state.lastWinLines = winLines;
    renderAll();
    renderWinMessage(totalWin, winLines);
    state.freeSpins--;
    setTimeout(spinBonus, 1800);
}

// --- ОСНОВНОЙ СПИН ---
function spin() {
    if (state.inBonus || state.bonusActive) return;
    if (state.balance < state.bet) {
        showNotification('Недостаточно средств!');
        return;
    }
    state.balance -= state.bet;
    state.reels = spinReels();
    // Проверяем бонус
    if (checkBonus(state.reels)) {
        // x5 от ставки + бонус
        let win = state.bet * BONUS_WIN_MULTIPLIER;
        state.balance += win;
        state.win = win;
        renderAll();
        renderWinMessage(win, []);
        setTimeout(startBonus, 1800);
        return;
    }
    // Проверяем выигрышные линии
    let { totalWin, winLines } = checkPaylines(state.reels, state.bet);
    state.balance += totalWin;
    state.win = totalWin;
    state.lastWinLines = winLines;
    // Добавляем в историю
    state.history.unshift({
        time: new Date().toLocaleTimeString(),
        bet: state.bet,
        win: totalWin,
        lines: winLines
    });
    if (state.history.length > 50) state.history.pop();
    renderAll();
    renderWinMessage(totalWin, winLines);
    if (state.autospin && state.autospinCount > 0) {
        state.autospinCount--;
        setTimeout(spin, 1200);
    } else {
        state.autospin = false;
    }
}

// --- КНОПКИ И СОБЫТИЯ ---
spinBtn.onclick = () => spin();
autospinBtn.onclick = () => {
    if (state.inBonus || state.bonusActive) return;
    state.autospin = true;
    state.autospinCount = AUTOSPIN_LIMIT;
    spin();
};
maxbetBtn.onclick = () => {
    state.bet = Math.min(state.balance, MAX_BET);
    renderBet();
};
buybonusBtn.onclick = () => {
    if (state.inBonus || state.bonusActive) return;
    let price = state.bet * BONUS_BUY_MULTIPLIER;
    if (state.balance < price) {
        showNotification('Недостаточно средств для покупки бонуса!');
        return;
    }
    state.balance -= price;
    state.win = 0;
    renderAll();
    setTimeout(startBonus, 800);
};
betMinusBtn.onclick = () => {
    state.bet = Math.max(MIN_BET, state.bet - BET_STEP);
    renderBet();
};
betPlusBtn.onclick = () => {
    state.bet = Math.min(MAX_BET, state.bet + BET_STEP, state.balance);
    renderBet();
};
rulesBtn.onclick = () => {
    openSidebar(renderRules());
};
historyBtn.onclick = () => {
    openSidebar(renderHistory());
};
showPaylinesBtn.onclick = () => {
    openSidebar(renderPaylines());
};
closeSidebarBtn.onclick = closeSidebar;
closeModalBtn.onclick = closeModal;

// --- РЕНДЕР ПРАВИЛ, ЛИНИЙ, ИСТОРИИ ---
function renderRules() {
    return `
    <h2>Правила игры</h2>
    <ul style="font-size:1.1rem;line-height:1.6;">
        <li>Символы: ${EMOJIS.join(' ')}, WILD: ${WILD_EMOJI}, BONUS: ${BONUS_EMOJI}</li>
        <li>WILD заменяет все символы кроме BONUS, только на барабанах 2,3,4</li>
        <li>WILD может иметь множители x2/x3, применяется к выигрышу на линии</li>
        <li>Множители WILD на линии суммируются</li>
        <li>BONUS появляется только на барабанах 1,3,5</li>
        <li>3 BONUS = x5 от ставки + запуск бонуски (фриспины)</li>
        <li>Во время бонуски WILD остаются на месте до конца бонуски</li>
        <li>Во время бонуски символы BONUS не выпадают</li>
        <li>Выплаты по линиям — только слева направо, начиная с крайнего левого барабана</li>
        <li>Максимум 20 линий выплат</li>
    </ul>
    <h3>Таблица выплат</h3>
    <table style="width:100%;font-size:1.1rem;text-align:center;">
        <tr><th>Символ</th><th>5</th><th>4</th><th>3</th></tr>
        ${EMOJIS.map((e,i)=>`<tr><td>${e}</td><td>x${PAYTABLE[i][0]}</td><td>x${PAYTABLE[i][1]}</td><td>x${PAYTABLE[i][2]}</td></tr>`).join('')}
    </table>
    `;
}
function renderPaylines() {
    return `
    <h2>Линии выплат</h2>
    <div style="display:grid;grid-template-columns:repeat(5,32px);gap:2px;margin:12px 0;">
        ${Array(15).fill(0).map((_,i)=>`<div style="width:32px;height:32px;background:#444;border-radius:6px;"></div>`).join('')}
    </div>
    <ol style="font-size:1.1rem;line-height:1.5;">
        ${PAYLINES.map((line,i)=>`<li>Линия ${i+1}: ${line.join('-')}</li>`).join('')}
    </ol>
    `;
}
function renderHistory() {
    return `
    <h2>История игр</h2>
    <table style="width:100%;font-size:1.1rem;text-align:center;">
        <tr><th>Время</th><th>Ставка</th><th>Выигрыш</th><th>Линии</th></tr>
        ${state.history.map(h=>`<tr><td>${h.time}</td><td>${formatNumber(h.bet)}</td><td style="color:${h.win>0?'#00e676':'#fff'};font-weight:700;">${formatNumber(h.win)}</td><td>${h.lines.map(l=>l.line).join(', ')}</td></tr>`).join('')}
    </table>
    `;
}

// --- ИНИЦИАЛИЗАЦИЯ ---
function renderAll() {
    renderBalance();
    renderBet();
    renderReels();
}
function init() {
    state.reels = spinReels();
    renderAll();
}

init(); 
