import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function Donations({ user, onNavigate }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDonations() {
    try {
      const response = await fetch(`${API}/donations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load donations.");
      }

      setDonations(data.donations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  async function requestDonation(donation) {
    if (!user) {
      alert("Please login as an NGO.");
      onNavigate("login");
      return;
    }

    if (user.role?.toUpperCase() !== "NGO") {
      alert("Only NGO users can request food.");
      return;
    }

    const quantity = window.prompt(
      `Available: ${donation.quantity} ${donation.unit}\nEnter quantity to request:`
    );
    if (!quantity) return;

    const requestedQuantity = Number(quantity);
    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0 ||
      requestedQuantity > Number(donation.quantity)
    ) {
      alert("Please enter a valid quantity.");
      return;
    }

    const message = window.prompt("Optional message to donor:");
    const token = localStorage.getItem("foodconnect_token");

    try {
      const response = await fetch(
        `${API}/requests?ngo_id=${encodeURIComponent(user.user_id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            donation_id: donation.donation_id,
            requested_quantity: requestedQuantity,
            message: message || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Request failed.");
        return;
      }

      alert("Donation request submitted successfully.");
      loadDonations();
    } catch {
      alert("Unable to connect to FoodConnect.");
    }
  }

  return (
    <section className="donations-page">
      <div className="page-header">
        <p className="hero-label">AVAILABLE FOOD</p>
        <h1>Available Donations</h1>
        <p>
          NGOs can request available surplus food. Physical quality
          inspection happens before collection.
        </p>
      </div>

      {loading && <div className="no-donations">Loading donations...</div>}
      {error && <div className="error-box">{error}</div>}

      {!loading && !error && donations.length === 0 && (
        <div className="no-donations">
          <h2>No available donations</h2>
          <p>New donor submissions will appear here.</p>
        </div>
      )}

      {!loading && !error && donations.length > 0 && (
        <div className="donation-grid">
          {donations.map((donation) => (
            <div className="donation-card" key={donation.donation_id}>
              {donation.food_photo ? (
                <img
                  src={donation.food_photo}
                  alt={donation.food_name}
                  className="donation-photo"
                />
              ) : (
                <div className="default-food-image">🍲</div>
              )}

              <div className="donation-card-content">
                <h3>{donation.food_name}</h3>
                <p>{donation.food_type}</p>
                <p>{donation.description}</p>
                <p>
                  <strong>Quantity:</strong> {donation.quantity} {donation.unit}
                </p>
                <p>
                  <strong>Location:</strong> {donation.location}
                </p>

                <span className="quality-passed">
                  NGO inspection required
                </span>

                {user?.role?.toUpperCase() === "NGO" && (
                  <button
                    className="primary-btn"
                    onClick={() => requestDonation(donation)}
                  >
                    Request Food
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Donations;
