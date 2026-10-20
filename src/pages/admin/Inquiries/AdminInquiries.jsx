
import { useMemo, useState } from "react";
import {
  Search,
  Eye,
  X,
  Mail,
  Phone,
  MessageSquareText,
  Download,
  Trash2,
  Check,
  Clock3,
  CheckCircle2,
  Users,
  RefreshCw,
  StickyNote,
  AlertTriangle,
} from "lucide-react";

const initialInquiries = [
  {
    id: "INQ-001",
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
    service: "Newborn Photography",
    date: "2026-10-16",
    message:
      "We would like to enquire about a newborn photography session next month. Please share your packages and available dates.",
    status: "New",
    notes: "",
  },
  {
    id: "INQ-002",
    name: "Priya Mehta",
    email: "priya@example.com",
    phone: "+91 98765 12340",
    service: "Maternity Portraits",
    date: "2026-10-15",
    message:
      "I am interested in a maternity shoot and would love to know more about your studio setup and pricing.",
    status: "Contacted",
    notes: "Follow up about available maternity packages.",
  },
  {
    id: "INQ-003",
    name: "Riya Patel",
    email: "riya@example.com",
    phone: "+91 98765 67890",
    service: "Baby Milestone Session",
    date: "2026-10-14",
    message:
      "Looking for a photography session for my baby's first birthday. Could you please share the details?",
    status: "Resolved",
    notes: "",
  },
  {
    id: "INQ-004",
    name: "Neha Desai",
    email: "neha@example.com",
    phone: "+91 98765 09876",
    service: "Family Portrait Session",
    date: "2026-10-13",
    message:
      "We would like to book a family portrait session. Please let us know the available slots.",
    status: "New",
    notes: "",
  },
];

