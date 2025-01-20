import pandas as pd
import numpy as np
from joblib import load
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, f1_score
import time
from tabulate import tabulate

# Загрузка TF-IDF данных
vectorizer, tfidf_matrix, df = load('dataset.joblib')

df.loc[len(df)//2:, 'fraud'] = 1

# Разделение данных на признаки (X) и целевую переменную (y)
X = tfidf_matrix
y = df['fraud']  

# Разделение данных на обучающую и тестовую выборки
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Определение алгоритмов и гиперпараметров
models = [
    ('SVM', SVC(), {
        'kernel': ['rbf', 'poly', 'linear'],
        'C': [0.1, 1, 10],
        'gamma': ['scale', 0.1, 1],
        'degree': [2, 3]
    }),
    ('Logistic Regression', LogisticRegression(max_iter=1000), {
        'C': [0.1, 1, 10],
        'solver': ['lbfgs', 'saga'],
        'penalty': ['l2', 'none']
    }),
    ('Random Forest', RandomForestClassifier(random_state=42), {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 10, 20],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }),
    ('MLP', MLPClassifier(max_iter=2000, random_state=42), {
        'hidden_layer_sizes': [(50,), (100,)],
        'activation': ['relu', 'tanh'],
        'solver': ['adam', 'sgd'],
        'alpha': [0.0001, 0.001]
    })
]

results = []

# Итерация по моделям
for name, model, param_grid in models:
    print(f'Обучение модели: {name}')
    start_time = time.time()

    grid_search = GridSearchCV(model, param_grid, cv=5, scoring='f1', n_jobs=-1)
    grid_search.fit(X_train, y_train)

    training_time = time.time() - start_time

    # Прогнозирование
    start_time = time.time()
    y_pred = grid_search.best_estimator_.predict(X_test)
    prediction_time = time.time() - start_time

    # Метрики
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    # Результаты
    results.append({
        'Model': name,
        'Best Params': grid_search.best_params_,
        'Accuracy': accuracy,
        'F1-Score': f1,
        'Training Time (s)': training_time,
        'Prediction Time (s)': prediction_time
    })

    print(f'{name} завершена. Лучшие параметры: {grid_search.best_params_}\n')

# Таблица сравнения
results_df = pd.DataFrame(results)
print(tabulate(results_df, headers='keys', tablefmt='grid'))
