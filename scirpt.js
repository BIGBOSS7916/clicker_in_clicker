const balanceEl = document.getElementById("balance");
const reels = [...document.querySelectorAll(".reel")];
const spinBtn = document.getElementById("spinBtn");
const messageEl = document.getElementById("message");

let balance = 1000;
const bet = 100;

const symbols = ["🐶", "🦴", "🐾", "🐕", "💎", "7️⃣", "WILD", "BONUS"];

// Упрощённый пример линий (20 линий = массив индексов)
const lines = [
  [0, 0, 0, 0, 0], // Верхняя
  [1, 1, 1, 1, 1], // Средняя
  [2, 2, 2, 2, 2], // Нижняя
  [0, 1, 2, 1, 0], // Диагональ
  [2, 1, 0, 1, 2],
  // ... и т.д. (добавь до 20 линий!)
];

spinBtn.addEventListener("click", spin);

function spin() {
  if (balance < bet) {
    messageEl.textContent = "Недостаточно средств!";
    return;
  }
  balance -= bet;
  updateBalance();
  messageEl.textContent = "Крутим...";

  let finalSymbols = [];

  // Анимация: смена символов
  let spins = 15;
  let count = 0;
  const interval = setInterval(() => {
    reels.forEach(reel => {
      reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    });
    count++;
    if (count >= spins) {
      clearInterval(interval);
      // После анимации — итоговые символы
      finalSymbols = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
      for (let i = 0; i < reels.length; i++) {
        reels[i].textContent = finalSymbols[i];
      }
      checkWin(finalSymbols);
    }
  }, 100);
}

function checkWin(finalSymbols) {
  // Пока что для примера: совпадение всех символов
  if (new Set(finalSymbols).size === 1) {
    const win = bet * 10;
    balance += win;
    messageEl.textContent = 🎉 Джекпот! +${win}💰;
  } else {
    messageEl.textContent = "❌ Не повезло!";
  }
  updateBalance();
}

function updateBalance() {
  balanceEl.textContent = balance;
}
