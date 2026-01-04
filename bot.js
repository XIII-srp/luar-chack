console.log('🚀 Luar Chack Discord Shop запускается...\n');

// ============ ИМПОРТЫ ============
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ============ КОНФИГУРАЦИЯ ============
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const PORT = process.env.PORT || 3000;
const WEB_APP_URL = process.env.WEB_APP_URL || `http://localhost:${PORT}`;
const DB_PATH = process.env.DB_PATH || './database.sqlite';

// ============ ПРОВЕРКА ТОКЕНА ============
if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN === 'ВАШ_ТОКЕН_ОТ_BOTFATHER') {
    console.error('❌ ОШИБКА: Укажите TELEGRAM_TOKEN в .env файле');
    console.log('📝 Как получить токен:');
    console.log('1. Откройте Telegram');
    console.log('2. Найдите @BotFather');
    console.log('3. Отправьте /newbot');
    console.log('4. Скопируйте токен');
    console.log('5. Вставьте в файл .env');
    process.exit(1);
}

// ============ БАЗА ДАННЫХ ============
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
    } else {
        console.log('✅ Подключено к SQLite базе данных');
        initDatabase();
    }
});

function initDatabase() {
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        balance INTEGER DEFAULT 0,
        discord_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица товаров
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        lcoins INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1
    )`);

    // Таблица транзакций
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        amount INTEGER,
        lcoins INTEGER,
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Добавляем товары если их нет
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (row.count === 0) {
            const products = [
                ['10 L-Coin', 'Пополнение баланса на 10 L-Coin', 100, 10],
                ['20 L-Coin', 'Пополнение баланса на 20 L-Coin', 190, 20],
                ['50 L-Coin', 'Пополнение баланса на 50 L-Coin', 450, 50],
                ['100 L-Coin', 'Пополнение баланса на 100 L-Coin', 850, 100]
            ];
            
            const stmt = db.prepare("INSERT INTO products (name, description, price, lcoins) VALUES (?, ?, ?, ?)");
            products.forEach(product => stmt.run(product));
            stmt.finalize();
            console.log('✅ Товары добавлены в базу');
        }
    });
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ БД ============
function getUser(telegramId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE telegram_id = ?", [telegramId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function createUser(telegramId, username) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO users (telegram_id, username) VALUES (?, ?)", 
            [telegramId, username], 
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function updateBalance(userId, lcoins) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE users SET balance = balance + ? WHERE id = ?", 
            [lcoins, userId], 
            function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            }
        );
    });
}

function getProducts() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM products WHERE is_active = 1 ORDER BY lcoins", (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function createTransaction(userId, productId, amount, lcoins) {
    return new Promise((resolve, reject) => {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        db.run(`INSERT INTO transactions (user_id, product_id, amount, lcoins, payment_method) VALUES (?, ?, ?, ?, ?)`,
            [userId, productId, amount, lcoins, 'yoomoney'],
            function(err) {
                if (err) reject(err);
                else resolve({ transactionId: this.lastID, paymentId });
            }
        );
    });
}

// ============ ИНИЦИАЛИЗАЦИЯ БОТА И СЕРВЕРА ============
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============ MINI APP - МАГАЗИН ============
app.get('/shop', async (req, res) => {
    try {
        const products = await getProducts();
        
        res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🪙 Luar Chack - Магазин L-Coin</title>
            <script src="https://telegram.org/js/telegram-web-app.js"></script>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                
                .app-container {
                    width: 100%;
                    max-width: 420px;
                    background: white;
                    border-radius: 25px;
                    overflow: hidden;
                    box-shadow: 0 25px 75px rgba(0,0,0,0.25);
                }
                
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 25px;
                    text-align: center;
                }
                
                .logo {
                    font-size: 50px;
                    margin-bottom: 15px;
                    animation: bounce 2s infinite;
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                h1 {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                
                .subtitle {
                    font-size: 16px;
                    opacity: 0.9;
                }
                
                .products-container {
                    padding: 25px;
                }
                
                .balance-card {
                    background: #f8f9ff;
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 25px;
                    text-align: center;
                    border: 2px solid #e2e8f0;
                }
                
                .balance-amount {
                    font-size: 32px;
                    font-weight: 700;
                    color: #667eea;
                    margin: 10px 0;
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
                    gap: 15px;
                    margin-bottom: 25px;
                }
                
                .product-card {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    text-align: center;
                    border: 2px solid #e2e8f0;
                    transition: all 0.3s;
                    cursor: pointer;
                }
                
                .product-card:hover {
                    transform: translateY(-5px);
                    border-color: #667eea;
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
                }
                
                .product-icon {
                    font-size: 30px;
                    margin-bottom: 10px;
                    color: #667eea;
                }
                
                .product-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2d3748;
                    margin-bottom: 5px;
                }
                
                .product-price {
                    font-size: 22px;
                    font-weight: 700;
                    color: #764ba2;
                    margin-bottom: 10px;
                }
                
                .product-lcoins {
                    font-size: 14px;
                    color: #718096;
                    margin-bottom: 15px;
                }
                
                .buy-button {
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .buy-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
                }
                
                .footer {
                    padding: 20px;
                    background: #f8f9ff;
                    border-top: 2px solid #e2e8f0;
                }
                
                .footer-button {
                    width: 100%;
                    padding: 16px;
                    background: white;
                    color: #667eea;
                    border: 2px solid #667eea;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .footer-button:hover {
                    background: #667eea;
                    color: white;
                }
                
                @media (max-width: 480px) {
                    .app-container {
                        border-radius: 20px;
                    }
                    
                    .header {
                        padding: 25px 20px;
                    }
                    
                    h1 {
                        font-size: 24px;
                    }
                    
                    .products-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="app-container">
                <div class="header">
                    <div class="logo">🪙</div>
                    <h1>Luar Chack</h1>
                    <div class="subtitle">Магазин L-Coin</div>
                </div>
                
                <div class="products-container">
                    <div class="balance-card">
                        <div>Ваш баланс</div>
                        <div class="balance-amount" id="balance">0 L-Coin</div>
                        <div style="color: #718096; font-size: 14px;">Пополните баланс для покупок</div>
                    </div>
                    
                    <div class="products-grid">
                        ${products.map(product => `
                            <div class="product-card" onclick="buyProduct(${product.id})">
                                <div class="product-icon">💰</div>
                                <div class="product-name">${product.name}</div>
                                <div class="product-price">${product.price} ₽</div>
                                <div class="product-lcoins">${product.lcoins} L-Coin</div>
                                <button class="buy-button">Купить</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="footer">
                    <button class="footer-button" onclick="closeApp()">Закрыть магазин</button>
                </div>
            </div>
            
            <script>
                const tg = window.Telegram.WebApp;
                
                // Расширяем на весь экран
                tg.expand();
                
                // Получаем данные пользователя
                const initData = tg.initDataUnsafe;
                console.log('Пользователь:', initData.user);
                
                // Обновляем баланс (в реальном приложении здесь был бы запрос к API)
                // document.getElementById('balance').textContent = '0 L-Coin';
                
                // Функция покупки
                function buyProduct(productId) {
                    tg.showPopup({
                        title: 'Подтверждение покупки',
                        message: 'Вы уверены, что хотите купить этот товар?',
                        buttons: [
                            { type: 'default', text: 'Отмена' },
                            { 
                                type: 'ok', 
                                text: 'Купить',
                                id: 'buy'
                            }
                        ]
                    }, function(buttonId) {
                        if (buttonId === 'buy') {
                            // Отправляем данные в бота
                            tg.sendData(JSON.stringify({
                                action: 'buy',
                                product_id: productId,
                                timestamp: new Date().toISOString()
                            }));
                            
                            tg.showAlert('✅ Заказ создан! Оплатите по реквизитам в боте.');
                        }
                    });
                }
                
                // Закрытие приложения
                function closeApp() {
                    tg.close();
                }
                
                // Инициализация завершена
                tg.ready();
                console.log('Luar Chack Shop Mini App запущен!');
            </script>
        </body>
        </html>
        `);
    } catch (error) {
        console.error('Ошибка загрузки магазина:', error);
        res.status(500).send('Ошибка загрузки магазина');
    }
});

// ============ TELEGRAM КОМАНДЫ ============

// /start - главная команда
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    
    console.log(`👤 ${username} запустил бота`);
    
    // Регистрируем/получаем пользователя
    let user = await getUser(telegramId);
    if (!user) {
        await createUser(telegramId, username);
        user = await getUser(telegramId);
    }
    
    const keyboard = {
        inline_keyboard: [
            [{
                text: '🛍️ ОТКРЫТЬ МАГАЗИН',
                web_app: { url: `${WEB_APP_URL}/shop` }
            }],
            [{
                text: '💰 МОЙ БАЛАНС',
                callback_data: 'balance'
            }],
            [{
                text: '📋 ИСТОРИЯ ПОКУПОК',
                callback_data: 'history'
            }],
            [{
                text: '❓ ПОМОЩЬ',
                callback_data: 'help'
            }]
        ]
    };
    
    bot.sendMessage(chatId, 
        `🎮 *Привет, ${username}!*\n\n` +
        `Добро пожаловать в *Luar Chack* — магазин L-Coin для Discord сервера!\n\n` +
        `*Ваш баланс:* ${user.balance || 0} L-Coin\n\n` +
        `_Выберите действие ниже:_`,
        {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        }
    );
});

// /shop - быстрый доступ к магазину
bot.onText(/\/shop/, (msg) => {
    bot.sendMessage(msg.chat.id, '🛍️ Открываю магазин...', {
        reply_markup: {
            inline_keyboard: [[{
                text: '🚀 ОТКРЫТЬ МАГАЗИН',
                web_app: { url: `${WEB_APP_URL}/shop` }
            }]]
        }
    });
});

// /balance - проверка баланса
bot.onText(/\/balance/, async (msg) => {
    const user = await getUser(msg.from.id);
    bot.sendMessage(msg.chat.id, 
        `💰 *Ваш баланс:* ${user?.balance || 0} L-Coin\n\n` +
        `💳 Для пополнения откройте магазин и выберите нужное количество L-Coin.`,
        { parse_mode: 'Markdown' }
    );
});

// /help - помощь
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `🆘 *Помощь по Luar Chack*\n\n` +
        `*/start* - Главное меню\n` +
        `*/shop* - Открыть магазин\n` +
        `*/balance* - Проверить баланс\n` +
        `*/help* - Эта справка\n\n` +
        `*Как купить L-Coin:*\n` +
        `1. Нажмите "ОТКРЫТЬ МАГАЗИН"\n` +
        `2. Выберите количество L-Coin\n` +
        `3. Оплатите по реквизитам\n` +
        `4. Отправьте чек админу\n` +
        `5. L-Coin зачислятся на ваш счет\n\n` +
        `*Реквизиты для оплаты:*\n` +
        `📱 ЮMoney: \`4100XXXXXXXXX\`\n` +
        `💳 Сбербанк: \`XXXXXXXXXXXX\`\n\n` +
        `📧 По вопросам: @ваш_ник`,
        { parse_mode: 'Markdown' }
    );
});

