function DonationCard({
  donation,
  onRequest,
  showRequest = false
}) {
  return (
    <div className="donation-card">

      {donation.food_photo ? (
        <img
          src={donation.food_photo}
          alt={donation.food_type}
          className="donation-photo"
        />
      ) : (
        <div className="default-food-image">
          🍱
        </div>
      )}

      <div className="donation-card-content">

        <h3>
          {donation.food_type}
        </h3>

        <p>
          {donation.description ||
            "No description provided"}
        </p>

        <p>
          <strong>
            Quantity:
          </strong>{" "}
          {donation.quantity}{" "}
          {donation.unit}
        </p>

        <p>
          <strong>
            Location:
          </strong>{" "}
          {donation.location}
        </p>

        <p>
          <strong>
            Available From:
          </strong>{" "}
          {donation.available_from}
        </p>

        <p>
          <strong>
            Available Until:
          </strong>{" "}
          {donation.available_until}
        </p>

        <span className="quality-passed">
          ✓ FoodGuard Passed
        </span>

        {showRequest && (
          <button
            className="primary-btn"
            onClick={() =>
              onRequest(donation)
            }
          >
            Request Donation
          </button>
        )}

      </div>

    </div>
  );
}

export default DonationCard;
