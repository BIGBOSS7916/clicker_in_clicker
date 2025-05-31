// Конфиги символов и выплат (множители, WILD, BONUS)
const SYMBOLS = ['🐶','🤡','😈','👹','👽','🤖','💀','👻','🤬','😎','🍔'];
const WILD_SYMBOLS = ['🥈','🥉']; // упростим — они будут добавляться в барабаны 2,3,4 с мультипликаторами
const BONUS_SYMBOL = '💰';

// Выигрышные линии — массив индексов символов по строкам и колонкам (20 линий)
// Для 5 колонок и 3 строк, каждая линия — массив из 5 индексов по строкам (0..2)
// Пример: линия 0 — верхний ряд (0,0),(0,1),(0,2),(0,3),(0,4) — т.е. все строки 0
const WIN_LINES = [
  [0,0,0,0,0], // Верхняя линия
  [1,1,1,1,1], // Средняя линия
  [2,2,2,2,2], // Нижняя линия
  [0,1,2,1,0], // Зигзаг и т.д.
  [2,1,0,1,2],
  // ... Добавить остальные 15 линий, итого 20
];

// Для упрощения — добавим реальные 20 линий ниже (для примера)
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

// Множители выплат для разных символов и количества совпадений
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
  'BONUS': {3: 5} // при 3 бонусах ставка х5
};

let balance = 1_000_000_000;
let bet = 1000;
let freeSpins = 0;
let spinning = false;

// Элементы UI
const balanceElem = document.getElementById('balance-value');
const betInput = document.getElementById('bet-input');
const spinButton = document.getElementById('spin-button');
const reelsContainer = document.getElementById('reels-container');
const freeSpinsElem = document.getElementById('free-spins');
const freeSpinsContainer = document.getElementById('free-spins-container');
const winMessage = document.getElementById('win-message');

// Инициализация барабанов: 5 колонок * 3 строки
let reels = new Array(5).fill(0).map(() => new Array(3).fill(''));

// Формат баланса с точками
function formatNumberWithDots(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Обновление UI
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

// Рендер символов на экране
function renderReels() {
  reelsContainer.innerHTML = '';
  for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 5; col++) {
      const symbol = reels[col][row] || SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const div = document.createElement('div');
      div.className = 'symbol';
      div.textContent = symbol;
      reelsContainer.appendChild(div);
    }
  }
}

// Генерация случайного символа для барабана с учётом правил
function randomSymbolForReel(reelIndex) {
  // BONUS только на барабанах 1,3,5 (индексы 0,2,4)
  if ([0,2,4].includes(reelIndex)) {
    if (Math.random() < 0.05) return BONUS_SYMBOL; // 5% шанс бонуса
  }
  // WILD на барабанах 2,3,4 (индексы 1,2,3)
  if ([1,2,3].includes(reelIndex)) {
    if (Math.random() < 0.1) { // 10% шанс WILD
      // Выбираем случайный wild символ с множителем
      const wild = WILD_SYMBOLS[Math.floor(Math.random() * WILD_SYMBOLS.length)];
      return wild; 
    }
  }
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

// Заполняем reels новыми символами
function spinReels() {
  for(let col=0; col < 5; col++) {
    for(let row=0; row < 3; row++) {
      reels[col][row] = randomSymbolForReel(col);
    }
  }
}

// Подсчёт выигрыша с учётом линий, множителей и бонусов
function calculateWin() {
  let totalWin = 0;
  let bonusCount = 0;
  // Считаем бонусы
  for(let col=0; col < 5; col++) {
    for(let row=0; row < 3; row++) {
      if(reels[col][row] === BONUS_SYMBOL) bonusCount++;
    }
  }
  if (bonusCount >=3) {
    totalWin += bet * PAYOUTS['BONUS'][3];
    freeSpins += 10 + Math.floor(Math.random()*10); // 10-19 бесплатных спинов
  }

  // Подсчёт по линиям
  FULL_WIN_LINES.forEach(line => {
    // На линии — берем символы по индексам строк для каждой колонки
    let lineSymbols = [];
    for(let col=0; col<5; col++) {
      lineSymbols.push(reels[col][line[col]]);
    }
    // Логика подсчёта последовательных совпадений слева направо
    let firstSym = lineSymbols[0];
    if(firstSym === BONUS_SYMBOL) return; // бонус не считается для линии

    // Разрешаем замену WILD на символы для подсчёта
    let wildMultipliers = 0;
    let matchCount = 1;

    for(let i=1; i<5; i++) {
      let sym = lineSymbols[i];
      if(sym === firstSym || WILD_SYMBOLS.includes(sym)) {
        matchCount++;
        if(WILD_SYMBOLS.includes(sym)) wildMultipliers += 2; // упрощение: множитель х2
      } else break;
    }

    if(matchCount >=3) {
      // Основной множитель
      let payout = PAYOUTS[firstSym]?.[matchCount] || 0;
      if (payout > 0) {
        // Применяем множители WILD
        payout *= (1 + wildMultipliers);
        totalWin += bet * payout;
      }
    }
  });

  return totalWin;
}

// Анимация прокрутки — примитивная, для демонстрации
async function animateSpin() {
  const spinDuration = 1800; // 1.8 сек
  const interval = 150; // обновление каждые 150мс
  let elapsed = 0;

  while(elapsed < spinDuration) {
    spinReels();
    renderReels();
    await new Promise(r => setTimeout(r, interval));
    elapsed += interval;
  }
}

// Основная функция спина
async function onSpinClick() {
  if (spinning) return;
  if (bet > balance && freeSpins <= 0) {
    alert('Недостаточно баланса для ставки!');
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
  balance += win;

  if (win > 0) {
    winMessage.textContent = `Вы выиграли ${formatNumberWithDots(win)}$! 🎉`;
  }

  updateUI();

  spinning = false;
  spinButton.disabled = false;
}

// Обработчики
spinButton.addEventListener('click', onSpinClick);
betInput.addEventListener('change', (e) => {
  let val = Number(e.target.value);
  if (val < 1) val = 1;
  if (val > balance) val = balance;
  bet = val;
  updateUI();
});

// Инициализация
updateUI();
