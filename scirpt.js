const reels = document.querySelectorAll(".reel");
const symbols = ["🐶", "🍖", "🐾", "💎", "🏠", "7️⃣", "🍗"];
const resultBox = document.getElementById("result");
const spinButton = document.getElementById("spin-btn");

function spin() {
  spinButton.disabled = true;
  resultBox.textContent = "🎰 Крутим...";

  let spins = 30; // количество "крутых" циклов
  let spinSpeed = 50; // скорость анимации

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
    spins--;
    if (spins === 0) {
      clearInterval(interval);
      finalizeSpin();
    }
  }, spinSpeed);
}

function finalizeSpin() {
  // Генерация итогового результата
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

  // 👉 Здесь можно вставить логику расчёта выигрыша
}

spinButton.addEventListener("click", spin);
