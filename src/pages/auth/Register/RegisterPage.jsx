
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";
import "./RegisterPage.scss";

const REGISTER_API = "/api/auth/register/";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));
    setError("");

    if (status !== "idle") setStatus("idle");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setStatus("error");
      setError("Please complete all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setStatus("error");
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setError("Your passwords don't match. Please check again.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(REGISTER_API, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: form.password,
          confirm_password: form.confirmPassword,
          role: "customer",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            data.email?.[0] ||
            data.password?.[0] ||
            "We couldn't create your account. Please try again."
        );
      }

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
          email,
        },
      });
    } catch (err) {
      setStatus("error");
      setError(
        err.message ||
          "Unable to connect. Please try again in a moment."
      );
    }
  }

  return (
    <main className="register-page">
      <div className="register-page__ornament" aria-hidden="true" />

      <section
        className="register-card"
        aria-labelledby="register-title"
      >
        <Link to="/" className="register-brand" aria-label="Little Click Studio home">
          <span className="register-brand__symbol">
            <Sparkles size={21} strokeWidth={1.5} />
          </span>
          <span className="register-brand__copy">
            <strong>Little Click Studio</strong>
            <small>SOUTH BOPAL · AHMEDABAD</small>
          </span>
        </Link>

        <div className="register-heading">
          <p className="register-eyebrow">A PLACE FOR YOUR MEMORIES</p>
          <h1 id="register-title">
            Your story,
            <br />
            <em>starts here.</em>
          </h1>
          <p className="register-description">
            Create your studio account to keep your bookings and
            photography memories together.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          <div className="register-field">
            <label htmlFor="register-name">Full name</label>
            <div className="register-input">
              <UserRound size={18} aria-hidden="true" />
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.name}
                onChange={updateField}
                required
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="register-email">Email address</label>
            <div className="register-input">
              <Mail size={18} aria-hidden="true" />
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={updateField}
                required
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="register-password">Create password</label>
            <div className="register-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={updateField}
                minLength={8}
                required
                disabled={status === "loading"}
              />
              <button
                className="register-password-toggle"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="register-confirm-password">
              Confirm password
            </label>
            <div className="register-input">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={form.confirmPassword}
                onChange={updateField}
                required
                disabled={status === "loading"}
              />
              <button
                className="register-password-toggle"
                type="button"
                onClick={() =>
                  setShowConfirmPassword((visible) => !visible)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="register-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="register-submit"
            type="submit"
            disabled={status === "loading"}
          >
            <span>
              {status === "loading"
                ? "Creating your account…"
                : "Create my account"}
            </span>
            {status !== "loading" && <ArrowRight size={18} />}
          </button>

          <p className="register-terms">
            By creating an account, you agree to use the studio's
            services responsibly.
          </p>
        </form>

        <div className="register-divider">
          <span>YOUR LITTLE MOMENTS AWAIT</span>
        </div>

        <p className="register-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <p className="register-security">
          Secure access · Your memories remain yours
        </p>
      </section>

      <footer className="register-footer">
        ONE CLICK, ONE MOMENT, A LIFETIME OF LOVE.
      </footer>
    </main>
  );
}
