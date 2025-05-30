let balance = 0;
let passiveIncome = 0;
let totalClicks = 0;

const upgradesData = [
  { name: "Курсор", price: 10, income: 1 },
  { name: "Ассистент", price: 100, income: 5 },
  { name: "Ферма", price: 1000, income: 50 },
];

const balanceEl = document.getElementById("balance");
const clickBtn = document.getElementById("clickBtn");
const upgradesEl = document.getElementById("upgrades");
const totalClicksEl = document.getElementById("totalClicks");
const passiveIncomeEl = document.getElementById("passiveIncome");

// Инициализация улучшений
function initUpgrades() {
  upgradesEl.innerHTML = "";
  upgradesData.forEach((upg, idx) => {
    const div = document.createElement("div");
    div.classList.add("upgrade");
    div.innerHTML = `
      ${upg.name} — ${upg.price}💰 (+${upg.income}/сек)
      <button onclick="buyUpgrade(${idx})">Купить</button>
    `;
    upgradesEl.appendChild(div);
  });
}

// Кликер
clickBtn.addEventListener("click", () => {
  balance += 1;
  totalClicks += 1;
  updateUI();
});

// Купить улучшение
function buyUpgrade(idx) {
  const upg = upgradesData[idx];
  if (balance >= upg.price) {
    balance -= upg.price;
    passiveIncome += upg.income;
    upg.price = Math.floor(upg.price * 1.5); // Увеличиваем цену
    initUpgrades();
    updateUI();
  } else {
    alert("Недостаточно 💰!");
  }
}

// Пассивный доход
setInterval(() => {
  balance += passiveIncome;
  updateUI();
}, 1000);

// Обновить UI
function updateUI() {
  balanceEl.textContent = balance;
  totalClicksEl.textContent = totalClicks;
  passiveIncomeEl.textContent = passiveIncome;
}

// Переключение экранов
let currentScreen = 0;
const screens = document.querySelectorAll(".screen");
document.getElementById("prevBtn").addEventListener("click", () => {
  currentScreen = (currentScreen - 1 + screens.length) % screens.length;
  showScreen();
});
document.getElementById("nextBtn").addEventListener("click", () => {
  currentScreen = (currentScreen + 1) % screens.length;
  showScreen();
});

function showScreen() {
  screens.forEach((s, i) => {
    s.classList.toggle("active", i === currentScreen);
  });
}

// Запуск
initUpgrades();
updateUI();
showScreen();
