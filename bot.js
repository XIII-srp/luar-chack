require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const express = require('express');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const db = new Database('database.db');
const ADMIN_ID = 1484129008; // ⚠️ ЗАМЕНИТЕ НА ВАШ ID
const PORT = process.env.PORT || 3000;

// Инициализация БД
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        coins INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0
    )
`);

// Функция записи логов
function writeLog(text) {
    const logEntry = `[${new Date().toLocaleString()}] ${text}\n`;
    fs.appendFileSync('logs.txt', logEntry);
    console.log(logEntry);
}

// Поиск или создание юзера
function getUser(msg) {
    let user = db.prepare("SELECT * FROM users WHERE id = ?").get(msg.from.id);
    if (!user) {
        db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run(msg.from.id, msg.from.username || 'User');
        user = { id: msg.from.id, username: msg.from.username, coins: 0 };
        writeLog(`Новый пользователь: ${msg.from.id} (@${msg.from.username})`);
    }
    return user;
}

// --- КОМАНДЫ ---
bot.onText(/\/start/, (msg) => {
    getUser(msg);
    bot.sendMessage(msg.chat.id, `👋 *Добро пожаловать в Luar Shop!*\n\n1 L-coin = 1 рубль\n\nИспользуй кнопку ниже, чтобы войти в магазин.`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: "💎 ОТКРЫТЬ МАГАЗИН", web_app: { url: process.env.WEB_APP_URL } }]] }
    });
});

// --- ОБРАБОТКА ДАННЫХ МАГАЗИНА ---
bot.on('web_app_data', (msg) => {
    const data = JSON.parse(msg.web_app_data.data);
    if (data.action === 'pay_sbp') {
        const orderId = Math.floor(Math.random() * 90000) + 10000;
        writeLog(`Создан заказ #${orderId} от ${msg.from.id} на сумму ${data.price}р`);

        const keyboard = {
            inline_keyboard: [
                [{ text: "✅ Я ОПЛАТИЛ", callback_data: `check_${orderId}_${msg.from.id}_${data.amount}_${data.price}` }],
                [{ text: "❌ ОТМЕНА", callback_data: `cancel_${orderId}` }]
            ]
        };

        bot.sendMessage(msg.chat.id, 
            `💳 *ОПЛАТА СБП (Заказ #${orderId})*\n\n` +
            `Пополнение: *${data.amount} L-coins*\n` +
            `К оплате: *${data.price} ₽*\n\n` +
            `📍 Номер: \`+79023916402\`\n` +
            `🏦 Банк: *Сбер-Банк*\n` +
            `💬 Комментарий: \`ID ${msg.from.id}\`\n\n` +
            `_Нажми кнопку после перевода!_`, 
            { parse_mode: 'Markdown', reply_markup: keyboard }
        );
    }
});

// --- CALLBACK ОБРАБОТКА (КНОПКИ) ---
bot.on('callback_query', (query) => {
    const parts = query.data.split('_');
    const action = parts[0];

    if (action === 'check') {
        const [_, orderId, userId, amount, price] = parts;
        bot.sendMessage(query.message.chat.id, "⏳ Ожидайте... Админ проверяет перевод.");
        
        bot.sendMessage(ADMIN_ID, 
            `🔔 *ПОДТВЕРЖДЕНИЕ ОПЛАТЫ*\n\n` +
            `Юзер: @${query.from.username} (ID: ${userId})\n` +
            `Сумма: ${price} ₽\n` +
            `Товар: ${amount} L-coins\n` +
            `Заказ: #${orderId}`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ ПОДТВЕРДИТЬ", callback_data: `confirm_${userId}_${amount}_${price}` }],
                    [{ text: "❌ ОТКЛОНИТЬ", callback_data: `decline_${userId}` }]
                ]
            }
        });
    }

    if (action === 'confirm' && query.from.id == ADMIN_ID) {
        const [_, userId, amount, price] = parts;
        db.prepare("UPDATE users SET coins = coins + ?, total_spent = total_spent + ? WHERE id = ?").run(amount, price, userId);
        bot.sendMessage(userId, `🎉 *Успех!* Вам начислено ${amount} L-coins!`);
        writeLog(`ОПЛАТА ПОДТВЕРЖДЕНА: Юзер ${userId} получил ${amount} L`);
        bot.answerCallbackQuery(query.id, { text: "Выдано!" });
    }
});

