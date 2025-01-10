// Слушаем сообщения от background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "show_alert") {
        const { probability, digit_probability, text_probability } = message.data;

        // Формируем сообщение для отображения
        const alertMessage = `
🚨 Предупреждение о возможном мошенничестве! 🚨

🔴 Общая вероятность: ${probability}%
🔢 Вероятность на основе URL: ${digit_probability}%
📄 Вероятность на основе текста: ${text_probability}%

Пожалуйста, будьте осторожны при взаимодействии с этим сайтом!
        `;

        // Выводим предупреждение пользователю
        alert(alertMessage);

        // Логируем данные в консоль
        console.log("Alert shown with data:", {
            probability,
            digit_probability,
            text_probability
        });
    }
});
