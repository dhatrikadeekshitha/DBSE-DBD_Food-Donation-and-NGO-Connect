import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function DonorDashboard({ user }) {
  const [form, setForm] = useState({
    food_name: "",
    food_type: "",
    description: "",
    quantity: "",
    unit: "Meals",
    prepared_at: "",
    available_from: "",
    available_until: "",
    storage_method: "",
    location: ""
  });

  const [foodPhoto, setFoodPhoto] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);

  const donorId = user?.user_id;

  // ============================================================
  // FORM
  // ============================================================

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  // ============================================================
  // FOOD PHOTO
  // ============================================================

  function handleImage(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Prevent extremely large images
    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5 MB.");
      return;
    }

    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      setFoodPhoto(reader.result);
    };

    reader.readAsDataURL(file);
  }

  // ============================================================
  // LOAD DONOR'S DONATIONS
  // ============================================================

  async function loadDonations() {
    if (!donorId) return;

    const token =
      localStorage.getItem("foodconnect_token");

    try {
      const response = await fetch(
        `${API}/donations/mine?donor_id=${donorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setDonations(
        data.donations || []
      );

    } catch (error) {
      console.error(
        "Donation loading error:",
        error
      );
    }
  }

  // ============================================================
  // CHECK NGO ARRIVAL
  //
  // THIS IS FOR THE DONOR ACCOUNT.
  //
  // The donor receives the popup when the NGO
  // sends an arrival notification.
  // ============================================================

  async function checkNgoArrival(
    showPopup = true
  ) {
    if (!donorId) return;

    const token =
      localStorage.getItem(
        "foodconnect_token"
      );

    try {
      const response = await fetch(
        `${API}/requests/donor/${donorId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return;

      const data =
        await response.json();

      const currentRequests =
        data.requests || [];

      setRequests(
        currentRequests
      );

      if (!showPopup) return;

      for (
        const request of currentRequests
      ) {
        /*
         * NGO has told the donor:
         * "I am arriving to inspect the food."
         */

        if (
          request.arrival_status ===
          "ARRIVING"
        ) {
          const notificationKey =
            `foodconnect_arrival_seen_${request.request_id}`;

          const alreadyShown =
            localStorage.getItem(
              notificationKey
            );

          if (!alreadyShown) {

            alert(
              `🚗 NGO ARRIVAL NOTIFICATION\n\n` +

              `${request.ngo_name || "NGO"} ` +
              `is arriving to inspect your donated food.\n\n` +

              `Food: ` +
              `${request.food_name || "Food donation"}\n\n` +

              `Message from NGO:\n` +

              `${request.arrival_message || 
                "The NGO is arriving to inspect the food."}\n\n` +

              `The NGO will physically check whether ` +
              `the food is FRESH or SPOILED before collection.`
            );

            localStorage.setItem(
              notificationKey,
              "true"
            );
          }
        }
      }

    } catch (error) {

      console.error(
        "NGO arrival notification error:",
        error
      );
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    if (!donorId) return;

    loadDonations();

    checkNgoArrival(false);

  }, [donorId]);

  // ============================================================
  // CONTINUOUS DONOR NOTIFICATION CHECK
  //
  // Checks every 3 seconds so the donor can receive
  // the NGO arrival popup without refreshing.
  // ============================================================

  useEffect(() => {

    if (!donorId) return;

    const interval =
      setInterval(() => {

        loadDonations();

        checkNgoArrival(true);

      }, 3000);

    return () => {
      clearInterval(interval);
    };

  }, [donorId]);

  // ============================================================
  // CREATE FOOD DONATION
  // ============================================================

  async function handleSubmit(event) {

    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.food_name.trim()) {
      setError(
        "Please enter the food name."
      );
      return;
    }

    if (!form.food_type) {
      setError(
        "Please select the food type."
      );
      return;
    }

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      setError(
        "Quantity must be greater than zero."
      );
      return;
    }

    if (
      !form.available_from ||
      !form.available_until
    ) {
      setError(
        "Please enter both available-from and available-until times."
      );
      return;
    }

    if (
      new Date(form.available_until) <
      new Date(form.available_from)
    ) {
      setError(
        "Available until time must be after available from time."
      );
      return;
    }

    if (!form.location.trim()) {
      setError(
        "Please enter the pickup location."
      );
      return;
    }

    const token =
      localStorage.getItem(
        "foodconnect_token"
      );

    try {

      const response = await fetch(
        `${API}/donations/?donor_id=${donorId}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({

            ...form,

            quantity:
              Number(form.quantity),

            food_photo:
              foodPhoto || null,

            prepared_at:
              form.prepared_at || null,

            available_from:
              form.available_from,

            available_until:
              form.available_until
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        setError(
          data.detail ||
          "Unable to create donation."
        );

        return;
      }

      setMessage(
        "Food donation submitted successfully."
      );

      setForm({
        food_name: "",
        food_type: "",
        description: "",
        quantity: "",
        unit: "Meals",
        prepared_at: "",
        available_from: "",
        available_until: "",
        storage_method: "",
        location: ""
      });

      setFoodPhoto("");

      await loadDonations();

    } catch (error) {

      console.error(error);

      setError(
        "Unable to connect to FoodConnect."
      );
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="dashboard-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="dashboard-header">

        <div>

          <p className="hero-label">
            DONOR DASHBOARD
          </p>

          <h1>
            Welcome,{" "}
            {
              user?.name ||
              user?.full_name ||
              "Donor"
            }
          </h1>

          <p>
            Share surplus food with verified
            NGO users.
          </p>

        </div>

        <div className="dashboard-stat">

          <strong>
            {donations.length}
          </strong>

          <span>
            My Donations
          </span>

        </div>

      </div>

      {/* ======================================================
          DONATION FORM
      ====================================================== */}

      <div className="dashboard-card">

        <h2>
          Add Food Donation
        </h2>

        <p>
          After an NGO requests your food,
          the NGO will notify you when they
          are arriving to physically inspect it.
          The NGO will then decide whether the
          food is fresh or spoiled before collection.
        </p>

        <form
          onSubmit={handleSubmit}
        >

          {/* FOOD NAME + TYPE */}

          <div className="two-column">

            <div>

              <label>
                Food Name
              </label>

              <input
                name="food_name"
                value={form.food_name}
                onChange={updateField}
                placeholder="Example: Vegetable Rice"
                required
              />

            </div>

            <div>

              <label>
                Food Type
              </label>

              <select
                name="food_type"
                value={form.food_type}
                onChange={updateField}
                required
              >

                <option value="">
                  Select food type
                </option>

                <option>
                  Cooked Meal
                </option>

                <option>
                  Rice
                </option>

                <option>
                  Vegetables
                </option>

                <option>
                  Fruits
                </option>

                <option>
                  Bakery
                </option>

                <option>
                  Packaged Food
                </option>

                <option>
                  Other
                </option>

              </select>

            </div>

          </div>

          {/* DESCRIPTION */}

          <label>
            Description
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            placeholder="Describe the food..."
          />

          {/* QUANTITY + UNIT */}

          <div className="two-column">

            <div>

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="0.1"
                step="0.1"
                name="quantity"
                value={form.quantity}
                onChange={updateField}
                required
              />

            </div>

            <div>

              <label>
                Unit
              </label>

              <select
                name="unit"
                value={form.unit}
                onChange={updateField}
              >

                <option>
                  Meals
                </option>

                <option>
                  Kg
                </option>

                <option>
                  Litres
                </option>

                <option>
                  Packets
                </option>

              </select>

            </div>

          </div>

          {/* PREPARED + AVAILABLE FROM */}

          <div className="two-column">

            <div>

              <label>
                Prepared At
              </label>

              <input
                type="datetime-local"
                name="prepared_at"
                value={form.prepared_at}
                onChange={updateField}
              />

            </div>

            <div>

              <label>
                Available From
              </label>

              <input
                type="datetime-local"
                name="available_from"
                value={form.available_from}
                onChange={updateField}
                required
              />

            </div>

          </div>

          {/* AVAILABLE UNTIL */}

          <label>
            Available Until
          </label>

          <input
            type="datetime-local"
            name="available_until"
            value={form.available_until}
            onChange={updateField}
            required
          />

          {/* STORAGE */}

          <label>
            Storage Method
          </label>

          <select
            name="storage_method"
            value={form.storage_method}
            onChange={updateField}
          >

            <option value="">
              Select
            </option>

            <option>
              Refrigerated
            </option>

            <option>
              Room Temperature
            </option>

            <option>
              Insulated Container
            </option>

            <option>
              Other
            </option>

          </select>

          {/* LOCATION */}

          <label>
            Pickup Location
          </label>

          <input
            name="location"
            value={form.location}
            onChange={updateField}
            placeholder="Enter pickup location"
            required
          />

          {/* PHOTO */}

          <label>
            Food Photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
          />

          {/* POLICY */}

          <div className="info-box">

            <strong>
              Food inspection policy
            </strong>

            <p>
              The NGO first sends an arrival
              notification to you. The NGO then
              physically checks the food and
              marks it FRESH or SPOILED before
              collection.
            </p>

          </div>

          {/* SUBMIT */}

          <button
            className="primary-btn"
            type="submit"
          >
            Submit Food Donation
          </button>

        </form>

        {message && (
          <div className="success-box">
            {message}
          </div>
        )}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

      </div>

      {/* ======================================================
          DONOR'S NGO UPDATES
      ====================================================== */}

      {requests.length > 0 && (

        <div className="dashboard-card">

          <h2>
            NGO Updates
          </h2>

          <div className="request-list">

            {requests.map(
              (request) => (

                <div
                  className="request-card"
                  key={
                    request.request_id
                  }
                >

                  <h3>
                    {request.food_name}
                  </h3>

                  <p>
                    <strong>
                      NGO:
                    </strong>{" "}
                    {
                      request.ngo_name ||
                      "NGO"
                    }
                  </p>

                  <p>
                    <strong>
                      Request Status:
                    </strong>{" "}
                    {
                      request.request_status ||
                      request.status ||
                      "PENDING"
                    }
                  </p>

                  {/* NGO ARRIVAL MESSAGE */}

                  {request.arrival_status ===
                    "ARRIVING" && (

                    <div className="info-box">

                      <strong>
                        🚗 NGO is arriving to inspect your food
                      </strong>

                      <p>
                        {
                          request.arrival_message ||
                          "The NGO is arriving to inspect the food."
                        }
                      </p>

                      <p>
                        The NGO will physically
                        check whether the food is
                        fresh or spoiled before
                        collection.
                      </p>

                    </div>

                  )}

                  {/* INSPECTION RESULT */}

                  {request.food_condition && (

                    <p>

                      <strong>
                        Inspection Result:
                      </strong>{" "}

                      {
                        request.food_condition
                      }

                    </p>

                  )}

                  {request.inspection_notes && (

                    <p>

                      <strong>
                        Inspection Notes:
                      </strong>{" "}

                      {
                        request.inspection_notes
                      }

                    </p>

                  )}

                </div>

              )
            )}

          </div>

        </div>

      )}

      {/* ======================================================
          DONATION HISTORY
      ====================================================== */}

      <div className="dashboard-card">

        <h2>
          My Donation History
        </h2>

        {donations.length === 0 ? (

          <p>
            No donations submitted yet.
          </p>

        ) : (

          <div className="request-list">

            {donations.map(
              (donation) => (

                <div
                  className="request-card"
                  key={
                    donation.donation_id ||
                    donation.id
                  }
                >

                  <h3>
                    {
                      donation.food_name
                    }
                  </h3>

                  <p>
                    {
                      donation.food_type
                    }
                  </p>

                  <p>
                    Quantity:{" "}
                    {
                      donation.quantity
                    }{" "}
                    {
                      donation.unit
                    }
                  </p>

                  <span className="request-status">
                    {
                      donation.status
                    }
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </section>
  );
}

export default DonorDashboard;