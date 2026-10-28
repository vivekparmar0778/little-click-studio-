import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  StickyNote,
  X,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
];

const PHOTOGRAPHY_TYPES = [
  { value: "newborn", label: "Newborn Photography" },
  { value: "maternity", label: "Maternity Photography" },
  { value: "milestones", label: "Baby & Milestones" },
  { value: "family", label: "Family Photography" },
  { value: "undecided", label: "Not sure yet" },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


function formatStatus(value) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

function formatPhotographyType(value) {
  return PHOTOGRAPHY_TYPES.find((item) => item.value === value)?.label ?? value;
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportInquiries(inquiries) {
  const columns = [
    ["Inquiry ID", "id"],
    ["Customer", "name"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["Photography type", "photography_type"],
    ["Preferred date", "preferred_date"],
    ["Date received", "created_at"],
    ["Status", "status"],
    ["Customer message", "message"],
    ["Internal notes", "admin_notes"],
  ];

  const csv = [
    columns.map(([label]) => escapeCsv(label)).join(","),
    ...inquiries.map((inquiry) =>
      columns
        .map(([, key]) => {
          if (key === "status") return escapeCsv(formatStatus(inquiry[key]));
          if (key === "photography_type") {
            return escapeCsv(formatPhotographyType(inquiry[key]));
          }
          if (key === "created_at" || key === "preferred_date") {
            return escapeCsv(formatDate(inquiry[key]));
          }
          return escapeCsv(inquiry[key]);
        })
        .join(","),
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `little-click-inquiries-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildListPath({ page, search, status, type, sort }) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(PAGE_SIZE),
  });

  if (search.trim()) params.set("search", search.trim());
  if (status !== "all") params.set("status", status);
  if (type !== "all") params.set("photography_type", type);

  const ordering = {
    newest: "-created_at",
    oldest: "created_at",
    name: "name",
  }[sort];

  params.set("ordering", ordering);

  return `inquiries/admin/?${params.toString()}`;
}

export default function AdminInquiries() {
  const { apiRequest } = useAuth();

  const [reloadKey, setReloadKey] = useState(0);
  const [inquiries, setInquiries] = useState([]);
  

  
  const [summary, setSummary] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    booked: 0,
    closed: 0,
  });
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [draftNotes, setDraftNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadInquiries() {
      setLoading(true);
      setError("");

      try {
        const listPath = buildListPath({
          page,
          search,
          status: statusFilter,
          type: typeFilter,
          sort: sortOrder,
        });

        const [listData, summaryData] = await Promise.all([
          apiRequest(listPath),
          apiRequest("inquiries/admin/summary/"),
        ]);

        if (!active) return;

        setInquiries(Array.isArray(listData?.results) ? listData.results : []);
        setCount(Number(listData?.count ?? 0));
        setSummary({
          total: Number(summaryData?.total ?? 0),
          new: Number(summaryData?.new ?? 0),
          contacted: Number(summaryData?.contacted ?? 0),
          booked: Number(summaryData?.booked ?? 0),
          closed: Number(summaryData?.closed ?? 0),
        });
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load inquiries.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInquiries();

    return () => {
      active = false;
    };
  }, [
    apiRequest,
    page,
    search,
    statusFilter,
    typeFilter,
    sortOrder,
    reloadKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    sortOrder !== "newest";

  const pageLabel = useMemo(
    () => `Page ${page} of ${totalPages}`,
    [page, totalPages],
  );

  const showNotice = (message, type = "success") => {
    setNotice({ message, type });
  };

  const updateStatus = async (inquiry, nextStatus) => {
    if (!STATUS_OPTIONS.some((item) => item.value === nextStatus)) return;
    if (inquiry.status === nextStatus) return;

    setSaving(true);
    setNotice(null);

    try {
      const updated = await apiRequest(`inquiries/admin/${inquiry.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setInquiries((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedInquiry((current) =>
        current?.id === updated.id ? updated : current,
      );

      const summaryData = await apiRequest("inquiries/admin/summary/");
      setSummary({
        total: Number(summaryData?.total ?? 0),
        new: Number(summaryData?.new ?? 0),
        contacted: Number(summaryData?.contacted ?? 0),
        booked: Number(summaryData?.booked ?? 0),
        closed: Number(summaryData?.closed ?? 0),
      });
      setPage(1);
      setReloadKey((current) => current + 1);
      showNotice("Inquiry status updated.");
    } catch (requestError) {
      showNotice(
        requestError.message || "Unable to update inquiry status.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setDraftNotes(inquiry.admin_notes ?? "");
  };

  const saveNotes = async () => {
    if (!selectedInquiry) return;

    setSaving(true);
    setNotice(null);

    try {
      const updated = await apiRequest(
        `inquiries/admin/${selectedInquiry.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ admin_notes: draftNotes.trim() }),
        },
      );

      setInquiries((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedInquiry(updated);
      setDraftNotes(updated.admin_notes ?? "");
      showNotice("Internal notes saved.");
    } catch (requestError) {
      showNotice(requestError.message || "Unable to save notes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortOrder("newest");
    setPage(1);
  };

  const stats = [
    {
      label: "Total inquiries",
      value: summary.total,
      note: "All messages received",
      icon: MessageSquareText,
    },
    {
      label: "New inquiries",
      value: summary.new,
      note: "Awaiting first contact",
      icon: Clock3,
    },
    {
      label: "Contacted",
      value: summary.contacted,
      note: "Follow-up in progress",
      icon: Phone,
    },
    {
      label: "Booked",
      value: summary.booked,
      note: "Converted to a session",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="admin-inquiries" aria-labelledby="inquiries-title">
      <header className="admin-inquiries__header">
        <div className="admin-inquiries__heading-copy">
          <span className="admin-inquiries__eyebrow">CLIENT COMMUNICATION</span>
          <h1 id="inquiries-title">Inquiries</h1>
          <p>
            Review customer messages, manage follow-ups, and track inquiry
            resolution.
          </p>
        </div>

        <button
          type="button"
          className="admin-inquiries__export"
          onClick={() => exportInquiries(inquiries)}
          disabled={!inquiries.length || loading}
          title="Export the inquiries shown on this page"
        >
          <Download size={16} aria-hidden="true" />
          Export this page
        </button>
      </header>

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

      {error && (
        <div
          className="admin-inquiries__notice admin-inquiries__notice--error"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <div className="admin-inquiries__stats">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <article className="admin-inquiries__stat" key={label}>
            <div className="admin-inquiries__stat-top">
              <span>{label}</span>
              <Icon size={18} aria-hidden="true" />
            </div>
            <strong>{loading ? "—" : value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>

      <section className="admin-inquiries__panel">
        <div className="admin-inquiries__panel-heading">
          <div>
            <h2>Inquiry directory</h2>
            <p>
              {loading
                ? "Loading records…"
                : `${count} ${count === 1 ? "record" : "records"} found`}
            </p>
          </div>
          <span className="admin-inquiries__count">{count} records</span>
        </div>

        <div className="admin-inquiries__toolbar">
          <label className="admin-inquiries__search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone, message..."
              aria-label="Search inquiries"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
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
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Photography type</span>
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All types</option>
                {PHOTOGRAPHY_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort by</span>
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value);
                  setPage(1);
                }}
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
                <RefreshCw size={14} aria-hidden="true" />
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
                <th scope="col">Photography type</th>
                <th scope="col">Received</th>
                <th scope="col">Status</th>
                <th scope="col">Update status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-inquiries__empty">
                      Loading inquiries…
                    </div>
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <td>
                      <div className="admin-inquiries__customer">
                        <strong>{inquiry.name}</strong>
                        <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                        <small>{inquiry.id}</small>
                      </div>
                    </td>
                    <td>
                      <span className="admin-inquiries__service">
                        {formatPhotographyType(inquiry.photography_type)}
                      </span>
                    </td>
                    <td className="admin-inquiries__date">
                      {formatDate(inquiry.created_at)}
                    </td>
                    <td>
                      <span
                        className={`admin-inquiries__badge admin-inquiries__badge--${inquiry.status}`}
                      >
                        <span />
                        {formatStatus(inquiry.status)}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-inquiries__status-select"
                        value={inquiry.status}
                        disabled={saving}
                        onChange={(event) =>
                          void updateStatus(inquiry, event.target.value)
                        }
                        aria-label={`Update status for ${inquiry.name}`}
                      >
                        {STATUS_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
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
                          <Eye size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && !error && !inquiries.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-inquiries__empty">
                      <MessageSquareText size={28} aria-hidden="true" />
                      <strong>No inquiries found</strong>
                      <span>
                        {hasActiveFilters
                          ? "Try another search or filter."
                          : "New contact form submissions will appear here."}
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
            Showing {inquiries.length} of {count} inquiries
          </span>
          <div className="admin-inquiries__pagination">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span>{pageLabel}</span>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      {selectedInquiry && (
        <div
          className="admin-inquiries__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedInquiry(null);
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
                onClick={() => setSelectedInquiry(null)}
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
                <a href={`tel:${selectedInquiry.phone.replace(/[^\d+]/g, "")}`}>
                  {selectedInquiry.phone}
                </a>
              </p>
            </div>

            <dl className="admin-inquiries__details">
              <div>
                <dt>Photography type</dt>
                <dd>
                  {formatPhotographyType(selectedInquiry.photography_type)}
                </dd>
              </div>
              <div>
                <dt>Preferred session date</dt>
                <dd>{formatDate(selectedInquiry.preferred_date)}</dd>
              </div>
              <div>
                <dt>Date received</dt>
                <dd>{formatDate(selectedInquiry.created_at)}</dd>
              </div>
              <div>
                <dt>Inquiry status</dt>
                <dd>
                  <span
                    className={`admin-inquiries__badge admin-inquiries__badge--${selectedInquiry.status}`}
                  >
                    <span />
                    {formatStatus(selectedInquiry.status)}
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
                disabled={saving}
                onChange={(event) =>
                  void updateStatus(selectedInquiry, event.target.value)
                }
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
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
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveNotes()}
                >
                  <StickyNote size={15} aria-hidden="true" />
                  {saving ? "Saving…" : "Save notes"}
                </button>
              </div>
            </div>

            <footer className="admin-inquiries__modal-actions">
              <button
                type="button"
                className="admin-inquiries__button admin-inquiries__button--secondary"
                onClick={() => setSelectedInquiry(null)}
              >
                Close details
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
