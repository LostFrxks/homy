# Homy

Полный стек - Django + DRF + SimpleJWT (backend) и Vite + React + TS ( frontend ).  
Аутентификация по email или username, CRUD по объектам недвижимости.

# Структура

homy/
backend/
frontend/
docker-compose.yml # локальный постгре
README.md

# Требования

- Python 3.13+
- Node.js 18+ (или новее)
- Docker (по желанию, для постгре)



# Запуск Backend

cd backend
.\.venv\Scripts\activate
python manage.py runserver


# создать .env из примера
copy .env.example .env

# миграции и сервер
python manage.py migrate
python manage.py runserver 0.0.0.0:8000



# Запуск frontend

cd frontend
npm run dev

# создать .env из примера
copy .env.example .env

npm run dev
# http://localhost:5173

Да, оба запускаются