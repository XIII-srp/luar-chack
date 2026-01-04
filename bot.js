require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const express = require('express');

// ===== КОНФИГУРАЦИЯ =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_ID = 1484129008; // ⚠️ ОБЯЗАТЕЛЬНО ЗАМЕНИ НА СВОЙ ID (узнать в @userinfobot)
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const db = new Database('database.db');
const app = express();

// ===== БАЗА ДАННЫХ =====
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        coins INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0
    )
`);

// Логирование
function writeLog(text) {
    const entry = `[${new Date().toLocaleString()}] ${text}\n`;
    fs.appendFileSync('logs.txt', entry);
    console.log(entry);
}

// ===== ЛОГИКА БОТА =====
bot.onText(/\/start/, (msg) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(msg.from.id);
    if (!user) {
        db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run(msg.from.id, msg.from.username || 'User');
    }
    
    bot.sendMessage(msg.chat.id, `💎 *Luar Shop* — Пополнение L-coins\n\n💰 Курс: *1 L-coin = 1 ₽*\n💳 Оплата: *СБП (Сбербанк)*`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: "🛒 МАГАЗИН", web_app: { url: WEB_APP_URL } }]]
        }
    });
});

// Получение данных об оплате из Web App
bot.on('web_app_data', (msg) => {
    const data = JSON.parse(msg.web_app_data.data);
    
    if (data.action === 'pay_sbp') {
        const orderId = Math.floor(Math.random() * 90000) + 10000;
        
        // Сообщение пользователю в чат
        bot.sendMessage(msg.chat.id, 
            `✅ *Заказ #${orderId} оформлен!*\n\n` +
            `Сумма: *${data.price} ₽*\n` +
            `Товар: *${data.amount} L-coins*\n\n` +
            `Администратор проверяет ваше пополнение. Ожидайте начисления.`, 
            { parse_mode: 'Markdown' }
        );

        // Уведомление админу
        bot.sendMessage(ADMIN_ID, 
            `🔔 *НОВЫЙ ЗАКАЗ #${orderId}*\n\n` +
            `Юзер: @${msg.from.username} (ID: \`${msg.from.id}\`)\n` +
            `Сумма: *${data.price} ₽*\n` +
            `Товар: *${data.amount} L-coins*`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ ПОДТВЕРДИТЬ", callback_data: `confirm_${msg.from.id}_${data.amount}_${data.price}` }],
                    [{ text: "❌ ОТКЛОНИТЬ", callback_data: `decline_${msg.from.id}` }]
                ]
            }
        });
        writeLog(`Заказ #${orderId} от ${msg.from.id} на ${data.price}р`);
    }
});

// Обработка кнопок админа
bot.on('callback_query', (query) => {
    const [action, userId, amount, price] = query.data.split('_');

    if (action === 'confirm' && query.from.id == ADMIN_ID) {
        db.prepare("UPDATE users SET coins = coins + ?, total_spent = total_spent + ? WHERE id = ?").run(amount, price, userId);
        
        bot.sendMessage(userId, `🎉 *Оплата принята!*\nНа ваш баланс зачислено: *${amount} L-coins*.`);
        bot.editMessageText(`✅ Оплата подтверждена. Выдано ${amount} L юзеру ${userId}`, {
            chat_id: ADMIN_ID,
            message_id: query.message.message_id
        });
        writeLog(`АДМИН ПОДТВЕРДИЛ: ${amount} L для ${userId}`);
    }
});

// ===== EXPRESS (СЕРВЕР) =====
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => writeLog(`Сервер запущен на порту ${PORT}`));
