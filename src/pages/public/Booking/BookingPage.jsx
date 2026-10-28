import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Check, Clock3 } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const SERVICES_API = "http://127.0.0.1:8000/api/v1/services/";

function studioDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default function BookingPage() {
  const { user, loading, isAuthenticated, apiRequest } = useAuth();

  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [retry, setRetry] = useState(0);

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [details, setDetails] = useState({
    name: null,
    phone: null,
    notes: "",
  });
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");

  const contactName = details.name ?? fullName;
  const contactPhone = details.phone ?? user?.phone_number ?? "";
  const selectedService = services.find(
    (service) => String(service.id) === serviceId,
  );

  useEffect(() => {
    const controller = new AbortController();

    fetch(SERVICES_API, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load services.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid services response.");
        }

        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setServices(data);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setServicesError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setServicesLoading(false);
        }
      });

    return () => controller.abort();
  }, [retry]);

  function updateDetails(event) {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
    setNotice("");
  }

  function continueToDate() {
    if (!selectedService) {
      setNotice("Please select a service.");
      return;
    }

    setNotice("");
    setStep(2);
  }

  function continueToDetails() {
    if (!date || date < studioDate() || !time) {
      setNotice("Please choose a valid preferred date and time.");
      return;
    }

    if (new Date(`${date}T${time}:00+05:30`) <= new Date()) {
      setNotice("Please choose a future date and time.");
      return;
    }

    setNotice("");
    setStep(3);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;
    if (step === 1) return continueToDate();
    if (step === 2) return continueToDetails();

    if (!selectedService) {
      setStep(1);
      setNotice("Please select an available service.");
      return;
    }

    if (!contactName.trim()) {
      setNotice("Please enter your full name.");
      return;
    }

    if (!/^\+[1-9][0-9]{7,14}$/.test(contactPhone.trim())) {
      setNotice("Enter phone number with country code, e.g. +919876543210.");
      return;
    }

    setSubmitting(true);
    setNotice("");

    try {
      const result = await apiRequest("bookings/", {
        method: "POST",
        body: JSON.stringify({
          service: selectedService.id,
          preferred_date: date,
          preferred_time: time,
          contact_name: contactName.trim(),
          contact_email: user.email,
          contact_phone: contactPhone.trim(),
          notes: details.notes.trim(),
        }),
      });

      setBooking(result);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to submit your booking request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="booking-page">
        <p>Loading your account…</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="booking-page">
        <section className="booking-hero">
          <h1>Plan your session.</h1>
          <p>Please sign in before submitting a booking request.</p>
          <Link className="booking-button" to="/login">
            Sign in <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    );
  }

  if (booking) {
    return (
      <main className="booking-page">
        <section className="booking-hero" aria-live="polite">
          <Check size={32} aria-hidden="true" />
          <h1>Request received.</h1>
          <p>
            Your {booking.service_name} booking request has been saved. The
            studio will review your preferred timing.
          </p>
          <p>Status: Pending — this is not a confirmed reservation.</p>
          <p>Reference: {booking.id}</p>

          <Link className="booking-button" to="/dashboard/bookings">
            My bookings <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <section className="booking-hero">
        <div className="booking-hero__eyebrow">
          <span /> YOUR MOMENT, BEAUTIFULLY CAPTURED
        </div>
        <h1>
          Let's make it
          <br />
          <em>memorable.</em>
        </h1>
        <p>Choose a service and send your preferred session details.</p>
      </section>

      <section className="booking-content">
        <div className="booking-intro">
          <span className="booking-intro__label">LITTLE CLICK STUDIO</span>
          <h2>
            A little moment.
            <br />
            <em>A lifetime of love.</em>
          </h2>
          <p>
            Your request will be reviewed by the studio. Your selected date and
            time are preferences, subject to confirmation.
          </p>
        </div>

        <div className="booking-card">
          <div className="booking-card__top">
            <div>
              <span className="booking-card__eyebrow">PLAN YOUR SESSION</span>
              <h2>
                {step === 1 && "Choose your experience"}
                {step === 2 && "Your preferred timing"}
                {step === 3 && "Your contact details"}
              </h2>
            </div>
            <span className="booking-card__step">0{step} / 03</span>
          </div>

          <div
            className="booking-progress"
            role="progressbar"
            aria-label="Booking progress"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step}
          >
            {[1, 2, 3].map((number) => (
              <span
                key={number}
                className={step >= number ? "is-active" : ""}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} aria-busy={submitting}>
            {step === 1 && (
              <div className="booking-step">
                {servicesLoading ? (
                  <p role="status">Loading services…</p>
                ) : servicesError ? (
                  <div>
                    <p role="alert">{servicesError}</p>
                    <button
                      type="button"
                      className="booking-button"
                      onClick={() => {
                        setServicesError("");
                        setServicesLoading(true);
                        setRetry((value) => value + 1);
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ) : services.length === 0 ? (
                  <p>No services are currently available for booking.</p>
                ) : (
                  <>
                    <div className="booking-experiences">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          className={`booking-experience ${
                            serviceId === String(service.id)
                              ? "is-selected"
                              : ""
                          }`}
                          aria-pressed={serviceId === String(service.id)}
                          onClick={() => {
                            setServiceId(String(service.id));
                            setNotice("");
                          }}
                        >
                          <span className="booking-experience__icon">
                            <Camera size={21} aria-hidden="true" />
                          </span>
                          <span className="booking-experience__content">
                            <strong>{service.name}</strong>
                            <small>{service.description}</small>
                            <small className="booking-experience__duration">
                              <Clock3 size={13} aria-hidden="true" />
                              {service.duration_minutes} minutes
                            </small>
                            <small>
                              {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                              }).format(Number(service.price))}
                            </small>
                          </span>
                          <span className="booking-experience__check">
                            {serviceId === String(service.id) && (
                              <Check size={16} />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="booking-button"
                      onClick={continueToDate}
                    >
                      Continue to date <ArrowRight size={18} />
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="booking-step">
                <p className="booking-step__description">
                  Select your preferred studio date and time (India time).
                  Availability is confirmed separately by the studio.
                </p>

                <div className="booking-field">
                  <label htmlFor="booking-date">Preferred date *</label>
                  <input
                    id="booking-date"
                    type="date"
                    min={studioDate()}
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setNotice("");
                    }}
                    required
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="booking-time">Preferred time *</label>
                  <input
                    id="booking-time"
                    type="time"
                    value={time}
                    onChange={(event) => {
                      setTime(event.target.value);
                      setNotice("");
                    }}
                    required
                  />
                </div>

                <div className="booking-actions">
                  <button
                    type="button"
                    className="booking-button booking-button--secondary"
                    onClick={() => {
                      setNotice("");
                      setStep(1);
                    }}
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button
                    type="button"
                    className="booking-button"
                    onClick={continueToDetails}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="booking-step">
                <div className="booking-summary">
                  <div>
                    <span>SERVICE</span>
                    <strong>{selectedService?.name}</strong>
                  </div>
                  <div>
                    <span>PREFERRED DATE</span>
                    <strong>{date}</strong>
                  </div>
                  <div>
                    <span>PREFERRED TIME · IST</span>
                    <strong>{time}</strong>
                  </div>
                </div>

                <div className="booking-fields">
                  <div className="booking-field">
                    <label htmlFor="booking-name">Full name *</label>
                    <input
                      id="booking-name"
                      name="name"
                      autoComplete="name"
                      value={contactName}
                      onChange={updateDetails}
                      maxLength={300}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-email">Account email</label>
                    <input
                      id="booking-email"
                      type="email"
                      autoComplete="email"
                      value={user.email}
                      readOnly
                    />
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-phone">Phone number *</label>
                    <input
                      id="booking-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+919876543210"
                      value={contactPhone}
                      onChange={updateDetails}
                      maxLength={16}
                      required
                      disabled={submitting}
                    />
                    <p className="booking-field__hint">
                      Include country code without spaces.
                    </p>
                  </div>

                  <div className="booking-field">
                    <label htmlFor="booking-notes">
                      Additional details (optional)
                    </label>
                    <textarea
                      id="booking-notes"
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      value={details.notes}
                      onChange={updateDetails}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    type="button"
                    className="booking-button booking-button--secondary"
                    disabled={submitting}
                    onClick={() => {
                      setNotice("");
                      setStep(2);
                    }}
                  >
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button
                    type="submit"
                    className="booking-button"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Send booking request"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {notice && (
              <p className="booking-notice" role="alert">
                {notice}
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
