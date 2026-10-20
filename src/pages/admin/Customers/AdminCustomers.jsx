import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const initialCustomers = [
  {
    id: "CUS-1001",
    name: "Aarav Mehta",
    email: "aarav.mehta@example.com",
    phone: "+91 98765 43210",
    joined: "2026-09-14",
    status: "active",
    bookings: 3,
    notes: "Prefers WhatsApp for appointment updates.",
    source: "Website",
  },
  {
    id: "CUS-1002",
    name: "Diya Shah",
    email: "diya.shah@example.com",
    phone: "+91 98250 12345",
    joined: "2026-09-27",
    status: "active",
    bookings: 1,
    notes: "",
    source: "Instagram",
  },
  {
    id: "CUS-1003",
    name: "Rohan Patel",
    email: "rohan.patel@example.com",
    phone: "+91 98980 45678",
    joined: "2026-10-02",
    status: "inactive",
    bookings: 0,
    notes: "Asked to contact again next month.",
    source: "Referral",
  },
  {
    id: "CUS-1004",
    name: "Mira Desai",
    email: "mira.desai@example.com",
    phone: "+91 99090 11223",
    joined: "2026-10-11",
    status: "active",
    bookings: 2,
    notes: "Interested in maternity and newborn packages.",
    source: "Website",
  },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  status: "active",
  notes: "",
  source: "Website",
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "C";

const digitsOnly = (value = "") => value.replace(/\D/g, "");

const getNextCustomerId = (customers) => {
  const highest = customers.reduce((max, customer) => {
    const suffix = Number(customer.id.match(/\d+$/)?.[0] ?? 1000);
    return Math.max(max, suffix);
  }, 1000);
  return `CUS-${highest + 1}`;
};

function downloadCsv(customers) {
  const columns = [
    ["Customer ID", "id"],
    ["Name", "name"],
    ["Email", "email"],
    ["Phone", "phone"],
    ["Joined", "joined"],
    ["Status", "status"],
    ["Bookings", "bookings"],
    ["Source", "source"],
    ["Internal notes", "notes"],
  ];

  const escapeCsv = (value) => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csv = [
    columns.map(([label]) => escapeCsv(label)).join(","),
    ...customers.map((customer) =>
      columns.map(([, key]) => escapeCsv(customer[key])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `little-click-customers-${today()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = customers.filter((customer) => {
      const matchesSearch =
        !query ||
        [
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.notes,
        ].some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" || customer.status === statusFilter;
      const matchesSource =
        sourceFilter === "all" || customer.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });

    return result.sort((a, b) => {
      if (sortBy === "oldest") return a.joined.localeCompare(b.joined);
      if (sortBy === "name-az") return a.name.localeCompare(b.name);
      if (sortBy === "name-za") return b.name.localeCompare(a.name);
      if (sortBy === "bookings") return b.bookings - a.bookings;
      return b.joined.localeCompare(a.joined);
    });
  }, [customers, search, statusFilter, sourceFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageCustomers = filteredCustomers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.status === "active");
    const bookings = customers.reduce(
      (total, customer) => total + Number(customer.bookings || 0),
      0
    );
    const newest = [...customers].sort((a, b) =>
      b.joined.localeCompare(a.joined)
    )[0];
    return {
      total: customers.length,
      active: active.length,
      bookings,
      newest: newest ? newest.name : "No customers yet",
      newestDate: newest ? formatDate(newest.joined) : "Add your first customer",
    };
  }, [customers]);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setFormMode("add");
  };

  const openEditForm = (customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      notes: customer.notes ?? "",
      source: customer.source ?? "Website",
    });
    setFormErrors({});
    setFormMode("edit");
    setSelectedCustomer(null);
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingId(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();

    if (name.length < 2) errors.name = "Enter a name with at least 2 characters.";
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (digitsOnly(phone).length < 10) {
      errors.phone = "Enter a valid phone number with at least 10 digits.";
    }

    const duplicateEmail = customers.some(
      (customer) =>
        customer.id !== editingId &&
        customer.email.trim().toLowerCase() === email
    );
    if (email && duplicateEmail) errors.email = "This email already exists.";

    const phoneDigits = digitsOnly(phone);
    const duplicatePhone = customers.some(
      (customer) =>
        customer.id !== editingId &&
        digitsOnly(customer.phone) === phoneDigits
    );
    if (phoneDigits && duplicatePhone) errors.phone = "This phone number already exists.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsBusy(true);
    const normalized = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      status: formData.status,
      notes: formData.notes.trim(),
      source: formData.source,
    };

    if (formMode === "add") {
      const newCustomer = {
        ...normalized,
        id: getNextCustomerId(customers),
        joined: today(),
        bookings: 0,
      };
      setCustomers((current) => [newCustomer, ...current]);
      setPage(1);
      showNotice("success", `${newCustomer.name} was added to the customer directory.`);
    } else {
      const updatedCustomer = customers.find((customer) => customer.id === editingId);
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === editingId ? { ...customer, ...normalized } : customer
        )
      );
      if (selectedCustomer?.id === editingId && updatedCustomer) {
        setSelectedCustomer({ ...updatedCustomer, ...normalized });
      }
      showNotice("success", `${normalized.name}'s profile was updated.`);
    }

    setIsBusy(false);
    closeForm();
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;
    const deletedId = customerToDelete.id;
    const deletedName = customerToDelete.name;
    setCustomers((current) =>
      current.filter((customer) => customer.id !== deletedId)
    );
    if (selectedCustomer?.id === deletedId) setSelectedCustomer(null);
    setCustomerToDelete(null);
    showNotice("success", `${deletedName} was deleted from this demo directory.`);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSourceFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  const changeSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const changeStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const changeSource = (value) => {
    setSourceFilter(value);
    setPage(1);
  };

  const changePageSize = (value) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const openCustomerFromRow = (customer) => setSelectedCustomer(customer);

  return (
    <section className="admin-customers" aria-labelledby="customers-title">
      <div className="admin-customers__heading">
        <div className="admin-customers__heading-copy">
          <p className="admin-customers__eyebrow">RELATIONSHIP MANAGEMENT</p>
          <h1 id="customers-title" className="admin-customers__title">
            Customer directory
          </h1>
          <p className="admin-customers__description">
            Manage client profiles, track relationships, and keep customer records organized.
          </p>
        </div>
        <div className="admin-customers__heading-actions">
          <button
            className="admin-customers__secondary-button"
            type="button"
            onClick={() => downloadCsv(filteredCustomers)}
            disabled={!filteredCustomers.length}
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </button>
          <button className="admin-customers__primary-button" type="button" onClick={openAddForm}>
            <Plus size={17} aria-hidden="true" />
            Add customer
          </button>
        </div>
      </div>

      <div className="admin-customers__demo-notice" role="note">
        <ShieldCheck size={17} aria-hidden="true" />
        <span>
          Demo mode: changes are held in React state and reset on refresh. Connect the Django API
          before using this screen with real customer data.
        </span>
      </div>

      {notice && (
        <div
          className={`admin-customers__notice ${notice.type === "error" ? "admin-customers__notice--error" : ""}`}
          role="status"
        >
          <Check size={17} aria-hidden="true" />
          <span>{notice.message}</span>
          <button
            type="button"
            className="admin-customers__notice-close"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="admin-customers__stats-grid">
        <article className="admin-customers__stat-card">
          <div className="admin-customers__stat-top">
            <span className="admin-customers__stat-label">Total customers</span>
            <span className="admin-customers__stat-icon"><Users size={18} /></span>
          </div>
          <strong className="admin-customers__stat-value">{stats.total}</strong>
          <span className="admin-customers__stat-foot">Profiles in this directory</span>
        </article>
        <article className="admin-customers__stat-card">
          <div className="admin-customers__stat-top">
            <span className="admin-customers__stat-label">Active customers</span>
            <span className="admin-customers__stat-icon"><ShieldCheck size={18} /></span>
          </div>
          <strong className="admin-customers__stat-value">{stats.active}</strong>
          <span className="admin-customers__stat-foot">Marked active</span>
        </article>
        <article className="admin-customers__stat-card">
          <div className="admin-customers__stat-top">
            <span className="admin-customers__stat-label">Linked bookings</span>
            <span className="admin-customers__stat-icon"><CalendarDays size={18} /></span>
          </div>
          <strong className="admin-customers__stat-value">{stats.bookings}</strong>
          <span className="admin-customers__stat-foot">Across listed customers</span>
        </article>
        <article className="admin-customers__stat-card">
          <div className="admin-customers__stat-top">
            <span className="admin-customers__stat-label">Latest registration</span>
            <span className="admin-customers__stat-icon"><FileText size={18} /></span>
          </div>
          <strong className="admin-customers__stat-value admin-customers__stat-value--name">{stats.newest}</strong>
          <span className="admin-customers__stat-foot">{stats.newestDate}</span>
        </article>
      </div>

      <div className="admin-customers__panel">
        <div className="admin-customers__panel-header">
          <div>
            <h2 className="admin-customers__panel-title">All customers</h2>
            <p className="admin-customers__panel-description">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? "record" : "records"} found
            </p>
          </div>
          <span className="admin-customers__count-pill">{filteredCustomers.length} records</span>
        </div>

        <div className="admin-customers__toolbar">
          <label className="admin-customers__search-box">
            <Search size={17} aria-hidden="true" />
            <span className="admin-customers__sr-only">Search customers</span>
            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search name, ID, email, phone..."
            />
            {search && (
              <button type="button" onClick={() => changeSearch("")} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </label>

          <div className="admin-customers__filter-group">
            <label className="admin-customers__select-label">
              <Filter size={15} aria-hidden="true" />
              <span className="admin-customers__sr-only">Filter by status</span>
              <select value={statusFilter} onChange={(event) => changeStatus(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="admin-customers__select-label">
              <span className="admin-customers__sr-only">Filter by source</span>
              <select value={sourceFilter} onChange={(event) => changeSource(event.target.value)}>
                <option value="all">All sources</option>
                <option value="Website">Website</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="admin-customers__select-label">
              <ArrowDownUp size={15} aria-hidden="true" />
              <span className="admin-customers__sr-only">Sort customers</span>
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-az">Name A–Z</option>
                <option value="name-za">Name Z–A</option>
                <option value="bookings">Most bookings</option>
              </select>
            </label>
            {(search || statusFilter !== "all" || sourceFilter !== "all" || sortBy !== "newest") && (
              <button type="button" className="admin-customers__clear-button" onClick={clearFilters}>
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="admin-customers__table-wrap">
          <table className="admin-customers__table">
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Contact details</th>
                <th scope="col">Joined</th>
                <th scope="col">Bookings</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="admin-customers__customer-cell">
                      <span className="admin-customers__avatar" aria-hidden="true">{initials(customer.name)}</span>
                      <span className="admin-customers__customer-meta">
                        <strong>{customer.name}</strong>
                        <small>{customer.id}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-customers__contact-cell">
                      <a href={`mailto:${customer.email}`}><Mail size={13} />{customer.email}</a>
                      <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`}><Phone size={13} />{customer.phone}</a>
                    </div>
                  </td>
                  <td className="admin-customers__date-cell">{formatDate(customer.joined)}</td>
                  <td><span className="admin-customers__booking-pill">{customer.bookings}</span></td>
                  <td>
                    <span className={`admin-customers__status ${customer.status === "active" ? "admin-customers__status--active" : "admin-customers__status--inactive"}`}>
                      <span className="admin-customers__status-dot" />
                      {customer.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-customers__row-actions">
                      <button type="button" className="admin-customers__icon-button" onClick={() => openCustomerFromRow(customer)} aria-label={`View ${customer.name}`} title="View profile">
                        <Eye size={16} />
                      </button>
                      <button type="button" className="admin-customers__icon-button" onClick={() => openEditForm(customer)} aria-label={`Edit ${customer.name}`} title="Edit customer">
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="admin-customers__icon-button admin-customers__danger-icon-button" onClick={() => setCustomerToDelete(customer)} aria-label={`Delete ${customer.name}`} title="Delete customer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageCustomers.length && (
            <div className="admin-customers__empty-state">
              <span className="admin-customers__empty-icon"><Search size={21} /></span>
              <h3>No customers found</h3>
              <p>Try a different search or reset the filters.</p>
              <button type="button" className="admin-customers__secondary-button" onClick={clearFilters}>Reset filters</button>
            </div>
          )}
        </div>

        <div className="admin-customers__pagination">
          <div className="admin-customers__pagination-info">
            Showing <strong>{filteredCustomers.length ? (safePage - 1) * pageSize + 1 : 0}</strong>–<strong>{Math.min(safePage * pageSize, filteredCustomers.length)}</strong> of <strong>{filteredCustomers.length}</strong>
          </div>
          <div className="admin-customers__pagination-controls">
            <label className="admin-customers__page-size">
              <span>Rows</span>
              <select value={pageSize} onChange={(event) => changePageSize(event.target.value)}>
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </label>
            <button type="button" className="admin-customers__page-button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous page">
              <ChevronLeft size={17} />
            </button>
            <span className="admin-customers__page-number">Page {safePage} of {totalPages}</span>
            <button type="button" className="admin-customers__page-button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} aria-label="Next page">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {selectedCustomer && (
        <div className="admin-customers__backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedCustomer(null); }}>
          <section className="admin-customers__modal admin-customers__profile-modal" role="dialog" aria-modal="true" aria-labelledby="customer-profile-title">
            <div className="admin-customers__modal-header">
              <div>
                <p className="admin-customers__eyebrow">CUSTOMER PROFILE</p>
                <h2 id="customer-profile-title">Customer details</h2>
              </div>
              <button type="button" className="admin-customers__modal-close" onClick={() => setSelectedCustomer(null)} aria-label="Close customer profile"><X size={19} /></button>
            </div>
            <div className="admin-customers__profile-identity">
              <span className="admin-customers__avatar admin-customers__avatar--large">{initials(selectedCustomer.name)}</span>
              <div>
                <h3>{selectedCustomer.name}</h3>
                <p>{selectedCustomer.id}</p>
                <span className={`admin-customers__status ${selectedCustomer.status === "active" ? "admin-customers__status--active" : "admin-customers__status--inactive"}`}>
                  <span className="admin-customers__status-dot" />{selectedCustomer.status === "active" ? "Active customer" : "Inactive customer"}
                </span>
              </div>
            </div>
            <div className="admin-customers__detail-grid">
              <div className="admin-customers__detail-item"><span>Email address</span><a href={`mailto:${selectedCustomer.email}`}>{selectedCustomer.email}</a></div>
              <div className="admin-customers__detail-item"><span>Phone number</span><a href={`tel:${selectedCustomer.phone.replace(/[^\d+]/g, "")}`}>{selectedCustomer.phone}</a></div>
              <div className="admin-customers__detail-item"><span>Registered on</span><strong>{formatDate(selectedCustomer.joined)}</strong></div>
              <div className="admin-customers__detail-item"><span>Linked bookings</span><strong>{selectedCustomer.bookings}</strong></div>
              <div className="admin-customers__detail-item"><span>Customer source</span><strong>{selectedCustomer.source || "—"}</strong></div>
              <div className="admin-customers__detail-item"><span>Gallery access</span><strong>Requires gallery API</strong></div>
            </div>
            <div className="admin-customers__notes-block">
              <span>Internal notes</span>
              <p>{selectedCustomer.notes || "No internal notes have been added."}</p>
            </div>
            <div className="admin-customers__modal-actions">
              <button type="button" className="admin-customers__secondary-button" onClick={() => setSelectedCustomer(null)}>Close</button>
              <button type="button" className="admin-customers__primary-button" onClick={() => openEditForm(selectedCustomer)}><Pencil size={15} /> Edit profile</button>
            </div>
            <p className="admin-customers__modal-footnote">Booking history and gallery permissions become live after the Django API is connected.</p>
          </section>
        </div>
      )}

      {formMode && (
        <div className="admin-customers__backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section className="admin-customers__modal admin-customers__form-modal" role="dialog" aria-modal="true" aria-labelledby="customer-form-title">
            <div className="admin-customers__modal-header">
              <div>
                <p className="admin-customers__eyebrow">{formMode === "add" ? "NEW RELATIONSHIP" : "UPDATE RECORD"}</p>
                <h2 id="customer-form-title">{formMode === "add" ? "Add customer" : "Edit customer"}</h2>
                <p className="admin-customers__modal-intro">{formMode === "add" ? "Create a customer profile in the directory." : "Update this customer's contact and relationship details."}</p>
              </div>
              <button type="button" className="admin-customers__modal-close" onClick={closeForm} aria-label="Close customer form"><X size={19} /></button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="admin-customers__form-grid">
                <label className="admin-customers__field">
                  <span>Full name <b>*</b></span>
                  <input autoFocus value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Aanya Shah" aria-invalid={Boolean(formErrors.name)} aria-describedby={formErrors.name ? "customer-name-error" : undefined} />
                  {formErrors.name && <small id="customer-name-error" className="admin-customers__field-error">{formErrors.name}</small>}
                </label>
                <label className="admin-customers__field">
                  <span>Email address <b>*</b></span>
                  <input type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" aria-invalid={Boolean(formErrors.email)} aria-describedby={formErrors.email ? "customer-email-error" : undefined} />
                  {formErrors.email && <small id="customer-email-error" className="admin-customers__field-error">{formErrors.email}</small>}
                </label>
                <label className="admin-customers__field">
                  <span>Phone number <b>*</b></span>
                  <input type="tel" value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} placeholder="+91 98765 43210" aria-invalid={Boolean(formErrors.phone)} aria-describedby={formErrors.phone ? "customer-phone-error" : undefined} />
                  {formErrors.phone && <small id="customer-phone-error" className="admin-customers__field-error">{formErrors.phone}</small>}
                </label>
                <label className="admin-customers__field">
                  <span>Account status</span>
                  <select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label className="admin-customers__field">
                  <span>Customer source</span>
                  <select value={formData.source} onChange={(event) => setFormData((current) => ({ ...current, source: event.target.value }))}>
                    <option value="Website">Website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="admin-customers__field admin-customers__field--full">
                  <span>Internal notes <small>Visible to authorized admins only</small></span>
                  <textarea rows={4} value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} placeholder="Preferences, follow-up reminders, or useful context..." maxLength={1000} />
                  <small className="admin-customers__character-count">{formData.notes.length}/1000</small>
                </label>
              </div>
              <div className="admin-customers__form-hint">Customer ID, registration date, and booking count are system-managed. Booking totals should come from linked booking records in Django.</div>
              <div className="admin-customers__modal-actions">
                <button type="button" className="admin-customers__secondary-button" onClick={closeForm}>Cancel</button>
                <button type="submit" className="admin-customers__primary-button" disabled={isBusy}>
                  <Check size={16} />{formMode === "add" ? "Create customer" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {customerToDelete && (
        <div className="admin-customers__backdrop admin-customers__confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCustomerToDelete(null); }}>
          <section className="admin-customers__modal admin-customers__confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-customer-title" aria-describedby="delete-customer-description">
            <span className="admin-customers__warning-icon"><AlertTriangle size={23} /></span>
            <h2 id="delete-customer-title">Delete this customer?</h2>
            <p id="delete-customer-description">
              You are about to remove <strong>{customerToDelete.name}</strong> ({customerToDelete.id}) from this demo directory. This action cannot be undone here.
            </p>
            <p className="admin-customers__delete-warning">In production, check linked bookings and gallery ownership before deleting a customer.</p>
            <div className="admin-customers__modal-actions">
              <button type="button" className="admin-customers__secondary-button" onClick={() => setCustomerToDelete(null)}>Cancel</button>
              <button type="button" className="admin-customers__delete-button" onClick={confirmDelete}><Trash2 size={16} /> Delete customer</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
