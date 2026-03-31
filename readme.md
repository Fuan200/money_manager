# Money Manager

Money Manager es una aplicación web completa para el manejo de finanzas personales.

`NOTA`: Al crear una cuenta, se crean datos de prueba para la demo.

Enlace a la demo: http://money-manager-frontend-hhlrx6-984dec-107-148-105-18.traefik.me/

## ☁️ ¿Cómo has utilizado CubePath?
Desplegamos el servicio de Dokploy con el servicio de CubePath, con el plan gp.micro.
La estructura del Proyecto es:

Base de Datos (PostgreSQL)
Backend (FastAPI)
Frontend (Astro + Preact)
Ya dentro de dokploy, creamos un proyecto, creamos la db, el servicio del backend, y finalmente el del frontend.

## Features

Money Manager ayuda a los usuarios a organizar sus finanzas personales en un solo lugar, con una interfaz web para dar seguimiento a balances, ingresos y gastos.

* Autenticación de usuarios con sesiones protegidas
* Gestión de cuentas para crear, editar, eliminar y revisar cuentas personales
* Vista general de balances con el total de dinero disponible entre cuentas
* Gestión de categorías para clasificaciones de ingresos y gastos
* Registro de transacciones de ingresos y gastos con asignación de cuenta y categoría
* Vistas de panel para revisar la actividad financiera reciente
* Desglose de ingresos y gastos por categoría para un análisis rápido de movimientos


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

#### Autores

:blue_heart: **Neonairb** - [NeoNairb](https://github.com/Neonairb)

:blue_heart: **Neicx** - [Neicx](https://github.com/Neicx)

:blue_heart: **Fuan200** - [Fuan200](https://github.com/Fuan200)

