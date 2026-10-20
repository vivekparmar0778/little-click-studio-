
import { Link } from "react-router-dom";
import {
  
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  LockKeyhole,
  Sparkles,
  Wallet,
} from "lucide-react";


const overviewStats = [
  {
    label: "Your sessions",
    value: "02",
    note: "Memories in the making",
    icon: Camera,
    tone: "rose",
  },
  {
    label: "Photos delivered",
    value: "—",
    note: "Your gallery will appear here",
    icon: ImageIcon,
    tone: "sage",
  },
  {
    label: "Pending balance",
    value: "—",
    note: "No payment data yet",
    icon: Wallet,
    tone: "sand",
  },
];

const journeySteps = [
  { label: "Booking requested", done: true },
  { label: "Session confirmed", done: false },
  { label: "Your gallery is ready", done: false },
];

export default function Overview() {
  // UI preview only. Replace with customer-specific API data later.
  const customerName = "there";
  const hasUpcomingSession = false;
  const hasGallery = false;

  return (
    <main className="customer-overview">
      <section className="customer-overview__welcome">
        <div className="customer-overview__welcome-copy">
          <span className="customer-overview__eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            YOUR LITTLE CLICK EXPERIENCE
          </span>

          <h1>
            Every little moment,
            <br />
            <em>beautifully remembered.</em>
          </h1>

          <p>
            Welcome back, {customerName}. Your special moments deserve a
            beautiful place to live. Find your sessions, photographs and
            memories all in one place.
          </p>

          <div className="customer-overview__welcome-actions">
            <Link
              className="customer-overview__primary-button"
              to="/#contact"
            >
              Plan a session
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>

            <Link
              className="customer-overview__text-link"
              to="/dashboard/bookings"
            >
              Explore bookings
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="customer-overview__welcome-art" aria-hidden="true">
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

      <section className="customer-overview__section">
        <div className="customer-overview__section-heading">
          <div>
            <span className="customer-overview__eyebrow">YOUR STUDIO SPACE</span>
            <h2>A little overview</h2>
          </div>

          <span className="customer-overview__private-label">
            <LockKeyhole size={13} />
            Private to you
          </span>
        </div>

        <div className="customer-overview__stats">
          {overviewStats.map(({ label, value, note, icon: Icon, tone }) => (
            <article
              className={`customer-overview__stat customer-overview__stat--${tone}`}
              key={label}
            >
              <div className="customer-overview__stat-top">
                <span className="customer-overview__stat-icon">
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <ArrowUpRight
                  className="customer-overview__stat-arrow"
                  size={17}
                  aria-hidden="true"
                />
              </div>
              <p className="customer-overview__stat-label">{label}</p>
              <strong className="customer-overview__stat-value">{value}</strong>
              <span className="customer-overview__stat-note">{note}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="customer-overview__content-grid">
        <article className="customer-overview__session-card">
          <div className="customer-overview__section-heading">
            <div>
              <span className="customer-overview__eyebrow">
                THE NEXT CHAPTER
              </span>
              <h2>Your next session</h2>
            </div>
            <CalendarDays size={21} strokeWidth={1.5} />
          </div>

          {hasUpcomingSession ? (
            <div className="customer-overview__session-detail">
              <span className="customer-overview__status">
                <CheckCircle2 size={14} />
                Confirmed
              </span>
              <h3>Your upcoming photography session</h3>
              <p>Your real booking details will appear here.</p>
              <Link to="/dashboard/bookings" className="customer-overview__inline-link">
                View session details <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="customer-overview__empty-session">
              <div className="customer-overview__empty-icon">
                <Clock3 size={23} strokeWidth={1.4} />
              </div>
              <h3>Your next memory starts here.</h3>
              <p>
                You don’t have an upcoming session displayed yet. When your
                booking is confirmed, its date and details will appear here.
              </p>
              <Link
                to="/dashboard/bookings"
                className="customer-overview__outline-button"
              >
                View my bookings <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </article>

        <article className="customer-overview__journey-card">
          <span className="customer-overview__eyebrow">FROM MOMENT TO MEMORY</span>
          <h2>Your photography journey</h2>
          <p className="customer-overview__journey-intro">
            Every step brings you closer to memories you can keep forever.
          </p>

          <div className="customer-overview__journey">
            {journeySteps.map((step, index) => (
              <div
                className={`customer-overview__journey-step ${
                  step.done ? "is-complete" : ""
                }`}
                key={step.label}
              >
                <span className="customer-overview__journey-marker">
                  {step.done ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  )}
                </span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>

          <Link
            to="/dashboard/bookings"
            className="customer-overview__inline-link"
          >
            Follow your journey <ArrowRight size={15} />
          </Link>
        </article>
      </section>

      <section className="customer-overview__gallery">
        <div className="customer-overview__gallery-copy">
          <span className="customer-overview__eyebrow">
            YOUR PRIVATE COLLECTION
          </span>
          <h2>
            The moments you’ll
            <br />
            <em>want to keep forever.</em>
          </h2>
          <p>
            Your photographs deserve more than a folder. Once your studio
            gallery is published, you’ll find your collection here.
          </p>
          <Link
            to="/dashboard/gallery"
            className="customer-overview__primary-button"
          >
            Visit private gallery
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="customer-overview__gallery-visual">
          <div className="customer-overview__gallery-frame customer-overview__gallery-frame--back">
            <span>little moments</span>
          </div>
          <div className="customer-overview__gallery-frame customer-overview__gallery-frame--front">
            <div className="customer-overview__gallery-placeholder">
              <ImageIcon size={28} strokeWidth={1.3} />
              <span>{hasGallery ? "Open your collection" : "Your story awaits"}</span>
            </div>
          </div>
          <span className="customer-overview__gallery-seal">
            <Sparkles size={16} />
          </span>
        </div>
      </section>

      <section className="customer-overview__bottom-note">
        <div className="customer-overview__bottom-note-icon">
          <LockKeyhole size={19} />
        </div>
        <div>
          <h3>Your memories, your privacy.</h3>
          <p>
            Private galleries and account details should only be accessible to
            their authorised owner.
          </p>
        </div>
        <Link to="/dashboard/profile" aria-label="Open profile settings">
          <ArrowUpRight size={19} />
        </Link>
      </section>
    </main>
  );
}
