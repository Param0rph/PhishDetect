from flask import Flask, request, jsonify
import pickle
import logging
from flask_cors import CORS
import re
from langdetect import detect
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
import nltk
import torch
from transformers import BertTokenizer, BertForSequenceClassification

# Инициализация Flask
app = Flask(__name__)
CORS(app)

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Загрузка моделей
with open('mlp_model.pkl', 'rb') as model_file:
    mlp_model = pickle.load(model_file)

with open('scaler.pkl', 'rb') as scaler_file:
    scaler = pickle.load(scaler_file)

# Загрузка TinyBERT модели и токенизатора с map_location='cpu'
tinybert_model = torch.load('tinybert_model_cpu.pkl', map_location=torch.device('cpu'))
tokenizer = torch.load('tokenizer_cpu.pkl', map_location=torch.device('cpu'))

# Загрузка NLTK-ресурсов
nltk.download('stopwords')
nltk_stopwords = set(stopwords.words('russian'))
snowball = SnowballStemmer('russian')

# Список признаков
FEATURE_NAMES = [
    "length_url", "length_hostname", "ip", "nb_dots", "nb_hyphens", "nb_at",
    "nb_qm", "nb_and", "nb_or", "nb_eq", "nb_underscore", "nb_tilde",
    "nb_percent", "nb_slash", "nb_star", "nb_colon", "nb_comma",
    "nb_semicolumn", "nb_dollar", "nb_space", "nb_www", "nb_com", "nb_dslash",
    "http_in_path", "https_token", "ratio_digits_url", "ratio_digits_host",
    "punycode", "port", "tld_in_path", "tld_in_subdomain",
    "abnormal_subdomain", "nb_subdomains", "prefix_suffix",
    "shortening_service", "path_extension", "length_words_raw", "char_repeat",
    "shortest_words_raw", "shortest_word_host", "shortest_word_path",
    "longest_words_raw", "longest_word_host", "longest_word_path",
    "avg_words_raw", "avg_word_host", "avg_word_path", "phish_hints", "brand_in_path",
    "suspecious_tld", "nb_hyperlinks", "ratio_intHyperlinks",
    "ratio_extHyperlinks", "ratio_nullHyperlinks", "nb_extCSS",
    "iframe", "popup_window", "right_clic"
]

# Глобальные переменные для хранения данных
features_data = None
text_data = None

# Функция обработки текста
def process_text(text):
    text = re.sub(r'[^а-яА-Яa-zA-Z\s]', '', text)
    text = text.lower()

    # Определение языка текста
    try:
        lang = detect(text)
    except:
        lang = 'unknown'

    if lang == 'ru':
        tokens = text.split()
        tokens = [snowball.stem(word) for word in tokens if word not in nltk_stopwords]
    elif lang == 'en':
        tokens = text.split()
        tokens = [word for word in tokens if word not in nltk_stopwords]
    else:
        logger.warning("Не удалось определить язык текста.")
        tokens = []

    return ' '.join(tokens)

@app.route('/analyze', methods=['POST'])
def analyze():
    global features_data, text_data

    logger.info("Received a request for analysis.")
    data = request.json

    request_type = data.get("type")
    logger.info(f"Request type: {request_type}")

    # Обработка запроса типа "features"
    if request_type == "features":
        features = data.get("data", {})
        if not features:
            return jsonify({"error": "Feature data is missing or empty."}), 400
        features_data = features
        logger.info(f"Received features data: {features}")

    # Обработка запроса типа "text"
    elif request_type == "text":
        raw_text = data.get("data", "")
        if not raw_text:
            return jsonify({"error": "Text data is missing or empty."}), 400
        text_data = raw_text
        logger.info(f"Received text data: {raw_text}")

    else:
        return jsonify({"error": "Invalid request type. Must be 'features' or 'text'."}), 400

    # Проверка, что данные получены для обоих типов запросов
    if features_data and text_data:
        logger.info("Both feature and text data received. Performing analysis.")
        
        # Обработка признаков
        feature_vector = [features_data.get(name, 0) for name in FEATURE_NAMES]
        scaled_features = scaler.transform([feature_vector])
        digit_prediction = mlp_model.predict(scaled_features)
        digit_probability = mlp_model.predict_proba(scaled_features)[0][1]
        
        logger.info(f"Digit Prediction: {digit_prediction[0]}, Probability: {digit_probability:.4f}")

        # Обработка текста с использованием TinyBERT
        processed_text = process_text(text_data)
        inputs = tokenizer(processed_text, return_tensors="pt", padding=True, truncation=True, max_length=256)
        inputs = {key: value.to(tinybert_model.device) for key, value in inputs.items()}
        with torch.no_grad():
            outputs = tinybert_model(**inputs)
            logits = outputs.logits
        text_probability = torch.softmax(logits, dim=-1).cpu().numpy()[0][0]  # Вероятность фишинга ASFIHSFDIUHASFIUHD

        logger.info(f"Text Prediction: {int(text_probability > 0.5)}, Probability: {text_probability:.4f}")

        # Вычисление средней вероятности
        average_probability = (digit_probability + text_probability) / 2

        # Определение окончательного предсказания
        prediction = average_probability >= 0.5

        # Отправка ответа
        response = {
            "is_phishing": bool(prediction),
            "average_probability": float(average_probability),
            "digit_probability": float(digit_probability),
            "text_probability": float(text_probability)
        }

        # Очистка глобальных данных
        features_data = None
        text_data = None
        
        logger.info(f"Sent response: {response}")
        return jsonify(response)

    # Если данные не получены для обоих типов запросов
    logger.info("Waiting for both feature and text data.")
    return jsonify({"status": "waiting"}), 200


if __name__ == '__main__':
    logger.info("Starting server on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
