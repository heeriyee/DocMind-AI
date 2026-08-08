import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    localStorage.setItem(
      "docmind_logged_in",
      "true"
    );

    localStorage.setItem(
      "docmind_user_email",
      email
    );

    navigate("/dashboard");
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-icon">
          ✦
        </div>

        <h1>Welcome Back</h1>

        <p>
          Sign in to continue using DocMind AI.
        </p>

        <label>Email</label>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
        />

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="login-button"
        >
          Sign In →
        </button>

        <small>
          Demo authentication — ready for backend
          authentication integration.
        </small>

      </div>

    </div>
  );
}

export default Login;