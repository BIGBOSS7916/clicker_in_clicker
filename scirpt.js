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

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function updateBalance() {
  balanceAmount.textContent = balance.toLocaleString("ru-RU");
}

function setMessage(text, type = "info") {
  message.textContent = text;
  message.className = type;
}

async function spin() {
  if (spinning) return;

  const bet = parseInt(betInput.value);
  if (bet > balance) {
    setMessage("Недостаточно средств!", "error");
    return;
  }

  if (freeSpins === 0) {
    balance -= bet;
    updateBalance();
  }

  spinning = true;
  setMessage("");
  spinButton.disabled = true;

  const reels = document.querySelectorAll(".reel");

  for (let step = 0; step < 20; step++) {
    reels.forEach(reel => {
      const symbolsDivs = reel.querySelectorAll(".symbol");
      symbolsDivs.forEach(sym => {
        const nextSymbol = randomSymbol();
        sym.style.transition = "transform 0.1s ease";
        sym.style.transform = "translateY(-100%)";
        setTimeout(() => {
          sym.textContent = nextSymbol;
          sym.style.transition = "none";
          sym.style.transform = "translateY(100%)";
          setTimeout(() => {
            sym.style.transition = "transform 0.1s ease";
            sym.style.transform = "translateY(0)";
          }, 10);
        }, 100);
      });
    });
    await delay(50);
  }

  reels.forEach(reel => {
    const symbolsDivs = reel.querySelectorAll(".symbol");
    symbolsDivs.forEach(sym => {
      sym.textContent = randomSymbol();
      sym.style.transition = "none";
      sym.style.transform = "translateY(0)";
    });
  });

  checkWin(bet);
  spinning = false;
  spinButton.disabled = false;
}

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
    const freeSpinsWon = Math.floor(Math.random() * 10) + 5;
    freeSpins += freeSpinsWon;
    setMessage(`🎉 Бонус игра! +${freeSpinsWon} бесплатных спинов!`, "bonus");
  }

  if (freeSpins > 0) {
    freeSpins--;
    freeSpinsDisplay.textContent = Бесплатные спины: ${freeSpins};
  } else {
    freeSpinsDisplay.textContent = "";
  }

  if (totalWin > 0) {
    balance += totalWin;
    setMessage(`🎉 Выигрыш: ${totalWin.toLocaleString("ru-RU")} $`, "win");
  } else if (bonusCount < 3) {
    setMessage("Неудача!", "lose");
  }

  updateBalance();
}

function isWild(sym) {
  return sym === "🥈" || sym === "🥉";
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

updateBalance();
spinButton.addEventListener("click", spin);
