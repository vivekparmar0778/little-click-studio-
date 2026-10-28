import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Image,
  IndianRupee,
  MessageSquare,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { createAdminOverviewService } from "../../../services/adminReviewsService";

const summaryCardConfig = [
  {
    label: "Total bookings",
    key: "total_bookings",
    note: "All booking requests",
    icon: CalendarDays,
    to: "/admin/bookings",
  },
  {
    label: "Pending inquiries",
    key: "pending_inquiries",
    note: "New and contacted inquiries",
    icon: MessageSquare,
    to: "/admin/inquiries",
  },
  {
    label: "Total customers",
    key: "total_customers",
    note: "Registered non-admin accounts",
    icon: Users,
    to: "/admin/customers",
  },
  {
    label: "Revenue received",
    key: "revenue_received",
    note: "Live payments minus successful refunds",
    icon: IndianRupee,
    to: "/admin/bookings",
  },
];

const quickActions = [
  {
    title: "Manage bookings",
    description: "Review appointments and session requests.",
    icon: CalendarDays,
    to: "/admin/bookings",
    label: "Open bookings",
  },
  {
    title: "Manage gallery",
    description: "Organize photography and studio albums.",
    icon: Image,
    to: "/admin/gallery",
    label: "Open gallery",
  },
  {
    title: "Review inquiries",
    description: "Keep track of incoming client messages.",
    icon: MessageSquare,
    to: "/admin/inquiries",
    label: "View inquiries",
  },
  {
    title: "Studio settings",
    description: "Manage your studio information and preferences.",
    icon: Settings2,
    to: "/admin/settings",
    label: "Open settings",
  },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatActivityTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function validateOverview(data) {
  const summary = data?.summary;

  const countFields = [
    "total_bookings",
    "pending_inquiries",
    "total_customers",
  ];

  const validCounts = countFields.every(
    (key) => Number.isInteger(summary?.[key]) && summary[key] >= 0,
  );

  const revenue = summary?.revenue_received;
  const validRevenue =
    (typeof revenue === "string" && revenue.trim() !== "") ||
    typeof revenue === "number";

  if (
    !summary ||
    !validCounts ||
    !validRevenue ||
    !Number.isFinite(Number(revenue)) ||
    summary.currency !== "INR" ||
    !Array.isArray(data.recent_bookings)
  ) {
    throw new Error("Invalid overview response. Please try again.");
  }

  return data;
}

export default function AdminDashboard() {
  const { apiRequest } = useAuth();

  const overviewApi = useMemo(
    () => createAdminOverviewService(apiRequest),
    [apiRequest],
  );

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        const response = await overviewApi.getOverview();
        const data = validateOverview(response);

        if (active) {
          setOverview(data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setOverview(null);
          setError(requestError?.message || "Unable to load studio overview.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      active = false;
    };
  }, [overviewApi, retryCount]);

  function handleRetry() {
    setLoading(true);
    setError("");
    setOverview(null);
    setRetryCount((count) => count + 1);
  }

  const dataConnected = overview !== null && !loading && !error;
  const summary = overview?.summary;
  const recentBookings = overview?.recent_bookings ?? [];
  const recentActivity = overview?.recent_activity ?? [];

  const summaryCards = summaryCardConfig.map((card) => {
    let value = "—";

    if (dataConnected) {
      value =
        card.key === "revenue_received"
          ? new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: summary.currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(Number(summary[card.key]))
          : new Intl.NumberFormat("en-IN").format(summary[card.key]);
    }

    return {
      ...card,
      value,
      note: loading ? "Loading..." : error ? "Unable to load data" : card.note,
    };
  });

  const connectionText = loading
    ? "Loading studio data..."
    : error
      ? "Data connection failed"
      : dataConnected
        ? "Studio data loaded"
        : "Awaiting data connection";

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__intro">
        <div className="admin-dashboard__intro-copy">
          <p className="admin-dashboard__eyebrow">
            LITTLE CLICK STUDIO · ADMINISTRATION
          </p>

          <h1>
            Studio <span>overview.</span>
          </h1>

          <p className="admin-dashboard__description">
            A considered view of your studio operations, client activity and
            upcoming work — all in one place.
          </p>
        </div>

        <div
          className={`admin-dashboard__connection ${
            dataConnected
              ? "admin-dashboard__connection--connected"
              : "admin-dashboard__connection--pending"
          }`}
          role="status"
        >
          <span className="admin-dashboard__connection-dot" />
          {connectionText}
        </div>
      </header>

      {error && (
        <div className="admin-dashboard__panel" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="admin-dashboard__button"
            onClick={handleRetry}
          >
            Try again
          </button>
        </div>
      )}

      <section
        className="admin-dashboard__metrics"
        aria-label="Studio summary"
        aria-busy={loading}
      >
        {summaryCards.map(({ label, value, note, icon: Icon, to }, index) => (
          <Link
            className="admin-dashboard__metric"
            to={to}
            key={label}
            aria-label={`${label}: ${value}. ${note}. Open related page.`}
          >
            <div className="admin-dashboard__metric-top">
              <span className="admin-dashboard__metric-label">{label}</span>

              <span className="admin-dashboard__metric-icon">
                <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
            </div>

            <strong className="admin-dashboard__metric-value">{value}</strong>

            <div className="admin-dashboard__metric-bottom">
              <span>{note}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </div>

            <span
              className={`admin-dashboard__metric-accent admin-dashboard__metric-accent--${index + 1}`}
            />
          </Link>
        ))}
      </section>

      <section className="admin-dashboard__section">
        <div className="admin-dashboard__section-heading">
          <div>
            <p className="admin-dashboard__eyebrow">YOUR WORKSPACE</p>
            <h2>Studio operations</h2>
          </div>

          <p>Everything you need to keep the studio moving.</p>
        </div>

        <div className="admin-dashboard__content-grid">
          <article
            className="admin-dashboard__panel admin-dashboard__bookings"
            aria-busy={loading}
          >
            <div className="admin-dashboard__panel-heading">
              <div>
                <p className="admin-dashboard__eyebrow">CLIENT SESSIONS</p>
                <h3>Recent bookings</h3>
              </div>

              <Link className="admin-dashboard__text-link" to="/admin/bookings">
                View all <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {loading ? (
              <div className="admin-dashboard__empty" role="status">
                <span className="admin-dashboard__empty-icon">
                  <Clock3 size={23} strokeWidth={1.5} aria-hidden="true" />
                </span>

                <h4>Loading bookings...</h4>
                <p>Fetching your latest client sessions.</p>
              </div>
            ) : error ? (
              <div className="admin-dashboard__empty">
                <span className="admin-dashboard__empty-icon">
                  <CalendarDays
                    size={23}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>

                <h4>Bookings could not be loaded</h4>
                <p>Use Try again above to reload studio data.</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="admin-dashboard__empty">
                <span className="admin-dashboard__empty-icon">
                  <CalendarDays
                    size={23}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>

                <h4>No booking records yet</h4>

                <p>Your latest bookings will appear here once created.</p>

                <Link className="admin-dashboard__button" to="/admin/bookings">
                  Open bookings <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="admin-dashboard__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Client</th>
                      <th scope="col">Session</th>
                      <th scope="col">Date</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.client}</td>
                        <td>{booking.session}</td>
                        <td>{formatDate(booking.date)}</td>
                        <td>
                          <span className="admin-dashboard__booking-status">
                            {booking.status_label || booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <aside
            className="admin-dashboard__panel admin-dashboard__activity"
            aria-busy={loading}
          >
            <div className="admin-dashboard__panel-heading">
              <div>
                <p className="admin-dashboard__eyebrow">STUDIO PULSE</p>
                <h3>Recent activity</h3>
              </div>

              <Clock3 size={19} strokeWidth={1.6} aria-hidden="true" />
            </div>

            {loading ? (
              <div className="admin-dashboard__activity-empty" role="status">
                <h4>Loading activity...</h4>
                <p>Fetching recent bookings and inquiries.</p>
              </div>
            ) : error ? (
              <div className="admin-dashboard__activity-empty">
                <h4>Activity could not be loaded</h4>
                <p>Use Try again above to reload studio data.</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="admin-dashboard__activity-empty">
                <span className="admin-dashboard__activity-decoration">
                  <Sparkles size={20} aria-hidden="true" />
                </span>

                <h4>No activity yet</h4>
                <p>New bookings and inquiries will appear here.</p>
              </div>
            ) : (
              <ul className="admin-dashboard__activity-list">
                {recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <span className="admin-dashboard__activity-marker" />

                    <div>
                      <strong>{activity.title}</strong>
                      <p>{activity.description}</p>

                      <small>
                        <time dateTime={activity.created_at}>
                          {formatActivityTime(activity.created_at)}
                        </time>
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>

      <section className="admin-dashboard__section admin-dashboard__shortcuts">
        <div className="admin-dashboard__section-heading">
          <div>
            <p className="admin-dashboard__eyebrow">QUICK ACCESS</p>
            <h2>Make it happen.</h2>
          </div>

          <p>Jump straight into your studio essentials.</p>
        </div>

        <div className="admin-dashboard__actions">
          {quickActions.map(
            ({ title, description, icon: Icon, to, label }, index) => (
              <Link className="admin-dashboard__action" to={to} key={title}>
                <div className="admin-dashboard__action-top">
                  <span className="admin-dashboard__action-icon">
                    <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
                  </span>

                  <span className="admin-dashboard__action-number">
                    0{index + 1}
                  </span>
                </div>

                <h3>{title}</h3>
                <p>{description}</p>

                <span className="admin-dashboard__action-link">
                  {label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ),
          )}
        </div>
      </section>

      <footer className="admin-dashboard__footer">
        <div className="admin-dashboard__footer-mark">
          <Sparkles size={17} strokeWidth={1.5} aria-hidden="true" />
        </div>

        <div>
          <strong>Little moments. Beautifully managed.</strong>
          <p>A workspace for the memories that matter.</p>
        </div>

        <Link
          className="admin-dashboard__footer-link"
          to="/admin/settings"
          aria-label="Manage studio settings"
        >
          Studio preferences <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
