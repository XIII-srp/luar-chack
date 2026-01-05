require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const ADMIN_ID = 1484129008; // Твой ID
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const db = new Database('database.db');
const app = express();

// Инициализация БД
db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, coins INTEGER DEFAULT 0)`);

// Команда /start с ПРАВИЛЬНОЙ кнопкой
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `🔴 *LUAR SHOP*\n\n1 L-coin = 1 ₽\n\nИспользуй кнопку в меню или ниже:`, {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                [{ text: "🔥 ОТКРЫТЬ МАГАЗИН", web_app: { url: WEB_APP_URL } }]
            ],
            resize_keyboard: true
        }
    });
});

// ОБРАБОТКА ДАННЫХ (Сюда приходят данные после tg.sendData)
bot.on('service_message', (msg) => {
    if (msg.web_app_data) {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            const orderId = Math.floor(Math.random() * 90000) + 10000;

            // 1. Сообщение ПОКУПАТЕЛЮ
            bot.sendMessage(msg.chat.id, `✅ *Заказ #${orderId} отправлен!*\nСумма: ${data.price} ₽. Ожидайте подтверждения.`, { parse_mode: 'Markdown' });

            // 2. Сообщение АДМИНУ (Тебе)
            bot.sendMessage(ADMIN_ID, `🚨 *НОВЫЙ ЧЕК (#${orderId})*\n\nЮзер: @${msg.from.username || 'n/a'}\nID: \`${msg.from.id}\`\nСумма: *${data.price} ₽*\nТовар: *${data.amount} L*`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ ПОДТВЕРДИТЬ", callback_data: `confirm_${msg.from.id}_${data.amount}` }],
                        [{ text: "❌ ОТКЛОНИТЬ", callback_data: `decline` }]
                    ]
                }
            });
            console.log(`Заказ #${orderId} получен от ${msg.from.id}`);
        } catch (e) {
            console.error("Ошибка парсинга данных:", e);
        }
    }
});

// Кнопка подтверждения
bot.on('callback_query', (query) => {
    const parts = query.data.split('_');
    if (parts[0] === 'confirm') {
        const [_, userId, amount] = parts;
        db.prepare("UPDATE users SET coins = coins + ? WHERE id = ?").run(amount, userId);
        bot.sendMessage(userId, `🚀 *ОПЛАТА ПРИНЯТА!*\nЗачислено: +${amount} L-coins.`);
        bot.editMessageText(`✅ Выдано ${amount} L юзеру ${userId}`, { chat_id: ADMIN_ID, message_id: query.message.message_id });
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Бот и сервер запущены!`));
