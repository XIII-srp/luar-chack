require('dotenv').config();

const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');

// ===== CONFIG =====
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !WEB_APP_URL) {
    console.error('❌ Не заданы BOT_TOKEN или WEB_APP_URL');
    process.exit(1);
}

// ===== EXPRESS =====
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== DATABASE =====
const db = new Database('database.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        telegram_id INTEGER PRIMARY KEY,
        username TEXT,
        balance INTEGER DEFAULT 0, -- копейки
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

// ===== UTILS =====
const formatRub = (kopeks) =>
    (kopeks / 100).toFixed(2).replace('.', ',') + ' ₽';

function getOrCreateUser(msg) {
    const id = msg.from.id;
    const username = msg.from.username || null;

    let user = db
        .prepare('SELECT * FROM users WHERE telegram_id = ?')
        .get(id);

    if (!user) {
        db.prepare(
            'INSERT INTO users (telegram_id, username) VALUES (?, ?)'
        ).run(id, username);

        user = { telegram_id: id, username, balance: 0 };
    }

    return user;
}

// ===== TELEGRAM BOT =====
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// /start
bot.onText(/\/start/, (msg) => {
    const user = getOrCreateUser(msg);

    bot.sendMessage(
        msg.chat.id,
        `🛍 *Luar Chack Discord Shop*\n\n💳 Баланс: *${formatRub(user.balance)}*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🛒 ОТКРЫТЬ МАГАЗИН',
                        web_app: { url: WEB_APP_URL }
                    }
                ]]
            }
        }
    );
});

// /balance
bot.onText(/\/balance/, (msg) => {
    const user = getOrCreateUser(msg);

    bot.sendMessage(
        msg.chat.id,
        `💳 Ваш баланс: ${formatRub(user.balance)}`
    );
});

// /addrub 100 (тест)
bot.onText(/\/addrub (\d+)/, (msg, match) => {
    const rub = parseInt(match[1], 10);
    const kopeks = rub * 100;

    db.prepare(
        'UPDATE users SET balance = balance + ? WHERE telegram_id = ?'
    ).run(kopeks, msg.from.id);

    bot.sendMessage(
        msg.chat.id,
        `✅ Начислено ${rub} ₽`
    );
});

// ===== SERVER =====
app.listen(PORT, () => {
    console.log('====================================');
    console.log('🚀 Luar Chack Shop запущен');
    console.log(`🌐 Web App: ${WEB_APP_URL}`);
    console.log('💳 Валюта: RUB (копейки)');
    console.log('====================================');
});

// ===== ERRORS =====
bot.on('polling_error', (err) => {
    console.error('⚠️ Telegram error:', err.message);
});