const STATUSES = ["New", "Contacted", "Resolved"];

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const today = () => new Date().toISOString().slice(0, 10);

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function exportInquiries(inquiries) {
  const columns = [
    ["Inquiry ID", "id"],
    ["Customer", "name"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["Service", "service"],
    ["Date received", "date"],
    ["Status", "status"],
    ["Customer message", "message"],
    ["Internal notes", "notes"],
  ];

  const csv = [
    columns.map(([label]) => escapeCsv(label)).join(","),
    ...inquiries.map((inquiry) =>
      columns.map(([, key]) => escapeCsv(inquiry[key])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `little-click-inquiries-${today()}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [notice, setNotice] = useState(null);
  const [inquiryToDelete, setInquiryToDelete] = useState(null);
  const [draftNotes, setDraftNotes] = useState("");

  const filteredInquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = inquiries.filter((inquiry) => {
      const searchableValues = [
        inquiry.id,
        inquiry.name,
        inquiry.email,
        inquiry.phone,
        inquiry.service,
        inquiry.message,
        inquiry.notes,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" || inquiry.status === statusFilter;

      const matchesService =
        serviceFilter === "All" || inquiry.service === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });

    return result.sort((a, b) => {
      if (sortOrder === "oldest") {
        return a.date.localeCompare(b.date);
      }

      if (sortOrder === "name") {
        return a.name.localeCompare(b.name);
      }

      return b.date.localeCompare(a.date);
    });
  }, [inquiries, search, statusFilter, serviceFilter, sortOrder]);

  const newCount = inquiries.filter(
    (item) => item.status === "New"
  ).length;

  const contactedCount = inquiries.filter(
    (item) => item.status === "Contacted"
  ).length;

  const resolvedCount = inquiries.filter(
    (item) => item.status === "Resolved"
  ).length;

  const serviceOptions = useMemo(
    () => [...new Set(inquiries.map((item) => item.service))].sort(),
    [inquiries]
  );

  const showNotice = (message, type = "success") => {
    setNotice({ message, type });
  };

  const updateStatus = (inquiryId, nextStatus) => {
    const inquiry = inquiries.find((item) => item.id === inquiryId);

    if (!inquiry || !STATUSES.includes(nextStatus)) return;
    if (inquiry.status === nextStatus) return;

    setInquiries((current) =>
      current.map((item) =>
        item.id === inquiryId
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setSelectedInquiry((current) =>
      current?.id === inquiryId
        ? { ...current, status: nextStatus }
        : current
    );

    showNotice(
      `${inquiry.name}'s inquiry marked as ${nextStatus.toLowerCase()}.`
    );
  };

  const openDetails = (inquiry) => {
    setSelectedInquiry({ ...inquiry });
    setDraftNotes(inquiry.notes ?? "");
  };

  const closeDetails = () => {
    setSelectedInquiry(null);
    setDraftNotes("");
  };

  const saveNotes = () => {
    if (!selectedInquiry) return;

    const inquiryId = selectedInquiry.id;
    const notes = draftNotes.trim();

    setInquiries((current) =>
      current.map((item) =>
        item.id === inquiryId ? { ...item, notes } : item
      )
    );

    setSelectedInquiry((current) =>
      current ? { ...current, notes } : current
    );

    showNotice("Internal notes saved in this demo.");
  };

  const deleteInquiry = () => {
    if (!inquiryToDelete) return;

    const { id, name } = inquiryToDelete;

    setInquiries((current) =>
      current.filter((item) => item.id !== id)
    );

    if (selectedInquiry?.id === id) {
      closeDetails();
    }

    setInquiryToDelete(null);
    showNotice(`${name}'s inquiry was removed from this demo.`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setServiceFilter("All");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "All" ||
    serviceFilter !== "All" ||
    sortOrder !== "newest";

  return (
    <section className="admin-inquiries" aria-labelledby="inquiries-title">
      <header className="admin-inquiries__header">
        <div className="admin-inquiries__heading-copy">
          <span className="admin-inquiries__eyebrow">
            CLIENT COMMUNICATION
          </span>

          <h1 id="inquiries-title">Inquiries</h1>

          <p>
            Review customer messages, manage follow-ups, and track inquiry
            resolution.
          </p>
        </div>

        <button
          type="button"
          className="admin-inquiries__export"
          onClick={() => exportInquiries(filteredInquiries)}
          disabled={!filteredInquiries.length}
        >
          <Download size={16} aria-hidden="true" />
          Export CSV
        </button>
      </header>

      <div className="admin-inquiries__demo-notice" role="note">
        <AlertTriangle size={17} aria-hidden="true" />
        <p>
          Demo mode: changes are stored in React state and reset on refresh.
          Connect the Django API before using real customer inquiries.
        </p>
      </div>

      {notice && (
        <div
          className={`admin-inquiries__notice admin-inquiries__notice--${notice.type}`}
          role="status"
        >
          <CheckCircle2 size={17} aria-hidden="true" />

          <span>{notice.message}</span>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-inquiries__stats">
        <article className="admin-inquiries__stat">
          <div className="admin-inquiries__stat-top">
            <span>Total inquiries</span>
            <MessageSquareText size={18} aria-hidden="true" />
          </div>
          <strong>{inquiries.length}</strong>
          <small>All messages received</small>
        </article>

        <article className="admin-inquiries__stat">
          <div className="admin-inquiries__stat-top">
            <span>New inquiries</span>
            <Clock3 size={18} aria-hidden="true" />
          </div>
          <strong>{newCount}</strong>
          <small>Awaiting first contact</small>
        </article>

        <article className="admin-inquiries__stat">
          <div className="admin-inquiries__stat-top">
            <span>Contacted</span>
            <Users size={18} aria-hidden="true" />
          </div>
          <strong>{contactedCount}</strong>
          <small>Follow-up in progress</small>
        </article>

        <article className="admin-inquiries__stat">
          <div className="admin-inquiries__stat-top">
            <span>Resolved</span>
            <CheckCircle2 size={18} aria-hidden="true" />
          </div>
          <strong>{resolvedCount}</strong>
          <small>Marked as completed</small>
        </article>
      </div>

      <section className="admin-inquiries__panel">
        <div className="admin-inquiries__panel-heading">
          <div>
            <h2>Inquiry directory</h2>
            <p>
              {filteredInquiries.length}{" "}
              {filteredInquiries.length === 1 ? "record" : "records"} found
            </p>
          </div>

          <span className="admin-inquiries__count">
            {filteredInquiries.length} records
          </span>
        </div>

        <div className="admin-inquiries__toolbar">
          <label className="admin-inquiries__search">
            <Search size={17} aria-hidden="true" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, message..."
              aria-label="Search inquiries"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </label>

          <div className="admin-inquiries__filters">
            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Service</span>
              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
              >
                <option value="All">All services</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort by</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className="admin-inquiries__reset"
                onClick={clearFilters}
              >
                <RefreshCw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="admin-inquiries__table-wrap">
          <table className="admin-inquiries__table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Requested service</th>
                <th scope="col">Received</th>
                <th scope="col">Status</th>
                <th scope="col">Update status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>
                    <div className="admin-inquiries__customer">
                      <strong>{inquiry.name}</strong>
                      <a href={`mailto:${inquiry.email}`}>
                        {inquiry.email}
                      </a>
                      <small>{inquiry.id}</small>
                    </div>
                  </td>

                  <td>
                    <span className="admin-inquiries__service">
                      {inquiry.service}
                    </span>
                  </td>

                  <td className="admin-inquiries__date">
                    {formatDate(inquiry.date)}
                  </td>

                  <td>
                    <span
                      className={`admin-inquiries__badge admin-inquiries__badge--${inquiry.status.toLowerCase()}`}
                    >
                      <span />
                      {inquiry.status}
                    </span>
                  </td>

                  <td>
                    <select
                      className="admin-inquiries__status-select"
                      value={inquiry.status}
                      onChange={(event) =>
                        updateStatus(inquiry.id, event.target.value)
                      }
                      aria-label={`Update status for ${inquiry.name}`}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <div className="admin-inquiries__row-actions">
                      <button
                        type="button"
                        className="admin-inquiries__action"
                        onClick={() => openDetails(inquiry)}
                        aria-label={`View inquiry from ${inquiry.name}`}
                        title="View details and notes"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        className="admin-inquiries__action admin-inquiries__action--danger"
                        onClick={() => setInquiryToDelete(inquiry)}
                        aria-label={`Delete inquiry from ${inquiry.name}`}
                        title="Delete inquiry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredInquiries.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-inquiries__empty">
                      <MessageSquareText size={28} aria-hidden="true" />
                      <strong>No inquiries found</strong>
                      <span>
                        Try another search term or change your filters.
                      </span>

                      {hasActiveFilters && (
                        <button type="button" onClick={clearFilters}>
                          Reset filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="admin-inquiries__panel-footer">
          <span>
            Showing {filteredInquiries.length} of {inquiries.length} inquiries
          </span>
          <span>Sorted by {sortOrder === "name" ? "name" : "date received"}</span>
        </footer>
      </section>

      {selectedInquiry && (
        <div
          className="admin-inquiries__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            className="admin-inquiries__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-modal-title"
          >
            <header className="admin-inquiries__modal-header">
              <div>
                <span>INQUIRY DETAILS · {selectedInquiry.id}</span>
                <h2 id="inquiry-modal-title">{selectedInquiry.name}</h2>
                <p>Review the request and manage its follow-up.</p>
              </div>

              <button
                type="button"
                className="admin-inquiries__action"
                onClick={closeDetails}
                aria-label="Close inquiry details"
              >
                <X size={19} />
              </button>
            </header>

            <div className="admin-inquiries__contact">
              <p>
                <Mail size={17} aria-hidden="true" />
                <a href={`mailto:${selectedInquiry.email}`}>
                  {selectedInquiry.email}
                </a>
              </p>

              <p>
                <Phone size={17} aria-hidden="true" />
                <a
                  href={`tel:${selectedInquiry.phone.replace(/[^\d+]/g, "")}`}
                >
                  {selectedInquiry.phone}
                </a>
              </p>
            </div>

            <dl className="admin-inquiries__details">
              <div>
                <dt>Requested service</dt>
                <dd>{selectedInquiry.service}</dd>
              </div>

              <div>
                <dt>Date received</dt>
                <dd>{formatDate(selectedInquiry.date)}</dd>
              </div>

              <div>
                <dt>Inquiry status</dt>
                <dd>
                  <span
                    className={`admin-inquiries__badge admin-inquiries__badge--${selectedInquiry.status.toLowerCase()}`}
                  >
                    <span />
                    {selectedInquiry.status}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="admin-inquiries__message">
              <span>Customer message</span>
              <p>{selectedInquiry.message}</p>
            </div>

            <label className="admin-inquiries__modal-status">
              <span>Update inquiry status</span>
              <select
                value={selectedInquiry.status}
                onChange={(event) =>
                  updateStatus(selectedInquiry.id, event.target.value)
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-inquiries__notes">
              <label htmlFor="inquiry-admin-notes">
                <StickyNote size={16} aria-hidden="true" />
                Internal admin notes
              </label>

              <textarea
                id="inquiry-admin-notes"
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                placeholder="Record follow-up details, call outcome, or reminders..."
                rows={4}
                maxLength={2000}
              />

              <div className="admin-inquiries__notes-footer">
                <small>Internal use only · {draftNotes.length}/2000</small>
                <button type="button" onClick={saveNotes}>
                  <Check size={15} />
                  Save notes
                </button>
              </div>
            </div>

            <footer className="admin-inquiries__modal-actions">
              <button
                type="button"
                className="admin-inquiries__button admin-inquiries__button--secondary"
                onClick={closeDetails}
              >
                Close details
              </button>

              <button
                type="button"
                className="admin-inquiries__button admin-inquiries__button--danger"
                onClick={() => setInquiryToDelete(selectedInquiry)}
              >
                <Trash2 size={15} />
                Delete inquiry
              </button>
            </footer>

            <p className="admin-inquiries__footnote">
              Email and phone actions open the corresponding app on your
              device. Actual inquiry history and permissions require backend
              integration.
            </p>
          </section>
        </div>
      )}

      {inquiryToDelete && (
        <div
          className="admin-inquiries__backdrop admin-inquiries__backdrop--confirm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setInquiryToDelete(null);
            }
          }}
        >
          <section
            className="admin-inquiries__confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-inquiry-title"
            aria-describedby="delete-inquiry-description"
          >
            <span className="admin-inquiries__confirm-icon">
              <AlertTriangle size={23} />
            </span>

            <h2 id="delete-inquiry-title">Delete this inquiry?</h2>

            <p id="delete-inquiry-description">
              Remove the inquiry from <strong>{inquiryToDelete.name}</strong>?
              This action cannot be undone in this demo.
            </p>

            <p className="admin-inquiries__delete-warning">
              In production, verify linked customer records and audit
              requirements before permanently deleting an inquiry.
            </p>

            <div className="admin-inquiries__modal-actions">
              <button
                type="button"
                className="admin-inquiries__button admin-inquiries__button--secondary"
                onClick={() => setInquiryToDelete(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-inquiries__button admin-inquiries__button--danger"
                onClick={deleteInquiry}
              >
                <Trash2 size={15} />
                Delete inquiry
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
