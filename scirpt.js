const emojis = ['🐶', '🤡', '😈', '👹', '👽', '🤖', '💀', '👻', '🤬', '😎', '🍔'];
let balance = 1_000_000_000;
let spinning = false;

const balanceElem = document.getElementById('balance');
const betInput = document.getElementById('bet');
const messageElem = document.getElementById('message');

function updateBalance() {
  balanceElem.textContent = balance.toLocaleString('ru-RU') + ' 💰';
}

function spinReel(reelElem) {
  const spinCount = 15;
  let i = 0;
  const interval = setInterval(() => {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    reelElem.textContent = randomEmoji;
    i++;
    if (i >= spinCount) {
      clearInterval(interval);
    }
  }, 50);
}

document.getElementById('spin').addEventListener('click', () => {
  if (spinning) return;
  let bet = parseInt(betInput.value.replace(/\./g, ''));
  if (isNaN(bet) || bet <= 0) {
    messageElem.textContent = 'Введите корректную ставку!';
    return;
  }
  if (bet > balance) {
    messageElem.textContent = 'Недостаточно средств!';
    return;
  }

  spinning = true;
  messageElem.textContent = '';

  balance -= bet;
  updateBalance();

  const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
  ];

  reels.forEach(reel => spinReel(reel));

  setTimeout(() => {
    const results = reels.map(reel => reel.textContent);
    const unique = new Set(results);
    let multiplier = 0;
    if (unique.size === 1) {
      multiplier = 10;
      messageElem.textContent = '🎉 Три одинаковых! Выигрыш!';
    } else if (unique.size === 2) {
      multiplier = 3;
      messageElem.textContent = '😊 Два одинаковых!';
    } else {
      messageElem.textContent = '😢 Ничего не выпало...';
    }
    const win = bet * multiplier;
    balance += win;
    updateBalance();
    spinning = false;
  }, 1000);
});

updateBalance();
