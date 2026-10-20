
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";


const INITIAL_BOOKINGS = [
  {
    id: "LC-1001",
    customer: "Aarav Shah",
    email: "aarav@example.com",
    service: "Newborn Photography",
    date: "2026-10-24",
    time: "10:00",
    status: "Pending",
    notes: "Newborn session. Parents will confirm the final package.",
  },
  {
    id: "LC-1002",
    customer: "Diya Patel",
    email: "diya@example.com",
    service: "Maternity Photography",
    date: "2026-10-26",
    time: "11:30",
    status: "Confirmed",
    notes: "Outdoor maternity portraits preferred.",
  },
  {
    id: "LC-1003",
    customer: "Mira Desai",
    email: "mira@example.com",
    service: "Baby Photography",
    date: "2026-10-28",
    time: "15:00",
    status: "Completed",
    notes: "Milestone photography session.",
  },
  {
    id: "LC-1004",
    customer: "Rohan Mehta",
    email: "rohan@example.com",
    service: "Newborn Photography",
    date: "2026-10-30",
    time: "09:30",
    status: "Pending",
    notes: "",
  },
];

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

const EMPTY_FORM = {
  customer: "",
  email: "",
  service: "Newborn Photography",
  date: "",
  time: "10:00",
  status: "Pending",
  notes: "",
};

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "—";

  const [hours, minutes] = time.split(":").map(Number);
  const parsed = new Date();

  parsed.setHours(hours, minutes, 0, 0);

  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`admin-bookings__status admin-bookings__status--${status.toLowerCase()}`}
    >
      <span className="admin-bookings__status-dot" />
      {status}
    </span>
  );
}

