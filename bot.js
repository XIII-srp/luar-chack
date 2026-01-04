require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const express = require('express');

// ===== КОНФИГУРАЦИЯ =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_ID = 1484129008; // Твой ID установлен
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const db = new Database('database.db');
const app = express();

// База данных
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT,
        coins INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0
    )
`);

// Функция для логов
function writeLog(text) {
    fs.appendFileSync('logs.txt', `[${new Date().toLocaleString()}] ${text}\n`);
}

// Команда /start
bot.onText(/\/start/, (msg) => {
    // Регистрируем юзера если его нет
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(msg.from.id);
    if (!user) {
        db.prepare("INSERT INTO users (id, username) VALUES (?, ?)").run(msg.from.id, msg.from.username || 'User');
    }

    bot.sendMessage(msg.chat.id, `🔴 *LUAR SHOP — L-COINS*\n\n1 L-coin = 1 ₽\nНажми кнопку, чтобы войти в магазин.`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: "🔥 МАГАЗИН И ПРОФИЛЬ", web_app: { url: WEB_APP_URL } }]]
        }
    });
});

// ПРИЕМ ДАННЫХ ИЗ ПРИЛОЖЕНИЯ
bot.on('web_app_data', (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        
        if (data.action === 'pay_sbp') {
            const orderId = Math.floor(Math.random() * 90000) + 10000;

            // Сообщение пользователю в чат
            bot.sendMessage(msg.chat.id, 
                `📝 *ЗАКАЗ #${orderId} ОТПРАВЛЕН*\n\n` +
                `Сумма: *${data.price} ₽*\n` +
                `Товар: *${data.amount} L-coins*\n\n` +
                `⏳ Ожидайте, админ проверяет оплату.`, { parse_mode: 'Markdown' });

            // Уведомление тебе (админу)
            bot.sendMessage(ADMIN_ID, 
                `🚨 *НОВЫЙ ЧЕК (#${orderId})*\n\n` +
                `Юзер: @${msg.from.username || 'n/a'}\n` +
                `ID: \`${msg.from.id}\`\n` +
                `К оплате: *${data.price} ₽*\n` +
                `Товар: *${data.amount} L*`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ ПОДТВЕРДИТЬ", callback_data: `confirm_${msg.from.id}_${data.amount}_${data.price}` }],
                        [{ text: "❌ ОТКЛОНИТЬ", callback_data: `cancel` }]
                    ]
                }
            });
            writeLog(`Заказ #${orderId} от ${msg.from.id}`);
        }
    } catch (e) {
        console.error("Ошибка обработки данных:", e);
    }
});

// Кнопка подтверждения у админа
bot.on('callback_query', (query) => {
    const parts = query.data.split('_');
    if (parts[0] === 'confirm') {
        const [_, userId, amount, price] = parts;
        db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(amount, userId);
        
        bot.sendMessage(userId, `🚀 *ОПЛАТА ПОДТВЕРЖДЕНА!*\nБаланс пополнен на: +${amount} L-coins.`);
        bot.answerCallbackQuery(query.id, { text: "Баланс пополнен!" });
        bot.editMessageText(`✅ Выдано ${amount} L юзеру ${userId}`, {
            chat_id: ADMIN_ID,
            message_id: query.message.message_id
        });
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Бот запущен на порту ${PORT}`));