// Обработка callback-кнопок
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    
    switch(data) {
        case 'balance':
            const user = await getUser(callbackQuery.from.id);
            bot.sendMessage(chatId, `💰 Ваш баланс: ${user?.balance || 0} L-Coin`);
            break;
            
        case 'history':
            bot.sendMessage(chatId, '📋 История покупок пока недоступна. Скоро появится!');
            break;
            
        case 'help':
            bot.sendMessage(chatId, 
                '❓ Помощь:\n\n' +
                '• Используйте /shop для открытия магазина\n' +
                '• Выберите товар и оплатите\n' +
                '• Отправьте чек админу\n' +
                '• L-Coin будут зачислены\n\n' +
                'По вопросам: @ваш_ник'
            );
            break;
    }
    
    bot.answerCallbackQuery(callbackQuery.id);
});

// Обработка данных из Mini App
bot.on('message', async (msg) => {
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            const chatId = msg.chat.id;
            const telegramId = msg.from.id;
            
            console.log('Данные из Mini App:', data);
            
            if (data.action === 'buy') {
                // Получаем информацию о товаре
                const product = await new Promise((resolve, reject) => {
                    db.get("SELECT * FROM products WHERE id = ?", [data.product_id], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });
                
                if (!product) {
                    bot.sendMessage(chatId, '❌ Товар не найден');
                    return;
                }
                
                // Получаем пользователя
                const user = await getUser(telegramId);
                if (!user) {
                    bot.sendMessage(chatId, '❌ Пользователь не найден');
                    return;
                }
                
                // Создаем транзакцию
                const transaction = await createTransaction(user.id, product.id, product.price, product.lcoins);
                
                // Отправляем инструкции по оплате
                const paymentMessage = 
                    `✅ *Заказ создан!*\n\n` +
                    `*Товар:* ${product.name}\n` +
                    `*Цена:* ${product.price} ₽\n` +
                    `*Количество L-Coin:* ${product.lcoins}\n\n` +
                    `*Реквизиты для оплаты:*\n` +
                    `📱 *ЮMoney:* \`4100XXXXXXXXX\`\n` +
                    `💳 *Сбербанк:* \`XXXXXXXXXXXX\`\n\n` +
                    `*Важно!* При оплате укажите:\n` +
                    `\`Заказ #${transaction.transactionId}\`\n\n` +
                    `После оплаты отправьте скриншот чека @ваш_ник\n` +
                    `L-Coin будут зачислены в течение 15 минут.`;
                
                bot.sendMessage(chatId, paymentMessage, { parse_mode: 'Markdown' });
                
                // Логируем транзакцию
                console.log(`📦 Новая покупка: пользователь ${user.id}, товар ${product.id}`);
            }
        } catch (error) {
            console.error('Ошибка обработки данных из Mini App:', error);
            bot.sendMessage(msg.chat.id, '❌ Произошла ошибка при обработке заказа');
        }
    }
});

