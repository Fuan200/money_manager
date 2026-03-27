from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select
from uuid import UUID
from typing import List

from core.database import get_session
from routes.users import get_current_user
from models import Icon, User, Category

from schema.category import CategoryPublic, CreateCategory, UpdateCategory, SuccessResponse

categories = APIRouter(prefix="/categories", tags=["categories"])


def load_category_with_icon(session: Session, category_id: UUID) -> Category | None:
    statement = select(Category).options(selectinload(Category.icon)).where(Category.id == category_id)
    return session.exec(statement).first()


@categories.get("/get-all-categories-by-user", response_model=SuccessResponse[List[CategoryPublic]])
def get_categories(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = (
        select(Category)
        .options(selectinload(Category.icon))
        .where(Category.user_id == current_user.id)
        .order_by(Category.created_at.desc())
    )
    categories = session.exec(statement).all()
    return {"success": True, "data": categories}


@categories.get("/get-category-by-id/{id}", response_model=SuccessResponse[CategoryPublic])
def get_category(id: UUID, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    category = load_category_with_icon(session, id)

    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="CATEGORY NOT FOUND")

    return {"success": True, "data": category}


@categories.post("/create-category", response_model=SuccessResponse[CategoryPublic])
def create_category(category_data: CreateCategory, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if category_data.icon_id:
        icon = session.get(Icon, category_data.icon_id)
        if not icon:
            raise HTTPException(status_code=404, detail="ICON NOT FOUND")

    category = Category(
        name=category_data.name,
        type=category_data.type if category_data.type is not None else False,
        user_id=current_user.id,
        icon_id=category_data.icon_id,
    )

    session.add(category)
    session.commit()
    created_category = load_category_with_icon(session, category.id)

    return {"success": True, "data": created_category}


@categories.patch("/update-category/{id}", response_model=SuccessResponse[CategoryPublic])
def update_category(
    id: UUID,
    category_data: UpdateCategory,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    category = session.get(Category, id)

    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="CATEGORY NOT FOUND")

    if category_data.icon_id:
        icon = session.get(Icon, category_data.icon_id)
        if not icon:
            raise HTTPException(status_code=404, detail="ICON NOT FOUND")

    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    session.add(category)
    session.commit()
    updated_category = load_category_with_icon(session, category.id)

    return {"success": True, "data": updated_category}


@categories.delete("/delete-category/{id}", response_model=SuccessResponse[CategoryPublic])
def delete_category(
    id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    category = session.get(Category, id)

    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="CATEGORY NOT FOUND")

    deleted_category = load_category_with_icon(session, category.id)

    try:
        session.delete(category)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="CATEGORY CANNOT BE DELETED") from None

    return {"success": True, "data": deleted_category}
