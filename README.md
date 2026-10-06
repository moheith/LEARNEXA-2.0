# LEARNEXA

LEARNEXA is a college-project web application for exchanging skills between students. A student can say what they can teach, what they want to learn, discover compatible students, send an exchange request, schedule a session, leave feedback, and earn reward points.

## Project Structure

```text
LEARNEXA/
├── backend/
│   ├── app.py                 Flask API, database models, and routes
│   ├── requirements.txt       Python dependencies
│   ├── .env.example            Backend configuration template
│   └── instance/               Local SQLite database location
├── database/
│   └── schema.sql              MySQL schema and starter skills
├── frontend/
│   ├── app/                    Next.js pages and shared styles
│   ├── lib/api.ts              Reusable API request helper
│   ├── package.json            Frontend scripts and dependencies
│   └── .env.local              Frontend API URL
└── README.md
```

## How The Application Works

1. The user registers through the Next.js frontend.
2. The frontend sends the form to Flask at `POST /api/register`.
3. Flask validates the data, hashes the password, and stores the user in the database.
4. Flask returns a JWT token. The frontend stores that token and sends it with protected requests.
5. The user selects teaching and learning skills on the profile page.
6. Flask compares skill lists using direct matches plus TF-IDF cosine similarity and returns recommendations.
7. Students send requests to each other. An accepted request can become a scheduled session.
8. A completed session can receive feedback.
9. The wallet stores security amounts, reward points, and transaction history.

## Database Explained Simply

The database is the application's permanent storage. Without it, all users, skills, requests, and sessions would disappear when the backend stops.

The project supports two database modes:

### Local development: SQLite

By default, `backend/app.py` uses SQLite:

```text
sqlite:///learnexa.db
```

Flask-SQLAlchemy creates this database automatically when the backend starts. In this project, the SQLite file is stored under the backend instance folder, normally:

```text
backend/instance/learnexa.db
```

The local SQLite database is ignored by Git because it contains changing user data and should not be committed.

### Deployment: MySQL

Set `DB_TYPE=mysql` in `backend/.env` and provide the MySQL connection values. The backend then builds a connection using:

- `DB_HOST`: MySQL server address
- `DB_PORT`: usually `3306`
- `DB_NAME`: database name
- `DB_USER`: database username
- `DB_PASSWORD`: database password

The file [database/schema.sql](database/schema.sql) contains the MySQL version of the tables and starter skills.

## Tables

### `users`

Stores one record per student: name, email, hashed password, biography, and availability. Passwords are never stored as plain text.

### `skills`

Stores the available skills, such as Python, React, English, or Graphic Design. Each skill has a category.

### `user_skills`

Connects users to skills. This is a relationship table because one user can have many skills and one skill can belong to many users. `skill_type` says whether the user can `teach` or wants to `learn` the skill.

### `exchange_requests`

Stores requests between two users. It records the sender, receiver, message, status, and creation time. Status can be pending, accepted, rejected, or completed.

### `sessions`

Stores scheduled learning meetings created from accepted exchange requests. It contains the title, date, meeting link, and session status.

### `feedback`

Stores a rating and comment after a completed session. It records the reviewer and the person being reviewed.

### `wallets`

Stores one wallet per user. It contains the user's security amount and reward points.

### `wallet_transactions`

Stores the history of wallet deposits and reward redemptions. This gives the application an audit trail instead of only showing the current balance.

## Important Database Relationships

```text
users 1 ─── many user_skills many ─── 1 skills
users 1 ─── many exchange_requests as sender
users 1 ─── many exchange_requests as receiver
exchange_requests 1 ─── many sessions
sessions 1 ─── many feedback records
users 1 ─── 1 wallets
users 1 ─── many wallet_transactions
```

The foreign keys prevent child records from pointing to users or skills that do not exist. The cascade rules in `schema.sql` remove related records when a parent record is deleted.

## Run The Backend

Open PowerShell in the project folder:

```powershell
cd C:\LEARNEXA
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
python backend\app.py
```

The API runs at:

```text
http://127.0.0.1:5000
```

Check that it is running:

```text
http://127.0.0.1:5000/api/health
```

The response should say that the LEARNEXA API is running.

## Run The Frontend

Open a second PowerShell window:

```powershell
cd C:\LEARNEXA\frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend reads `NEXT_PUBLIC_API_BASE_URL` from `frontend/.env.local`. The default value is:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000/api
```

Both servers must be running because Next.js displays the interface while Flask handles authentication, database work, and business logic.

## Build For Production

```powershell
cd C:\LEARNEXA\frontend
npm run build
npm start
```

`npm run build` checks TypeScript and creates an optimized Next.js build. `npm start` serves that build.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/register` | Create a user |
| POST | `/api/login` | Authenticate a user |
| GET | `/api/me` | Read the signed-in user's profile |
| GET | `/api/skills` | List available skills |
| POST | `/api/profile` | Save profile details and skills |
| GET | `/api/recommendations` | Find compatible students |
| GET/POST | `/api/requests` | List or send exchange requests |
| PATCH | `/api/requests/<id>` | Accept or reject a request |
| GET/POST | `/api/sessions` | List or schedule sessions |
| PATCH | `/api/sessions/<id>` | Complete or cancel a session |
| POST | `/api/feedback` | Submit session feedback |
| GET | `/api/wallet` | Read wallet and transactions |
| POST | `/api/wallet/security` | Add a security amount |
| POST | `/api/wallet/redeem` | Redeem reward points |

Protected endpoints require:

```text
Authorization: Bearer <JWT token>
```

## Current Scope

This is an educational MVP. The wallet is a demonstration points system, not a real payment system. A production version would need payment processing, database migrations, stronger secret management, automated tests, notifications, and deployment configuration.
