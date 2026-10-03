from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    Numeric,
    Enum
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from .database import Base


# ============================================================
# USERS
# ============================================================

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, nullable=False, index=True)

    phone = Column(String(20), nullable=True)

    password = Column(String(255), nullable=False)

    role = Column(
        Enum("DONOR", "NGO", "ADMIN"),
        nullable=False,
        default="DONOR"
    )

    organization_name = Column(String(150), nullable=True)

    address = Column(String(255), nullable=True)

    city = Column(String(100), nullable=True)

    state = Column(String(100), nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    # Relationships
    donations = relationship(
        "Donation",
        back_populates="donor",
        cascade="all, delete-orphan"
    )

    requests = relationship(
        "Request",
        back_populates="ngo",
        cascade="all, delete-orphan"
    )

    inspections = relationship(
        "FoodInspection",
        back_populates="ngo",
        cascade="all, delete-orphan"
    )

    collections = relationship(
        "Collection",
        back_populates="ngo",
        cascade="all, delete-orphan"
    )

    distributions = relationship(
        "Distribution",
        back_populates="ngo",
        cascade="all, delete-orphan"
    )

    feedback = relationship(
        "Feedback",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    logs = relationship(
        "Log",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ============================================================
# DONATIONS
# ============================================================

class Donation(Base):
    __tablename__ = "donations"

    donation_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    donor_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    food_name = Column(
        String(150),
        nullable=False
    )

    food_type = Column(
        String(100),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    quantity = Column(
        Numeric(10, 2),
        nullable=False
    )

    unit = Column(
        String(50),
        nullable=False
    )

    location = Column(
        String(255),
        nullable=False
    )

    available_from = Column(
        DateTime,
        nullable=False
    )

    available_until = Column(
        DateTime,
        nullable=False
    )

    prepared_at = Column(
        DateTime,
        nullable=True
    )

    storage_method = Column(
        String(100),
        nullable=True
    )

    # IMPORTANT:
    # Image is stored as Base64.
    # MEDIUMTEXT in MySQL supports large Base64 images.
    food_photo = Column(
        Text,
        nullable=True
    )

    status = Column(
        Enum(
            "AVAILABLE",
            "REQUESTED",
            "APPROVED",
            "ARRIVING",
            "COLLECTED",
            "COMPLETED",
            "REJECTED",
            "CANCELLED",
            "EXPIRED"
        ),
        nullable=False,
        default="AVAILABLE",
        index=True
    )

    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    # Relationships
    donor = relationship(
        "User",
        back_populates="donations"
    )

    requests = relationship(
        "Request",
        back_populates="donation",
        cascade="all, delete-orphan"
    )

    inspection = relationship(
        "FoodInspection",
        back_populates="donation",
        uselist=False,
        cascade="all, delete-orphan"
    )


# ============================================================
# FOOD INSPECTIONS
# ============================================================

class FoodInspection(Base):
    __tablename__ = "food_inspections"

    inspection_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    donation_id = Column(
        Integer,
        ForeignKey("donations.donation_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    ngo_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    condition_status = Column(
        Enum("FRESH", "SPOILED"),
        nullable=False
    )

    inspection_notes = Column(
        Text,
        nullable=True
    )

    inspected_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    donation = relationship(
        "Donation",
        back_populates="inspection"
    )

    ngo = relationship(
        "User",
        back_populates="inspections"
    )


# ============================================================
# REQUESTS
# ============================================================

class Request(Base):
    __tablename__ = "requests"

    request_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    donation_id = Column(
        Integer,
        ForeignKey("donations.donation_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    ngo_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    requested_quantity = Column(
        Numeric(10, 2),
        nullable=False
    )

    message = Column(
        Text,
        nullable=True
    )

    status = Column(
        Enum(
            "PENDING",
            "APPROVED",
            "REJECTED",
            "ARRIVING",
            "COLLECTED",
            "COMPLETED",
            "CANCELLED"
        ),
        nullable=False,
        default="PENDING"
    )

    # IMPORTANT:
    # Database column is created_at, not requested_at.
    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    donation = relationship(
        "Donation",
        back_populates="requests"
    )

    ngo = relationship(
        "User",
        back_populates="requests"
    )

    collection = relationship(
        "Collection",
        back_populates="request",
        uselist=False,
        cascade="all, delete-orphan"
    )


# ============================================================
# COLLECTIONS
# ============================================================

class Collection(Base):
    __tablename__ = "collections"

    collection_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    request_id = Column(
        Integer,
        ForeignKey("requests.request_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    ngo_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    collection_date = Column(
        DateTime,
        nullable=False
    )

    collector_name = Column(
        String(150),
        nullable=False
    )

    arrival_message = Column(
        Text,
        nullable=True
    )

    status = Column(
        Enum(
            "SCHEDULED",
            "ARRIVING",
            "COLLECTED",
            "CANCELLED"
        ),
        nullable=False,
        default="SCHEDULED"
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp()
    )

    request = relationship(
        "Request",
        back_populates="collection"
    )

    ngo = relationship(
        "User",
        back_populates="collections"
    )

    distributions = relationship(
        "Distribution",
        back_populates="collection",
        cascade="all, delete-orphan"
    )


# ============================================================
# DISTRIBUTIONS
# ============================================================

class Distribution(Base):
    __tablename__ = "distributions"

    distribution_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    collection_id = Column(
        Integer,
        ForeignKey("collections.collection_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    ngo_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    distributed_quantity = Column(
        Numeric(10, 2),
        nullable=False
    )

    distribution_date = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    beneficiary_count = Column(
        Integer,
        nullable=False
    )

    location = Column(
        String(255),
        nullable=False
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    collection = relationship(
        "Collection",
        back_populates="distributions"
    )

    ngo = relationship(
        "User",
        back_populates="distributions"
    )


# ============================================================
# FEEDBACK
# ============================================================

class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    donation_id = Column(
        Integer,
        ForeignKey("donations.donation_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    comment = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    user = relationship(
        "User",
        back_populates="feedback"
    )


# ============================================================
# LOGS
# ============================================================

class Log(Base):
    __tablename__ = "logs"

    log_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    action = Column(
        String(100),
        nullable=False
    )

    entity_type = Column(
        String(100),
        nullable=True
    )

    entity_id = Column(
        Integer,
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.current_timestamp()
    )

    user = relationship(
        "User",
        back_populates="logs"
    )