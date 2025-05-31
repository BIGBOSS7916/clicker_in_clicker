// Символы и конфигурации
const SYMBOLS = ['🐶','🤡','😈','👹','👽','🤖','💀','👻','🤬','😎','🍔'];
const WILD_SYMBOLS = ['🥈','🥉'];
const BONUS_SYMBOL = '💰';

// 20 линий выплат (каждая — массив индексов строк для колонок 0..4)
const FULL_WIN_LINES = [
  [0,0,0,0,0],
  [1,1,1,1,1],
  [2,2,2,2,2],
  [0,1,0,1,0],
  [2,1,2,1,2],
  [0,0,1,0,0],
  [2,2,1,2,2],
  [1,0,1,2,1],
  [1,2,1,0,1],
  [0,1,1,1,0],
  [2,1,1,1,2],
  [1,1,0,1,1],
  [1,1,2,1,1],
  [0,2,0,2,0],
  [2,0,2,0,2],
  [1,0,0,0,1],
  [1,2,2,2,1],
  [0,1,2,2,2],
  [2,1,0,0,0],
  [1,1,1,0,2]
];

// Множители для символов
const PAYOUTS = {
  '🐶': {3: 2.5, 4: 7.5, 5: 37.55},
  '🤡': {3: 1.75, 4: 5.0, 5: 25.05},
  '😈': {3: 1.25, 4: 3.0, 5: 15.0},
  '👹': {3: 1.0, 4: 2.0, 5: 10.0},
  '👽': {3: 0.6, 4: 1.25, 5: 7.5},
  '🤖': {3: 0.4, 4: 1.0, 5: 5.0},
  '💀': {3: 0.25, 4: 0.5, 5: 2.5},
  '👻': {3: 0.25, 4: 0.5, 5: 2.5},
  '🤬': {3: 0.1, 4: 0.25, 5: 1.25},
  '😎': {3: 0.1, 4: 0.25, 5: 1.25},
  '🍔': {3: 0.1, 4: 0.25, 5: 1.25},
  'BONUS': {3: 5} // бонус при 3 и более
};

let balance = 1_000_000_000;
let bet = 1000;
let freeSpins = 0;
let spinning = false;

// UI элементы
const balanceElem = document.getElementById('balance-value');
const betInput = document.getElementById('bet-input');
const spinButton = document.getElementById('spin-button');
const reelsContainer = document.getElementById('reels-container');
const freeSpinsElem = document.getElementById('free-spins');
const freeSpinsContainer = document.getElementById('free-spins-container');
const winMessage = document.getElementById('win-message');

let reels = new Array(5).fill(0).map(() => new Array(3).fill(''));

// Форматируем число с точками
function formatNumberWithDots(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Отобразить баланс и другие данные
function updateUI() {
  balanceElem.textContent = formatNumberWithDots(balance) + '$';
  betInput.value = bet;
  if (freeSpins > 0) {
    freeSpinsContainer.style.display = 'block';
    freeSpinsElem.textContent = freeSpins;
  } else {
    freeSpinsContainer.style.display = 'none';
  }
  renderReels();
  winMessage.textContent = '';
}

// Отрисовка барабанов
function renderReels() {
  reelsContainer.innerHTML = '';
  for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 5; col++) {
      const symbol = reels[col][row] || SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
      const div = document.createElement('div');
      div.classList.add('symbol');
      div.textContent = symbol;
      reelsContainer.appendChild(div);
    }
  }
}

// Генерация символов для спина
function generateSpinResult() {
  const result = [];
  for(let col=0; col<5; col++) {
    const colSymbols = [];
    for(let row=0; row<3; row++) {
      // Случайно вкинуть BONUS и WILD по правилам
      if (col === 0 || col === 2 || col === 4) {
        // бонус только на барабанах 1,3,5
        if (Math.random() < 0.07) {
          colSymbols.push(BONUS_SYMBOL);
          continue;
        }
      }
      if (col === 1 || col === 2 || col === 3) {
        // WILD на барабанах 2,3,4 с множителем 50% шанс x2, 50% x3
        if (Math.random() < 0.1) {
          let wildSymbol = WILD_SYMBOLS[Math.floor(Math.random()*WILD_SYMBOLS.length)];
          // Добавляем множитель — например просто цифра рядом для примера (в реале визуально)
          colSymbols.push(wildSymbol); 
          continue;
        }
      }
      colSymbols.push(SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]);
    }
    result.push(colSymbols);
  }
  return result;
}

