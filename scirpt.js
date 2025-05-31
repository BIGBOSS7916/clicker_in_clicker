const symbols = ["🐶", "🤡", "😈", "👹", "👽", "🤖", "💀", "👻", "🤬", "😎", "🍔", "💰", "⭐"];
const WILD = "💰";
const BONUS = "⭐";

let balance = 1000000000;
let bet = 100000;
let freeSpins = 0;
let spinning = false;

// Определение 20 линий выплат
const paylines = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 0, 0],
  [2, 2, 1, 2, 2],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2],
  [1, 0, 2, 0, 1],
  [1, 2, 0, 2, 1],
  [0, 2, 2, 2, 0]
];

const reelsContainer = document.getElementById('reels-container');
const balanceContainer = document.getElementById('balance');
const freeSpinsContainer = document.getElementById('free-spins');
const betInput = document.getElementById('bet');
const spinButton = document.getElementById('spin-btn');

// Инициализация барабанов
let reels = [];

function createReels() {
  for (let i = 0; i < 5; i++) {
    const reel = document.createElement('div');
    reel.classList.add('reel');
    reelsContainer.appendChild(reel);
    reels.push(reel);
  }
}

function updateUI() {
  balanceContainer.textContent = balance.toLocaleString('ru-RU');
  freeSpinsContainer.textContent = freeSpins;
  betInput.value = bet;
}

function getRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function generateReelSymbols() {
  const reelSymbols = [];
  for (let i = 0; i < 3; i++) {
    reelSymbols.push(getRandomSymbol());
  }
  return reelSymbols;
}

function displayReels(reelsSymbols) {
  for (let i = 0; i < reels.length; i++) {
    reels[i].innerHTML = '';
    for (let j = 0; j < 3; j++) {
      const symbolDiv = document.createElement('div');
      symbolDiv.classList.add('symbol');
      symbolDiv.textContent = reelsSymbols[i][j];
      reels[i].appendChild(symbolDiv);
    }
  }
}

function spin() {
  if (spinning) return;
  if (balance < bet && freeSpins <= 0) {
    alert('Недостаточно баланса!');
    return;
  }

  spinning = true;
  spinButton.disabled = true;

  if (freeSpins > 0) {
    freeSpins--;
  } else {
    balance -= bet;
  }

  const reelsSymbols = [];
  for (let i = 0; i < 5; i++) {
    reelsSymbols.push(generateReelSymbols());
  }

  displayReels(reelsSymbols);

  const win = calculateWin(reelsSymbols);
  balance += win;

  updateUI();
  spinning = false;
  spinButton.disabled = false;

  if (win > 0) {
    alert(`Вы выиграли ${win.toLocaleString('ru-RU')} 💰`);
  }
}

function calculateWin(reelsSymbols) {
  let totalWin = 0;
  let bonusCount = 0;

  // Подсчёт бонусных символов
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) {
      if (reelsSymbols[i][j] === BONUS) {
        bonusCount++;
      }
    }
  }

  if (bonusCount >= 3) {
    const freeSpinsAwarded = 5 + Math.floor(Math.random() * 6); // 5-10 спинов
    freeSpins += freeSpinsAwarded;
    alert(`БОНУС! Получено ${freeSpinsAwarded} бесплатных спинов!`);
  }

  // Проверка каждой линии
  for (const line of paylines) {
    const lineSymbols = [];
    for (let i = 0; i < 5; i++) {
      lineSymbols.push(reelsSymbols[i][line[i]]);
    }

    let matchSymbol = null;
    let matchCount = 0;
    let multiplier = 1;

    for (let i = 0; i < lineSymbols.length; i++) {
      const symbol = lineSymbols[i];
      if (symbol === WILD) {
        multiplier *= 2;
        matchCount++;
      } else if (matchSymbol === null) {
        matchSymbol = symbol;
        matchCount++;
      } else if (symbol === matchSymbol) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const winAmount = bet * matchCount * multiplier;
      totalWin += winAmount;
    }
  }

  return totalWin;
}

spinButton.addEventListener('click', spin);

createReels();
updateUI();
