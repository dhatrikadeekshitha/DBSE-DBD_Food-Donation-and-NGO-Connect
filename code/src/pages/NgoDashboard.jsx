import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

function NgoDashboard({ user }) {

  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");

  const ngoId = user?.user_id;

  // ============================================================
  // LOAD REQUESTS
  // ============================================================

  async function loadRequests() {

    if (!ngoId) return;

    const token =
      localStorage.getItem("foodconnect_token");

    try {

      const response = await fetch(
        `${API}/requests/ngo/${ngoId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const data =
        await response.json();

      if (!response.ok) {

        setError(
          data.detail ||
          "Unable to load donation requests."
        );

        return;
      }

      setRequests(
        data.requests || []
      );

      setError("");

    } catch (error) {

      console.error(error);

      setError(
        "Unable to connect to FoodConnect server."
      );
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    loadRequests();

  }, [ngoId]);


  // ============================================================
  // AUTO REFRESH
  // ============================================================

  useEffect(() => {

    if (!ngoId) return;

    const interval =
      setInterval(() => {

        loadRequests();

      }, 5000);

    return () => {

      clearInterval(interval);

    };

  }, [ngoId]);


  // ============================================================
  // NGO ARRIVAL
  // ============================================================

  async function sendArrival(requestId) {

    const defaultMessage =
      "I am arriving to inspect the donated food. I will check whether the food is fresh and suitable for collection.";

    const message =
      window.prompt(
        "Send arrival notification to donor:",
        defaultMessage
      );

    if (
      message === null ||
      !message.trim()
    ) {
      return;
    }

    const token =
      localStorage.getItem(
        "foodconnect_token"
      );

    try {

      const response =
        await fetch(
          `${API}/requests/${requestId}/arrival?ngo_id=${ngoId}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({

              collector_name:
                user?.full_name ||
                user?.name ||
                "NGO Representative",

              arrival_message:
                message.trim(),

              collection_date:
                null
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Unable to send arrival notification."
        );

        return;
      }

      alert(
        "Arrival notification sent to the donor."
      );

      await loadRequests();

    } catch (error) {

      console.error(error);

      alert(
        "Unable to connect to FoodConnect server."
      );
    }
  }


  // ============================================================
  // FOOD INSPECTION
  // ============================================================

  async function inspectFood(
    requestId,
    condition
  ) {

    const defaultNotes =
      condition === "FRESH"
        ? "Food appears fresh, properly prepared, and suitable for consumption."
        : "Food appears spoiled and is not suitable for consumption.";

    const notes =
      window.prompt(
        `Enter inspection notes for ${condition}:`,
        defaultNotes
      );

    if (notes === null) {
      return;
    }

    const token =
      localStorage.getItem(
        "foodconnect_token"
      );

    try {

      const response =
        await fetch(
          `${API}/requests/${requestId}/inspect?ngo_id=${ngoId}`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({

              condition_status:
                condition,

              inspection_notes:
                notes.trim()
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Inspection failed."
        );

        return;
      }

      if (condition === "FRESH") {

        alert(
          "Food marked FRESH. The request is approved and can proceed to collection."
        );

      } else {

        alert(
          "Food marked SPOILED. The request has been rejected."
        );
      }

      await loadRequests();

    } catch (error) {

      console.error(error);

      alert(
        "Unable to connect to FoodConnect server."
      );
    }
  }


  // ============================================================
  // COLLECT FOOD
  // ============================================================

  async function collectFood(requestId) {

    const confirmed =
      window.confirm(
        "Confirm that the food has been collected from the donor."
      );

    if (!confirmed) {
      return;
    }

    const token =
      localStorage.getItem(
        "foodconnect_token"
      );

    try {

      const response =
        await fetch(
          `${API}/requests/${requestId}/collect?ngo_id=${ngoId}`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Food collection failed."
        );

        return;
      }

      alert(
        "Food collected successfully."
      );

      await loadRequests();

    } catch (error) {

      console.error(error);

      alert(
        "Unable to connect to FoodConnect server."
      );
    }
  }


  // ============================================================
  // MARK FOOD DELIVERED
  // ============================================================

  async function deliverFood(requestId) {

    const quantity =
      window.prompt(
        "Enter quantity of food delivered:",
        "20"
      );

    if (
      quantity === null ||
      !quantity.trim()
    ) {
      return;
    }

    const quantityNumber =
      Number(quantity);

    if (
      Number.isNaN(quantityNumber) ||
      quantityNumber <= 0
    ) {

      alert(
        "Please enter a valid quantity."
      );

      return;
    }


    const beneficiaries =
      window.prompt(
        "Enter number of beneficiaries:",
        "20"
      );

    if (
      beneficiaries === null ||
      !beneficiaries.trim()
    ) {
      return;
    }

    const beneficiaryNumber =
      Number(beneficiaries);

    if (
      Number.isNaN(beneficiaryNumber) ||
      beneficiaryNumber <= 0
    ) {

      alert(
        "Please enter a valid beneficiary count."
      );

      return;
    }


    const location =
      window.prompt(
        "Enter food delivery location:",
        "KLH University"
      );

    if (
      location === null ||
      !location.trim()
    ) {
      return;
    }


    const notes =
      window.prompt(
        "Enter delivery notes:",
        "Food delivered successfully to beneficiaries."
      );

    if (notes === null) {
      return;
    }


    const confirmed =
      window.confirm(
        "Confirm that the food has been delivered to the beneficiaries?"
      );

    if (!confirmed) {
      return;
    }


    const token =
      localStorage.getItem(
        "foodconnect_token"
      );

    try {

      const response =
        await fetch(
          `${API}/requests/${requestId}/distribute?ngo_id=${ngoId}`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({

              distributed_quantity:
                quantityNumber,

              beneficiary_count:
                beneficiaryNumber,

              location:
                location.trim(),

              notes:
                notes.trim()
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Food delivery failed."
        );

        return;
      }

      alert(
        "Food delivered successfully. The donation is now completed."
      );

      await loadRequests();

    } catch (error) {

      console.error(error);

      alert(
        "Unable to connect to FoodConnect server."
      );
    }
  }


  // ============================================================
  // DASHBOARD
  // ============================================================

  return (

    <section className="dashboard-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="dashboard-header">

        <div>

          <p className="hero-label">
            NGO DASHBOARD
          </p>

          <h1>
            Welcome,{" "}
            {
              user?.full_name ||
              user?.name ||
              "NGO"
            }
          </h1>

          <p>
            Request, inspect, collect and
            distribute donated food.
          </p>

        </div>


        <div className="dashboard-stat">

          <strong>
            {requests.length}
          </strong>

          <span>
            Requests
          </span>

        </div>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="error-box">
          {error}
        </div>

      )}


      {/* ======================================================
          DONATION REQUESTS
      ====================================================== */}

      <div className="dashboard-card">

        <h2>
          Donation Requests
        </h2>


        {requests.length === 0 ? (

          <div className="no-donations">

            <p>
              No donation requests yet.
            </p>

          </div>

        ) : (

          <div className="request-list">

            {requests.map(
              (request) => {

                const requestStatus =
                  request.request_status ||
                  request.status ||
                  "PENDING";


                const arrivalStatus =
                  request.arrival_status ||
                  request.collection?.status ||
                  null;


                const inspection =
                  request.food_condition ||
                  request.condition_status ||
                  null;


                return (

                  <div
                    className="request-card"
                    key={
                      request.request_id
                    }
                  >

                    {/* FOOD NAME */}

                    <h3>
                      {
                        request.food_name
                      }
                    </h3>


                    {/* FOOD TYPE */}

                    <p>

                      <strong>
                        Food Type:
                      </strong>{" "}

                      {
                        request.food_type
                      }

                    </p>


                    {/* QUANTITY */}

                    <p>

                      <strong>
                        Requested:
                      </strong>{" "}

                      {
                        request.requested_quantity
                      }{" "}

                      {
                        request.unit
                      }

                    </p>


                    {/* REQUEST STATUS */}

                    <p>

                      <strong>
                        Request Status:
                      </strong>{" "}

                      {
                        requestStatus
                      }

                    </p>


                    {/* ==================================================
                        ARRIVAL NOTIFICATION
                    ================================================== */}

                    {arrivalStatus ===
                      "ARRIVING" && (

                      <div className="info-box">

                        <strong>
                          Arrival notification sent
                        </strong>

                        <p>
                          The donor has been
                          informed that the NGO
                          is arriving to inspect
                          the food.
                        </p>


                        {request.arrival_message && (

                          <p>

                            <strong>
                              Message:
                            </strong>{" "}

                            {
                              request.arrival_message
                            }

                          </p>

                        )}

                      </div>

                    )}


                    {/* ==================================================
                        INSPECTION RESULT
                    ================================================== */}

                    {inspection && (

                      <p>

                        <strong>
                          Inspection:
                        </strong>{" "}

                        {
                          inspection
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


                    {/* ==================================================
                        STEP 1
                        ARRIVAL
                    ================================================== */}

                    {requestStatus ===
                      "PENDING" &&
                      !arrivalStatus && (

                      <div className="action-row">

                        <button
                          className="primary-btn"
                          onClick={() =>
                            sendArrival(
                              request.request_id
                            )
                          }
                        >
                          🚗 I'm Arriving to Inspect
                        </button>

                      </div>

                    )}


                    {/* ==================================================
                        STEP 2
                        INSPECTION
                    ================================================== */}

                    {requestStatus ===
                      "PENDING" &&
                      arrivalStatus ===
                        "ARRIVING" && (

                      <div className="action-row">

                        <button
                          className="primary-btn"
                          onClick={() =>
                            inspectFood(
                              request.request_id,
                              "FRESH"
                            )
                          }
                        >
                          ✓ Food is Fresh
                        </button>


                        <button
                          className="danger-btn"
                          onClick={() =>
                            inspectFood(
                              request.request_id,
                              "SPOILED"
                            )
                          }
                        >
                          ✕ Food is Spoiled
                        </button>

                      </div>

                    )}


                    {/* ==================================================
                        STEP 3
                        COLLECTION
                    ================================================== */}

                    {requestStatus ===
                      "APPROVED" && (

                      <div className="action-row">

                        <button
                          className="primary-btn"
                          onClick={() =>
                            collectFood(
                              request.request_id
                            )
                          }
                        >
                          ✓ Mark Food Collected
                        </button>

                      </div>

                    )}


                    {/* ==================================================
                        STEP 4
                        DELIVERY
                    ================================================== */}

                    {requestStatus ===
                      "COLLECTED" && (

                      <div className="action-row">

                        <button
                          className="primary-btn"
                          onClick={() =>
                            deliverFood(
                              request.request_id
                            )
                          }
                        >
                          ✓ Mark Food Delivered
                        </button>

                      </div>

                    )}


                    {/* ==================================================
                        COMPLETED
                    ================================================== */}

                    {requestStatus ===
                      "COMPLETED" && (

                      <div className="success-box">

                        <strong>
                          ✓ Food Delivered Successfully
                        </strong>

                        <p>
                          The donated food has
                          been delivered to the
                          beneficiaries.
                        </p>

                      </div>

                    )}


                    {/* ==================================================
                        REJECTED
                    ================================================== */}

                    {requestStatus ===
                      "REJECTED" && (

                      <div className="error-box">

                        Food was rejected because
                        it was marked as spoiled.

                      </div>

                    )}


                    {/* CURRENT STATUS */}

                    <span className="request-status">

                      {
                        requestStatus
                      }

                    </span>

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </section>

  );
}

export default NgoDashboard;