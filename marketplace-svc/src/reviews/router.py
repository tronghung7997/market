from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import get_current_account
from src.database import get_session
from src.models.account import Account

from . import schemas, service

router = APIRouter(tags=["reviews"])


@router.post("/orders/{order_id}/review", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    order_id: int,
    body: schemas.ReviewCreate,
    account: Account = Depends(get_current_account),
    db: AsyncSession = Depends(get_session),
):
    return await service.create_review(order_id, account.id, body.rating, body.comment, db)


@router.get("/products/{product_id}/reviews", response_model=list[schemas.ReviewResponse])
async def product_reviews(
    product_id: int,
    db: AsyncSession = Depends(get_session),
):
    return await service.get_product_reviews(product_id, db)
