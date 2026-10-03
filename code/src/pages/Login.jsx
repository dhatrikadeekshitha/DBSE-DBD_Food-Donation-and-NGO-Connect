import { useState } from "react";

const API = "http://127.0.0.1:8000";

function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      localStorage.setItem("foodconnect_token", data.access_token);
      localStorage.setItem("foodconnect_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch {
      setError("Unable to connect to FoodConnect server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-page">
      <div className="form-card">
        <h1>Login</h1>
        <p>Welcome back to FoodConnect</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" className="primary-btn full-btn" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        <p className="small-text">
          Don't have an account?
          <button className="text-btn" onClick={() => onNavigate("register")}>
            Register
          </button>
        </p>
      </div>
    </section>
  );
}

export default Login;