import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const BOOKING_CARDS = [
  {
    key: "total",
    label: "Total bookings",
    note: "All your booking requests",
    icon: Camera,
    tone: "sand",
  },
  {
    key: "pending",
    label: "Pending requests",
    note: "Awaiting studio confirmation",
    icon: Clock3,
    tone: "rose",
  },
  {
    key: "confirmed",
    label: "Confirmed sessions",
    note: "Bookings marked confirmed",
    icon: CalendarDays,
    tone: "sage",
  },
  {
    key: "completed",
    label: "Completed sessions",
    note: "Bookings marked completed",
    icon: CheckCircle2,
    tone: "sage",
  },
];

const EMPTY_RESOURCE = {
  data: null,
  error: "",
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value));

function validateBookings(data) {
  const keys = [
    "total",
    "pending",
    "confirmed",
    "completed",
    "cancelled",
  ];

  if (
    !keys.every(
      (key) => Number.isInteger(data?.[key]) && data[key] >= 0,
    )
  ) {
    throw new Error("Unable to read your booking summary.");
  }

  return data;
}

function validateGallery(data) {
  if (
    !Number.isInteger(data?.count) ||
    data.count < 0 ||
    !Number.isInteger(data?.total_photos) ||
    data.total_photos < 0
  ) {
    throw new Error("Unable to read your gallery summary.");
  }

  return data;
}

function validatePayments(data) {
  const amountKeys = [
    "total_billed",
    "total_paid",
    "total_refunded",
    "net_paid",
    "balance_due",
    "credit_balance",
  ];

  if (
    !["test", "live"].includes(data?.environment) ||
    data.currency !== "INR" ||
    !Number.isInteger(data.billing_count) ||
    data.billing_count < 0 ||
    !amountKeys.every(
      (key) =>
        typeof data[key] === "string" &&
        /^-?\d+\.\d{2}$/.test(data[key]) &&
        Number.isFinite(Number(data[key])),
    )
  ) {
    throw new Error("Unable to read your payment summary.");
  }

  return data;
}

function ResourceState({ resource, label, retry, children }) {
  if (resource.error) {
    return (
      <div className="customer-overview__empty-session">
        <p role="alert">{resource.error}</p>

        <button
          type="button"
          className="customer-overview__outline-button"
          onClick={retry}
        >
          Retry {label}
        </button>
      </div>
    );
  }

  if (!resource.data) {
    return <p role="status">Loading your {label}…</p>;
  }

  return children(resource.data);
}

