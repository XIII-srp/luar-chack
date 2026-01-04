require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
const express = require('express');

// Конфигурация из .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_ID = 12345678; // ⚠️ ЗАМЕНИТЕ на свой ID (узнать можно в @userinfobot)
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const db = new Database('database.db');

// --- БАЗА ДАННЫХ ---
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        telegram_id INTEGER PRIMARY KEY,
        username TEXT,
        balance_rub REAL DEFAULT 0,
        l_coins INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function getUser(id) {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
}

function createUser(id, username) {
    db.prepare('INSERT INTO users (telegram_id, username) VALUES (?, ?)').run(id, username);
}

// --- КОМАНДЫ ПОЛЬЗОВАТЕЛЯ ---

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
            bot.sendMessage(msg.chat.id, orderMsg + `\n\n⚠️ *Инструкция:*\nПереведите сумму по номеру \`+79001234567\` и отправьте чек администратору.`, { parse_mode: 'Markdown' });

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
