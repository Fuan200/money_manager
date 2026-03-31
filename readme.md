# Money Manager

Money Manager es una aplicación web completa para el manejo de finanzas personales.

## Features



## Stack

* Backend: Python, FastAPI, alembic
* Frontend: TypeScript, Astro + Preact

## Self-Host

### Prerequisites

* PostgreSQL
* Python 3
* Node +22

1. Clone the repository:

```bash
git clone git@github.com:Fuan200/money_manager.git
cd money_manager/
```

2. Install dependencies for backend:

```bash
cd backend
python3 -m venv venv
. ./venv/bin/activate
pip install -r requirements.txt
```

* Create a .env 

```
DATABASE_URL=postgresql://<your_user>:<your_password>@localhost:5432/money_manager
JWT_SECRET_KEY = your_jwt_secret_key
```

* Run FastAPI:

```bash
fastapi run
```

3. Install dependies for frontend:

```bash
cd frontend
npm i
npm run astro
```

