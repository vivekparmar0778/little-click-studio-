
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import "./LoginPage.scss";

const LOGIN_API = "/api/auth/login/";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));

    if (error) setError("");
    if (status !== "idle") setStatus("idle");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      setError("Please enter your email and password.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(LOGIN_API, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Those details couldn't be verified. Please try again."
        );
      }

      const user = data.user || data;
      const role = String(user.role || user.user_type || "")
        .trim()
        .toLowerCase();

      if (["admin", "staff", "superuser"].includes(role)) {
        navigate("/admin", { replace: true });
      } else if (role === "customer") {
        navigate("/dashboard", { replace: true });
      } else {
        throw new Error(
          "Your account role could not be verified. Please contact the studio."
        );
      }
    } catch (err) {
      setStatus("error");
      setError(
        err.message ||
          "Unable to connect. Please try again in a moment."
      );
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__ornament" aria-hidden="true" />

      <section className="auth-card" aria-labelledby="login-title">
        <Link to="/" className="auth-brand" aria-label="Little Click Studio home">
          <span className="auth-brand__symbol">
            <Sparkles size={21} strokeWidth={1.5} />
          </span>
          <span className="auth-brand__copy">
            <strong>Little Click Studio</strong>
            <small>SOUTH BOPAL · AHMEDABAD</small>
          </span>
        </Link>

        <div className="auth-heading">
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1 id="login-title">
            Your moments,
            <br />
            <em>beautifully kept.</em>
          </h1>
          <p className="auth-description">
            Sign in to revisit your memories and manage your studio experience.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <div className="auth-input">
              <Mail size={18} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={form.email}
                onChange={updateField}
                required
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <div className="auth-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={updateField}
                required
                disabled={status === "loading"}
              />
              <button
                className="auth-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={status === "loading"}
          >
            <span>
              {status === "loading" ? "Signing you in…" : "Sign in"}
            </span>
            {status !== "loading" && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-divider">
          <span>YOUR LITTLE MOMENTS AWAIT</span>
        </div>

        <p className="auth-switch">
          New to our studio? <Link to="/register">Create an account</Link>
        </p>

        <p className="auth-security">
          Secure access · Your memories remain yours
        </p>
      </section>

      <footer className="auth-footer">
        ONE CLICK, ONE MOMENT, A LIFETIME OF LOVE.
      </footer>
    </main>
  );
}
