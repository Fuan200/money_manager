from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import TypedDict
from uuid import UUID

from sqlmodel import Session

from models import Account, Category, Transaction, User


class DemoTransactionBlueprint(TypedDict):
    account_name: str
    amount: str
    category_name: str
    days_ago: int
    description: str
    type: bool


def create_demo_seed_data(session: Session, user: User) -> None:
    account_by_name = _create_demo_accounts(session, user.id)
    category_by_name = _create_demo_categories(session, user.id)
    _create_demo_transactions(session, user.id, account_by_name, category_by_name)


def _create_demo_accounts(session: Session, user_id: UUID) -> dict[str, Account]:
    accounts = [
        Account(
            name="Cash",
            balance=Decimal("180.00"),
            is_debit=True,
            balance_include=True,
            saving=False,
            user_id=user_id,
        ),
        Account(
            name="Checking Account",
            balance=Decimal("1800.00"),
            is_debit=True,
            balance_include=True,
            saving=False,
            user_id=user_id,
        ),
        Account(
            name="Credit Card",
            balance=Decimal("0.00"),
            is_debit=False,
            balance_include=True,
            saving=False,
            user_id=user_id,
        ),
        Account(
            name="Savings",
            balance=Decimal("950.00"),
            is_debit=True,
            balance_include=True,
            saving=True,
            user_id=user_id,
        ),
    ]

    for account in accounts:
        session.add(account)

    session.flush()

    return {account.name: account for account in accounts}


def _create_demo_categories(session: Session, user_id: UUID) -> dict[str, Category]:
    expense_category_names = [
        "Groceries",
        "Rent",
        "Transport",
        "Utilities",
        "Dining Out",
        "Entertainment",
        "Healthcare",
        "Shopping",
        "Education",
        "Travel",
    ]
    income_category_names = [
        "Salary",
        "Freelance",
        "Interest",
        "Gift",
        "Bonus",
        "Refund",
    ]

    categories = [
        Category(name=name, type=False, user_id=user_id) for name in expense_category_names
    ] + [
        Category(name=name, type=True, user_id=user_id) for name in income_category_names
    ]

    for category in categories:
        session.add(category)

    session.flush()

    return {category.name: category for category in categories}


def _create_demo_transactions(
    session: Session,
    user_id: UUID,
    account_by_name: dict[str, Account],
    category_by_name: dict[str, Category],
) -> None:
    base_datetime = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)

    for blueprint in _build_demo_transaction_blueprints():
        account = account_by_name[blueprint["account_name"]]
        category = category_by_name[blueprint["category_name"]]
        amount = Decimal(blueprint["amount"])
        transaction_date = base_datetime - timedelta(days=blueprint["days_ago"])

        if blueprint["type"]:
            account.balance += amount
        else:
            account.balance -= amount

        session.add(
            Transaction(
                amount=amount,
                description=blueprint["description"],
                type=blueprint["type"],
                external_expense=False,
                transaction_date=transaction_date,
                user_id=user_id,
                account_id=account.id,
                category_id=category.id,
            )
        )

    session.flush()


