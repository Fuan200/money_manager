from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.middleware import jwt_auth_middleware

from routes.users import users
from routes.accounts import accounts
from routes.categories import categories
from routes.transfers import transfers
from routes.transactions import transactions

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4321"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def authenticate_requests(request, call_next):
    return await jwt_auth_middleware(request, call_next)


@app.get("/")
def hello_world():
    return "Server is running!!!"


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(users)
app.include_router(accounts)
app.include_router(categories)
app.include_router(transfers)
app.include_router(transactions)
