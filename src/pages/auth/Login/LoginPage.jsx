
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "./LoginPage.scss";


export default function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [loginType, setLoginType] = useState("customer");
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
    setError("");
    setStatus("idle");
  }

  function changeLoginType(type) {
    if (type === loginType || status === "loading") return;

    setLoginType(type);
    setError("");
    setStatus("idle");
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
      const user = await login({
        email,
        password: form.password,
      });

      // The backend must return is_staff from the authenticated /me endpoint.
      const isAdmin = user?.is_staff === true;

      if (loginType === "admin" && !isAdmin) {
        await logout();
        throw new Error(
          "This account does not have administrator access. Please choose Customer Login."
        );
      }

      if (loginType === "customer" && isAdmin) {
        await logout();
        throw new Error(
          "This is an administrator account. Please choose Admin Login."
        );
      }

      setStatus("success");

      navigate(isAdmin ? "/admin" : "/dashboard", {
        replace: true,
      });
    } catch (err) {
      setStatus("error");
      setError(
        err.message || "Unable to sign in. Please try again."
      );
    }
  }

  const isAdminLogin = loginType === "admin";

  return (
    <main className="auth-page">
      <div className="auth-page__ornament" aria-hidden="true" />

      <section className="auth-card" aria-labelledby="login-title">
        <Link
          to="/"
          className="auth-brand"
          aria-label="Little Click Studio home"
        >
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

          <h1 id="login-title" key={loginType} className="auth-mode-heading">
            {isAdminLogin ? (
              <>
                Your studio,
                <br />
                <em>in your hands.</em>
              </>
            ) : (
              <>
                Your moments,
                <br />
                <em>beautifully kept.</em>
              </>
            )}
          </h1>

          <p className="auth-description" key={`description-${loginType}`}>
            {isAdminLogin
              ? "Sign in to manage your studio and customer experience."
              : "Sign in to revisit your memories and manage your studio experience."}
          </p>
        </div>

        <div
          className="auth-role-selector"
          role="group"
          aria-label="Choose login type"
        >
          <button
            type="button"
            className={`auth-role-option ${
              loginType === "customer" ? "is-active" : ""
            }`}
            onClick={() => changeLoginType("customer")}
            aria-pressed={loginType === "customer"}
            disabled={status === "loading"}
          >
            <UserRound size={17} />
            <span>Customer</span>
          </button>

          <button
            type="button"
            className={`auth-role-option ${
              loginType === "admin" ? "is-active" : ""
            }`}
            onClick={() => changeLoginType("admin")}
            aria-pressed={loginType === "admin"}
            disabled={status === "loading"}
          >
            <ShieldCheck size={17} />
            <span>Admin</span>
          </button>
        </div>

        <p className="auth-role-hint" key={`hint-${loginType}`}>
          {isAdminLogin
            ? "Authorized studio administrators only"
            : "Access your personal customer account"}
        </p>

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
              {status === "loading"
                ? "Signing you in…"
                : isAdminLogin
                  ? "Sign in as Admin"
                  : "Sign in as Customer"}
            </span>

            {status !== "loading" && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-divider">
          <span>
            {isAdminLogin
              ? "STUDIO MANAGEMENT"
              : "YOUR LITTLE MOMENTS AWAIT"}
          </span>
        </div>

        {!isAdminLogin && (
          <p className="auth-switch">
            New to our studio?{" "}
            <Link to="/register">Create an account</Link>
          </p>
        )}

        {isAdminLogin && (
          <p className="auth-switch auth-admin-note">
            Administrator access is restricted to authorized accounts.
          </p>
        )}

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
