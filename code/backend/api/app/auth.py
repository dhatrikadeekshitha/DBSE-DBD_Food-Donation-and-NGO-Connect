import os

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from jose import jwt

import bcrypt


load_dotenv()


SECRET_KEY = os.getenv(
    "SECRET_KEY"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is missing in .env"
    )


def hash_password(password: str) -> str:

    hashed = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    stored_password: str
) -> bool:

    # New accounts use bcrypt.
    if stored_password.startswith("$2"):

        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            stored_password.encode("utf-8")
        )

    # Allows the sample database accounts
    # created with password 123456 to work.
    return plain_password == stored_password


def create_access_token(
    user_id: int,
    role: str
):

    expire = (
        datetime.now(timezone.utc)
        +
        timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