// Анимация кручения (плавная смена символов снизу вверх)
async function animateSpin() {
  const frames = 15;
  const delay = 50;
  for (let f = 0; f < frames; f++) {
    for(let col = 0; col < 5; col++) {
      for(let row = 0; row < 3; row++) {
        reels[col][row] = SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)];
      }
    }
    renderReels();
    await new Promise(r => setTimeout(r, delay));
  }
  // После анимации ставим итоговый результат
  reels = generateSpinResult();
  renderReels();
}

// Проверка выигрышей на линиях с учетом WILD и множителей
function calculateWin() {
  let totalWin = 0;
  let bonusCount = 0;
  // Подсчёт бонусов на поле
  for(let col=0; col<5; col++) {
    for(let row=0; row<3; row++) {
      if(reels[col][row] === BONUS_SYMBOL) bonusCount++;
    }
  }

  // Если 3 и более бонуса — прибавляем х5 ставки + запускаем бонусный раунд
  if (bonusCount >= 3) {
    totalWin += bet * 5;
    freeSpins += Math.floor(Math.random() * 5) + 5; // 5-9 бесплатных спинов
  }

  // Вычисление выигрыша по линиям
  FULL_WIN_LINES.forEach(line => {
    let lineSymbols = [];
    for(let col=0; col<5; col++) {
      lineSymbols.push(reels[col][line[col]]);
    }

    // Ищем выигрышную последовательность слева направо
    let firstSymbol = null;
    let count = 0;
    let wildMultiplier = 0;
    let winSymbol = null;

    for(let i=0; i<lineSymbols.length; i++) {
      let sym = lineSymbols[i];
      if(i === 0) {
        if(sym === BONUS_SYMBOL) break; // бонусы не считаются на линиях
        firstSymbol = (WILD_SYMBOLS.includes(sym)) ? null : sym;
        winSymbol = (WILD_SYMBOLS.includes(sym)) ? null : sym;
        if(WILD_SYMBOLS.includes(sym)) wildMultiplier += (sym === '🥈') ? 2 : 3;
        count++;
        continue;
      }

      if(sym === firstSymbol || (WILD_SYMBOLS.includes(sym) || (firstSymbol === null && !WILD_SYMBOLS.includes(sym)))) {
        if(WILD_SYMBOLS.includes(sym)) {
          wildMultiplier += (sym === '🥈') ? 2 : 3;
          if(winSymbol === null) winSymbol = firstSymbol || sym;
        } else {
          if(winSymbol === null) winSymbol = sym;
        }
        count++;
      } else {
        break;
      }
    }

    if(count >= 3 && winSymbol && PAYOUTS[winSymbol]) {
      let basePayout = PAYOUTS[winSymbol][count] || 0;
      if(wildMultiplier === 0) wildMultiplier = 1;
      totalWin += bet * basePayout * wildMultiplier;
    }
  });

  return Math.floor(totalWin);
}

// Кнопка СПИН
async function onSpinClick() {
  if (spinning) return;
  if (bet > balance && freeSpins <= 0) {
    alert('Недостаточно средств для ставки!');
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  winMessage.textContent = '';

  if (freeSpins > 0) {
    freeSpins--;
  } else {
    balance -= bet;
  }
  updateUI();

  await animateSpin();

  const win = calculateWin();

  if(win > 0) {
    balance += win;
    winMessage.textContent = `Вы выиграли ${formatNumberWithDots(win)}$! 🎉`;
  } else {
    winMessage.textContent = 'Удачи в следующий раз!';
  }

  updateUI();

  spinning = false;
  spinButton.disabled = false;
}

// Обработчики UI
spinButton.addEventListener('click', onSpinClick);
betInput.addEventListener('change', (e) => {
  let val = Number(e.target.value);
  if(val < 1) val = 1;
  if(val > balance) val = balance;
  bet = val;
  updateUI();
});

updateUI();
