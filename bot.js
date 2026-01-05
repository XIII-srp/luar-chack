require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ===== CONFIG =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_ID = 1484129008; // Твой ID
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !WEB_APP_URL) {
    console.error('❌ Не заданы BOT_TOKEN или WEB_APP_URL в .env');
    process.exit(1);
}

// ===== DATABASE =====
const db = new Database('database.db');
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        telegram_id INTEGER PRIMARY KEY,
        username TEXT,
        balance INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// ===== UTILS =====
const formatRub = (amount) => `${amount} ₽`;

function getOrCreateUser(msg) {
    const id = msg.from.id;
    const username = msg.from.username || 'User';
    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
    if (!user) {
        db.prepare('INSERT INTO users (telegram_id, username) VALUES (?, ?)').run(id, username);
        user = { telegram_id: id, username, balance: 0 };
    }
    return user;
}

// ===== TELEGRAM BOT =====
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Старт с кнопкой МЕНЮ (Keyboard) для работы sendData
bot.onText(/\/start/, (msg) => {
    getOrCreateUser(msg);
    bot.sendMessage(
        msg.chat.id,
        `🛍 *Luar Chack Discord Shop*\n\n💰 Курс: *1 L-coin = 1 ₽*\n🔴 Используй кнопку ниже для входа:`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [[{ text: "🔥 МАГАЗИН И ПРОФИЛЬ", web_app: { url: WEB_APP_URL } }]],
                resize_keyboard: true
            }
        }
    );
});

// ОБРАБОТКА ДАННЫХ ИЗ МАГАЗИНА
bot.on('web_app_data', async (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        if (data.action === 'pay_sbp') {
            const orderId = Math.floor(Math.random() * 90000) + 10000;

            // 1. Юзеру
            await bot.sendMessage(msg.chat.id, 
                `📝 *ЗАКАЗ #${orderId} ОТПРАВЛЕН*\n\n` +
                `Сумма: *${data.price} ₽*\n` +
                `Товар: *${data.amount} L-coins*\n\n` +
                `⏳ Ожидайте подтверждения оплаты админом.`, { parse_mode: 'Markdown' });

            // 2. Админу (Тебе)
            await bot.sendMessage(ADMIN_ID, 
                `🚨 *НОВЫЙ ЧЕК (#${orderId})*\n\n` +
                `Юзер: @${msg.from.username || 'скрыт'}\n` +
                `ID: \`${msg.from.id}\`\n` +
                `К оплате: *${data.price} ₽*\n` +
                `Товар: *${data.amount} L*`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ ПОДТВЕРДИТЬ", callback_data: `confirm_${msg.from.id}_${data.amount}` }],
                        [{ text: "❌ ОТКЛОНИТЬ", callback_data: `cancel` }]
                    ]
                }
            });
        }
    } catch (e) {
        console.error('Ошибка данных:', e.message);
    }
});

// Кнопка подтверждения у админа
bot.on('callback_query', (query) => {
    const parts = query.data.split('_');
    if (parts[0] === 'confirm') {
        const [_, userId, amount] = parts;
        db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?').run(amount, userId);
        
        bot.sendMessage(userId, `🚀 *ОПЛАТА ПРИНЯТА!*\nБаланс пополнен на: +${amount} L-coins.`);
        bot.editMessageText(`✅ Выдано ${amount} L юзеру ${userId}`, {
            chat_id: ADMIN_ID,
            message_id: query.message.message_id
        });
    }
});

// ===== EXPRESS SERVER =====
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
