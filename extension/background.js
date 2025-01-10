chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in background.js:", message);

    if (message.type === "features" || message.type === "text") {
        const url = "http://127.0.0.1:5000/analyze";

        const body = {
            type: message.type,
            data: message.type === "features" ? message.features : message.text
        };

        console.log("Sending data to server:", body);

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        .then(data => {
            console.log(`Received ${message.type} response from server:`, data);

            const probability = Math.round(data.average_probability * 100);
            const digit_probability = Math.round(data.digit_probability * 100);
            const text_probability = Math.round(data.text_probability * 100);

            console.log("Setting badge text:", probability, "%");
            chrome.action.setBadgeText({ text: `${probability}%`, tabId: sender.tab.id });
            chrome.action.setBadgeBackgroundColor({
                color: probability > 75 ? "#FF0000" : probability > 25 ? "#FFFF00" : "#00FF00"
            });

            console.log("Changed color successfully.");

            if (probability > 0) {
                chrome.storage.sync.get(['showAlertAbove85'], (result) => {
                    const showAlertAbove85 = result.showAlertAbove85 ?? false;

                    if (!showAlertAbove85 || (showAlertAbove85 && probability > 85)) {
                        if (sender.tab && sender.tab.id !== undefined) {
                            console.log("Sending message to alert.js with data:", { probability, digit_probability, text_probability });

                            chrome.tabs.sendMessage(sender.tab.id, {
                                type: "show_alert",
                                data: {
                                    probability,
                                    digit_probability,
                                    text_probability
                                }
                            });
                        } else {
                            console.error("No tabId found in sender.");
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error(`Error sending ${message.type} to server:`, error);
        });
    }
});
