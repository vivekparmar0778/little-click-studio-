
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import "./ForgotPasswordPage.scss";

const RESET_API = "/api/auth/password-reset/";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(RESET_API, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "We couldn't process your request. Please try again."
        );
      }

      setStatus("success");
      setMessage(
        data.message ||
          "If an account exists for this email, reset instructions will be sent."
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error.message ||
          "Unable to connect to the server. Please try again later."
      );
    }
  }

  return (
    <main className="forgot-page">
      <div className="forgot-page__ambient" aria-hidden="true" />

      <section
        className="forgot-card"
        aria-labelledby="forgot-title"
      >
        <Link
          to="/"
          className="forgot-brand"
          aria-label="Little Click Studio home"
        >
          <span className="forgot-brand__mark">
            <Sparkles size={20} strokeWidth={1.5} />
          </span>

          <span>
            <strong>Little Click Studio</strong>
            <small>SOUTH BOPAL · AHMEDABAD</small>
          </span>
        </Link>

        <div className="forgot-card__icon" aria-hidden="true">
          {status === "success" ? (
            <CheckCircle2 size={29} strokeWidth={1.5} />
          ) : (
            <Mail size={29} strokeWidth={1.5} />
          )}
        </div>

        {status === "success" ? (
          <div className="forgot-content">
            <p className="forgot-eyebrow">CHECK YOUR INBOX</p>

            <h1 id="forgot-title">
              Your next step starts <em>here.</em>
            </h1>

            <p className="forgot-description">
              {message}
            </p>

            <button
              type="button"
              className="forgot-button"
              onClick={() => {
                setEmail("");
                setMessage("");
                setStatus("idle");
              }}
            >
              Try another email
            </button>
          </div>
        ) : (
          <div className="forgot-content">
            <p className="forgot-eyebrow">
              ACCOUNT RECOVERY
            </p>

            <h1 id="forgot-title">
              Let's get you <em>back.</em>
            </h1>

            <p className="forgot-description">
              Forgot your password? Enter the email address
              associated with your account and we'll help you
              get back to your little moments.
            </p>

            <form
              className="forgot-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <label htmlFor="forgot-email">
                Email address
              </label>

              <div className="forgot-input-wrap">
                <Mail
                  size={18}
                  aria-hidden="true"
                />

                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);

                    if (status === "error") {
                      setStatus("idle");
                      setMessage("");
                    }
                  }}
                  required
                  disabled={status === "loading"}
                  aria-invalid={status === "error"}
                  aria-describedby={
                    message ? "forgot-message" : undefined
                  }
                />
              </div>

              {message && status === "error" && (
                <p
                  id="forgot-message"
                  className="forgot-message forgot-message--error"
                  role="alert"
                >
                  {message}
                </p>
              )}

              <button
                className="forgot-button"
                type="submit"
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Sending request…"
                  : "Reset my password"}
              </button>
            </form>
          </div>
        )}

        <div className="forgot-security">
          <ShieldCheck size={17} strokeWidth={1.6} />
          <span>Your account security matters to us.</span>
        </div>

        <Link to="/login" className="forgot-back">
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </section>

      <p className="forgot-footer">
        ONE CLICK, ONE MOMENT, A LIFETIME OF LOVE.
      </p>
    </main>
  );
}
