const reels = document.querySelectorAll(".reel");
const symbols = ["🐶", "🍖", "🐾", "💎", "🏠", "7️⃣", "🍗"];
const resultBox = document.getElementById("result");
const spinButton = document.getElementById("spin-btn");

function spin() {
  spinButton.disabled = true;
  resultBox.textContent = "🎰 Крутим...";
  let totalSpins = 30;
  const interval = setInterval(() => {
    reels.forEach(reel => {
      reel.innerHTML = "";
      for (let i = 0; i < 3; i++) {
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const symbolDiv = document.createElement("div");
        symbolDiv.className = "symbol";
        symbolDiv.textContent = randomSymbol;
        reel.appendChild(symbolDiv);
      }
    });
    totalSpins--;
    if (totalSpins === 0) {
      clearInterval(interval);
      finalizeSpin();
    }
  }, 50);
}

function finalizeSpin() {
  reels.forEach(reel => {
    reel.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const symbolDiv = document.createElement("div");
      symbolDiv.className = "symbol";
      symbolDiv.textContent = randomSymbol;
      reel.appendChild(symbolDiv);
    }
  });
  resultBox.textContent = "✅ Спин завершён!";
  spinButton.disabled = false;
}

spinButton.addEventListener("click", spin);
