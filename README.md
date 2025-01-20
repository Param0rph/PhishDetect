Программный модуль для выявления мошеннических веб-ресурсов на основе машинного обучения.

Этот репозиторий содержит код сервера и браузерного расширения для анализа веб-сайтов в реальном времени. Расширение собирает данные о сайте и отправляет их на сервер для анализа обученными моделями машинного обучения. В ответ сервер возвращает вероятность того, что сайт является фишинговым, и уведомляет пользователя.  

📂 Структура проекта  
server.py — код серверной части на Python.  
extension — код браузерного расширения на JavaScript для взаимодействия с сервером.  
Алгоритмы исследования — код для обучения и исследования алгоритмов моделей машинного обучения.
requirements.txt — список необходимых библиотек.  

⚙️ Установка и запуск сервера  

Клонируйте репозиторий:
`git clone https://github.com/your_username/anti-phishing-module.git`  
`cd anti-phishing-module`

Установите зависимости:
`pip install -r requirements.txt`

Запустите сервер:
`python server.py`

🌐 Установка браузерного расширения  
Перейдите в chrome://extensions/ в браузере Google Chrome.  
Включите режим разработчика (Developer mode).  
Нажмите Load unpacked и выберите папку с расширением.  
После установки расширение начнёт анализировать сайты, которые вы посещаете.  

🧠 Используемые модели:  
Для анализа текстов и URL-адресов использовались следующие модели машинного обучения:  

TinyBERT для анализа текстового содержимого страниц.  
Random Forest Classifier для анализа структурных признаков URL.  
  
Ссылка на модели: `https://drive.google.com/drive/folders/10oIYFJDF_rrpgru4l1cgiZSIeVVJbUZq?usp=sharing`  

Скачайте модели и поместите их в ту же папку, что и server.py.  

📜 Стек технологий
Python 3.12,
Flask,
Pickle,
Langdetect,
Re,
NLTK,
JavaScript,
Google Chrome API
