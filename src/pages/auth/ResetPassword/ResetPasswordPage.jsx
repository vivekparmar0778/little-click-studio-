
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import "./ResetPasswordPage.scss";

const RESET_CONFIRM_API =
  "http://127.0.0.1:8000/api/v1/auth/password-reset/confirm/";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requirements = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      label: "One number",
      met: /\d/.test(password),
    },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isSubmitting) return;

    if (!uid || !token) {
      setError(
        "Invalid password reset link. Please request a new one."
      );
      return;
    }

    if (requirements.some((item) => !item.met)) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(RESET_CONFIRM_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstError = Object.values(data).find(
          (value) =>
            Array.isArray(value) || typeof value === "string"
        );

        const errorMessage =
          data.detail ||
          (Array.isArray(firstError)
            ? firstError[0]
            : firstError) ||
          "Unable to reset password. Please try again.";

        throw new Error(String(errorMessage));
      }

      setPassword("");
      setConfirmPassword("");
      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <main className="reset-page">
        <section
          className="reset-card reset-card--success"
          aria-labelledby="reset-success-title"
        >
          <Link
            to="/"
            className="reset-brand"
            aria-label="Little Click Studio home"
          >
            <span className="reset-brand__mark">
              <Sparkles size={21} strokeWidth={1.5} />
            </span>

            <span className="reset-brand__text">
              <span className="reset-brand__name">
                little click
              </span>
              <span className="reset-brand__subtitle">
                STUDIO · SOUTH BOPAL
              </span>
            </span>
          </Link>

          <div className="reset-success-icon">
            <Check size={30} strokeWidth={1.7} />
          </div>

          <p className="reset-eyebrow">
            ALL SET FOR YOUR NEXT CHAPTER
          </p>

          <h1
            id="reset-success-title"
            className="reset-title"
          >
            Your new password
            <br />
            is ready.
          </h1>

          <p className="reset-description">
            Your password has been successfully updated.
            You can now sign in using your new password.
          </p>

          <button
            type="button"
            className="reset-submit"
            onClick={() => navigate("/login")}
          >
            Back to sign in
            <ArrowRight size={18} />
          </button>

          <Link to="/" className="reset-back-link">
            <ArrowLeft size={15} />
            Return to homepage
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="reset-page">
      <section
        className="reset-card"
        aria-labelledby="reset-title"
      >
        <Link
          to="/"
          className="reset-brand"
          aria-label="Little Click Studio home"
        >
          <span className="reset-brand__mark">
            <Sparkles size={21} strokeWidth={1.5} />
          </span>

          <span className="reset-brand__text">
            <span className="reset-brand__name">
              little click
            </span>
            <span className="reset-brand__subtitle">
              STUDIO · SOUTH BOPAL
            </span>
          </span>
        </Link>

        <div className="reset-icon">
          <LockKeyhole size={24} strokeWidth={1.5} />
        </div>

        <p className="reset-eyebrow">
          A FRESH START
        </p>

        <h1
          id="reset-title"
          className="reset-title"
        >
          Create a new
          <br />
          <span>password.</span>
        </h1>

        <p className="reset-description">
          Choose a strong password to keep your memories
          and account protected.
        </p>

        <form
          className="reset-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="reset-field">
            <label htmlFor="new-password">
              New password
            </label>

            <div className="reset-input-wrap">
              <KeyRound
                className="reset-input-icon"
                size={18}
                strokeWidth={1.6}
              />

              <input
                id="new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                aria-describedby="password-requirements"
                required
                disabled={isSubmitting}
              />

              <button
                type="button"
                className="reset-visibility"
                onClick={() =>
                  setShowPassword((visible) => !visible)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div
            className="reset-requirements"
            id="password-requirements"
            aria-live="polite"
          >
            <p>Password requirements</p>

            {requirements.map((item) => (
              <div
                className={`reset-requirement ${
                  item.met ? "is-met" : ""
                }`}
                key={item.label}
              >
                <span className="reset-requirement__check">
                  {item.met && <Check size={11} />}
                </span>

                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="reset-field">
            <label htmlFor="confirm-password">
              Confirm new password
            </label>

            <div className="reset-input-wrap">
              <LockKeyhole
                className="reset-input-icon"
                size={18}
                strokeWidth={1.6}
              />

              <input
                id="confirm-password"
                name="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                required
                disabled={isSubmitting}
              />

              <button
                type="button"
                className="reset-visibility"
                onClick={() =>
                  setShowConfirmPassword(
                    (visible) => !visible
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                disabled={isSubmitting}
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
            <p
              className="reset-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="reset-submit"
            disabled={isSubmitting || !uid || !token}
          >
            {isSubmitting
              ? "Resetting password..."
              : "Reset password"}

            <ArrowRight size={18} />
          </button>

          {(!uid || !token) && (
            <p className="reset-error" role="alert">
              Invalid password reset link. Please request
              a new one from the Forgot Password page.
            </p>
          )}
        </form>

        <div className="reset-security-note">
          <ShieldCheck
            size={17}
            strokeWidth={1.6}
          />
          <span>
            Your account security matters to us.
          </span>
        </div>

        <div className="reset-footer">
          <Link
            to="/login"
            className="reset-back-link"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </div>
      </section>

      <p className="reset-bottom-note">
        ONE CLICK, ONE MOMENT, A LIFETIME OF LOVE.
      </p>
    </main>
  );
}
