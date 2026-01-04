<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🪙 Luar Chack</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        }
        
        .container {
            max-width: 600px;
        }
        
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        p {
            font-size: 1.2em;
            line-height: 1.6;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .feature-icon {
            font-size: 40px;
            margin-bottom: 15px;
        }
        
        .btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
            transition: transform 0.3s;
        }
        
        .btn:hover {
            transform: translateY(-3px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🪙 Luar Chack</h1>
        <p>Магазин L-Coin для вашего Discord сервера</p>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">💰</div>
                <h3>Пополнение баланса</h3>
                <p>Купите L-Coin для покупок на сервере</p>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <h3>Быстрая выдача</h3>
                <p>Мгновенное зачисление после оплаты</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🛡️</div>
                <h3>Безопасно</h3>
                <p>Защищенные платежи через ЮMoney</p>
            </div>
        </div>
        
        <a href="/shop" class="btn">Открыть магазин</a>
    </div>
</body>
</html>        <title>🎮 Discord Shop</title>
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
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .app-container {
                width: 100%;
                max-width: 400px;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.5s ease-out;
            }
            
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }
            
            .logo-icon {
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
            
            .main-content {
                padding: 40px 25px;
                text-align: center;
            }
            
            .construction-icon {
                font-size: 70px;
                margin-bottom: 20px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
            
            h2 {
                color: #333;
                font-size: 24px;
                margin-bottom: 15px;
            }
            
            .status-text {
                color: #666;
                font-size: 16px;
                line-height: 1.5;
                margin-bottom: 25px;
            }
            
            .progress-container {
                background: #f8f9ff;
                border-radius: 15px;
                padding: 20px;
                margin: 30px 0;
                border: 2px solid #e2e8f0;
            }
            
            .progress-bar {
                height: 12px;
                background: #e2e8f0;
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2);
                border-radius: 6px;
                width: 65%;
                animation: loading 2s infinite;
            }
            
            @keyframes loading {
                0%, 100% { width: 65%; }
                50% { width: 66%; }
            }
            
            .progress-text {
                color: #718096;
                font-size: 14px;
            }
            
            .footer {
                padding: 20px;
                background: #f8f9ff;
                border-top: 2px solid #e2e8f0;
            }
            
            .tg-button {
                width: 100%;
                padding: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .tg-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
            }
            
            @media (max-width: 420px) {
                .app-container {
                    border-radius: 15px;
                }
                
                .main-content {
                    padding: 30px 20px;
                }
                
                h1 { font-size: 24px; }
                h2 { font-size: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="app-container">
            <div class="header">
                <div class="logo-icon">🎮</div>
                <h1>Discord Shop</h1>
                <p>Эксклюзивные товары для вашего сервера</p>
            </div>
            
            <div class="main-content">
                <div class="construction-icon">🚧</div>
                <h2>Магазин в разработке</h2>
                
                <p class="status-text">
                    Мы создаем для вас уникальный магазин с эксклюзивными ролями, 
                    премиум-доступом и другими крутыми фишками для Discord сервера.
                </p>
                
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <p class="progress-text">Разработка завершена на 65%</p>
                </div>
                
                <p>Ожидайте запуск в ближайшее время! 🚀</p>
            </div>
            
            <div class="footer">
                <button class="tg-button" onclick="window.Telegram.WebApp.close()">
                    Закрыть магазин
                </button>
            </div>
        </div>
        
        <script>
            // Инициализация Telegram Mini App
            const tg = window.Telegram.WebApp;
            
            // Расширяем на весь экран
            tg.expand();
            
            // Показываем кнопку "Назад"
            tg.BackButton.show();
            tg.BackButton.onClick(() => {
                tg.close();
            });
            
            // Готовность приложения
            tg.ready();
            
            console.log('✅ Discord Shop Mini App запущен!');
        </script>
    </body>
    </html>
    `);
});

// === КОМАНДЫ БОТА ===
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'друг';
    
    console.log(`👤 ${firstName} запустил бота`);
    
    const keyboard = {
        inline_keyboard: [[
            {
                text: '🛍️ ОТКРЫТЬ МАГАЗИН',
                web_app: { url: WEB_APP_URL }
            }
        ]]
    };
    
    bot.sendMessage(chatId, `🎮 Привет, ${firstName}!\n\nДобро пожаловать в магазин Discord сервера!\n\nНажмите кнопку ниже, чтобы открыть магазин:`, {
        reply_markup: keyboard
    });
});

bot.onText(/\/shop/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Открываю магазин...', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🚀 ОТКРЫТЬ МАГАЗИН',
                    web_app: { url: WEB_APP_URL }
                }
            ]]
        }
    });
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        `🆘 Помощь по боту:\n\n` +
        `/start - Главное меню\n` +
        `/shop - Быстрый доступ к магазину\n` +
        `/help - Эта справка\n\n` +
        `🌐 Web App URL: ${WEB_APP_URL}\n\n` +
        `По вопросам: @ваш_ник`
    );
});

// === ЗАПУСК СЕРВЕРА ===
app.listen(PORT, () => {
    console.log('\n✨ =========================================== ✨');
    console.log('✅ Сервер запущен на порту 3000');
    console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
    console.log('🤖 Бот готов к работе!');
    console.log('✨ =========================================== ✨\n');
    console.log('📝 ДЕЙСТВИЯ:');
    console.log('1. Добавьте этот URL в @BotFather:');
    console.log(`   ${WEB_APP_URL}`);
    console.log('2. Отправьте /start вашему боту в Telegram');
    console.log('3. Нажмите кнопку "ОТКРЫТЬ МАГАЗИН"');
    console.log('\n👉 Оставьте это окно открытым!');
    console.log('👉 Оставьте окно с serveo.net тоже открытым!\n');
});

// === ОБРАБОТКА ОШИБОК ===
bot.on('polling_error', (error) => {
    console.log('⚠️ Ошибка бота:', error.message);
});

process.on('SIGINT', () => {
    console.log('\n👋 Завершение работы...');
    process.exit();
});