// Запуск сервера для Web App
const app = express();
app.use(express.static('public'));
app.listen(PORT, () => console.log(`Сервер на порту ${PORT}`));
// Старт
bot.onText(/\/start/, (msg) => {
    const userId = msg.from.id;
    const user = getUser(userId);

    if (!user) createUser(userId, msg.from.username || 'User');

    bot.sendMessage(msg.chat.id, `💎 *Luar Shop: L-coins*\n\nДобро пожаловать! Здесь вы можете купить игровую валюту.\n\n💰 Твой баланс: *${user ? user.l_coins : 0} L-coins*`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: "🛒 МАГАЗИН", web_app: { url: WEB_APP_URL } }]]
        }
    });
});

// Профиль текстом
bot.onText(/\/me/, (msg) => {
    const user = getUser(msg.from.id);
    if (user) {
        bot.sendMessage(msg.chat.id, `👤 *Профиль*\n\nID: \`${user.telegram_id}\`\nL-coins: *${user.l_coins}*\nБаланс: *${user.balance_rub} ₽*`, { parse_mode: 'Markdown' });
    }
});

// --- ОБРАБОТКА ЗАКАЗА ИЗ WEB APP ---
bot.on('web_app_data', (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        
        if (data.action === 'order_lcoins') {
            const orderMsg = `📦 *НОВЫЙ ЗАКАЗ*\n\n` +
                             `👤 От: @${msg.from.username || 'id' + msg.from.id}\n` +
                             `🆔 ID: \`${msg.from.id}\`\n` +
                             `💎 Товар: *${data.amount} L-coins*\n` +
                             `💰 Сумма: *${data.price} ₽*\n` +
                             `💳 Метод: *СБП*`;

            // Уведомление пользователю
            bot.sendMessage(msg.chat.id, orderMsg + `\n\n⚠️ *Инструкция:*\nПереведите сумму по номеру \`+79023916402\` и отправьте чек администратору.`, { parse_mode: 'Markdown' });

            // Уведомление админу
            bot.sendMessage(ADMIN_ID, `🔔 *Новый заказ в магазине!*\n\n` + orderMsg, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        console.error("Ошибка данных:", e);
    }
});

// --- АДМИН-КОМАНДЫ ---

// Выдать коины: /give [id] [количество]
bot.onText(/\/give (\d+) (\d+)/, (msg, match) => {
    if (msg.from.id !== ADMIN_ID) return;

    const targetId = parseInt(match[1]);
    const amount = parseInt(match[2]);

    try {
        db.prepare('UPDATE users SET l_coins = l_coins + ? WHERE telegram_id = ?').run(amount, targetId);
        bot.sendMessage(msg.chat.id, `✅ Игроку \`${targetId}\` начислено *${amount} L-coins*`, { parse_mode: 'Markdown' });
        bot.sendMessage(targetId, `💎 Вам начислено *${amount} L-coins*! Проверьте профиль.`);
    } catch (e) {
        bot.sendMessage(msg.chat.id, `❌ Ошибка: пользователь не найден.`);
    }
});

// Проверить базу: /stats
bot.onText(/\/stats/, (msg) => {
    if (msg.from.id !== ADMIN_ID) return;
    const count = db.prepare('SELECT COUNT(*) as total FROM users').get().total;
    bot.sendMessage(msg.chat.id, `📊 Всего пользователей в базе: *${count}*`, { parse_mode: 'Markdown' });
});

// --- СЕРВЕР ДЛЯ ВЕБ-ПРИЛОЖЕНИЯ ---
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`
    🚀 Бот запущен!
    📍 Web App URL: ${WEB_APP_URL}
    🛠 Admin ID: ${ADMIN_ID}
    `);
});
