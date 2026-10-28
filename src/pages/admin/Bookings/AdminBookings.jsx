import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];
const EMPTY_FORM = {
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  service: "",
  preferred_date: "",
  preferred_time: "",
  status: "pending",
  notes: "",
};

function displayStatus(status = "pending") {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizeBooking(item) {
  return {
    ...item,
    customer: item.contact_name || "—",
    email: item.contact_email || "—",
    phone: item.contact_phone || "—",
    serviceLabel:
      item.service_name || item.service?.name || item.service || "—",
    serviceId:
      typeof item.service === "object" ? item.service?.id : item.service,
    date: item.preferred_date || "",
    time: item.preferred_time || "",
    status: item.status || "pending",
  };
}

function getErrorMessage(error) {
  if (typeof error === "string") return error;
  if (error?.detail) return error.detail;
  if (error && typeof error === "object") {
    const firstValue = Object.values(error)[0];
    if (Array.isArray(firstValue)) return firstValue[0];
    if (typeof firstValue === "string") return firstValue;
  }
  return "Something went wrong. Please try again.";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatTime(value) {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Modal({ title, eyebrow, onClose, children, wide = false }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
            {eyebrow && <p className="admin-bookings__eyebrow">{eyebrow}</p>}
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
  const { apiRequest } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const loadBookings = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: "10",
        ordering: "-created_at",
      });
      if (search) params.set("search", search);
      if (activeFilter !== "all") params.set("status", activeFilter);

      const [listResponse, summaryResponse, serviceResponse] = await Promise.all([
        apiRequest(`bookings/admin/?${params.toString()}`),
        apiRequest("bookings/admin/summary/"),
        apiRequest("services/"),
      ]);

      const list = Array.isArray(listResponse)
        ? listResponse
        : listResponse?.results || [];
      setBookings(list.map(normalizeBooking));
      setPageCount(
        listResponse?.count
          ? Math.max(1, Math.ceil(listResponse.count / 10))
          : 1,
      );
      setSummary((current) => ({ ...current, ...(summaryResponse || {}) }));
      setServices(
        (Array.isArray(serviceResponse)
          ? serviceResponse
          : serviceResponse?.results || []
        ).filter((service) => service.is_active !== false),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [apiRequest, page, search, activeFilter]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) await loadBookings();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadBookings]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const stats = useMemo(
    () => [
      { label: "Total bookings", value: summary.total ?? 0, icon: CalendarDays, tone: "total" },
      { label: "Pending", value: summary.pending ?? 0, icon: Clock3, tone: "pending" },
      { label: "Confirmed", value: summary.confirmed ?? 0, icon: CheckCircle2, tone: "confirmed" },
      { label: "Completed", value: summary.completed ?? 0, icon: CheckCircle2, tone: "completed" },
    ],
    [summary],
  );

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingBooking(null);
    setFormData(EMPTY_FORM);
    setFormError("");
  }, []);

  function openCreateForm() {
    setEditingBooking(null);
    setFormData({
      ...EMPTY_FORM,
      service: services[0] ? String(services[0].id) : "",
    });
    setFormError("");
    setFormOpen(true);
    setNotice("");
  }

  function openEditForm(booking) {
    setSelectedBooking(null);
    setEditingBooking(booking);
    setFormData({
      contact_name: booking.contact_name || "",
      contact_email: booking.contact_email || "",
      contact_phone: booking.contact_phone || "",
      service: booking.serviceId ? String(booking.serviceId) : "",
      preferred_date: booking.date || "",
      preferred_time: (booking.time || "").slice(0, 5),
      status: booking.status,
      notes: booking.notes || "",
    });
    setFormError("");
    setFormOpen(true);
    setNotice("");
  }

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);
    const payload = {
      contact_name: formData.contact_name.trim(),
      contact_email: formData.contact_email.trim(),
      contact_phone: formData.contact_phone.trim(),
      service: formData.service,
      preferred_date: formData.preferred_date,
      preferred_time: formData.preferred_time,
      status: formData.status,
      notes: formData.notes.trim(),
    };
    try {
      if (editingBooking) {
        await apiRequest(`bookings/admin/${editingBooking.id}/`, {
          method: "PATCH",
          body: payload,
        });
        setNotice(`Booking ${editingBooking.id} updated.`);
      } else {
        await apiRequest("bookings/admin/", { method: "POST", body: payload });
        setNotice("Booking created successfully.");
        setPage(1);
      }
      closeForm();
      await loadBookings();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(booking, status) {
    setError("");
    try {
      await apiRequest(`bookings/admin/${booking.id}/`, {
        method: "PATCH",
        body: { status },
      });
      setNotice(`Booking ${booking.id} marked ${status}.`);
      await loadBookings();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking((current) => current && { ...current, status });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function deleteBooking() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`bookings/admin/${target.id}/`, { method: "DELETE" });
      setDeleteTarget(null);
      setSelectedBooking(null);
      setNotice(`Booking ${target.id} deleted.`);
      if (bookings.length === 1 && page > 1) setPage((current) => current - 1);
      else await loadBookings();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-bookings">
      <header className="admin-bookings__heading">
        <div>
          <p className="admin-bookings__eyebrow">STUDIO MANAGEMENT</p>
          <h1>Bookings</h1>
          <p className="admin-bookings__subtitle">
            Manage every appointment, customer detail and booking status.
          </p>
        </div>
        <div className="admin-bookings__heading-actions">
          <button
            type="button"
            className="admin-bookings__secondary-button"
            onClick={() => void loadBookings()}
            disabled={loading}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            type="button"
            className="admin-bookings__primary-button"
            onClick={openCreateForm}
            
          >
            <FilePlus2 size={18} /> New booking
          </button>
        </div>
      </header>

      {notice && (
        <div className="admin-bookings__notice" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">
            <X size={17} />
          </button>
        </div>
      )}
      {error && <p className="admin-bookings__error" role="alert">{error}</p>}

      <section className="admin-bookings__stats" aria-label="Booking summary">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article className="admin-bookings__stat-card" key={label}>
            <div className={`admin-bookings__stat-icon admin-bookings__stat-icon--${tone}`}>
              <Icon size={20} aria-hidden="true" />
            </div>
            <div className="admin-bookings__stat-content"><p>{label}</p><strong>{value}</strong></div>
          </article>
        ))}
      </section>

      <section className="admin-bookings__panel">
        <div className="admin-bookings__toolbar">
          <div className="admin-bookings__toolbar-copy">
            <h2>All appointments</h2>
            <p>{loading ? "Loading bookings…" : `${summary.total ?? bookings.length} records`}</p>
          </div>
          <label className="admin-bookings__search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search customer, email or booking ID…"
              aria-label="Search bookings"
            />
            {searchInput && <button type="button" onClick={() => setSearchInput("")} aria-label="Clear search"><X size={16} /></button>}
          </label>
        </div>

        <div className="admin-bookings__filters" aria-label="Filter by status">
          {["all", ...STATUS_OPTIONS].map((filter) => (
            <button
              type="button"
              key={filter}
              className={`admin-bookings__filter${activeFilter === filter ? " is-active" : ""}`}
              onClick={() => { setPage(1); setActiveFilter(filter); }}
              aria-pressed={activeFilter === filter}
            >
              {filter === "all" ? "All" : displayStatus(filter)}
              <span>{filter === "all" ? summary.total ?? 0 : summary[filter] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="admin-bookings__table-wrap">
          <table className="admin-bookings__table">
            <thead><tr><th>Booking / Customer</th><th>Photography service</th><th>Appointment</th><th>Status</th><th className="admin-bookings__actions-heading">Actions</th></tr></thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td><div className="admin-bookings__customer"><span className="admin-bookings__avatar">{initials(booking.customer)}</span><div><strong>{booking.customer}</strong><span>{booking.id}</span><small>{booking.email}</small></div></div></td>
                  <td><span className="admin-bookings__service">{booking.serviceLabel}</span></td>
                  <td><div className="admin-bookings__appointment"><strong>{formatDate(booking.date)}</strong><span>{formatTime(booking.time)}</span></div></td>
                  <td>
                    <label className="admin-bookings__status-control">
                      <span className={`admin-bookings__status admin-bookings__status--${booking.status}`}><span className="admin-bookings__status-dot" />{displayStatus(booking.status)}</span>
                      <select value={booking.status} aria-label={`Change status for booking ${booking.id}`} onChange={(event) => void updateStatus(booking, event.target.value)}>
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}
                      </select>
                    </label>
                  </td>
                  <td><div className="admin-bookings__row-actions">
                    <button type="button" className="admin-bookings__icon-button" onClick={() => setSelectedBooking(booking)} aria-label={`View booking ${booking.id}`} title="View details"><Eye size={17} /></button>
                    <button type="button" className="admin-bookings__icon-button" onClick={() => openEditForm(booking)} aria-label={`Edit booking ${booking.id}`} title="Edit booking"><Pencil size={17} /></button>
                    <button type="button" className="admin-bookings__icon-button admin-bookings__icon-button--danger" onClick={() => setDeleteTarget(booking)} aria-label={`Delete booking ${booking.id}`} title="Delete booking"><Trash2 size={17} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="admin-bookings__empty" role="status"><p>Loading booking records…</p></div>}
          {!loading && !bookings.length && (
            <div className="admin-bookings__empty">
              <div className="admin-bookings__empty-icon"><CalendarDays size={25} /></div>
              <h3>{search || activeFilter !== "all" ? "No bookings match these filters" : "No booking records yet"}</h3>
              <p>{search || activeFilter !== "all" ? "Clear the search or choose another status to see more records." : "New customer bookings will appear here when the API is connected."}</p>
              {(search || activeFilter !== "all") && <button type="button" className="admin-bookings__secondary-button" onClick={() => { setSearchInput(""); setActiveFilter("all"); }}>Clear filters</button>}
            </div>
          )}
        </div>
        <nav className="admin-bookings__pagination" aria-label="Bookings pages">
          <button type="button" className="admin-bookings__secondary-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" className="admin-bookings__secondary-button" disabled={page >= pageCount || loading} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
        </nav>
      </section>

      {formOpen && (
        <Modal title={editingBooking ? "Edit booking" : "Create a booking"} eyebrow={editingBooking?.id || "NEW APPOINTMENT"} onClose={closeForm} wide>
          <form className="admin-bookings__form" onSubmit={handleSubmit}>
            <div className="admin-bookings__form-grid">
              <label className="admin-bookings__field"><span>Customer name *</span><input name="contact_name" value={formData.contact_name} onChange={updateField} autoComplete="name" maxLength={300} required /></label>
              <label className="admin-bookings__field"><span>Email address *</span><input type="email" name="contact_email" value={formData.contact_email} onChange={updateField} autoComplete="email" maxLength={254} required /></label>
              <label className="admin-bookings__field"><span>Phone number *</span><input type="tel" name="contact_phone" value={formData.contact_phone} onChange={updateField} autoComplete="tel" placeholder="+919876543210" pattern="\+[1-9][0-9]{7,14}" title="Enter country code followed by 8–15 digits, without spaces." required /></label>
              <label className="admin-bookings__field"><span>Photography service *</span><select name="service" value={formData.service} onChange={updateField} required><option value="" disabled>Select a service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
              <label className="admin-bookings__field"><span>Appointment date *</span><input type="date" name="preferred_date" value={formData.preferred_date} onChange={updateField} required /></label>
              <label className="admin-bookings__field"><span>Appointment time *</span><input type="time" name="preferred_time" value={formData.preferred_time} onChange={updateField} required /></label>
              <label className="admin-bookings__field"><span>Booking status *</span><select name="status" value={formData.status} onChange={updateField}>{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</select></label>
              <label className="admin-bookings__field admin-bookings__field--full"><span>Session notes</span><textarea name="notes" value={formData.notes} onChange={updateField} maxLength={1000} rows={4} placeholder="Session preferences and special requests…" /></label>
            </div>
            {formError && <p className="admin-bookings__form-error" role="alert">{getErrorMessage(formError)}</p>}
            <div className="admin-bookings__modal-footer"><button type="button" className="admin-bookings__secondary-button" onClick={closeForm} disabled={saving}>Cancel</button><button type="submit" className="admin-bookings__primary-button" disabled={saving}>{saving ? "Saving…" : editingBooking ? "Save changes" : "Create booking"}</button></div>
          </form>
        </Modal>
      )}

      {selectedBooking && (
        <Modal title="Booking details" eyebrow={selectedBooking.id} onClose={() => setSelectedBooking(null)}>
          <div className="admin-bookings__details">
            <div className="admin-bookings__details-person"><span className="admin-bookings__avatar admin-bookings__avatar--large">{initials(selectedBooking.customer)}</span><div><h3>{selectedBooking.customer}</h3><p>{selectedBooking.email}</p><p>{selectedBooking.phone}</p></div></div>
            <dl className="admin-bookings__detail-list">
              <div><dt>Photography service</dt><dd>{selectedBooking.serviceLabel}</dd></div>
              <div><dt>Appointment</dt><dd>{formatDate(selectedBooking.date)} · {formatTime(selectedBooking.time)}</dd></div>
              <div><dt>Status</dt><dd>{displayStatus(selectedBooking.status)}</dd></div>
              <div><dt>Session notes</dt><dd>{selectedBooking.notes || "No notes added."}</dd></div>
            </dl>
            <div className="admin-bookings__modal-footer"><button type="button" className="admin-bookings__secondary-button" onClick={() => openEditForm(selectedBooking)}><Pencil size={16} /> Edit booking</button><button type="button" className="admin-bookings__danger-button" onClick={() => setDeleteTarget(selectedBooking)}><Trash2 size={16} /> Delete booking</button></div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete this booking?" eyebrow={deleteTarget.id} onClose={() => !saving && setDeleteTarget(null)}>
          <div className="admin-bookings__confirm-delete"><p>This permanently deletes the booking record for <strong>{deleteTarget.customer}</strong>. This action cannot be undone.</p><div className="admin-bookings__modal-footer"><button type="button" className="admin-bookings__secondary-button" onClick={() => setDeleteTarget(null)} disabled={saving}>Keep booking</button><button type="button" className="admin-bookings__danger-button" onClick={() => void deleteBooking()} disabled={saving}>{saving ? "Deleting…" : "Delete booking"}</button></div></div>
        </Modal>
      )}
    </main>
  );
}