function Modal({ title, eyebrow, onClose, children, wide = false }) {
  return (
    <div
      className="admin-bookings__modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`admin-bookings__modal${wide ? " admin-bookings__modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="admin-bookings__modal-header">
          <div>
            {eyebrow && (
              <p className="admin-bookings__eyebrow">{eyebrow}</p>
            )}
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="admin-bookings__icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [notice, setNotice] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesFilter =
        activeFilter === "All" || booking.status === activeFilter;

      const searchableText = [
        booking.id,
        booking.customer,
        booking.email,
        booking.service,
        booking.status,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableText.includes(query);
    });
  }, [bookings, search, activeFilter]);

  const stats = useMemo(
    () => [
      {
        label: "Total bookings",
        value: bookings.length,
        icon: CalendarDays,
        tone: "total",
      },
      {
        label: "Pending",
        value: bookings.filter((item) => item.status === "Pending").length,
        icon: Clock3,
        tone: "pending",
      },
      {
        label: "Confirmed",
        value: bookings.filter((item) => item.status === "Confirmed").length,
        icon: CheckCircle2,
        tone: "confirmed",
      },
      {
        label: "Completed",
        value: bookings.filter((item) => item.status === "Completed").length,
        icon: Check,
        tone: "completed",
      },
    ],
    [bookings],
  );

  function showNotice(message) {
    setNotice(message);
  }

  function openCreateForm() {
    setEditingBooking(null);
    setFormData({ ...EMPTY_FORM });
    setFormError("");
    setFormOpen(true);
    setNotice("");
  }

  function openEditForm(booking) {
    setEditingBooking(booking);
    setFormData({
      customer: booking.customer,
      email: booking.email,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      notes: booking.notes || "",
    });
    setFormError("");
    setSelectedBooking(null);
    setFormOpen(true);
    setNotice("");
  }

  function closeForm() {
    setFormOpen(false);
    setEditingBooking(null);
    setFormError("");
  }

  function updateField(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const customer = formData.customer.trim();
    const email = formData.email.trim();
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!customer) {
      setFormError("Please enter the customer's name.");
      return;
    }

    if (!emailIsValid) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!formData.date || !formData.time) {
      setFormError("Please select a booking date and time.");
      return;
    }

    if (!formData.service) {
      setFormError("Please select a photography service.");
      return;
    }

    const cleanedBooking = {
      customer,
      email,
      service: formData.service,
      date: formData.date,
      time: formData.time,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    if (editingBooking) {
      setBookings((current) =>
        current.map((booking) =>
          booking.id === editingBooking.id
            ? { ...booking, ...cleanedBooking }
            : booking,
        ),
      );

      showNotice(`Booking ${editingBooking.id} updated successfully.`);
    } else {
      const highestId = bookings.reduce((highest, booking) => {
        const number = Number(booking.id.replace("LC-", ""));
        return Number.isFinite(number) ? Math.max(highest, number) : highest;
      }, 1000);

      const newBooking = {
        id: `LC-${highestId + 1}`,
        ...cleanedBooking,
      };

      setBookings((current) => [newBooking, ...current]);
      setActiveFilter("All");
      setSearch("");
      showNotice(`Booking ${newBooking.id} created successfully.`);
    }

    closeForm();
  }

  function updateStatus(id, status) {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id ? { ...booking, status } : booking,
      ),
    );

    if (selectedBooking?.id === id) {
      setSelectedBooking((current) =>
        current ? { ...current, status } : current,
      );
    }

    showNotice(`Booking ${id} marked as ${status.toLowerCase()}.`);
  }

  function confirmDelete() {
    if (!bookingToDelete) return;

    const deletedId = bookingToDelete.id;

    setBookings((current) =>
      current.filter((booking) => booking.id !== deletedId),
    );

    setBookingToDelete(null);
    setSelectedBooking(null);
    showNotice(`Booking ${deletedId} deleted.`);
  }

  return (
    <main className="admin-bookings">
      <div className="admin-bookings__heading">
        <div>
          <p className="admin-bookings__eyebrow">STUDIO MANAGEMENT</p>
          <h1>Bookings</h1>
          <p className="admin-bookings__subtitle">
            Manage appointments, session details and booking status.
          </p>
        </div>

        <button
          type="button"
          className="admin-bookings__primary-button"
          onClick={openCreateForm}
        >
          <FilePlus2 size={18} />
          <span>New booking</span>
        </button>
      </div>

      {notice && (
        <div className="admin-bookings__notice" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="admin-bookings__stats" aria-label="Booking summary">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article className="admin-bookings__stat-card" key={label}>
            <div className={`admin-bookings__stat-icon admin-bookings__stat-icon--${tone}`}>
              <Icon size={20} />
            </div>
            <div className="admin-bookings__stat-content">
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-bookings__panel">
        <div className="admin-bookings__toolbar">
          <div className="admin-bookings__toolbar-copy">
            <h2>All appointments</h2>
            <p>
              {filteredBookings.length}{" "}
              {filteredBookings.length === 1 ? "booking" : "bookings"} shown
            </p>
          </div>

          <label className="admin-bookings__search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or ID..."
              aria-label="Search bookings"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>

        <div className="admin-bookings__filters" aria-label="Filter by status">
          {FILTERS.map((filter) => {
            const count =
              filter === "All"
                ? bookings.length
                : bookings.filter((booking) => booking.status === filter)
                    .length;

            return (
              <button
                type="button"
                key={filter}
                className={`admin-bookings__filter${activeFilter === filter ? " is-active" : ""}`}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="admin-bookings__table-wrap">
          <table className="admin-bookings__table">
            <thead>
              <tr>
                <th>Booking / Customer</th>
                <th>Photography service</th>
                <th>Appointment</th>
                <th>Status</th>
                <th className="admin-bookings__actions-heading">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="admin-bookings__customer">
                      <span className="admin-bookings__avatar">
                        {booking.customer
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>

                      <div>
                        <strong>{booking.customer}</strong>
                        <span>{booking.id}</span>
                        <small>{booking.email}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="admin-bookings__service">
                      {booking.service}
                    </span>
                  </td>

                  <td>
                    <div className="admin-bookings__appointment">
                      <strong>{formatDate(booking.date)}</strong>
                      <span>{formatTime(booking.time)}</span>
                    </div>
                  </td>

                  <td>
                    <StatusBadge status={booking.status} />
                  </td>

                  <td>
                    <div className="admin-bookings__row-actions">
                      <button
                        type="button"
                        className="admin-bookings__icon-button"
                        onClick={() => setSelectedBooking(booking)}
                        aria-label={`View booking ${booking.id}`}
                        title="View details"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        className="admin-bookings__icon-button"
                        onClick={() => openEditForm(booking)}
                        aria-label={`Edit booking ${booking.id}`}
                        title="Edit booking"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="admin-bookings__icon-button admin-bookings__icon-button--danger"
                        onClick={() => setBookingToDelete(booking)}
                        aria-label={`Delete booking ${booking.id}`}
                        title="Delete booking"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBookings.length === 0 && (
            <div className="admin-bookings__empty">
              <div className="admin-bookings__empty-icon">
                <CalendarDays size={25} />
              </div>
              <h3>No bookings found</h3>
              <p>
                Try another search or filter, or create a new booking.
              </p>
              <button
                type="button"
                className="admin-bookings__secondary-button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {formOpen && (
        <Modal
          title={editingBooking ? "Edit booking" : "Create a booking"}
          eyebrow={editingBooking ? editingBooking.id : "NEW APPOINTMENT"}
          onClose={closeForm}
          wide
        >
          <form className="admin-bookings__form" onSubmit={handleSubmit}>
            <div className="admin-bookings__form-grid">
              <label className="admin-bookings__field">
                <span>Customer name *</span>
                <input
                  name="customer"
                  value={formData.customer}
                  onChange={updateField}
                  placeholder="e.g. Aarav Shah"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="admin-bookings__field">
                <span>Email address *</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={updateField}
                  placeholder="customer@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="admin-bookings__field">
                <span>Photography service *</span>
                <select
                  name="service"
                  value={formData.service}
                  onChange={updateField}
                  required
                >
                  <option>Newborn Photography</option>
                  <option>Baby Photography</option>
                  <option>Maternity Photography</option>
                  <option>Family Photography</option>
                  <option>Birthday Photography</option>
                </select>
              </label>

              <label className="admin-bookings__field">
                <span>Booking status</span>
                <select
                  name="status"
                  value={formData.status}
                  onChange={updateField}
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="admin-bookings__field">
                <span>Appointment date *</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="admin-bookings__field">
                <span>Appointment time *</span>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="admin-bookings__field admin-bookings__field--full">
                <span>Session notes</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={updateField}
                  placeholder="Session preferences, special requests..."
                  rows={3}
                />
              </label>
            </div>

            {formError && (
              <p className="admin-bookings__form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="admin-bookings__modal-footer">
              <button
                type="button"
                className="admin-bookings__secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-bookings__primary-button"
              >
                <Check size={17} />
                {editingBooking ? "Save changes" : "Create booking"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedBooking && (
        <Modal
          title="Booking details"
          eyebrow={selectedBooking.id}
          onClose={() => setSelectedBooking(null)}
        >
          <div className="admin-bookings__details">
            <div className="admin-bookings__details-person">
              <span className="admin-bookings__avatar admin-bookings__avatar--large">
                {selectedBooking.customer
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <h3>{selectedBooking.customer}</h3>
                <p>{selectedBooking.email}</p>
              </div>
            </div>

            <div className="admin-bookings__detail-list">
              <div>
                <span>Service</span>
                <strong>{selectedBooking.service}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{formatDate(selectedBooking.date)}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>{formatTime(selectedBooking.time)}</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <div className="admin-bookings__detail-notes">
                <span>Session notes</span>
                <p>{selectedBooking.notes || "No notes added."}</p>
              </div>
            </div>

            <label className="admin-bookings__field">
              <span>Update booking status</span>
              <select
                value={selectedBooking.status}
                onChange={(event) =>
                  updateStatus(selectedBooking.id, event.target.value)
                }
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <div className="admin-bookings__modal-footer">
              <button
                type="button"
                className="admin-bookings__secondary-button"
                onClick={() => openEditForm(selectedBooking)}
              >
                <Pencil size={16} />
                Edit details
              </button>
              <button
                type="button"
                className="admin-bookings__primary-button"
                onClick={() => setSelectedBooking(null)}
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {bookingToDelete && (
        <Modal
          title="Delete this booking?"
          eyebrow="CONFIRM DELETION"
          onClose={() => setBookingToDelete(null)}
        >
          <div className="admin-bookings__delete-content">
            <div className="admin-bookings__delete-icon">
              <Trash2 size={23} />
            </div>
            <p>
              You are about to delete the booking for{" "}
              <strong>{bookingToDelete.customer}</strong> (
              {bookingToDelete.id}). This action cannot be undone.
            </p>
            <div className="admin-bookings__modal-footer">
              <button
                type="button"
                className="admin-bookings__secondary-button"
                onClick={() => setBookingToDelete(null)}
              >
                Keep booking
              </button>
              <button
                type="button"
                className="admin-bookings__danger-button"
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Delete booking
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
