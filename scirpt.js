const balanceEl = document.getElementById("balance");
const slotEls = [document.getElementById("slot1"), document.getElementById("slot2"), document.getElementById("slot3")];
const spinBtn = document.getElementById("spinBtn");
const messageEl = document.getElementById("message");

let balance = 1000;
const bet = 100;
const symbols = ["🐶", "🦴", "🐾", "🐕", "🐩", "💎", "7️⃣"];

spinBtn.addEventListener("click", spin);

function spin() {
  if (balance < bet) {
    messageEl.textContent = "Недостаточно средств!";
    return;
  }

  balance -= bet;
  updateBalance();
  messageEl.textContent = "";

  let spins = 15;
  let count = 0;

  const spinInterval = setInterval(() => {
    for (let i = 0; i < 3; i++) {
      const randIndex = Math.floor(Math.random() * symbols.length);
      slotEls[i].textContent = symbols[randIndex];
      slotEls[i].classList.add("spin");
    }
    count++;
    if (count >= spins) {
      clearInterval(spinInterval);
      for (let el of slotEls) el.classList.remove("spin");
      checkWin();
    }
  }, 80);
}

function checkWin() {
  const [a, b, c] = slotEls.map(el => el.textContent);

  if (a === b && b === c) {
    const win = bet * 10;
    balance += win;
    messageEl.textContent = 🎉 Джекпот! +${win}💰;
  } else if (a === b  b === c  a === c) {
    const win = bet * 2;
    balance += win;
    messageEl.textContent = ✨ Две совпали! +${win}💰;
  } else {
    messageEl.textContent = "❌ Не повезло!";
  }

  updateBalance();
}

function updateBalance() {
  balanceEl.textContent = balance;
}
