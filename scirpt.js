const symbols = ["🐶", "🤡", "😈", "👹", "👽", "🤖", "💀", "👻", "🤬", "😎", "🍔", "🥈", "🥉", "💰"];
const symbolMultipliers = {
  "🐶": [0.60, 2.00, 7.50],
  "🤡": [0.40, 1.25, 5.00],
  "😈": [0.25, 1.00, 2.50],
  "👹": [0.25, 1.00, 2.50],
  "👽": [0.10, 0.25, 1.25],
  "🤖": [0.10, 0.25, 1.25],
  "💀": [0.10, 0.25, 1.25],
  "👻": [0.25, 0.50, 2.50],
  "🤬": [0.25, 0.50, 2.50],
  "😎": [0.25, 0.50, 2.50],
  "🍔": [0.25, 1.00, 2.50],
  "🥈": [0, 0, 0],
  "🥉": [0, 0, 0],
  "💰": [0, 0, 0]
};

const lines = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [0, 6, 12, 8, 4],
  [10, 6, 2, 8, 14],
  [0, 5, 10, 5, 0],
  [4, 9, 14, 9, 4],
  [0, 6, 12, 6, 0],
  [4, 8, 12, 8, 4],
  [2, 6, 10, 6, 2],
  [0, 1, 7, 3, 4],
  [10, 11, 7, 13, 14],
  [5, 6, 7, 8, 9],
  [0, 5, 7, 9, 4],
  [10, 5, 7, 9, 14],
  [2, 1, 7, 3, 2],
  [12, 11, 7, 13, 12],
  [5, 6, 2, 8, 9],
  [5, 1, 7, 3, 9],
  [0, 6, 7, 8, 4]
];

let balance = 1000000000;
let freeSpins = 0;
let spinning = false;

const reelsContainer = document.getElementById("reels");
const balanceAmount = document.getElementById("balance-amount");
const betInput = document.getElementById("bet");
const spinButton = document.getElementById("spin-button");
const message = document.getElementById("message");
const freeSpinsDisplay = document.getElementById("free-spins");

// Инициализация барабанов
function initReels() {
  reelsContainer.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const reel = document.createElement("div");
    reel.classList.add("reel");
    for (let j = 0; j < 3; j++) {
      const symbol = document.createElement("div");
      symbol.classList.add("symbol");
      symbol.textContent = randomSymbol();
      reel.appendChild(symbol);
    }
    reelsContainer.appendChild(reel);
  }
}
initReels();

// Получить случайный символ
function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

// Обновить баланс с точками
function updateBalance() {
  balanceAmount.textContent = balance.toLocaleString("ru-RU");
}

// Кручение барабанов
async function spin() {
  if (spinning) return;

  const bet = parseInt(betInput.value);
  if (bet > balance) {
    message.textContent = "Недостаточно средств!";
    return;
  }

  if (freeSpins === 0) {
    balance -= bet;
    updateBalance();
  }

  spinning = true;
  message.textContent = "";
  spinButton.disabled = true;

  const reels = document.querySelectorAll(".reel");
  for (let i = 0; i < 20; i++) {
    reels.forEach(reel => {
      const symbolsDivs = reel.querySelectorAll(".symbol");
      symbolsDivs.forEach(sym => {
        sym.style.transform = translateY(${Math.random() * 50}px);
        sym.textContent = randomSymbol();
      });
    });
    await delay(50);
  }

  // Последние символы (итог)
  reels.forEach(reel => {
    const symbolsDivs = reel.querySelectorAll(".symbol");
    symbolsDivs.forEach(sym => {
      sym.textContent = randomSymbol();
      sym.style.transform = "translateY(0)";
    });
  });

  checkWin(bet);
  spinning = false;
  spinButton.disabled = false;
}

// Проверка выигрыша
function checkWin(bet) {
  const finalSymbols = [];
  document.querySelectorAll(".reel").forEach(reel => {
    reel.querySelectorAll(".symbol").forEach(sym => {
      finalSymbols.push(sym.textContent);
    });
  });

  let totalWin = 0;
  let bonusCount = 0;

  lines.forEach(line => {
    const lineSymbols = line.map(idx => finalSymbols[idx]);
    let firstSym = lineSymbols[0];
    let count = 1;
    let wildMultiplier = 1;

    for (let i = 1; i < lineSymbols.length; i++) {
      const sym = lineSymbols[i];
      if (sym === firstSym || isWild(sym)) {
        if (isWild(sym)) wildMultiplier += sym === "🥈" ? 1 : 2;
        count++;
      } else {
        break;
      }
    }

    if (count >= 3 && symbolMultipliers[firstSym]) {
      const idx = count - 3;
      const win = bet * symbolMultipliers[firstSym][idx] * wildMultiplier;
      totalWin += win;
    }

    bonusCount += lineSymbols.filter(s => s === "💰").length;
  });

  if (bonusCount >= 3) {
    totalWin += bet * 5;
    freeSpins += Math.floor(Math.random() * 10) + 5;
    message.textContent = "🎉 Бонус игра! + бесплатные спины!";
  }

  if (freeSpins > 0) {
    freeSpins--;
    freeSpinsDisplay.textContent = Бесплатные спины: ${freeSpins};
  } else {
    freeSpinsDisplay.textContent = "";
  }

  if (totalWin > 0) {
    balance += totalWin;
    message.textContent = 🎉 Выигрыш: ${totalWin.toLocaleString("ru-RU")} $;
  } else if (bonusCount < 3) {
    message.textContent = "Неудача!";
  }

  updateBalance();
}

// WILD?
function isWild(sym) {
  return sym === "🥈" || sym === "🥉";
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

updateBalance();
spinButton.addEventListener("click", spin);
// Кнопка "Показать правила"
const rulesButton = document.getElementById("show-rules");
const rulesContainer = document.getElementById("rules-container");
let rulesVisible = false;

rulesButton.addEventListener("click", () => {
  rulesVisible = !rulesVisible;
  rulesContainer.style.display = rulesVisible ? "block" : "none";
});

// Правила (пример)
rulesContainer.innerHTML = `
  <h3>Правила игры</h3>
  <p>Все выплаты осуществляются при выпадении одинаковых символов слева направо по выигрышным линиям (20 линий).</p>
  <ul>
    <li>🥈 и 🥉 — это WILD символы, заменяют любые другие символы на линии.</li>
    <li>💰 — бонус-символ, выпадающий только на барабанах 1, 3, 5. При 3 символах 💰 активируется бонусная игра.</li>
    <li>Множители WILD добавляют множители к выплатам на линии (🥈 +1, 🥉 +2).</li>
    <li>Бесплатные спины выпадают в бонусной игре. В них WILD остаются на экране до конца бонуса.</li>
  </ul>
`;

// Обновим стиль сообщения
function setMessage(text, type = "info") {
  message.textContent = text;
  message.className = "";
  message.classList.add(type);
}

// Пример вызова setMessage
// setMessage("🎉 Бонус игра!", "success");
// setMessage("Недостаточно средств!", "error");

// Адаптивность (добавим стили, если нужно)
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  if (width < 600) {
    document.body.classList.add("mobile");
  } else {
    document.body.classList.remove("mobile");
  }
});

// Запустим проверку при загрузке
window.dispatchEvent(new Event("resize"));
