"""
This module configures the connection to a PostgreSQL database using SQLAlchemy.
It provides the session for database interactions and defines a base for ORM models.
"""

from dotenv import load_dotenv
from sqlmodel import create_engine, Session
import os

load_dotenv()

SQLMODEL_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLMODEL_DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session
