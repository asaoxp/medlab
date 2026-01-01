# MedLAB+

## Prerequisites
- Node.js (v18+ recommended)
- Python (v3.10+)
- MySQL (v8+)

---

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
````

Create a `.env` file inside `backend/`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=medlab_db
```

Start backend server:

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## MySQL

Ensure MySQL is running.
Database and tables are created automatically on first backend run.

---

## Done

Open the frontend URL in your browser.
"# medlab" 
