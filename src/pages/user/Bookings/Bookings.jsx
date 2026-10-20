
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

// UI preview records only. Replace these with authenticated API data later.
const previewBookings = [
  {
    id: "LCS-1024",
    title: "Newborn Photography",
    type: "Newborn",
    date: "2026-11-14",
    time: "10:30 AM",
    location: "Little Click Studio · South Bopal",
    status: "Confirmed",
    description:
      "A gentle studio session to capture your baby's earliest little moments.",
  },
  {
    id: "LCS-1025",
    title: "Maternity Portraits",
    type: "Maternity",
    date: "2026-11-22",
    time: "04:00 PM",
    location: "Little Click Studio · South Bopal",
    status: "Pending",
    description:
      "An elegant maternity portrait session with soft, natural studio lighting.",
  },
  {
    id: "LCS-1018",
    title: "Baby Milestone Session",
    type: "Baby",
    date: "2026-08-12",
    time: "11:00 AM",
    location: "Little Click Studio · South Bopal",
    status: "Completed",
    description:
      "A milestone session celebrating your baby's growing personality.",
  },
];

const filters = ["All sessions", "Upcoming", "Completed", "Cancelled"];

function getFilterStatus(booking) {
  if (booking.status === "Cancelled") return "Cancelled";
  if (booking.status === "Completed") return "Completed";
  return new Date(`${booking.date}T23:59:59`) >= new Date()
    ? "Upcoming"
    : "Completed";
}

// function formatDate(date) {
//   return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

export default function Bookings() {
  const [activeFilter, setActiveFilter] = useState("All sessions");
  const [search, setSearch] = useState("");
  const [expandedBooking, setExpandedBooking] = useState(null);

  const bookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return previewBookings.filter((booking) => {
      const matchesFilter =
        activeFilter === "All sessions" ||
        getFilterStatus(booking) === activeFilter;

      const matchesSearch =
        !query ||
        `${booking.title} ${booking.type} ${booking.id} ${booking.status}`
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, search]);

  const upcomingCount = previewBookings.filter(
    (booking) => getFilterStatus(booking) === "Upcoming"
  ).length;

  const completedCount = previewBookings.filter(
    (booking) => getFilterStatus(booking) === "Completed"
  ).length;

  return (
    <div className="customer-bookings">
      <header className="customer-bookings__intro">
        <div>
          <span className="customer-bookings__eyebrow">
            <Sparkles size={14} />
            YOUR STUDIO JOURNEY
          </span>
          <h1>
            Moments in <em>the making.</em>
          </h1>
          <p>
            Every session is a new memory waiting to happen. Find your
            bookings, check your session details and plan what comes next.
          </p>
        </div>

        <Link to="/booking" className="customer-bookings__primary-button">
          Book a session <ArrowRight size={16} />
        </Link>
      </header>

      <section className="customer-bookings__summary" aria-label="Booking summary">
        <article>
          <span className="customer-bookings__summary-icon">
            <CalendarDays size={19} />
          </span>
          <div>
            <span>Upcoming sessions</span>
            <strong>{upcomingCount}</strong>
          </div>
        </article>

        <article>
          <span className="customer-bookings__summary-icon">
            <Clock3 size={19} />
          </span>
          <div>
            <span>Completed sessions</span>
            <strong>{completedCount}</strong>
          </div>
        </article>

        <article className="customer-bookings__summary-note">
          <span className="customer-bookings__summary-icon">
            <Check size={19} />
          </span>
          <div>
            <span>Every moment matters</span>
            <strong className="customer-bookings__summary-message">
              Beautifully remembered.
            </strong>
          </div>
        </article>
      </section>

      <section className="customer-bookings__content">
        <div className="customer-bookings__section-heading">
          <div>
            <span className="customer-bookings__eyebrow">YOUR RESERVATIONS</span>
            <h2>My sessions</h2>
          </div>
          <span className="customer-bookings__result-count">
            {bookings.length} {bookings.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        <div className="customer-bookings__toolbar">
          <div className="customer-bookings__filters" role="group" aria-label="Filter bookings">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={
                  activeFilter === filter
                    ? "customer-bookings__filter is-active"
                    : "customer-bookings__filter"
                }
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="customer-bookings__search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search sessions..."
              aria-label="Search bookings"
            />
          </label>
        </div>

        {bookings.length > 0 ? (
          <div className="customer-bookings__list">
            {bookings.map((booking, index) => {
              const expanded = expandedBooking === booking.id;
              const statusClass = booking.status.toLowerCase();

              return (
                <article
                  className="customer-bookings__card"
                  key={booking.id}
                  style={{ "--booking-index": index }}
                >
                  <div className="customer-bookings__date-tile">
                    <span>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span>
                    <strong>{new Date(`${booking.date}T12:00:00`).getDate()}</strong>
                    <span>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" })}</span>
                  </div>

                  <div className="customer-bookings__details">
                    <div className="customer-bookings__card-topline">
                      <span className="customer-bookings__type">{booking.type} SESSION</span>
                      <span className={`customer-bookings__status customer-bookings__status--${statusClass}`}>
                        <span />
                        {booking.status}
                      </span>
                    </div>

                    <h3>{booking.title}</h3>

                    <div className="customer-bookings__meta">
                      <span><Clock3 size={14} /> {booking.time}</span>
                      <span><MapPin size={14} /> {booking.location}</span>
                    </div>

                    {expanded && (
                      <div className="customer-bookings__expanded">
                        <p>{booking.description}</p>
                        <span>Booking reference: {booking.id}</span>
                      </div>
                    )}

                    <button
                      className="customer-bookings__details-button"
                      type="button"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedBooking(expanded ? null : booking.id)
                      }
                    >
                      {expanded ? "Hide details" : "View details"}
                      <ChevronDown
                        size={15}
                        className={expanded ? "is-rotated" : ""}
                      />
                    </button>
                  </div>

                  <div className="customer-bookings__card-action">
                    <span>REFERENCE</span>
                    <strong>{booking.id}</strong>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBooking(expanded ? null : booking.id)
                      }
                      aria-label={`${expanded ? "Hide" : "Show"} details for ${booking.title}`}
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="customer-bookings__empty">
            <span><CalendarDays size={25} /></span>
            <h3>No sessions found</h3>
            <p>
              Try another filter or search, or plan a new photography session.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("All sessions");
                setSearch("");
              }}
            >
              Clear filters
            </button>
            <Link to="/booking">Explore a new session ↗</Link>
          </div>
        )}
      </section>

      <aside className="customer-bookings__help">
        <div>
          <span className="customer-bookings__eyebrow">NEED A LITTLE HELP?</span>
          <h2>We're here for your story.</h2>
          <p>Have a question about a session? Get in touch with the studio.</p>
        </div>
        <Link to="/contact">Contact the studio <ArrowRight size={15} /></Link>
      </aside>

      <p className="customer-bookings__disclaimer">
        Preview mode: the displayed sessions are sample UI data, not actual
        reservations. Your authenticated booking records will be loaded from
        the backend when the API is connected.
      </p>
    </div>
  );
}