def _build_demo_transaction_blueprints() -> list[DemoTransactionBlueprint]:
    return [
        {
            "days_ago": 58,
            "account_name": "Checking Account",
            "category_name": "Salary",
            "amount": "3200.00",
            "description": "Monthly salary",
            "type": True,
        },
        {
            "days_ago": 57,
            "account_name": "Checking Account",
            "category_name": "Rent",
            "amount": "1100.00",
            "description": "Apartment rent",
            "type": False,
        },
        {
            "days_ago": 55,
            "account_name": "Checking Account",
            "category_name": "Groceries",
            "amount": "86.40",
            "description": "Weekly grocery run",
            "type": False,
        },
        {
            "days_ago": 53,
            "account_name": "Cash",
            "category_name": "Transport",
            "amount": "24.50",
            "description": "Bus and metro rides",
            "type": False,
        },
        {
            "days_ago": 50,
            "account_name": "Checking Account",
            "category_name": "Dining Out",
            "amount": "32.80",
            "description": "Dinner with friends",
            "type": False,
        },
        {
            "days_ago": 47,
            "account_name": "Checking Account",
            "category_name": "Utilities",
            "amount": "142.35",
            "description": "Electricity and internet bill",
            "type": False,
        },
        {
            "days_ago": 45,
            "account_name": "Checking Account",
            "category_name": "Freelance",
            "amount": "420.00",
            "description": "Freelance design payment",
            "type": True,
        },
        {
            "days_ago": 44,
            "account_name": "Checking Account",
            "category_name": "Shopping",
            "amount": "68.90",
            "description": "Household supplies",
            "type": False,
        },
        {
            "days_ago": 41,
            "account_name": "Cash",
            "category_name": "Entertainment",
            "amount": "27.00",
            "description": "Movie tickets",
            "type": False,
        },
        {
            "days_ago": 39,
            "account_name": "Checking Account",
            "category_name": "Healthcare",
            "amount": "54.20",
            "description": "Pharmacy and vitamins",
            "type": False,
        },
        {
            "days_ago": 36,
            "account_name": "Checking Account",
            "category_name": "Salary",
            "amount": "3200.00",
            "description": "Monthly salary",
            "type": True,
        },
        {
            "days_ago": 35,
            "account_name": "Checking Account",
            "category_name": "Rent",
            "amount": "1100.00",
            "description": "Apartment rent",
            "type": False,
        },
        {
            "days_ago": 32,
            "account_name": "Checking Account",
            "category_name": "Groceries",
            "amount": "91.10",
            "description": "Groceries and cleaning products",
            "type": False,
        },
        {
            "days_ago": 29,
            "account_name": "Checking Account",
            "category_name": "Travel",
            "amount": "180.00",
            "description": "Weekend bus trip",
            "type": False,
        },
        {
            "days_ago": 27,
            "account_name": "Checking Account",
            "category_name": "Refund",
            "amount": "45.00",
            "description": "Refund from online order",
            "type": True,
        },
        {
            "days_ago": 24,
            "account_name": "Checking Account",
            "category_name": "Education",
            "amount": "60.00",
            "description": "Online course subscription",
            "type": False,
        },
        {
            "days_ago": 21,
            "account_name": "Cash",
            "category_name": "Dining Out",
            "amount": "38.25",
            "description": "Lunch outside the office",
            "type": False,
        },
        {
            "days_ago": 18,
            "account_name": "Checking Account",
            "category_name": "Utilities",
            "amount": "136.40",
            "description": "Water and mobile bill",
            "type": False,
        },
        {
            "days_ago": 16,
            "account_name": "Savings",
            "category_name": "Bonus",
            "amount": "250.00",
            "description": "Quarterly performance bonus",
            "type": True,
        },
        {
            "days_ago": 14,
            "account_name": "Checking Account",
            "category_name": "Shopping",
            "amount": "74.90",
            "description": "New work clothes",
            "type": False,
        },
        {
            "days_ago": 12,
            "account_name": "Checking Account",
            "category_name": "Gift",
            "amount": "100.00",
            "description": "Birthday gift received",
            "type": True,
        },
        {
            "days_ago": 10,
            "account_name": "Checking Account",
            "category_name": "Groceries",
            "amount": "88.65",
            "description": "Biweekly groceries",
            "type": False,
        },
        {
            "days_ago": 8,
            "account_name": "Cash",
            "category_name": "Transport",
            "amount": "22.00",
            "description": "Taxi rides",
            "type": False,
        },
        {
            "days_ago": 6,
            "account_name": "Checking Account",
            "category_name": "Entertainment",
            "amount": "41.75",
            "description": "Streaming and games",
            "type": False,
        },
        {
            "days_ago": 4,
            "account_name": "Savings",
            "category_name": "Interest",
            "amount": "6.80",
            "description": "Savings account interest",
            "type": True,
        },
        {
            "days_ago": 3,
            "account_name": "Checking Account",
            "category_name": "Healthcare",
            "amount": "35.00",
            "description": "Doctor appointment copay",
            "type": False,
        },
        {
            "days_ago": 2,
            "account_name": "Checking Account",
            "category_name": "Dining Out",
            "amount": "29.40",
            "description": "Coffee and dinner",
            "type": False,
        },
        {
            "days_ago": 1,
            "account_name": "Cash",
            "category_name": "Groceries",
            "amount": "64.30",
            "description": "Neighborhood market",
            "type": False,
        },
    ]
