const tg = window.Telegram.WebApp;
tg.expand(); // полноэкранный режим

let balance = 0;
let clickValue = 1;
let upgradeCost = 10;

// обновляем баланс
function updateBalance() {
  document.getElementById('balance').innerText = Баланс: ${balance};
}

// кнопка "Клик!"
document.getElementById('clickBtn').addEventListener('click', () => {
  balance += clickValue;
  updateBalance();
});

// кнопка "Улучшение"
document.getElementById('upgradeBtn').addEventListener('click', () => {
  if (balance >= upgradeCost) {
    balance -= upgradeCost;
    clickValue += 1;
    upgradeCost *= 2; // стоимость удваивается
    document.getElementById('upgradeBtn').innerText = Купить улучшение (${upgradeCost} монет);
    updateBalance();
  } else {
    alert('Не хватает монет!');
  }
});

// кнопка "Вывод"
document.getElementById('withdrawBtn').addEventListener('click', () => {
  const data = {
    action: 'withdraw',
    amount: balance
  };
  tg.sendData(JSON.stringify(data)); // отправляем данные боту
  alert('Заявка на вывод отправлена!');
  balance = 0; // обнуляем баланс
  updateBalance();
});
