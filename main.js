// Dog House Slot Machine — main.js
// Масштабная логика для веб-слота с поддержкой всех правил и красивым UI

document.addEventListener('DOMContentLoaded', function() {
    // Dog House Slot Machine — main.js
    // Масштабная логика для веб-слота с поддержкой всех правил и красивым UI
    
    // --- КОНСТАНТЫ ---
    const EMOJIS = [
        '🐶', '🤡', '😈', '👹', '👽', '🤖', '💀', '👻', '🤬', '😎', '🍔'
    ];
    
    // Режимы интеграции (строго API, единый баланс с ботом)
    const LOCAL_MODE = typeof window.LOCAL_MODE === 'boolean' ? window.LOCAL_MODE : false;
    const STRICT_REMOTE_BALANCE = typeof window.STRICT_REMOTE_BALANCE === 'boolean'
        ? window.STRICT_REMOTE_BALANCE
        : true;
    
    // Настройки API бота
    const BOT_API_URL = window.BOT_API_URL
        || new URLSearchParams(window.location.search).get('api')
        || "http://localhost:5000";
    const BALANCE_SYNC_INTERVAL = 30000; // Синхронизация каждые 30 секунд
    
    // Локальная база данных пользователей
    let localUsersDB = null;
    const WILD_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Индексы для WILD (можно расширить)
    const BONUS_INDEX = 0; // Индекс для BONUS (будет отдельный символ)
    const WILD_EMOJI = '🥈'; // WILD символ (серебряная медаль)
    const BONUS_EMOJI = '💰'; // BONUS символ (мешок с деньгами)
    const REELS = 5;
    const ROWS = 3;
    const PAYLINES = [
        // 20 линий выплат (каждая — массив из 5 позиций: row для каждого reel)
        [0,0,0,0,0], [1,1,1,1,1], [2,2,2,2,2],
        [0,1,2,1,0], [2,1,0,1,2], [0,0,1,0,0], [2,2,1,2,2],
        [1,0,0,0,1], [1,2,2,2,1], [0,1,1,1,0],
        [2,1,1,1,2], [1,0,1,2,1], [1,2,1,0,1], [0,1,2,2,2],
        [2,1,0,0,0], [0,0,0,1,2], [2,2,2,1,0], [0,2,0,2,0],
        [2,0,2,0,2], [1,1,0,1,1]
    ];
    const PAYTABLE = [
        // 5, 4, 3 символа подряд (x ставка)
        [37.5, 7.5, 2.5], // 👹
        [25.0, 5.0, 1.75], // 😈
        [15.0, 3.0, 1.25], // 💀
        [10.0, 2.0, 1.0], // 🤖
        [7.5, 1.25, 0.6], // 🐷 (заменено на 🤬)
        [5.0, 1.0, 0.4], // 🦋 (заменено на 👻)
        [2.5, 0.5, 0.25], // 🦍 (заменено на 🤡)
        [2.5, 0.5, 0.25], // 🐯 (заменено на 👽)
        [1.25, 0.25, 0.1], // 🍔 (заменено на 😎)
        [1.25, 0.25, 0.1], // 🍓 (заменено на 🍔)
        [1.25, 0.25, 0.1], // 🍭 (заменено на 🤡)
    ];
    // Убираем START_BALANCE - баланс всегда загружается из базы данных
    const MIN_BET = 1_000_000;
    const MAX_BET = 100_000_000;
    const BET_STEP = 1_000_000;
    const AUTOSPIN_LIMIT = 100;
    const BONUS_BUY_MULTIPLIER = 100; // x100 от ставки
    const BONUS_WIN_MULTIPLIER = 5; // x5 за 3 BONUS
    const FREE_SPINS_MIN = 7;
    const FREE_SPINS_MAX = 15;
    
    // --- СОСТОЯНИЕ ИГРЫ ---
    let state = {
        balance: 0, // Баланс будет загружен из базы данных
        bet: MIN_BET,
        reels: [], // 5x3
        history: [],
        autospin: false,
        autospinCount: 0,
        freeSpins: 0,
        inBonus: false,
        stickyWilds: [],
        win: 0,
        lastWinLines: [],
        bonusActive: false,
        autospinActive: false, // Флаг для отслеживания активного автоповтора
    };
    
    // --- СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ ---
    let userState = {
        isLoggedIn: false,
        userId: null,
        userNick: null,
        lastSyncTime: 0,
        syncInProgress: false
    };
    
    // --- ЭЛЕМЕНТЫ DOM ---
    const balanceEl = document.getElementById('balance');
    const betAmountEl = document.getElementById('bet-amount');
    const reelsEl = document.getElementById('reels');
    const spinBtn = document.getElementById('spin-btn');
    const autospinBtn = document.getElementById('autospin-btn');
    const maxbetBtn = document.getElementById('maxbet-btn');
    const buybonusBtn = document.getElementById('buybonus-btn');
    const betMinusBtn = document.getElementById('bet-minus');
    const betPlusBtn = document.getElementById('bet-plus');
    const winMessageEl = document.getElementById('win-message');
    const notificationEl = document.getElementById('notification');
    const rulesBtn = document.getElementById('rules-btn');
    const historyBtn = document.getElementById('history-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const showPaylinesBtn = document.getElementById('show-paylines');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal');
    
    // --- ЭЛЕМЕНТЫ АУТЕНТИФИКАЦИИ ---
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    const userIdInput = document.getElementById('user-id-input');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userNickEl = document.getElementById('user-nick');
    
    // --- УТИЛИТЫ ---
    function formatNumber(num) {
        return num.toLocaleString('ru-RU').replace(/\s/g, '.').replace(/,/g, '.');
    }
    
    // --- ЗАГРУЗКА ЛОКАЛЬНОЙ БАЗЫ ДАННЫХ ---
    async function loadLocalUsersDB() {
        if (STRICT_REMOTE_BALANCE) {
            console.log('ℹ️ STRICT_REMOTE_BALANCE=true, локальная users_db.json отключена');
            localUsersDB = {};
            return true;
        }
        try {
            // Добавляем версию к файлу, чтобы обойти кэш браузера и GitHub Pages
            const response = await fetch(`./users_db.json?v=${Date.now()}`);
            if (response.ok) {
                localUsersDB = await response.json();
                console.log('✅ Локальная база данных загружена:', Object.keys(localUsersDB).length, 'пользователей');
                return true;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки локальной базы данных:', error);
        }
        return false;
    }
    
    // --- ФУНКЦИИ ДЛЯ РАБОТЫ С API БОТА ---
    async function fetchBalanceFromAPI(userId) {
        try {
            console.log(`🔍 Запрос баланса через API: ${BOT_API_URL}/api/balance/${userId}`);
            const response = await fetch(`${BOT_API_URL}/api/balance/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Добавляем кэш-бастер, чтобы всегда получать актуальные данные
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Ответ от API:', data);
                return {
                    user_id: userId,
                    balance: data.balance || 0,
                    nick: data.nick || 'Unknown'
                };
            } else {
                console.error(`❌ API вернул ошибку: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Ошибка запроса баланса через API:', error);
            console.error('Детали ошибки:', error.message);
        }
        return null;
    }
    
    async function fetchAllBalancesFromAPI() {
        try {
            console.log(`🔍 Запрос всех балансов через API: ${BOT_API_URL}/api/balances/all`);
            const response = await fetch(`${BOT_API_URL}/api/balances/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Получены все балансы через API, пользователей:', Object.keys(data).length);
                return data;
            } else {
                console.error(`❌ API вернул ошибку: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Ошибка запроса всех балансов через API:', error);
            console.error('Детали ошибки:', error.message);
        }
        return null;
    }
    
    // --- ЛОКАЛЬНЫЕ ФУНКЦИИ (с поддержкой API) ---
    async function fetchUserBalance(userId) {
        console.log('🔍 Поиск пользователя:', userId);
        console.log('📦 Локальная база данных загружена:', !!localUsersDB);
        console.log('🌐 API URL:', BOT_API_URL);
        
        // ПРИОРИТЕТ 1: Пробуем получить баланс через API бота
        if (BOT_API_URL && BOT_API_URL !== "http://localhost:5000") {
            console.log('🔄 Пробуем получить баланс через API...');
            const apiBalance = await fetchBalanceFromAPI(userId);
            if (apiBalance && apiBalance.balance !== undefined) {
                console.log('✅ Баланс получен через API:', apiBalance.balance);
                // Обновляем локальную базу данных
                if (!localUsersDB) localUsersDB = {};
                if (!localUsersDB[userId]) localUsersDB[userId] = {};
                localUsersDB[userId].balance = apiBalance.balance;
                localUsersDB[userId].nick = apiBalance.nick;
                return apiBalance;
            } else {
                console.warn('⚠️ API не вернул баланс, пробуем другие источники...');
            }
        } else {
            console.warn('⚠️ API URL не настроен или равен localhost');
        }
        
        // ПРИОРИТЕТ 2: Пробуем Telegram Web App для синхронизации
        if (window.Telegram && window.Telegram.WebApp) {
            console.log('🔄 Пробуем синхронизацию через Telegram Web App...');
            try {
                await syncBalanceFromBot(userId);
                // После синхронизации пробуем API еще раз
                const apiBalance = await fetchBalanceFromAPI(userId);
                if (apiBalance && apiBalance.balance !== undefined) {
                    console.log('✅ Баланс получен через API после синхронизации:', apiBalance.balance);
                    return apiBalance;
                }
            } catch (error) {
                console.error('❌ Ошибка синхронизации через Web App:', error);
            }
        }
        
        // В строгом remote-режиме локальный fallback запрещен.
        if (STRICT_REMOTE_BALANCE) {
            console.error('❌ Не удалось получить баланс через API (STRICT_REMOTE_BALANCE=true)');
            return null;
        }
        
        // ПРИОРИТЕТ 3: Используем локальную базу данных ТОЛЬКО если баланс > 0
        // Это предотвращает использование файла с балансом 0
        if (localUsersDB && localUsersDB[userId]) {
            const userData = localUsersDB[userId];
            const fileBalance = userData.balance || 0;
            console.log('📁 Пользователь найден в локальной базе, баланс:', fileBalance);
            
            // НЕ используем файл, если баланс 0 - это может быть устаревший файл
            if (fileBalance > 0) {
                console.log('✅ Используем баланс из файла:', fileBalance);
                return {
                    user_id: userId,
                    balance: fileBalance,
                    nick: userData.nick || 'Unknown'
                };
            } else {
                console.warn('⚠️ Баланс в файле равен 0, игнорируем файл');
            }
        }
        
        console.log('❌ Пользователь не найден или баланс недоступен');
        // Возвращаем 0 только если действительно не удалось получить баланс
        return {
            user_id: userId,
            balance: 0,
            nick: 'Новый игрок'
        };
    }
    
    // Функция для синхронизации баланса с бота на сайт
    async function syncBalanceFromBot(userId) {
        try {
            console.log('🔄 Синхронизируем баланс с бота на сайт для пользователя:', userId);
            
            // Пробуем получить баланс через API
            if (BOT_API_URL && BOT_API_URL !== "http://localhost:5000") {
                const apiBalance = await fetchBalanceFromAPI(userId);
                if (apiBalance) {
                    // Обновляем локальную базу данных
                    if (!localUsersDB) localUsersDB = {};
                    if (!localUsersDB[userId]) localUsersDB[userId] = {};
                    localUsersDB[userId].balance = apiBalance.balance;
                    localUsersDB[userId].nick = apiBalance.nick;
                    
                    // Обновляем баланс в игре, если пользователь залогинен
                    if (userState.isLoggedIn && userState.userId === userId) {
                        state.balance = apiBalance.balance;
                        renderBalance();
                        console.log('✅ Баланс обновлен в игре:', apiBalance.balance);
                    }
                    
                    return true;
                }
            }
            
            // Отправляем запрос на синхронизацию баланса через Telegram Web App
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                
                // Отправляем данные в бот для синхронизации
                const syncData = {
                    type: 'sync_balance_from_bot',
                    userId: userId,
                    timestamp: Date.now()
                };
                
                try {
                    tg.sendData(JSON.stringify(syncData));
                    console.log('📤 Запрос синхронизации отправлен в бот:', syncData);
                } catch (error) {
                    console.error('❌ Ошибка отправки запроса синхронизации:', error);
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Ошибка синхронизации баланса с бота:', error);
            return false;
        }
    }
    
    // Функция для периодической синхронизации всех балансов
    async function syncAllBalances() {
        try {
            if (!BOT_API_URL || BOT_API_URL === "http://localhost:5000") {
                // Если API не настроен, используем синхронизацию через Telegram Web App
                if (window.Telegram && window.Telegram.WebApp && userState.isLoggedIn) {
                    console.log('🔄 Запрашиваем баланс через Telegram Web App...');
                    const syncData = {
                        type: 'sync_balance_from_bot',
                        userId: userState.userId,
                        timestamp: Date.now()
                    };
                    try {
                        window.Telegram.WebApp.sendData(JSON.stringify(syncData));
                        console.log('📤 Запрос синхронизации отправлен через Telegram Web App');
                    } catch (error) {
                        console.error('❌ Ошибка отправки запроса через Telegram Web App:', error);
                    }
                }
                return;
            }
            
            console.log('🔄 Синхронизируем все балансы с бота через API...');
            const allBalances = await fetchAllBalancesFromAPI();
            if (allBalances) {
                // Обновляем локальную базу данных
                localUsersDB = allBalances;
                
                // Обновляем баланс текущего пользователя, если он залогинен
                if (userState.isLoggedIn && userState.userId) {
                    const userBalance = allBalances[userState.userId];
                    if (userBalance) {
                        const newBalance = userBalance.balance || 0;
                        if (state.balance !== newBalance) {
                            state.balance = newBalance;
                            renderBalance();
                            console.log('✅ Баланс обновлен через API:', newBalance);
                        }
                    }
                }
                
                console.log('✅ Все балансы синхронизированы через API');
            } else {
                // Если API недоступен, используем Telegram Web App
                if (window.Telegram && window.Telegram.WebApp && userState.isLoggedIn) {
                    console.log('⚠️ API недоступен, используем Telegram Web App для синхронизации');
                    const syncData = {
                        type: 'sync_balance_from_bot',
                        userId: userState.userId,
                        timestamp: Date.now()
                    };
                    try {
                        window.Telegram.WebApp.sendData(JSON.stringify(syncData));
                        console.log('📤 Запрос синхронизации отправлен через Telegram Web App');
                    } catch (error) {
                        console.error('❌ Ошибка отправки запроса через Telegram Web App:', error);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Ошибка синхронизации всех балансов:', error);
            // Fallback на Telegram Web App
            if (window.Telegram && window.Telegram.WebApp && userState.isLoggedIn) {
                try {
                    const syncData = {
                        type: 'sync_balance_from_bot',
                        userId: userState.userId,
                        timestamp: Date.now()
                    };
                    window.Telegram.WebApp.sendData(JSON.stringify(syncData));
                    console.log('📤 Fallback: запрос отправлен через Telegram Web App');
                } catch (e) {
                    console.error('❌ Ошибка fallback синхронизации:', e);
                }
            }
        }
    }
    
    // Локальные функции для работы с балансом (с поддержкой API)
    async function updateLocalBalance(userId, newBalance) {
        if (STRICT_REMOTE_BALANCE && (!BOT_API_URL || BOT_API_URL === "http://localhost:5000")) {
            console.error('❌ BOT_API_URL не настроен, строгий remote-режим не может обновить баланс');
            return false;
        }
        if (!localUsersDB) localUsersDB = {};
        if (!localUsersDB[userId]) localUsersDB[userId] = {};
        if (localUsersDB && localUsersDB[userId]) {
            const oldBalance = localUsersDB[userId].balance || 0;
            
            // Обновляем баланс в локальной базе данных
            localUsersDB[userId].balance = newBalance;
            console.log(`💰 Баланс обновлен локально: ${userId} = ${newBalance}`);
            
            // Обновляем отображение баланса
            state.balance = newBalance;
            renderBalance();
            
            // Отправляем обновление баланса в бот через API (источник истины).
            if (BOT_API_URL && BOT_API_URL !== "http://localhost:5000") {
                try {
                    const response = await fetch(`${BOT_API_URL}/api/balance/${userId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ balance: newBalance })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Баланс синхронизирован с ботом через API:', data);
                    } else {
                        console.error('❌ Ошибка синхронизации баланса с ботом:', response.status);
                        if (STRICT_REMOTE_BALANCE) return false;
                    }
                } catch (error) {
                    console.error('❌ Ошибка отправки баланса в бот через API:', error);
                    if (STRICT_REMOTE_BALANCE) return false;
                }
            }
            
            // Отправляем обновление баланса в Telegram Web App
            if (window.Telegram && window.Telegram.WebApp) {
                try {
                    const data = {
                        type: 'balance_update',
                        userId: userId,
                        balance: newBalance
                    };
                    window.Telegram.WebApp.sendData(JSON.stringify(data));
                    console.log('📤 Баланс отправлен в Telegram Web App:', data);
                } catch (error) {
                    console.error('❌ Ошибка отправки баланса в Telegram:', error);
                }
            } else {
                console.warn('⚠️ Telegram Web App не доступен для отправки данных');
            }
            
            return true;
        }
        console.error('❌ Пользователь не найден в локальной базе данных:', userId);
        return false;
    }
    
    function addToLocalBalance(userId, amount) {
        if (localUsersDB && localUsersDB[userId]) {
            localUsersDB[userId].balance = (localUsersDB[userId].balance || 0) + amount;
            console.log(`Добавлено к балансу: ${userId} + ${amount} = ${localUsersDB[userId].balance}`);
            return true;
        }
        return false;
    }
    
    function subtractFromLocalBalance(userId, amount) {
        if (localUsersDB && localUsersDB[userId]) {
            localUsersDB[userId].balance = Math.max(0, (localUsersDB[userId].balance || 0) - amount);
            console.log(`Вычтено из баланса: ${userId} - ${amount} = ${localUsersDB[userId].balance}`);
            return true;
        }
        return false;
    }
    
    
    // Функция для автоматического входа через Telegram Web App
    async function autoLoginFromTelegram() {
        try {
            // Проверяем, запущено ли приложение в Telegram Web App
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                console.log('Telegram Web App detected');
                console.log('Init data:', tg.initData);
                console.log('Init data unsafe:', tg.initDataUnsafe);
                
                // Инициализируем Web App
                tg.ready();
                tg.expand();
                
                // Получаем данные пользователя из Telegram
                const user = tg.initDataUnsafe?.user;
                if (user && user.id) {
                    console.log('User data found:', user);
                    console.log('User ID:', user.id);
                    
                    // Автоматически устанавливаем пользователя
                    userState.isLoggedIn = true;
                    userState.userId = user.id.toString();
                    userState.userNick = user.first_name || 'Пользователь';
                    
                    // Загружаем реальный баланс пользователя
                    try {
                        console.log('🔍 Загружаем баланс для пользователя:', userState.userId);
                        const userData = await fetchUserBalance(userState.userId);
                        state.balance = userData.balance;
                        renderBalance();
                        console.log('✅ Баланс загружен из базы данных:', userData.balance);
                        console.log('✅ Баланс отформатирован:', formatNumber(userData.balance));
                        console.log('👤 Пользователь:', userData.nick);
                        
                        // Принудительно синхронизируем баланс с бота на сайт
                        await syncBalanceFromBot(userState.userId);
                    } catch (error) {
                        console.error('❌ Ошибка загрузки баланса:', error);
                        // Если произошла ошибка, используем данные из fetchUserBalance
                        const userData = await fetchUserBalance(userState.userId);
                        state.balance = userData.balance;
                        renderBalance();
                        console.log('⚠️ Используем данные из fetchUserBalance, баланс:', userData.balance);
                        
                        // Принудительно синхронизируем баланс с бота на сайт
                        await syncBalanceFromBot(userState.userId);
                    }
                    
                    // Обновляем UI
                    userSection.style.display = 'flex';
                    userNickEl.textContent = userState.userNick;
                    
                        console.log('Автоматический вход успешен');
                        return true;
                } else {
                    console.log('Данные пользователя не найдены в Telegram Web App');
                    // Пробуем получить ID из initData
                    if (tg.initData) {
                        try {
                            const urlParams = new URLSearchParams(tg.initData);
                            const userParam = urlParams.get('user');
                            if (userParam) {
                                const userData = JSON.parse(decodeURIComponent(userParam));
                                if (userData.id) {
                                    console.log('User ID from initData:', userData.id);
                                    
                                    // Автоматически устанавливаем пользователя
                                    userState.isLoggedIn = true;
                                    userState.userId = userData.id.toString();
                                    userState.userNick = userData.first_name || 'Пользователь';
                                    
                                    // Загружаем реальный баланс пользователя
                                    try {
                                        console.log('🔍 Загружаем баланс через initData для пользователя:', userState.userId);
                                        const userBalanceData = await fetchUserBalance(userState.userId);
                                        state.balance = userBalanceData.balance;
                                        renderBalance();
                                        console.log('✅ Баланс загружен через initData:', userBalanceData.balance);
                                        console.log('✅ Баланс отформатирован:', formatNumber(userBalanceData.balance));
                                        console.log('👤 Пользователь:', userBalanceData.nick);
                                    } catch (error) {
                                        console.error('❌ Ошибка загрузки баланса через initData:', error);
                                        // Если произошла ошибка, используем данные из fetchUserBalance
                                        const userData = await fetchUserBalance(userState.userId);
                                        state.balance = userData.balance;
                                        renderBalance();
                                        console.log('⚠️ Используем данные из fetchUserBalance через initData, баланс:', userData.balance);
                                    }
                                    
                                    // Обновляем UI
                                    userSection.style.display = 'flex';
                                    userNickEl.textContent = userState.userNick;
                                    
                                        console.log('Автоматический вход через initData успешен');
                                        return true;
                                }
                            }
                        } catch (e) {
                            console.error('Ошибка парсинга initData:', e);
                        }
                    }
                }
            } else {
                console.log('Telegram Web App не обнаружен');
            }
            return false;
        } catch (error) {
            console.error('Ошибка автоматического входа через Telegram:', error);
            return false;
        }
    }
    
    
    // --- ЛОКАЛЬНАЯ РАБОТА С БАЛАНСОМ ---
    // Синхронизация с API отключена - работаем только локально
    
    // --- АНИМАЦИЯ ВРАЩЕНИЯ БАРАБАНОВ ---
    function startReelSpin() {
        const cells = document.querySelectorAll('.reel-cell');
        cells.forEach((cell, index) => {
            const col = parseInt(cell.dataset.col);
            const speedClass = getSpeedClass(col);
            cell.classList.add('spinning', speedClass);
        });
        
        // Звуковой эффект начала вращения
        playSpinSound();
    }
    
    // --- ЗВУКОВЫЕ ЭФФЕКТЫ ---
    function playSpinSound() {
        // Создаем простой звуковой эффект с помощью Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Игнорируем ошибки звука
        }
    }
    
    function playWinSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Игнорируем ошибки звука
        }
    }
    
    function createWinParticles() {
        const container = document.querySelector('.slot-machine');
        const rect = container.getBoundingClientRect();
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Случайная позиция в области слотов
            const x = Math.random() * rect.width;
            const y = Math.random() * rect.height;
            
            // Случайное направление полета
            const tx = (Math.random() - 0.5) * 200;
            const ty = (Math.random() - 0.5) * 200;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            container.appendChild(particle);
            
            // Удаляем частицу после анимации
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1000);
        }
    }
    
    // --- УПРАВЛЕНИЕ АВТОПОВТОРОМ ---
    function startAutospin() {
        if (state.autospinActive) return; // Уже запущен
        
        state.autospin = true;
        state.autospinCount = AUTOSPIN_LIMIT;
        state.autospinActive = true;
        
        // Обновляем внешний вид кнопки
        autospinBtn.textContent = `AUTOSPIN (${state.autospinCount})`;
        autospinBtn.classList.add('autospin-active');
        
        showNotification(`Автоповтор запущен: ${state.autospinCount} спинов`);
        spin();
    }
    
    function stopAutospin() {
        state.autospin = false;
        state.autospinCount = 0;
        state.autospinActive = false;
        
        // Обновляем внешний вид кнопки
        autospinBtn.textContent = 'AUTOSPIN';
        autospinBtn.classList.remove('autospin-active');
        
        showNotification('Автоповтор остановлен');
    }
    
    function updateAutospinDisplay() {
        if (state.autospinActive && state.autospinCount > 0) {
            autospinBtn.textContent = `AUTOSPIN (${state.autospinCount})`;
        } else {
            autospinBtn.textContent = 'AUTOSPIN';
        }
    }
    
    function getSpeedClass(col) {
        // Разные скорости для разных барабанов
        const speeds = ['spinning-fast', 'spinning-medium', 'spinning-slow', 'spinning-medium', 'spinning-fast'];
        return speeds[col] || 'spinning-medium';
    }
    
    function stopReelSpin() {
        const cells = document.querySelectorAll('.reel-cell');
        cells.forEach((cell, index) => {
            const col = parseInt(cell.dataset.col);
            const stopDelay = getStopDelay(col);
            
            setTimeout(() => {
                cell.classList.remove('spinning', 'spinning-fast', 'spinning-medium', 'spinning-slow');
                cell.classList.add('stopping');
                
                setTimeout(() => {
                    cell.classList.remove('stopping');
                }, 500);
            }, stopDelay);
        });
    }
    
    function getStopDelay(col) {
        // Барабаны останавливаются в разное время (слева направо)
        const delays = [800, 1200, 1600, 2000, 2400];
        return delays[col] || 1600;
    }
    
    function updateReelSymbols(newReels) {
        const cells = document.querySelectorAll('.reel-cell');
        cells.forEach((cell) => {
            const col = parseInt(cell.dataset.col);
            const row = parseInt(cell.dataset.row);
            const symbol = newReels[col][row];
            
            // Обновляем символ после остановки анимации
            setTimeout(() => {
                cell.className = 'reel-cell';
                
                if (symbol.type === 'wild') cell.classList.add('wild');
                if (symbol.type === 'bonus') cell.classList.add('bonus');
                if (symbol.win) cell.classList.add('win');
                
                // Добавляем специальный класс для sticky wilds в бонусном режиме
                if (state.inBonus && state.stickyWilds.some(w => w.col === col && w.row === row)) {
                    cell.classList.add('sticky-wild');
                }
                
                // Добавляем множитель для WILD символов
                let multiplierHtml = '';
                if (symbol.type === 'wild' && symbol.multiplier && symbol.multiplier > 1) {
                    multiplierHtml = `<div class="wild-multiplier">x${symbol.multiplier}</div>`;
                }
                
                cell.innerHTML = symbol.emoji + multiplierHtml;
            }, getStopDelay(col) + 500);
        });
    }
    function showNotification(msg, timeout = 2500) {
        notificationEl.textContent = msg;
        notificationEl.classList.add('show');
        setTimeout(() => notificationEl.classList.remove('show'), timeout);
    }
    function showModal(html) {
        modalContent.innerHTML = html;
        modal.classList.add('open');
    }
    function closeModal() {
        modal.classList.remove('open');
    }
    function openSidebar(html) {
        sidebarContent.innerHTML = html;
        sidebar.classList.add('open');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        // Очищаем содержимое sidebar после закрытия
        setTimeout(() => {
            if (!sidebar.classList.contains('open')) {
                sidebarContent.innerHTML = '';
            }
        }, 300);
    }
    
    // --- ОТРИСОВКА ---
    function renderBalance() {
        const formattedBalance = '₽' + formatNumber(state.balance);
        balanceEl.textContent = formattedBalance;
        console.log('💰 Отображение баланса:', {
            raw: state.balance,
            formatted: formattedBalance,
            element: balanceEl
        });
    }
    function renderBet() {
        betAmountEl.textContent = '₽' + formatNumber(state.bet);
    }
    function renderReels() {
        reelsEl.innerHTML = '';
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < REELS; col++) {
                const symbol = state.reels[col][row];
                let cellClass = 'reel-cell';
                if (symbol.type === 'wild') cellClass += ' wild';
                if (symbol.type === 'bonus') cellClass += ' bonus';
                if (symbol.win) cellClass += ' win';
                
                // Добавляем класс для sticky wilds в бонусном режиме
                if (state.inBonus && state.stickyWilds.some(w => w.col === col && w.row === row)) {
                    cellClass += ' sticky-wild';
                }
                
                // Добавляем множитель для WILD символов
                let multiplierHtml = '';
                if (symbol.type === 'wild' && symbol.multiplier && symbol.multiplier > 1) {
                    multiplierHtml = `<div class="wild-multiplier">x${symbol.multiplier}</div>`;
                }
                
                reelsEl.innerHTML += `<div class="${cellClass}" data-col="${col}" data-row="${row}">${symbol.emoji}${multiplierHtml}</div>`;
            }
        }
    }
    function renderWinMessage(win, lines) {
        if (win > 0) {
            winMessageEl.textContent = `Выигрыш: +₽${formatNumber(win)}`;
            winMessageEl.style.color = 'var(--win)';
        } else {
            winMessageEl.textContent = '';
        }
    }
    
    // --- ГЕНЕРАЦИЯ СЛОТОВ ---
    function getRandomSymbol(col, row, inBonus = false) {
        // WILD только на 2,3,4 барабанах
        if (inBonus && state.stickyWilds.some(w => w.col === col && w.row === row)) {
            return { emoji: '🥈', type: 'wild', multiplier: 1 };
        }
        if (col >= 1 && col <= 3 && Math.random() < 0.03) {
            // 3% шанс WILD (уменьшено с 12%)
            const multiplier = Math.random() < 0.5 ? 2 : 3;
            const wildEmoji = multiplier === 2 ? '🥈' : '🥉'; // Серебряная для x2, бронзовая для x3
            return { emoji: wildEmoji, type: 'wild', multiplier };
        }
        // BONUS только на 1,3,5 барабанах
        if (!inBonus && (col === 0 || col === 2 || col === 4) && Math.random() < 0.08) {
            return { emoji: BONUS_EMOJI, type: 'bonus' };
        }
        // Обычные символы
        const idx = Math.floor(Math.random() * EMOJIS.length);
        return { emoji: EMOJIS[idx], type: 'normal', index: idx };
    }
    function spinReels(inBonus = false) {
        let reels = [];
        for (let col = 0; col < REELS; col++) {
            let reel = [];
            for (let row = 0; row < ROWS; row++) {
                reel.push(getRandomSymbol(col, row, inBonus));
            }
            reels.push(reel);
        }
        return reels;
    }
    
    // --- ВЫПЛАТЫ И ВЫИГРЫШНЫЕ ЛИНИИ ---
    function checkPaylines(reels, bet) {
        let totalWin = 0;
        let winLines = [];
        let winCells = Array.from({length: REELS}, () => Array(ROWS).fill(false));
        for (let i = 0; i < PAYLINES.length; i++) {
            const line = PAYLINES[i];
            let symbols = [];
            let wilds = [];
            for (let col = 0; col < REELS; col++) {
                const row = line[col];
                const symbol = reels[col][row];
                symbols.push(symbol);
                if (symbol.type === 'wild') wilds.push(col);
            }
            // Определяем основной символ (не wild/bonus)
            let mainSymbol = symbols.find(s => s.type === 'normal');
            if (!mainSymbol) continue;
            let count = 0;
            let wildMultiplier = 1;
            for (let col = 0; col < REELS; col++) {
                const symbol = symbols[col];
                if (symbol.type === 'normal' && symbol.emoji === mainSymbol.emoji) {
                    count++;
                } else if (symbol.type === 'wild') {
                    count++;
                    wildMultiplier *= symbol.multiplier || 1;
                } else {
                    break;
                }
            }
            if (count >= 3) {
                // Найти индекс символа в EMOJIS
                let idx = EMOJIS.indexOf(mainSymbol.emoji);
                if (idx === -1) continue;
                let pay = PAYTABLE[idx][count-3] * bet * wildMultiplier;
                totalWin += pay;
                winLines.push({ line: i+1, symbol: mainSymbol.emoji, count, pay });
                // Отметить выигрышные ячейки
                for (let col = 0; col < count; col++) {
                    winCells[col][line[col]] = true;
                }
            }
        }
        // Пометить выигрышные ячейки
        for (let col = 0; col < REELS; col++) {
            for (let row = 0; row < ROWS; row++) {
                if (winCells[col][row]) reels[col][row].win = true;
            }
        }
        return { totalWin, winLines };
    }
    
    // --- БОНУСЫ И ФРИСПИНЫ ---
    function checkBonus(reels) {
        // 3 BONUS на 1,3,5 барабанах
        let bonusCols = [0,2,4];
        let bonusCount = 0;
        for (let col of bonusCols) {
            for (let row = 0; row < ROWS; row++) {
                if (reels[col][row].type === 'bonus') bonusCount++;
            }
        }
        return bonusCount >= 3;
    }
    function startBonus() {
        state.inBonus = true;
        state.bonusActive = true;
        state.freeSpins = Math.floor(Math.random() * (FREE_SPINS_MAX - FREE_SPINS_MIN + 1)) + FREE_SPINS_MIN;
        state.stickyWilds = [];
        showModal(`<h2>БОНУСКА!</h2><p>Вам начислено <b>${state.freeSpins}</b> бесплатных спинов!</p>`);
        setTimeout(closeModal, 2000);
        setTimeout(spinBonus, 2200);
    }
    async function spinBonus() {
        if (state.freeSpins <= 0) {
            state.inBonus = false;
            state.bonusActive = false;
            state.stickyWilds = [];
            showModal(`<h2>БОНУСКА завершена!</h2><p>Ваш выигрыш: <b>₽${formatNumber(state.win)}</b></p>`);
            setTimeout(closeModal, 2500);
            return;
        }
        
        // Генерируем слоты с учетом sticky wilds
        let reels = [];
        for (let col = 0; col < REELS; col++) {
            let reel = [];
            for (let row = 0; row < ROWS; row++) {
                // Если sticky wild — всегда wild
                if (state.stickyWilds.some(w => w.col === col && w.row === row)) {
                    reel.push({ emoji: '🥈', type: 'wild', multiplier: 2 });
                } else if (col >= 1 && col <= 3 && state.stickyWilds.length < 6) {
                    // Прогрессивный шанс нового sticky wild в зависимости от количества существующих
                    const baseChance = 0.08; // 8% базовый шанс
                    const existingWilds = state.stickyWilds.length;
                    const adjustedChance = baseChance * Math.pow(0.7, existingWilds); // Уменьшается с каждым wild
                    
                    if (Math.random() < adjustedChance) {
                        state.stickyWilds.push({ col, row });
                        reel.push({ emoji: '🥈', type: 'wild', multiplier: 2 });
                    }
                } else {
                    // Обычный символ
                    const idx = Math.floor(Math.random() * EMOJIS.length);
                    reel.push({ emoji: EMOJIS[idx], type: 'normal', index: idx });
                }
            }
            reels.push(reel);
        }
        
        // Начинаем анимацию вращения
        startReelSpin();
        
        // Анимация кнопки SPIN
        spinBtn.classList.add('spinning');
        setTimeout(() => spinBtn.classList.remove('spinning'), 3000);
        
        // Останавливаем вращение и показываем результаты
        setTimeout(async () => {
            stopReelSpin();
            updateReelSymbols(reels);
            
            // Обновляем состояние
            state.reels = reels;
            
            // Проверяем выигрышные линии
            let { totalWin, winLines } = checkPaylines(reels, state.bet);
            state.balance += totalWin;
            state.win += totalWin;
            state.lastWinLines = winLines;
            
            // Обновляем локальный баланс
            if (userState.isLoggedIn) {
                await updateLocalBalance(userState.userId, state.balance);
            }
            
            // Показываем выигрышные линии через некоторое время
            setTimeout(() => {
                renderReels(); // Перерисовываем с подсветкой выигрышных линий
                
                // Показываем выигрыш только после полной остановки барабанов
                renderWinMessage(totalWin, winLines);
                
                // Звуковой эффект при выигрыше
                if (totalWin > 0) {
                    playWinSound();
                    createWinParticles();
                }
            }, 2800);
            
            state.freeSpins--;
            setTimeout(spinBonus, 3500); // Увеличиваем задержку для бонусных спинов
        }, 100);
    }
    
    // --- ОСНОВНОЙ СПИН ---
    async function spin() {
        if (state.inBonus || state.bonusActive) return;
        if (state.balance < state.bet) {
            showNotification('Недостаточно средств!');
            if (state.autospinActive) {
                stopAutospin();
            }
            return;
        }
        
        state.balance -= state.bet;
        
        // Обновляем локальный баланс (включает renderBalance)
        if (userState.isLoggedIn) {
            await updateLocalBalance(userState.userId, state.balance);
        } else {
            renderBalance();
        }
        
        // Генерируем новые символы
        const newReels = spinReels();
        
        // Начинаем анимацию вращения
        startReelSpin();
        
        // Анимация кнопки SPIN
        spinBtn.classList.add('spinning');
        setTimeout(() => spinBtn.classList.remove('spinning'), 3000);
        
        // Останавливаем вращение и показываем результаты
        setTimeout(async () => {
            stopReelSpin();
            updateReelSymbols(newReels);
            
            // Обновляем состояние
            state.reels = newReels;
            
            // Проверяем бонус
            if (checkBonus(state.reels)) {
                // Останавливаем автоповтор при бонусе
                if (state.autospinActive) {
                    stopAutospin();
                }
                
                // x5 от ставки + бонус
                let win = state.bet * BONUS_WIN_MULTIPLIER;
                state.balance += win;
                state.win = win;
                
                // Обновляем локальный баланс (включает renderBalance)
                if (userState.isLoggedIn) {
                    await updateLocalBalance(userState.userId, state.balance);
                } else {
                    renderBalance();
                }
                
                // Показываем выигрыш бонуса через некоторое время
                setTimeout(() => {
                    renderWinMessage(win, []);
                    if (win > 0) {
                        playWinSound();
                        createWinParticles();
                    }
                }, 2800);
                
                setTimeout(startBonus, 1800);
                return;
            }
            
            // Проверяем выигрышные линии
            let { totalWin, winLines } = checkPaylines(state.reels, state.bet);
            state.balance += totalWin;
            state.win = totalWin;
            state.lastWinLines = winLines;
            
            // Обновляем локальный баланс (включает renderBalance)
            if (userState.isLoggedIn) {
                await updateLocalBalance(userState.userId, state.balance);
            } else {
                renderBalance();
            }
            
            // Добавляем в историю
            state.history.unshift({
                time: new Date().toLocaleTimeString(),
                bet: state.bet,
                win: totalWin,
                lines: winLines
            });
            if (state.history.length > 50) state.history.pop();
            
            // Показываем выигрышные линии через некоторое время
            setTimeout(() => {
                renderReels(); // Перерисовываем с подсветкой выигрышных линий
                
                // Показываем выигрыш только после полной остановки барабанов
                renderWinMessage(totalWin, winLines);
                
                // Звуковой эффект при выигрыше
                if (totalWin > 0) {
                    playWinSound();
                    createWinParticles();
                }
            }, 2800);
            
            if (state.autospin && state.autospinCount > 0) {
                state.autospinCount--;
                updateAutospinDisplay();
                
                if (state.autospinCount > 0) {
                    setTimeout(spin, 3500); // Увеличиваем задержку для автоповтора
                } else {
                    stopAutospin(); // Автоповтор закончился
                }
            } else {
                state.autospin = false;
            }
        }, 100);
    }
    
    // --- КНОПКИ И СОБЫТИЯ ---
    spinBtn.onclick = () => spin();
    
    autospinBtn.onclick = () => {
        if (state.inBonus || state.bonusActive) return;
        
        if (state.autospinActive) {
            // Если автоповтор уже активен - останавливаем его
            stopAutospin();
        } else {
            // Запускаем автоповтор
            startAutospin();
        }
    };
    maxbetBtn.onclick = () => {
        state.bet = Math.min(state.balance, MAX_BET);
        renderBet();
    };
    buybonusBtn.onclick = () => {
        if (state.inBonus || state.bonusActive) return;
        let price = state.bet * BONUS_BUY_MULTIPLIER;
        if (state.balance < price) {
            showNotification('Недостаточно средств для покупки бонуса!');
            return;
        }
        
        // Останавливаем автоповтор при покупке бонуса
        if (state.autospinActive) {
            stopAutospin();
        }
        
        state.balance -= price;
        state.win = 0;
        renderAll();
        setTimeout(startBonus, 800);
    };
    betMinusBtn.onclick = () => {
        state.bet = Math.max(MIN_BET, state.bet - BET_STEP);
        renderBet();
    };
    betPlusBtn.onclick = () => {
        state.bet = Math.min(MAX_BET, state.bet + BET_STEP, state.balance);
        renderBet();
    };
    rulesBtn.onclick = () => {
        openSidebar(renderRules());
    };
    historyBtn.onclick = () => {
        openSidebar(renderHistory());
    };
    showPaylinesBtn.onclick = () => {
        openSidebar(renderPaylines());
    };
    closeSidebarBtn.onclick = closeSidebar;
    closeModalBtn.onclick = closeModal;
    
    // Закрытие sidebar по клику вне его области
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !showPaylinesBtn.contains(e.target) && 
            !rulesBtn.contains(e.target) && 
            !historyBtn.contains(e.target)) {
            closeSidebar();
        }
    });
    
    // Закрытие sidebar по клавише Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.autospinActive) {
                stopAutospin();
            }
            if (sidebar.classList.contains('open')) {
                closeSidebar();
            }
            if (modal.classList.contains('open')) {
                closeModal();
            }
        }
    });
    
    // --- РЕНДЕР ПРАВИЛ, ЛИНИЙ, ИСТОРИИ ---
    function renderRules() {
        return `
        <div class="rules-container">
            <div class="rules-header">
                <h2>📋 Правила игры</h2>
                <p class="rules-subtitle">Изучите все возможности слота Dog House</p>
            </div>
    
            <div class="rules-section">
                <div class="rule-card">
                    <div class="rule-icon">🎰</div>
                    <div class="rule-content">
                        <h3>Символы игры</h3>
                        <div class="symbols-grid">
                            ${EMOJIS.map(emoji => `<span class="symbol-item">${emoji}</span>`).join('')}
                            <span class="symbol-item wild-symbol">🥈</span>
                            <span class="symbol-item wild-symbol">🥉</span>
                            <span class="symbol-item bonus-symbol">${BONUS_EMOJI}</span>
                        </div>
                    </div>
                </div>
            </div>
    
            <div class="rules-section">
                <div class="rule-card">
                    <div class="rule-icon">🥈</div>
                    <div class="rule-content">
                        <h3>WILD символы</h3>
                        <ul class="rule-list">
                            <li>Эти символы — WILD, и они могут заменять все символы на линии, кроме ${BONUS_EMOJI}</li>
                            <li>Символы WILD присутствуют только на барабанах 2, 3, 4</li>
                            <li>Могут иметь множители х2 или х3</li>
                            <li>Множитель WILD применяется к выигрышу на линии, в которой символ WILD используется</li>
                            <li>Если на линии используется больше одного символа WILD, множители всех символов WILD на данной линии суммируются</li>
                        </ul>
                    </div>
                </div>
            </div>
    
            <div class="rules-section">
                <div class="rule-card">
                    <div class="rule-icon">${BONUS_EMOJI}</div>
                    <div class="rule-content">
                        <h3>BONUS символы</h3>
                        <ul class="rule-list">
                            <li>Этот символ — BONUS. Он появляется только на барабанах 1, 3 и 5</li>
                            <li>Выбейте 3 символа BONUS, чтобы выиграть х5 от ставки и запустить БОНУСКУ</li>
                            <li>Во время бонуски WILD остаются на месте до конца бонуски</li>
                            <li>Во время бонуски символы BONUS не выпадают</li>
                        </ul>
                    </div>
                </div>
            </div>
    
            <div class="rules-section">
                <div class="rule-card">
                    <div class="rule-icon">💰</div>
                    <div class="rule-content">
                        <h3>Выплаты</h3>
                        <ul class="rule-list">
                            <li>Выплаты по линиям — только слева направо, начиная с крайнего левого барабана</li>
                            <li>Максимум 20 линий выплат</li>
                            <li>Минимум 3 символа для выигрыша</li>
                        </ul>
                    </div>
                </div>
            </div>
    
            <div class="rules-section">
                <div class="rule-card paytable-card">
                    <div class="rule-icon">📊</div>
                    <div class="rule-content">
                        <h3>Таблица выплат</h3>
                        <div class="paytable-container">
                            <table class="paytable">
                                <thead>
                                    <tr>
                                        <th>Символ</th>
                                        <th>5 символов</th>
                                        <th>4 символа</th>
                                        <th>3 символа</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${EMOJIS.map((emoji, i) => `
                                        <tr class="paytable-row">
                                            <td class="symbol-cell">${emoji}</td>
                                            <td class="win-cell">x${PAYTABLE[i][0]}</td>
                                            <td class="win-cell">x${PAYTABLE[i][1]}</td>
                                            <td class="win-cell">x${PAYTABLE[i][2]}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    function renderPaylines() {
        return `
        <div class="paylines-container">
            <div class="paylines-header">
                <h2>🎯 Линии выплат</h2>
                <p class="paylines-subtitle">В игре присутствует 20 выигрышных линий</p>
            </div>
    
            <div class="paylines-grid">
                ${PAYLINES.map((line, i) => `
                    <div class="payline-item">
                        <div class="payline-number">Линия ${i + 1}</div>
                        <div class="payline-visual">
                            ${Array(3).fill(0).map((_, row) => 
                                Array(5).fill(0).map((_, col) => {
                                    const isActive = line[col] === row;
                                    return `<div class="payline-cell ${isActive ? 'active' : ''}"></div>`;
                                }).join('')
                            ).join('')}
                        </div>
                        <div class="payline-info">
                            <p>Выигрышная линия ${i + 1}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
    
            <div class="paylines-info">
                <div class="info-card">
                    <div class="info-icon">ℹ️</div>
                    <div class="info-content">
                        <h3>Как работают линии</h3>
                        <p>Все выплаты осуществляются при выпадении символов непрерывно слева направо по выигрышным линиям, начиная с крайнего левого барабана.</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    function renderHistory() {
        return `
        <div class="history-container">
            <div class="history-header">
                <h2>📈 История игр</h2>
                <p class="history-subtitle">Ваши последние результаты</p>
            </div>
    
            ${state.history.length === 0 ? `
                <div class="empty-history">
                    <div class="empty-icon">🎰</div>
                    <h3>История пуста</h3>
                    <p>Сделайте первую ставку, чтобы увидеть историю игр</p>
                </div>
            ` : `
                <div class="history-stats">
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-content">
                            <div class="stat-value">${state.history.length}</div>
                            <div class="stat-label">Всего игр</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-content">
                            <div class="stat-value">₽${formatNumber(state.history.reduce((sum, h) => sum + h.win, 0))}</div>
                            <div class="stat-label">Общий выигрыш</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-content">
                            <div class="stat-value">${state.history.filter(h => h.win > 0).length}</div>
                            <div class="stat-label">Выигрышных игр</div>
                        </div>
                    </div>
                </div>
    
                <div class="history-list">
                    ${state.history.map((h, index) => `
                        <div class="history-item ${h.win > 0 ? 'win' : 'loss'}">
                            <div class="history-time">
                                <div class="time-icon">🕐</div>
                                <div class="time-text">${h.time}</div>
                            </div>
                            <div class="history-details">
                                <div class="bet-info">
                                    <span class="bet-label">Ставка:</span>
                                    <span class="bet-amount">₽${formatNumber(h.bet)}</span>
                                </div>
                                <div class="win-info">
                                    <span class="win-label">Выигрыш:</span>
                                    <span class="win-amount ${h.win > 0 ? 'positive' : 'negative'}">₽${formatNumber(h.win)}</span>
                                </div>
                                ${h.lines.length > 0 ? `
                                    <div class="lines-info">
                                        <span class="lines-label">Линии:</span>
                                        <span class="lines-numbers">${h.lines.map(l => l.line).join(', ')}</span>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="history-status">
                                ${h.win > 0 ? '🎉' : '😔'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
        `;
    }
    
    // --- ИНИЦИАЛИЗАЦИЯ ---
    function renderAll() {
        renderBalance();
        renderBet();
        renderReels();
    }
    
    
    async function init() {
        state.reels = spinReels();
        renderAll();
        
        // Загружаем локальную базу данных
        await loadLocalUsersDB();
        
        // Сначала пробуем автоматический вход через Telegram Web App
        const telegramLoginSuccess = await autoLoginFromTelegram();
        
        // Если автоматический вход не удался, показываем пользователя по умолчанию
        if (!telegramLoginSuccess) {
            userState.isLoggedIn = true;
            userState.userId = 'guest';
            userState.userNick = 'Гость';
            
            // Для гостя устанавливаем нулевой баланс
            state.balance = 0;
            renderBalance();
            console.log('👤 Гость, баланс: 0');
            
            // Обновляем UI
            userSection.style.display = 'flex';
            userNickEl.textContent = userState.userNick;
        }
        
        // Инициализируем адаптивность
        initResponsiveDesign();
        
        // Добавляем обработчик для получения данных от бота
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            
            // Обработчик для получения данных от бота через MainButton
            tg.onEvent('mainButtonClicked', () => {
                console.log('📥 MainButton clicked');
            });
            
            // Обработчик для получения данных от бота через sendData
            // Telegram Web App может получать данные через специальные события
            // Но основная синхронизация идет через периодические запросы
        }
        
        // Запускаем периодическую синхронизацию балансов
        if (BOT_API_URL && BOT_API_URL !== "http://localhost:5000") {
            // Первая синхронизация сразу
            setTimeout(() => {
                if (userState.isLoggedIn && userState.userId) {
                    syncBalanceFromBot(userState.userId);
                }
                syncAllBalances();
            }, 2000);
            
            // Периодическая синхронизация
            setInterval(() => {
                if (userState.isLoggedIn && userState.userId) {
                    syncBalanceFromBot(userState.userId);
                }
                syncAllBalances();
            }, BALANCE_SYNC_INTERVAL);
        }
    }
    
    // --- АДАПТИВНЫЙ ДИЗАЙН ---
    function initResponsiveDesign() {
        // Функция для обновления размеров в зависимости от экрана
        function updateResponsiveSizes() {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const isMobile = vw <= 768;
            const isLandscape = vw > vh;
            
            // Обновляем CSS переменные динамически
            const root = document.documentElement;
            
            if (isMobile) {
                // Мобильные устройства
                if (isLandscape) {
                    // Ландшафтная ориентация
                    root.style.setProperty('--reel-size', '35px');
                    root.style.setProperty('--reel-gap', '4px');
                    root.style.setProperty('--btn-font-size', '0.7rem');
                    root.style.setProperty('--header-font-size', '1.3rem');
                    root.style.setProperty('--balance-font-size', '1.1rem');
            } else {
                    // Портретная ориентация
                    root.style.setProperty('--reel-size', '50px');
                    root.style.setProperty('--reel-gap', '8px');
                    root.style.setProperty('--btn-font-size', '0.9rem');
                    root.style.setProperty('--header-font-size', '1.8rem');
                    root.style.setProperty('--balance-font-size', '1.5rem');
                }
            } else if (vw <= 1024) {
                // Планшеты
                root.style.setProperty('--reel-size', '60px');
                root.style.setProperty('--reel-gap', '10px');
                root.style.setProperty('--btn-font-size', '1rem');
                root.style.setProperty('--header-font-size', '2.2rem');
                root.style.setProperty('--balance-font-size', '1.8rem');
            } else {
                // Десктоп
                root.style.setProperty('--reel-size', '70px');
                root.style.setProperty('--reel-gap', '12px');
                root.style.setProperty('--btn-font-size', '1.1rem');
                root.style.setProperty('--header-font-size', '2.5rem');
                root.style.setProperty('--balance-font-size', '2rem');
            }
            
            // Обновляем размеры контейнера
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                if (isMobile) {
                    appContainer.style.maxWidth = '100%';
                    appContainer.style.padding = '8px';
                } else {
                    appContainer.style.maxWidth = '1200px';
                    appContainer.style.padding = '32px 16px 64px 16px';
                }
            }
        }
        
        // Вызываем при загрузке
        updateResponsiveSizes();
        
        // Обновляем при изменении размера окна
        window.addEventListener('resize', updateResponsiveSizes);
        window.addEventListener('orientationchange', () => {
            // Небольшая задержка для корректного определения размеров после поворота
            setTimeout(updateResponsiveSizes, 100);
        });
        
        // Обновляем при изменении viewport (для мобильных браузеров)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateResponsiveSizes);
        }
    }
    
    init();
    }); 
