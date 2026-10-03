from datetime import datetime

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status
)

from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from sqlalchemy import text

from app.database import (
    engine,
    get_db
)

from app.models import (
    User,
    Donation,
    FoodInspection,
    Request,
    Collection,
    Distribution,
    Feedback,
    Log
)

from app.schemas import (
    UserCreate,
    LoginRequest,
    DonationCreate,
    RequestCreate,
    InspectionCreate,
    ArrivalCreate,
    DistributionCreate,
    FeedbackCreate
)

from app.auth import (
    hash_password,
    verify_password,
    create_access_token
)


# ==========================================================
# APP
# ==========================================================

app = FastAPI(
    title="FoodConnect API",
    description=(
        "Food Donation and NGO Connect Platform"
    ),
    version="2.0.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():

    return {
        "message": "FoodConnect API is running",
        "version": "2.0.0"
    }


# ==========================================================
# HEALTH
# ==========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# ==========================================================
# DATABASE TEST
# ==========================================================

@app.get("/db-test")
def db_test(
    db: Session = Depends(get_db)
):

    try:

        result = db.execute(
            text("SELECT 1")
        )

        value = result.scalar()

        return {
            "database": "MySQL connected",
            "result": value
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# ==========================================================
# REGISTER
# ==========================================================

@app.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    role = user.role.upper()

    if role not in [
        "DONOR",
        "NGO"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Role must be DONOR or NGO"
        )


    existing_user = (
        db.query(User)
        .filter(
            User.email == user.email
        )
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )


    if (
        role == "NGO"
        and not user.organization_name
    ):

        raise HTTPException(
            status_code=400,
            detail="NGO organization name is required"
        )


    new_user = User(

        full_name=user.full_name,

        email=user.email,

        phone=user.phone,

        password=hash_password(
            user.password
        ),

        role=role,

        organization_name=(
            user.organization_name
            if role == "NGO"
            else None
        ),

        address=user.address,

        city=user.city,

        state=user.state
    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return {
        "message": "Registration successful",

        "user": {
            "user_id": new_user.user_id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role
        }
    }


# ==========================================================
# LOGIN
# ==========================================================

@app.post("/login")
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == credentials.email
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    if not verify_password(
        credentials.password,
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    token = create_access_token(
        user.user_id,
        user.role
    )


    return {

        "access_token": token,

        "token_type": "bearer",

        "user": {

            "user_id":
                user.user_id,

            "full_name":
                user.full_name,

            "name":
                user.full_name,

            "email":
                user.email,

            "role":
                user.role,

            "phone":
                user.phone,

            "organization_name":
                user.organization_name,

            "address":
                user.address,

            "city":
                user.city,

            "state":
                user.state
        }
    }


# ==========================================================
# GET ALL AVAILABLE DONATIONS
# ==========================================================

@app.get("/donations")
def get_donations(
    db: Session = Depends(get_db)
):

    donations = (
        db.query(Donation)
        .filter(
            Donation.status == "AVAILABLE"
        )
        .order_by(
            Donation.created_at.desc()
        )
        .all()
    )


    result = []


    for donation in donations:

        donor = (
            db.query(User)
            .filter(
                User.user_id ==
                donation.donor_id
            )
            .first()
        )


        result.append({

            "donation_id":
                donation.donation_id,

            "donor_id":
                donation.donor_id,

            "donor_name":
                donor.full_name
                if donor else "Unknown",

            "food_name":
                donation.food_name,

            "food_type":
                donation.food_type,

            "description":
                donation.description,

            "quantity":
                float(donation.quantity),

            "unit":
                donation.unit,

            "location":
                donation.location,

            "available_from":
                donation.available_from,

            "available_until":
                donation.available_until,

            "prepared_at":
                donation.prepared_at,

            "storage_method":
                donation.storage_method,

            "food_photo":
                donation.food_photo,

            "status":
                donation.status
        })


    return {
        "donations": result
    }


# ==========================================================
# DONOR'S DONATIONS
# ==========================================================

@app.get("/donations/donor/{donor_id}")
def get_donor_donations(
    donor_id: int,
    db: Session = Depends(get_db)
):

    donations = (
        db.query(Donation)
        .filter(
            Donation.donor_id ==
            donor_id
        )
        .order_by(
            Donation.created_at.desc()
        )
        .all()
    )


    return {
        "donations": donations
    }


# ==========================================================
# DONOR'S OWN DONATIONS (TOKEN/FRONTEND COMPATIBILITY)
# ==========================================================

@app.get("/donations/mine")
def get_my_donations(
    donor_id: int,
    db: Session = Depends(get_db)
):

    donations = (
        db.query(Donation)
        .filter(Donation.donor_id == donor_id)
        .order_by(Donation.created_at.desc())
        .all()
    )

    return {"donations": donations}


# CREATE DONATION
# ==========================================================

@app.post(
    "/donations",
    status_code=status.HTTP_201_CREATED
)
def create_donation(
    donation: DonationCreate,
    donor_id: int,
    db: Session = Depends(get_db)
):

    donor = (
        db.query(User)
        .filter(
            User.user_id == donor_id,
            User.role == "DONOR"
        )
        .first()
    )


    if not donor:

        raise HTTPException(
            status_code=404,
            detail="Donor not found"
        )


    if (
        donation.available_until
        <
        donation.available_from
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Available until time must be "
                "after available from time."
            )
        )


    new_donation = Donation(

        donor_id=donor_id,

        food_name=donation.food_name,

        food_type=donation.food_type,

        description=donation.description,

        quantity=donation.quantity,

        unit=donation.unit,

        location=donation.location,

        available_from=donation.available_from,

        available_until=donation.available_until,

        prepared_at=donation.prepared_at,

        storage_method=donation.storage_method,

        food_photo=donation.food_photo,

        status="AVAILABLE"
    )


    db.add(new_donation)

    db.flush()


    log = Log(

        user_id=donor_id,

        action="DONATION_CREATED",

        description=(
            f"Donation #{new_donation.donation_id} "
            f"created by donor."
        )
    )

    db.add(log)

    db.commit()

    db.refresh(new_donation)


    return {
        "message": "Donation created successfully",

        "donation": new_donation
    }


# ==========================================================
# CREATE NGO REQUEST
# ==========================================================

@app.post(
    "/requests",
    status_code=status.HTTP_201_CREATED
)
def create_request(
    request_data: RequestCreate,
    ngo_id: int,
    db: Session = Depends(get_db)
):

    ngo = (
        db.query(User)
        .filter(
            User.user_id == ngo_id,
            User.role == "NGO"
        )
        .first()
    )


    if not ngo:

        raise HTTPException(
            status_code=404,
            detail="NGO not found"
        )


    donation = (
        db.query(Donation)
        .filter(
            Donation.donation_id ==
            request_data.donation_id
        )
        .first()
    )


    if not donation:

        raise HTTPException(
            status_code=404,
            detail="Donation not found"
        )


    if donation.status != "AVAILABLE":

        raise HTTPException(
            status_code=400,
            detail=(
                "This donation is no longer available."
            )
        )


    if (
        request_data.requested_quantity
        >
        float(donation.quantity)
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Requested quantity is greater "
                "than available quantity."
            )
        )


    existing_request = (
        db.query(Request)
        .filter(
            Request.donation_id ==
            request_data.donation_id,

            Request.ngo_id == ngo_id,

            Request.status.in_([
                "PENDING",
                "APPROVED",
                "ARRIVING",
                "COLLECTED"
            ])
        )
        .first()
    )


    if existing_request:

        raise HTTPException(
            status_code=400,
            detail=(
                "You already have an active "
                "request for this donation."
            )
        )


    new_request = Request(

        donation_id=
            request_data.donation_id,

        ngo_id=ngo_id,

        requested_quantity=
            request_data.requested_quantity,

        message=
            request_data.message,

        status="PENDING"
    )


    donation.status = "REQUESTED"


    db.add(new_request)

    db.flush()


    db.add(
        Log(
            user_id=ngo_id,

            action="REQUEST_CREATED",

            description=(
                f"NGO requested donation "
                f"#{donation.donation_id}."
            )
        )
    )


    db.commit()

    db.refresh(new_request)


    return {
        "message": (
            "Food request submitted. "
            "NGO must physically inspect "
            "the food before approval."
        ),

        "request": new_request
    }


# ==========================================================
# NGO REQUESTS
# ==========================================================

@app.get("/requests/ngo/{ngo_id}")
def get_ngo_requests(
    ngo_id: int,
    db: Session = Depends(get_db)
):

    requests = (
        db.query(Request)
        .filter(
            Request.ngo_id == ngo_id
        )
        .order_by(
            Request.created_at.desc()
        )
        .all()
    )


    result = []


    for request in requests:

        donation = (
            db.query(Donation)
            .filter(
                Donation.donation_id ==
                request.donation_id
            )
            .first()
        )


        inspection = (
            db.query(FoodInspection)
            .filter(
                FoodInspection.donation_id ==
                request.donation_id
            )
            .first()
        )


        collection = (
            db.query(Collection)
            .filter(
                Collection.request_id ==
                request.request_id
            )
            .first()
        )


        result.append({

            "request_id":
                request.request_id,

            "donation_id":
                request.donation_id,

            "food_name":
                donation.food_name
                if donation else "",

            "food_type":
                donation.food_type
                if donation else "",

            "quantity":
                float(donation.quantity)
                if donation else 0,

            "unit":
                donation.unit
                if donation else "",

            "requested_quantity":
                float(
                    request.requested_quantity
                ),

            "location":
                donation.location
                if donation else "",

            "status":
                request.status,

            "request_status":
                request.status,

            "message":
                request.message,

            "condition_status":
                inspection.condition_status
                if inspection else None,

            "food_condition":
                inspection.condition_status
                if inspection else None,

            "inspection_notes":
                inspection.inspection_notes
                if inspection else None,

            "collection":
                {
                    "collection_id":
                        collection.collection_id,

                    "status":
                        collection.status,

                    "collector_name":
                        collection.collector_name,

                    "arrival_message":
                        collection.arrival_message,

                    "collection_date":
                        collection.collection_date
                }
                if collection else None,

            "arrival_status":
                collection.status
                if collection else None,

            "arrival_message":
                collection.arrival_message
                if collection else None
        })


    return {
        "requests": result
    }


# ==========================================================
# DONOR REQUESTS
# ==========================================================

@app.get("/requests/donor/{donor_id}")
def get_donor_requests(
    donor_id: int,
    db: Session = Depends(get_db)
):

    donations = (
        db.query(Donation)
        .filter(
            Donation.donor_id ==
            donor_id
        )
        .all()
    )


    donation_ids = [
        donation.donation_id
        for donation in donations
    ]


    if not donation_ids:

        return {
            "requests": []
        }


    requests = (
        db.query(Request)
        .filter(
            Request.donation_id.in_(
                donation_ids
            )
        )
        .order_by(
            Request.created_at.desc()
        )
        .all()
    )


    result = []


    for request in requests:

        donation = (
            db.query(Donation)
            .filter(
                Donation.donation_id ==
                request.donation_id
            )
            .first()
        )


        ngo = (
            db.query(User)
            .filter(
                User.user_id ==
                request.ngo_id
            )
            .first()
        )


        inspection = (
            db.query(FoodInspection)
            .filter(
                FoodInspection.donation_id ==
                request.donation_id
            )
            .first()
        )


        collection = (
            db.query(Collection)
            .filter(
                Collection.request_id ==
                request.request_id
            )
            .first()
        )


        result.append({

            "request_id":
                request.request_id,

            "donation_id":
                request.donation_id,

            "food_name":
                donation.food_name
                if donation else "",

            "requested_quantity":
                float(
                    request.requested_quantity
                ),

            "unit":
                donation.unit
                if donation else "",

            "ngo_name":
                ngo.full_name
                if ngo else "",

            "organization_name":
                ngo.organization_name
                if ngo else "",

            "status":
                request.status,

            "request_status":
                request.status,

            "condition_status":
                inspection.condition_status
                if inspection else None,

            "food_condition":
                inspection.condition_status
                if inspection else None,

            "inspection_notes":
                inspection.inspection_notes
                if inspection else None,

            "arrival_message":
                collection.arrival_message
                if collection else None,

            "arrival_status":
                collection.status
                if collection else None,

            "collector_name":
                collection.collector_name
                if collection else None
        })


    return {
        "requests": result
    }


# ==========================================================
# NGO PHYSICAL FOOD INSPECTION
# ==========================================================

@app.post(
    "/requests/{request_id}/inspect"
)
def inspect_food(
    request_id: int,
    inspection_data: InspectionCreate,
    ngo_id: int,
    db: Session = Depends(get_db)
):

    condition = (
        inspection_data
        .condition_status
        .upper()
    )


    if condition not in [
        "FRESH",
        "SPOILED"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Condition must be FRESH or SPOILED."
            )
        )


    request = (
        db.query(Request)
        .filter(
            Request.request_id ==
            request_id,

            Request.ngo_id == ngo_id
        )
        .first()
    )


    if not request:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    donation = (
        db.query(Donation)
        .filter(
            Donation.donation_id ==
            request.donation_id
        )
        .first()
    )


    collection = (
        db.query(Collection)
        .filter(
            Collection.request_id ==
            request_id
        )
        .first()
    )

    if not collection or collection.status != "ARRIVING":

        raise HTTPException(
            status_code=400,
            detail=(
                "The NGO must send the arrival notification "
                "before inspecting the food."
            )
        )

    existing_inspection = (
        db.query(FoodInspection)
        .filter(
            FoodInspection.donation_id ==
            request.donation_id
        )
        .first()
    )


    if existing_inspection:

        existing_inspection.condition_status = condition

        existing_inspection.inspection_notes = (
            inspection_data.inspection_notes
        )

    else:

        new_inspection = FoodInspection(

            donation_id=
                request.donation_id,

            ngo_id=ngo_id,

            condition_status=condition,

            inspection_notes=
                inspection_data.inspection_notes
        )

        db.add(new_inspection)


    if condition == "FRESH":

        request.status = "APPROVED"

        donation.status = "APPROVED"

        message = (
            "Food inspected and marked FRESH. "
            "Request approved."
        )

    else:

        request.status = "REJECTED"

        donation.status = "REJECTED"

        message = (
            "Food inspected and marked SPOILED. "
            "Request rejected."
        )


    db.add(
        Log(
            user_id=ngo_id,

            action="FOOD_INSPECTED",

            description=(
                f"Donation #{donation.donation_id} "
                f"was inspected as {condition}."
            )
        )
    )


    db.commit()


    return {
        "message": message,

        "condition_status": condition
    }


# ==========================================================
# NGO ARRIVAL
# ==========================================================

@app.post(
    "/requests/{request_id}/arrival"
)
def mark_arrival(
    request_id: int,
    arrival_data: ArrivalCreate,
    ngo_id: int,
    db: Session = Depends(get_db)
):

    request = (
        db.query(Request)
        .filter(
            Request.request_id == request_id,
            Request.ngo_id == ngo_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )

    if request.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=(
                "Arrival notification can only be sent "
                "before food inspection."
            )
        )

    donation = (
        db.query(Donation)
        .filter(
            Donation.donation_id == request.donation_id
        )
        .first()
    )

    if not donation:
        raise HTTPException(
            status_code=404,
            detail="Donation not found"
        )

    collection = (
        db.query(Collection)
        .filter(
            Collection.request_id == request_id
        )
        .first()
    )

    if not collection:
        collection = Collection(
            request_id=request_id,
            ngo_id=ngo_id,
            collection_date=(
                arrival_data.collection_date
                or datetime.now()
            ),
            collector_name=arrival_data.collector_name,
            arrival_message=arrival_data.arrival_message,
            status="ARRIVING"
        )
        db.add(collection)
    else:
        collection.ngo_id = ngo_id
        collection.collection_date = (
            arrival_data.collection_date
            or datetime.now()
        )
        collection.collector_name = (
            arrival_data.collector_name
        )
        collection.arrival_message = (
            arrival_data.arrival_message
        )
        collection.status = "ARRIVING"

    # IMPORTANT:
    # The NGO is only arriving to inspect the food.
    # The request stays PENDING until inspection.
    request.status = "PENDING"
    donation.status = "REQUESTED"

    db.add(
        Log(
            user_id=ngo_id,
            action="NGO_ARRIVAL_NOTIFICATION",
            description=(
                f"NGO sent an arrival notification for "
                f"request #{request_id}. The NGO is arriving "
                f"to inspect the food."
            )
        )
    )

    db.commit()

    return {
        "message": (
            "Arrival notification sent to the donor. "
            "The NGO is arriving to inspect the food."
        ),
        "request_status": request.status,
        "arrival_status": collection.status,
        "arrival_message": collection.arrival_message
    }


# COLLECTION
# ==========================================================

@app.post(
    "/requests/{request_id}/collect"
)
def collect_food(
    request_id: int,
    ngo_id: int,
    db: Session = Depends(get_db)
):

    request = (
        db.query(Request)
        .filter(
            Request.request_id ==
            request_id,

            Request.ngo_id == ngo_id
        )
        .first()
    )


    if not request:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    if request.status != "ARRIVING":

        raise HTTPException(
            status_code=400,
            detail=(
                "NGO must mark arrival before "
                "collecting food."
            )
        )


    donation = (
        db.query(Donation)
        .filter(
            Donation.donation_id ==
            request.donation_id
        )
        .first()
    )


    collection = (
        db.query(Collection)
        .filter(
            Collection.request_id ==
            request_id
        )
        .first()
    )


    if not collection:

        raise HTTPException(
            status_code=404,
            detail="Collection record not found"
        )


    collection.status = "COLLECTED"

    collection.collection_date = datetime.now()

    request.status = "COLLECTED"

    donation.status = "COLLECTED"


    db.add(
        Log(
            user_id=ngo_id,

            action="FOOD_COLLECTED",

            description=(
                f"Donation #{donation.donation_id} "
                f"was collected by NGO."
            )
        )
    )


    db.commit()


    return {
        "message": (
            "Food collection completed successfully."
        )
    }


# ==========================================================
# DISTRIBUTE FOOD
# ==========================================================

@app.post(
    "/requests/{request_id}/distribute"
)
def distribute_food(
    request_id: int,
    distribution_data: DistributionCreate,
    ngo_id: int,
    db: Session = Depends(get_db)
):

    request = (
        db.query(Request)
        .filter(
            Request.request_id ==
            request_id,

            Request.ngo_id == ngo_id
        )
        .first()
    )


    if not request:

        raise HTTPException(
            status_code=404,
            detail="Request not found"
        )


    if request.status != "COLLECTED":

        raise HTTPException(
            status_code=400,
            detail=(
                "Food must be collected before "
                "distribution."
            )
        )


    collection = (
        db.query(Collection)
        .filter(
            Collection.request_id ==
            request_id
        )
        .first()
    )


    if not collection:

        raise HTTPException(
            status_code=404,
            detail="Collection not found"
        )


    existing_distribution = (
        db.query(Distribution)
        .filter(
            Distribution.collection_id ==
            collection.collection_id
        )
        .first()
    )


    if existing_distribution:

        raise HTTPException(
            status_code=400,
            detail=(
                "This collection has already "
                "been distributed."
            )
        )


    distribution = Distribution(

        collection_id=
            collection.collection_id,

        ngo_id=ngo_id,

        distributed_quantity=
            distribution_data.distributed_quantity,

        distribution_date=
            datetime.now(),

        beneficiary_count=
            distribution_data.beneficiary_count,

        location=
            distribution_data.location,

        notes=
            distribution_data.notes
    )


    db.add(distribution)


    request.status = "COMPLETED"


    donation = (
        db.query(Donation)
        .filter(
            Donation.donation_id ==
            request.donation_id
        )
        .first()
    )


    donation.status = "COMPLETED"


    db.add(
        Log(
            user_id=ngo_id,

            action="FOOD_DISTRIBUTED",

            description=(
                f"Donation #{donation.donation_id} "
                f"was distributed to "
                f"{distribution_data.beneficiary_count} "
                f"beneficiaries."
            )
        )
    )


    db.commit()

    db.refresh(distribution)


    return {
        "message": (
            "Food distribution completed successfully."
        ),

        "distribution_id":
            distribution.distribution_id
    }


# ==========================================================
# FEEDBACK
# ==========================================================

@app.post(
    "/feedback",
    status_code=status.HTTP_201_CREATED
)
def create_feedback(
    feedback_data: FeedbackCreate,
    user_id: int,
    db: Session = Depends(get_db)
):

    feedback = Feedback(

        user_id=user_id,

        donation_id=
            feedback_data.donation_id,

        rating=
            feedback_data.rating,

        comment=
            feedback_data.comment
    )


    db.add(feedback)

    db.commit()

    db.refresh(feedback)


    return {
        "message": "Feedback submitted successfully"
    }


# ==========================================================
# LOGS
# ==========================================================

@app.get("/logs")
def get_logs(
    db: Session = Depends(get_db)
):

    logs = (
        db.query(Log)
        .order_by(
            Log.created_at.desc()
        )
        .limit(100)
        .all()
    )


    return {
        "logs": logs
    }