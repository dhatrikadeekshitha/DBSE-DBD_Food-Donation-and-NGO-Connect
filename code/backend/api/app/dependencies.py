import os

from fastapi import Depends, HTTPException, status

from jose import jwt, JWTError

from sqlalchemy.orm import Session

from dotenv import load_dotenv

from app.database import get_db

from app.models import User


load_dotenv()


SECRET_KEY = os.getenv(
    "SECRET_KEY"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(
        lambda: None
    )
):
    """
    Authentication is handled directly in the
    endpoints for this student project.
    """

    return None


def find_user(
    db: Session,
    user_id: int
):

    user = (
        db.query(User)
        .filter(
            User.user_id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user