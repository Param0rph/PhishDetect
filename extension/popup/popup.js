document.addEventListener("DOMContentLoaded", () => {
    // Получаем текущий URL вкладки
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const url = tabs[0].url;
        document.getElementById('output').innerText = `URL: ${url}`;
    });

    // Загружаем состояние переключателя из chrome.storage
    const alertToggle = document.getElementById('alert-toggle');
    chrome.storage.sync.get(['showAlertAbove85'], (result) => {
        alertToggle.checked = result.showAlertAbove85 ?? false;
    });

    // Обновляем состояние переключателя в chrome.storage при изменении
    alertToggle.addEventListener('change', () => {
        chrome.storage.sync.set({ showAlertAbove85: alertToggle.checked });
    });
});