export default function Overview() {
  const { user, apiRequest } = useAuth();

  const [bookings, setBookings] = useState(EMPTY_RESOURCE);
  const [gallery, setGallery] = useState(EMPTY_RESOURCE);
  const [payments, setPayments] = useState(EMPTY_RESOURCE);

  const [bookingRetry, setBookingRetry] = useState(0);
  const [galleryRetry, setGalleryRetry] = useState(0);
  const [paymentRetry, setPaymentRetry] = useState(0);

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName = fullName || user?.email || "Your account";

  useEffect(() => {
    const controller = new AbortController();

    apiRequest("bookings/summary/", {
      signal: controller.signal,
    })
      .then(validateBookings)
      .then((data) => {
        if (!controller.signal.aborted) {
          setBookings({ data, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setBookings({
            data: null,
            error: error.message || "Unable to load your bookings.",
          });
        }
      });

    return () => controller.abort();
  }, [apiRequest, bookingRetry]);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest("galleries/?page=1", {
      signal: controller.signal,
    })
      .then(validateGallery)
      .then((data) => {
        if (!controller.signal.aborted) {
          setGallery({ data, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setGallery({
            data: null,
            error: error.message || "Unable to load your gallery.",
          });
        }
      });

    return () => controller.abort();
  }, [apiRequest, galleryRetry]);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest("payments/summary/", {
      signal: controller.signal,
    })
      .then(validatePayments)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPayments({ data, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setPayments({
            data: null,
            error: error.message || "Unable to load your payments.",
          });
        }
      });

    return () => controller.abort();
  }, [apiRequest, paymentRetry]);

  function retryBookings() {
    setBookings(EMPTY_RESOURCE);
    setBookingRetry((value) => value + 1);
  }

  function retryGallery() {
    setGallery(EMPTY_RESOURCE);
    setGalleryRetry((value) => value + 1);
  }

  function retryPayments() {
    setPayments(EMPTY_RESOURCE);
    setPaymentRetry((value) => value + 1);
  }

  return (
    <div className="customer-overview">
      <section className="customer-overview__welcome">
        <div className="customer-overview__welcome-copy">
          <span className="customer-overview__eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            YOUR LITTLE CLICK EXPERIENCE
          </span>

          <h1>
            Welcome back,
            <br />
            <em>{displayName}.</em>
          </h1>

          <p>
            Your sessions, photographs and account details,
            thoughtfully brought together.
          </p>

          <div className="customer-overview__welcome-actions">
            <Link
              className="customer-overview__primary-button"
              to="/booking"
            >
              Plan a session
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>

            <Link
              className="customer-overview__text-link"
              to="/dashboard/bookings"
            >
              My bookings
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div
          className="customer-overview__welcome-art"
          aria-hidden="true"
        >
          <div className="customer-overview__art-orbit" />
          <div className="customer-overview__art-sun" />

          <div className="customer-overview__art-card">
            <div className="customer-overview__art-photo">
              <span className="customer-overview__art-label">
                LITTLE MOMENTS
              </span>

              <Camera size={30} strokeWidth={1.2} />

              <span className="customer-overview__art-caption">
                A lifetime of love
              </span>
            </div>
          </div>

          <div className="customer-overview__art-stamp">
            <Sparkles size={17} />
            <span>Made with love</span>
          </div>
        </div>
      </section>

      <section
        className="customer-overview__section"
        aria-busy={!bookings.data && !bookings.error}
      >
        <div className="customer-overview__section-heading">
          <div>
            <span className="customer-overview__eyebrow">
              YOUR STUDIO SPACE
            </span>
            <h2>Your bookings at a glance</h2>
          </div>
        </div>

        <ResourceState
          resource={bookings}
          label="bookings"
          retry={retryBookings}
        >
          {(summary) => (
            <>
              <div className="customer-overview__stats">
                {BOOKING_CARDS.map(
                  ({ key, label, note, icon: Icon, tone }) => (
                    <article
                      className={`customer-overview__stat customer-overview__stat--${tone}`}
                      key={key}
                    >
                      <div className="customer-overview__stat-top">
                        <span className="customer-overview__stat-icon">
                          <Icon
                            size={19}
                            strokeWidth={1.7}
                            aria-hidden="true"
                          />
                        </span>
                      </div>

                      <h3 className="customer-overview__stat-label">
                        {label}
                      </h3>

                      <strong className="customer-overview__stat-value">
                        {summary[key]}
                      </strong>

                      <span className="customer-overview__stat-note">
                        {note}
                      </span>
                    </article>
                  ),
                )}
              </div>

              <p className="customer-overview__summary-note">
                Cancelled bookings: {summary.cancelled}.
                {" "}Total includes all booking statuses.
              </p>
            </>
          )}
        </ResourceState>
      </section>

      <div className="customer-overview__content-grid">
        <section
          className="customer-overview__session-card"
          aria-busy={!gallery.data && !gallery.error}
        >
          <div className="customer-overview__section-heading">
            <div>
              <span className="customer-overview__eyebrow">
                YOUR PRIVATE COLLECTION
              </span>
              <h2>Photographs to keep</h2>
            </div>

            <ImageIcon size={23} aria-hidden="true" />
          </div>

          <ResourceState
            resource={gallery}
            label="gallery"
            retry={retryGallery}
          >
            {(summary) => (
              <>
                <dl className="account-details">
                  <div>
                    <dt>Published collections</dt>
                    <dd>{summary.count}</dd>
                  </div>

                  <div>
                    <dt>Delivered photographs</dt>
                    <dd>{summary.total_photos}</dd>
                  </div>
                </dl>

                <p className="customer-overview__summary-note">
                  {summary.count === 0
                    ? "Your collections will appear when the studio publishes them."
                    : "Only your published collections are included."}
                </p>

                <Link
                  className="customer-overview__outline-button"
                  to="/dashboard/gallery"
                >
                  Open private gallery
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </ResourceState>
        </section>

        <section
          className="customer-overview__journey-card"
          aria-busy={!payments.data && !payments.error}
        >
          <div className="customer-overview__section-heading">
            <div>
              <span className="customer-overview__eyebrow">
                YOUR ACCOUNT · BILLING
              </span>
              <h2>Payment overview</h2>
            </div>

            <Wallet size={23} aria-hidden="true" />
          </div>

          <ResourceState
            resource={payments}
            label="payments"
            retry={retryPayments}
          >
            {(summary) => (
              <>
                {summary.environment === "test" && (
                  <p className="customer-overview__summary-note" role="note">
                    <strong>Test environment:</strong> these amounts are
                    test records, not real customer payments.
                  </p>
                )}

                <dl className="account-details">
                  <div>
                    <dt>
                      {summary.environment === "test"
                        ? "Test balance due"
                        : "Balance due"}
                    </dt>
                    <dd>{formatMoney(summary.balance_due)}</dd>
                  </div>

                  <div>
                    <dt>Net paid</dt>
                    <dd>{formatMoney(summary.net_paid)}</dd>
                  </div>

                  <div>
                    <dt>Refunded</dt>
                    <dd>{formatMoney(summary.total_refunded)}</dd>
                  </div>

                  <div>
                    <dt>Credit balance</dt>
                    <dd>{formatMoney(summary.credit_balance)}</dd>
                  </div>
                </dl>

                <p className="customer-overview__summary-note">
                  {summary.billing_count === 0
                    ? "No billing records have been prepared yet."
                    : "Amounts include prepared billing records only."}
                </p>

                <Link
                  className="customer-overview__outline-button"
                  to="/dashboard/payments"
                >
                  View payments
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </>
            )}
          </ResourceState>
        </section>
      </div>

      <section className="customer-overview__section">
        <div className="customer-overview__session-card">
          <div className="customer-overview__section-heading">
            <div>
              <span className="customer-overview__eyebrow">
                YOUR STUDIO ACCOUNT
              </span>
              <h2>Personal details</h2>
            </div>

            <UserRound size={21} aria-hidden="true" />
          </div>

          <dl className="account-details">
            <div>
              <dt>Full name</dt>
              <dd>{fullName || "Not provided"}</dd>
            </div>

            <div>
              <dt>Email address</dt>
              <dd>{user?.email || "Not provided"}</dd>
            </div>

            <div>
              <dt>Phone number</dt>
              <dd>{user?.phone_number || "Not provided"}</dd>
            </div>

            <div>
              <dt>City</dt>
              <dd>{user?.city || "Not provided"}</dd>
            </div>
          </dl>

          <Link
            className="customer-overview__inline-link"
            to="/dashboard/profile"
          >
            View profile
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}