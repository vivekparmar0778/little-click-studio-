import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

function formatDate(value) {
  return new Date(`${value}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function canCancel(booking) {
  return (
    booking.status === "pending" &&
    new Date(`${booking.preferred_date}T${booking.preferred_time}+05:30`) >
      new Date()
  );
}

export default function Bookings() {
  const { apiRequest } = useAuth();

  const [result, setResult] = useState({
    count: 0,
    results: [],
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    let active = true;

    apiRequest(`bookings/?page=${page}`)
      .then((data) => {
        if (!Array.isArray(data.results)) {
          throw new Error("Invalid bookings response.");
        }

        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load bookings.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiRequest, page, reload]);

  function loadPage(nextPage) {
    setLoading(true);
    setError("");
    setExpanded(null);
    setConfirmCancel(null);
    setPage(nextPage);
  }

  function retry() {
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  }

  async function cancelBooking(id) {
    if (cancelling) return;

    setCancelling(id);
    setNotice("");

    try {
      const data = await apiRequest(`bookings/${id}/cancel/`, {
        method: "POST",
      });

      if (!data.booking || data.booking.id !== id) {
        throw new Error("Unable to confirm cancellation. Please reload.");
      }

      setResult((current) => ({
        ...current,
        results: current.results.map((booking) =>
          booking.id === id ? data.booking : booking,
        ),
      }));

      setConfirmCancel(null);
      setNotice(data.message);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Unable to cancel booking.",
      );
    } finally {
      setCancelling(null);
    }
  }

  const bookings = result.results.filter(
    (booking) => filter === "all" || booking.status === filter,
  );

  return (
    <div className="customer-bookings">
      <header className="customer-bookings__intro">
        <div>
          <span className="customer-bookings__eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            YOUR STUDIO JOURNEY
          </span>

          <h1>
            Moments in <em>the making.</em>
          </h1>
          <p>View your booking requests, session details and current status.</p>
        </div>

        <Link to="/booking" className="customer-bookings__primary-button">
          Book a session <ArrowRight size={16} />
        </Link>
      </header>

      <section className="customer-bookings__content" aria-busy={loading}>
        <div className="customer-bookings__section-heading">
          <div>
            <span className="customer-bookings__eyebrow">
              YOUR RESERVATIONS
            </span>
            <h2>My sessions</h2>
          </div>

          {!loading && !error && (
            <span className="customer-bookings__result-count">
              {result.count} total bookings
            </span>
          )}
        </div>

        {notice && <p role="status">{notice}</p>}

        {loading ? (
          <p role="status">Loading your bookings…</p>
        ) : error ? (
          <div className="customer-bookings__empty">
            <p role="alert">{error}</p>
            <button
              type="button"
              className="customer-bookings__button customer-bookings__button--secondary"
              onClick={retry}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="customer-bookings__toolbar">
              <div
                className="customer-bookings__filters"
                role="group"
                aria-label="Filter bookings on this page"
              >
                {FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`customer-bookings__filter ${
                      filter === status ? "is-active" : ""
                    }`}
                    aria-pressed={filter === status}
                    onClick={() => setFilter(status)}
                  >
                    {status === "all" ? "All statuses" : STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            <p>Filters apply to this page of bookings.</p>

            {bookings.length === 0 ? (
              <div className="customer-bookings__empty">
                <CalendarDays size={25} aria-hidden="true" />
                <h3>
                  {result.count === 0
                    ? "You have no bookings yet."
                    : "No matching bookings on this page."}
                </h3>
                <Link to="/booking">Plan a session ↗</Link>
              </div>
            ) : (
              <div className="customer-bookings__list">
                {bookings.map((booking, index) => {
                  const isExpanded = expanded === booking.id;
                  const isCancelling = cancelling === booking.id;
                  const detailsId = `booking-${booking.id}`;

                  return (
                    <article
                      className="customer-bookings__card"
                      key={booking.id}
                      style={{ "--booking-index": index }}
                    >
                      <div className="customer-bookings__date-tile">
                        <CalendarDays size={22} aria-hidden="true" />
                        <span>{formatDate(booking.preferred_date)}</span>
                      </div>

                      <div className="customer-bookings__details">
                        <div className="customer-bookings__card-topline">
                          <span className="customer-bookings__type">
                            PHOTOGRAPHY SESSION
                          </span>
                          <span
                            className={`customer-bookings__status customer-bookings__status--${booking.status}`}
                          >
                            <span />
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </div>

                        <h3>{booking.service_name}</h3>

                        <div className="customer-bookings__meta">
                          <span>
                            <Clock3 size={14} aria-hidden="true" />
                            {booking.preferred_time.slice(0, 5)} IST
                          </span>
                          <span>{booking.duration_minutes} minutes</span>
                        </div>

                        {booking.status === "pending" && (
                          <p>
                            Requested timing — awaiting studio confirmation.
                          </p>
                        )}

                        <button
                          className="customer-bookings__details-button"
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={detailsId}
                          onClick={() =>
                            setExpanded(isExpanded ? null : booking.id)
                          }
                        >
                          {isExpanded ? "Hide details" : "View details"}
                          <ChevronDown
                            size={15}
                            className={isExpanded ? "is-rotated" : ""}
                          />
                        </button>

                        {isExpanded && (
                          <div
                            id={detailsId}
                            className="customer-bookings__expanded"
                          >
                            <dl className="account-details">
                              <div>
                                <dt>Reference</dt>
                                <dd>{booking.id}</dd>
                              </div>
                              <div>
                                <dt>Quoted price</dt>
                                <dd>
                                  {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                  }).format(Number(booking.quoted_price))}
                                </dd>
                              </div>
                              <div>
                                <dt>Contact name</dt>
                                <dd>{booking.contact_name}</dd>
                              </div>
                              <div>
                                <dt>Email</dt>
                                <dd>{booking.contact_email}</dd>
                              </div>
                              <div>
                                <dt>Phone</dt>
                                <dd>{booking.contact_phone}</dd>
                              </div>
                              <div>
                                <dt>Notes</dt>
                                <dd>{booking.notes || "None provided"}</dd>
                              </div>
                            </dl>

                            {canCancel(booking) &&
                              (confirmCancel === booking.id ? (
                                <div className="customer-bookings__cancel-confirm">
                                  <p>Cancel this booking request?</p>

                                  <div className="customer-bookings__action-buttons">
                                    <button
                                      type="button"
                                      className="customer-bookings__button customer-bookings__button--danger"
                                      disabled={Boolean(cancelling)}
                                      onClick={() => cancelBooking(booking.id)}
                                    >
                                      {isCancelling
                                        ? "Cancelling…"
                                        : "Yes, cancel"}
                                    </button>

                                    <button
                                      type="button"
                                      className="customer-bookings__button customer-bookings__button--secondary"
                                      disabled={Boolean(cancelling)}
                                      onClick={() => setConfirmCancel(null)}
                                    >
                                      Keep booking
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="customer-bookings__button customer-bookings__button--danger-outline"
                                  disabled={Boolean(cancelling)}
                                  onClick={() => setConfirmCancel(booking.id)}
                                >
                                  Cancel request
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <nav
              className="customer-bookings__pagination"
              aria-label="Booking pages"
            >
              <button
                type="button"
                className="customer-bookings__button customer-bookings__button--secondary"
                disabled={!result.previous || Boolean(cancelling)}
                onClick={() => loadPage(page - 1)}
              >
                Previous
              </button>

              <span
                className="customer-bookings__page-number"
                aria-current="page"
              >
                Page {page}
              </span>

              <button
                type="button"
                className="customer-bookings__button customer-bookings__button--secondary"
                disabled={!result.next || Boolean(cancelling)}
                onClick={() => loadPage(page + 1)}
              >
                Next
              </button>
            </nav>
          </>
        )}
      </section>

      <aside className="customer-bookings__help">
        <div>
          <h2>Need help with your session?</h2>
          <p>Contact the studio about confirmed bookings or timing changes.</p>
        </div>
        <Link to="/contact">
          Contact the studio <ArrowRight size={15} />
        </Link>
      </aside>
    </div>
  );
}
