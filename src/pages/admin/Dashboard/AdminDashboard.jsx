
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

const summaryCards = [
  {
    label: "Total bookings",
    value: "—",
    note: "Booking data not connected",
    icon: CalendarDays,
    to: "/admin/bookings",
  },
  {
    label: "Pending inquiries",
    value: "—",
    note: "Inquiry data not connected",
    icon: MessageSquare,
    to: "/admin/inquiries",
  },
  {
    label: "Total customers",
    value: "—",
    note: "Customer data not connected",
    icon: Users,
    to: "/admin/customers",
  },
  {
    label: "Revenue received",
    value: "—",
    note: "Payment data not connected",
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

const recentBookings = [];
const recentActivity = [];

export default function AdminDashboard() {
  const dataConnected = false;

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
          {dataConnected ? "Live data connected" : "Awaiting data connection"}
        </div>
      </header>

      <section
        className="admin-dashboard__metrics"
        aria-label="Studio summary"
      >
        {summaryCards.map(({ label, value, note, icon: Icon, to }, index) => (
          <Link
            className="admin-dashboard__metric"
            to={to}
            key={label}
            aria-label={`${label}. ${note}. Open related page.`}
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
          <article className="admin-dashboard__panel admin-dashboard__bookings">
            <div className="admin-dashboard__panel-heading">
              <div>
                <p className="admin-dashboard__eyebrow">CLIENT SESSIONS</p>
                <h3>Recent bookings</h3>
              </div>

              <Link
                className="admin-dashboard__text-link"
                to="/admin/bookings"
              >
                View all <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="admin-dashboard__empty">
                <span className="admin-dashboard__empty-icon">
                  <CalendarDays size={23} strokeWidth={1.5} aria-hidden="true" />
                </span>

                <h4>No booking records yet</h4>

                <p>
                  Once booking data is connected, your latest client sessions
                  will appear here.
                </p>

                <Link
                  className="admin-dashboard__button"
                  to="/admin/bookings"
                >
                  Open bookings <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="admin-dashboard__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Session</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.client}</td>
                        <td>{booking.session}</td>
                        <td>{booking.date}</td>
                        <td>
                          <span className="admin-dashboard__booking-status">
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <aside className="admin-dashboard__panel admin-dashboard__activity">
            <div className="admin-dashboard__panel-heading">
              <div>
                <p className="admin-dashboard__eyebrow">STUDIO PULSE</p>
                <h3>Recent activity</h3>
              </div>

              <Clock3 size={19} strokeWidth={1.6} aria-hidden="true" />
            </div>

            {recentActivity.length === 0 ? (
              <div className="admin-dashboard__activity-empty">
                <span className="admin-dashboard__activity-decoration">
                  <Sparkles size={20} aria-hidden="true" />
                </span>

                <h4>Your next chapter starts here.</h4>

                <p>
                  Booking updates, new inquiries and studio changes can appear
                  here when activity tracking is connected.
                </p>
              </div>
            ) : (
              <ul className="admin-dashboard__activity-list">
                {recentActivity.map((activity) => (
                  <li key={activity.id}>
                    <span className="admin-dashboard__activity-marker" />
                    <div>
                      <strong>{activity.title}</strong>
                      <p>{activity.description}</p>
                      <small>{activity.time}</small>
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
              <Link
                className="admin-dashboard__action"
                to={to}
                key={title}
              >
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
          <p>
            A workspace for the memories that matter.
          </p>
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
