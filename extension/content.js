// Helper function to calculate hyperlink ratios
function calculateHyperlinkRatios(hyperlinks, hostname) {
    const totalLinks = hyperlinks.length;
    if (totalLinks === 0) {
        return { ratio_int: 0, ratio_ext: 0, ratio_null: 0 };
    }
    
    const intLinks = hyperlinks.filter(link => link.href.includes(hostname)).length;
    const extLinks = hyperlinks.filter(link => !link.href.includes(hostname)).length;
    const nullLinks = hyperlinks.filter(link => !link.href).length;

    return {
        ratio_int: intLinks / totalLinks,
        ratio_ext: extLinks / totalLinks,
        ratio_null: nullLinks / totalLinks
    };
}

// Функция для извлечения текста со страницы
async function extractText() {
    try {
        const rawText = document.body ? document.body.innerText : "";
        return rawText.replace(/[^а-яА-Яa-zA-Z\s]/g, "").toLowerCase(); // Удаление лишних символов и приведение к нижнему регистру
    } catch (error) {
        console.error("Error extracting text:", error);
        return "";
    }
}

// Функция для извлечения признаков из текущей страницы
async function extractFeatures() {
    const url = window.location.href;

    const features = {};
    try {
        const urlObj = new URL(url);

        features.url = url;
        features.length_url = url.length;
        features.length_hostname = urlObj.hostname.length;
        features.ip = /^[0-9.]+$/.test(urlObj.hostname) ? 1 : 0;
        features.nb_dots = (url.match(/\./g) || []).length;
        features.nb_hyphens = (url.match(/-/g) || []).length;
        features.nb_at = (url.match(/@/g) || []).length;
        features.nb_qm = (url.match(/\?/g) || []).length;
        features.nb_and = (url.match(/&/g) || []).length;
        features.nb_or = (url.match(/or/g) || []).length;
        features.nb_eq = (url.match(/=/g) || []).length;
        features.nb_underscore = (url.match(/_/g) || []).length;
        features.nb_tilde = (url.match(/~/g) || []).length;
        features.nb_percent = (url.match(/%/g) || []).length;
        features.nb_slash = (url.match(/\//g) || []).length;
        features.nb_star = (url.match(/\*/g) || []).length;
        features.nb_colon = (url.match(/:/g) || []).length;
        features.nb_comma = (url.match(/,/g) || []).length;
        features.nb_semicolumn = (url.match(/;/g) || []).length;
        features.nb_dollar = (url.match(/\$/g) || []).length;
        features.nb_space = (url.match(/\s/g) || []).length;
        features.nb_www = (url.match(/www/g) || []).length;
        features.nb_com = (url.match(/\.com/g) || []).length;
        features.nb_dslash = (url.match(/\/\//g) || []).length;

        features.http_in_path = urlObj.pathname.includes("http") ? 1 : 0;
        features.https_token = url.includes("https") ? 1 : 0;
        features.ratio_digits_url =
            (url.match(/\d/g) || []).length / url.length || 0;
        features.ratio_digits_host =
            (urlObj.hostname.match(/\d/g) || []).length /
                urlObj.hostname.length || 0;
        features.punycode = url.includes("xn--") ? 1 : 0;
        features.port = urlObj.port ? 1 : 0;
        features.tld_in_path = /\.(com|net|org|info|co|io|biz|xyz|top|club|me|online|site|live|tv|name|us|cc|mobi|store|asia|press|club|pro|click|download|red|party|win|cloud|party|tech|app|work|space|fun|website|org|re|group|sh|in|cn|tv|site|website|ai)/.test(urlObj.pathname) ? 1 : 0;
        features.tld_in_subdomain =
            /\.(com|net|org|info|co|io|biz|xyz|top|club|me|online|site|live|tv|name|us|cc|mobi|store|asia|press|club|pro|click|download|red|party|win|cloud|party|tech|app|work|space|fun|website|org|re|group|sh|in|cn|tv|site|website|ai)/.test(urlObj.hostname.split(".")[0]) ? 1 : 0;

        const subdomains = urlObj.hostname.split(".").slice(0, -2);
        features.abnormal_subdomain = subdomains.length > 2 ? 1 : 0;
        features.nb_subdomains = subdomains.length;
        features.prefix_suffix = urlObj.hostname.includes("-") ? 1 : 0;

        const shorteningServices = [
            "bit.ly",
            "goo.gl",
            "tinyurl",
            "ow.ly",
            "is.gd",
            "t.co",
            "adf.ly",
            "buff.ly",
            "lnkd.in",
            "v.gd",
            "shorte.st",
            "short.ly",
            "chng.it",
            "zmurl.com",
            "cli.re",
            "u.to",
            "srnk.net",
            "qr.net",
            "linktr.ee",
            "rebrand.ly",
            "cut.ly",
            "lil.ly",
            "link.tl",
            "fastly.me",
            "qrurl.com",
            "shortlink.co",
            "short.io",
            "bc.vc",
            "go2l.ink",
            "linkzip.net",
            "fave.co",
            "plink.in",
            "clicky.me",
            "linkbuck.com",
            "shrtfly.com",
            "2t.do",
            "qrphi.com",
            "tiny.cc",
            "x.co",
            "lnk.to",
            "s.id",
            "lnk.run",
            "cutt.ly",
            "ltt.ly",
            "shot.ly",
            "j.mp",
            "bit.do",
            "cuturl.in",
            "link.sh",
            "qrcu.be",
            "b1z.co"
        ];
        features.shortening_service = shorteningServices.some((service) =>
            url.includes(service)
        )
            ? 1
            : 0;

        features.path_extension =
            /\.(php|html|aspx|jsp|cgi)/.test(urlObj.pathname) ? 1 : 0;

        features.length_words_raw = url.split(/[/.?=&-_]/).join("").length;
        features.char_repeat =
            /([a-zA-Z0-9])\1{2,}/.test(url) ? 1 : 0;

        const words = url.split(/[/.?=&-_]/).filter((word) => word.length > 0);
        features.shortest_words_raw = Math.min(...words.map((w) => w.length)) || 0;
        features.shortest_word_host =
            Math.min(...urlObj.hostname.split(".").map((w) => w.length)) || 0;
        features.shortest_word_path =
            Math.min(...urlObj.pathname.split("/").map((w) => w.length)) || 0;
        features.longest_words_raw = Math.max(...words.map((w) => w.length)) || 0;
        features.longest_word_host =
            Math.max(...urlObj.hostname.split(".").map((w) => w.length)) || 0;
        features.longest_word_path =
            Math.max(...urlObj.pathname.split("/").map((w) => w.length)) || 0;
        features.avg_words_raw =
            words.reduce((sum, w) => sum + w.length, 0) / words.length || 0;
        features.avg_word_host =
            urlObj.hostname.split(".").reduce((sum, w) => sum + w.length, 0) /
                urlObj.hostname.split(".").length || 0;
        features.avg_word_path =
            urlObj.pathname.split("/").reduce((sum, w) => sum + w.length, 0) /
                urlObj.pathname.split("/").length || 0;

        features.phish_hints =
            /(login|secure|account|bank|update|payment|password|verify|safety|security|confirm|personal|details|info|registration|signin|signout|logout|auth|authentication|credit|card|billing|verify|validate|login|subscribe|recovery|change|reset|profile|confirm|alert|alerting|security|transaction|check|alert|request|verification|secure|protection|encrypted|login|support|help|contact|customer|service|statement|confirm|receipt|purchase|sale|telegram|store|вход|аккаунт|безопасность|банковский|платеж|пароль|подтвердить|обновить|регистрировать|профиль|подтверждение|персональные|данные|оплата|восстановление|сменить|система|сервис|интернет-банкинг|деньги|платежи|покупка|счет|защита|перевод|транзакция|кредит|оплата|сумма|списание|пользователь|подписка|сигнализация|поддержка|служба|обслуживание|проверить|проверка|информация|контакт|клиент|ставка|возврат|активировать|обработка|финансовые|настройки|ошибка|активность|реквизиты|пожертвование|покупатель|оповещение|активировать|скачать)/.test(url) ? 1 : 0;
        features.domain_in_brand = /sberbank|tinkoff|vtb|alfabank|raiffeisen|gazprombank|rosbank|ozon|wildberries|yandexmarket|market.yandex|citilink|mvideo|eldorado|yandex|mail|mail.ru|vk|vkontakte|rambler|megafon|mts|beeline|tele2|roscosmos|gosuslugi|nalog|pfr|mvd|mos|kremlin|pochta|cdek|boxberry|dpd|amazon|paypal|google|microsoft|apple|facebook|instagram|whatsapp|netflix|tesla|nike|adidas|samsung|huawei|sony|coca-cola|pepsi|mcdonalds|starbucks|burgerking|twitter|youtube|linkedin|ebay|alibaba|tiktok|snapchat|zoom|uber|lyft|airbnb|pinterest|walmart|target|costco|dell|hp|lenovo|nvidia|amd|intel|oracle|ibm|sap|salesforce|adobe|spotify|slack|github|bitbucket|dropbox|box|icloud|drive|onedrive|skype|outlook|hotmail|yahoo|baidu|jd|tencent|wechat|xiaomi|oppo|vivo|realme|poco|bmw|audi|mercedes|toyota|honda|ford|chevrolet|volkswagen|lexus|nissan|hyundai|kia|subaru|mazda|ferrari|lamborghini|porsche|bentley|rolls-royce|bugatti|telegram/.test(
            urlObj.hostname
        )
            ? 1
            : 0;
        features.brand_in_subdomain = /sberbank|tinkoff|vtb|alfabank|raiffeisen|gazprombank|rosbank|ozon|wildberries|yandexmarket|market.yandex|citilink|mvideo|eldorado|yandex|mail|mail.ru|vk|vkontakte|rambler|megafon|mts|beeline|tele2|roscosmos|gosuslugi|nalog|pfr|mvd|mos|kremlin|pochta|cdek|boxberry|dpd|amazon|paypal|google|microsoft|apple|facebook|instagram|whatsapp|netflix|tesla|nike|adidas|samsung|huawei|sony|coca-cola|pepsi|mcdonalds|starbucks|burgerking|twitter|youtube|linkedin|ebay|alibaba|tiktok|snapchat|zoom|uber|lyft|airbnb|pinterest|walmart|target|costco|dell|hp|lenovo|nvidia|amd|intel|oracle|ibm|sap|salesforce|adobe|spotify|slack|github|bitbucket|dropbox|box|icloud|drive|onedrive|skype|outlook|hotmail|yahoo|baidu|jd|tencent|wechat|xiaomi|oppo|vivo|realme|poco|bmw|audi|mercedes|toyota|honda|ford|chevrolet|volkswagen|lexus|nissan|hyundai|kia|subaru|mazda|ferrari|lamborghini|porsche|bentley|rolls-royce|bugatti|telegram/.test(
            subdomains.join(".")
        )
            ? 1
            : 0;
        features.brand_in_path =
            /(sberbank|tinkoff|vtb|alfabank|raiffeisen|gazprombank|rosbank|ozon|wildberries|yandexmarket|market.yandex|citilink|mvideo|eldorado|yandex|mail|mail.ru|vk|vkontakte|rambler|megafon|mts|beeline|tele2|roscosmos|gosuslugi|nalog|pfr|mvd|mos|kremlin|pochta|cdek|boxberry|dpd|amazon|paypal|google|microsoft|apple|facebook|instagram|whatsapp|netflix|tesla|nike|adidas|samsung|huawei|sony|coca-cola|pepsi|mcdonalds|starbucks|burgerking|twitter|youtube|linkedin|ebay|alibaba|tiktok|snapchat|zoom|uber|lyft|airbnb|pinterest|walmart|target|costco|dell|hp|lenovo|nvidia|amd|intel|oracle|ibm|sap|salesforce|adobe|spotify|slack|github|bitbucket|dropbox|box|icloud|drive|onedrive|skype|outlook|hotmail|yahoo|baidu|jd|tencent|wechat|xiaomi|oppo|vivo|realme|poco|bmw|audi|mercedes|toyota|honda|ford|chevrolet|volkswagen|lexus|nissan|hyundai|kia|subaru|mazda|ferrari|lamborghini|porsche|bentley|rolls-royce|bugatti)/.test(urlObj.pathname) ? 1 : 0;

        features.suspecious_tld =
            /\.(tk|ml|ga|cf|gq|xyz|top|club|work|space|win|date|party|online|site|download|bid|info|name|co|shop|icu|city|cc|pro|press|host|win|mobi|cf|pw|asia|io|link|cloud|tk|live|party|buzz|vip|rocks|church|info|click|website|run|fit|)$/.test(urlObj.hostname) ? 1 : 0;

        // Hyperlink-related features
        const hyperlinks = Array.from(document.links);
        features.nb_hyperlinks = hyperlinks.length || 0;

        const hyperlinkRatios = calculateHyperlinkRatios(hyperlinks, urlObj.hostname);
        features.ratio_intHyperlinks = hyperlinkRatios.ratio_int;
        features.ratio_extHyperlinks = hyperlinkRatios.ratio_ext;
        features.ratio_nullHyperlinks = hyperlinkRatios.ratio_null;

        // External CSS files
        const externalCSS = Array.from(document.styleSheets).filter(sheet => sheet.href);
        features.nb_extCSS = externalCSS.length || 0;

        // iFrame, popup window, and right-click features
        features.iframe = document.getElementsByTagName("iframe").length > 0 ? 1 : 0;
        features.popup_window = document.body.innerHTML.includes("window.open") ? 1 : 0;
        features.right_clic = document.oncontextmenu ? 1 : 0;

    } catch (err) {
        console.error("Error extracting features:", err);
    }
    return features;
}

// Инициализация
(async function initExtraction() {
    try {
        // Извлекаем текст
        const rawText = await extractText();
        chrome.runtime.sendMessage({ type: "text", text: rawText });
        console.log("Text sent to background script.");

        // Извлекаем признаки
        const features = await extractFeatures();
        chrome.runtime.sendMessage({ type: "features", features });
        console.log("Features sent to background script.");
    } catch (error) {
        console.error("Error during extraction:", error);
    }
})();