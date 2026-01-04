require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_ID = 1484129008; // ⚠️ ЗАМЕНИТЕ НА ВАШ ID
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const db = new Database('database.db');
const app = express();

db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, coins INTEGER DEFAULT 0, total_spent INTEGER DEFAULT 0)`);

function writeLog(text) {
    fs.appendFileSync('logs.txt', `[${new Date().toLocaleString()}] ${text}\n`);
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `🔴 *LUAR SHOP — МАГАЗИН L-COIN*\n\n1 L-coin = 1 ₽\nРеквизиты внутри приложения.`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: "🔥 ВОЙТИ В МАГАЗИН", web_app: { url: WEB_APP_URL } }]] }
    });
});

bot.on('web_app_data', (msg) => {
    try {
        const data = JSON.parse(msg.web_app_data.data);
        if (data.action === 'pay_sbp') {
            const orderId = Math.floor(Math.random() * 90000) + 10000;
            
            // Сообщение пользователю
            bot.sendMessage(msg.chat.id, 
                `📝 *ЗАКАЗ #${orderId} ОФОРМЛЕН*\n\n` +
                `Сумма: *${data.price} ₽*\n` +
                `Товар: *${data.amount} L-coins*\n\n` +
                `⏳ Ожидайте подтверждения от админа.`, { parse_mode: 'Markdown' });

            // Админу
            bot.sendMessage(ADMIN_ID, `🚨 *НОВЫЙ ЧЕК ПРОВЕРКИ*\nЮзер: @${msg.from.username}\nID: \`${msg.from.id}\`\nСумма: ${data.price} ₽\nТовар: ${data.amount} L`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ ПОДТВЕРДИТЬ", callback_data: `confirm_${msg.from.id}_${data.amount}_${data.price}` }],
                        [{ text: "❌ ОТКЛОНИТЬ", callback_data: `cancel` }]
                    ]
                }
            });
            writeLog(`Заказ #${orderId} от ${msg.from.id}`);
        }
    } catch (e) { console.log(e) }
});

bot.on('callback_query', (query) => {
    const [action, userId, amount, price] = query.data.split('_');
    if (action === 'confirm' && query.from.id == ADMIN_ID) {
        db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(amount, userId);
        bot.sendMessage(userId, `🚀 *ОПЛАТА ПРИНЯТА!*\nНачислено: +${amount} L-coins.`);
        bot.answerCallbackQuery(query.id, { text: "Готово!" });
        bot.deleteMessage(ADMIN_ID, query.message.message_id);
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Start on ${PORT}`));
