from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ==========================================================
# USER
# ==========================================================

class UserCreate(BaseModel):

    full_name: str

    email: EmailStr

    password: str = Field(
        min_length=6
    )

    role: str

    phone: Optional[str] = None

    organization_name: Optional[str] = None

    address: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# ==========================================================
# DONATION
# ==========================================================

class DonationCreate(BaseModel):

    food_name: str

    food_type: str

    description: Optional[str] = None

    quantity: float = Field(
        gt=0
    )

    unit: str

    location: str

    available_from: datetime

    available_until: datetime

    prepared_at: Optional[datetime] = None

    storage_method: Optional[str] = None

    food_photo: Optional[str] = None


# ==========================================================
# FOOD REQUEST
# ==========================================================

class RequestCreate(BaseModel):

    donation_id: int

    requested_quantity: float = Field(
        gt=0
    )

    message: Optional[str] = None


# ==========================================================
# FOOD INSPECTION
# ==========================================================

class InspectionCreate(BaseModel):

    condition_status: str

    inspection_notes: Optional[str] = None


# ==========================================================
# ARRIVAL
# ==========================================================

class ArrivalCreate(BaseModel):

    collector_name: str

    arrival_message: str

    collection_date: Optional[datetime] = None


# ==========================================================
# DISTRIBUTION
# ==========================================================

class DistributionCreate(BaseModel):

    distributed_quantity: float = Field(
        gt=0
    )

    beneficiary_count: int = Field(
        gt=0
    )

    location: str

    notes: Optional[str] = None


# ==========================================================
# FEEDBACK
# ==========================================================

class FeedbackCreate(BaseModel):

    donation_id: Optional[int] = None

    rating: int = Field(
        ge=1,
        le=5
    )

    comment: Optional[str] = None