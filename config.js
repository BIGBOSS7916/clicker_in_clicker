// URL API бота (должен указывать на твой бот-сервер, где Flask API на порту 5000).
// Можно переопределить через ?api=https://example.com в URL мини-аппа.
window.BOT_API_URL = "http://212.80.7.13:28742";

// LOCAL_MODE=false: не работаем как оффлайн-игрушка.
window.LOCAL_MODE = false;

// STRICT_REMOTE_BALANCE=true: баланс только через API бота (единый с Telegram-ботом).
window.STRICT_REMOTE_BALANCE = true;
