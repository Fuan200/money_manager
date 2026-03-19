from fastapi import FastAPI
from core.middleware import jwt_auth_middleware

from routes.users import users
from routes.accounts import accounts
from routes.categories import categories

app = FastAPI()


@app.middleware("http")
async def authenticate_requests(request, call_next):
    return await jwt_auth_middleware(request, call_next)


@app.get("/")
def hello_world():
    return "Server is running!!!"


app.include_router(users)
app.include_router(accounts)
app.include_router(categories)
