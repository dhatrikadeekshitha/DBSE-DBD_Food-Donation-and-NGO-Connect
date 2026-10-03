import { useState } from "react";

const API = "http://127.0.0.1:8000";

function Register({ onNavigate }) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    role: "DONOR",
    organization_name: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        role: form.role.toUpperCase(),
        organization_name:
          form.role === "NGO" ? form.organization_name : null
      };

      const response = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed.");
        return;
      }

      setMessage("Registration successful. Please login.");

      setTimeout(() => onNavigate("login"), 1000);
    } catch {
      setError("Unable to connect to FoodConnect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-page">
      <div className="form-card">
        <h1>Create Account</h1>
        <p>Choose how you want to use FoodConnect.</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input name="full_name" value={form.full_name} onChange={updateField} required />

          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={updateField} required />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={updateField}
            minLength={6}
            required
          />

          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={updateField} />

          <label>Register As</label>
          <select name="role" value={form.role} onChange={updateField}>
            <option value="DONOR">Donor</option>
            <option value="NGO">NGO</option>
          </select>

          {form.role === "NGO" && (
            <>
              <label>NGO Organization Name</label>
              <input
                name="organization_name"
                value={form.organization_name}
                onChange={updateField}
                required
              />
            </>
          )}

          <label>Address</label>
          <textarea name="address" value={form.address} onChange={updateField} />

          <div className="two-column">
            <div>
              <label>City</label>
              <input name="city" value={form.city} onChange={updateField} />
            </div>
            <div>
              <label>State</label>
              <input name="state" value={form.state} onChange={updateField} />
            </div>
          </div>

          <button className="primary-btn full-btn" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {message && <div className="success-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}
      </div>
    </section>
  );
}

export default Register;