// ============ ВЕБ-СЕРВЕР ============
app.get('/', (req, res) => {
    res.redirect('/shop');
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Luar Chack Bot',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ============ ЗАПУСК СЕРВЕРА ============
app.listen(PORT, () => {
    console.log('\n✨ =========================================== ✨');
    console.log(`✅ Сервер запущен на порту: ${PORT}`);
    console.log(`🌐 Web App доступен по адресу: ${WEB_APP_URL}`);
    console.log(`🤖 Telegram бот готов к работе!`);
    console.log(`📝 Доступные команды:`);
    console.log(`   /start  - Главное меню`);
    console.log(`   /shop   - Открыть магазин`);
    console.log(`   /balance - Проверить баланс`);
    console.log(`   /help   - Помощь`);
    console.log('✨ =========================================== ✨\n');
    
    console.log('🚀 Чтобы начать:');
    console.log(`1. Отправьте /start вашему боту в Telegram`);
    console.log(`2. Нажмите "ОТКРЫТЬ МАГАЗИН"`);
    console.log(`3. Выберите количество L-Coin`);
    console.log(`4. Оплатите по реквизитам\n`);
});

// ============ ОБРАБОТКА ОШИБОК ============
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка polling Telegram:', error.message);
});

process.on('SIGINT', () => {
    console.log('\n👋 Завершение работы Luar Chack...');
    db.close();
    process.exit(0);
});

// Экспорт для Vercel
module.exports = app;
