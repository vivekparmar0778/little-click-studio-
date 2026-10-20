
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Filter,
  LockKeyhole,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const paymentRecords = [
  {
    id: "INV-2026-1024",
    bookingId: "LCS-1024",
    service: "Newborn Photography",
    date: "14 Nov 2026",
    amount: 8500,
    paid: 8500,
    status: "Paid",
    method: "UPI",
    reference: "DEMO-UPI-1024",
  },
  {
    id: "INV-2026-1025",
    bookingId: "LCS-1025",
    service: "Maternity Portraits",
    date: "22 Nov 2026",
    amount: 12000,
    paid: 4000,
    status: "Partial",
    method: "UPI",
    reference: "DEMO-UPI-1025",
  },
  {
    id: "INV-2026-1018",
    bookingId: "LCS-1018",
    service: "Baby Milestone Session",
    date: "12 Aug 2026",
    amount: 6500,
    paid: 6500,
    status: "Paid",
    method: "Card",
    reference: "DEMO-CARD-1018",
  },
  {
    id: "INV-2026-1012",
    bookingId: "LCS-1012",
    service: "Family Portrait Session",
    date: "02 Jul 2026",
    amount: 9000,
    paid: 0,
    status: "Pending",
    method: "—",
    reference: "Not available",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function PaymentStatus({ status }) {
  const icon =
    status === "Paid" ? (
      <CheckCircle2 size={14} />
    ) : status === "Partial" ? (
      <Clock3 size={14} />
    ) : (
      <Clock3 size={14} />
    );

  return (
    <span
      className={`customer-payments__status customer-payments__status--${status.toLowerCase()}`}
    >
      {icon}
      {status === "Partial" ? "Part paid" : status}
    </span>
  );
}

function InvoiceModal({ invoice, onClose }) {
  if (!invoice) return null;

  const balance = invoice.amount - invoice.paid;

  return (
    <div
      className="customer-payments__modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="customer-payments__invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
      >
        <div className="customer-payments__modal-top">
          <div className="customer-payments__modal-icon">
            <ReceiptText size={22} />
          </div>
          <button
            type="button"
            className="customer-payments__icon-button"
            onClick={onClose}
            aria-label="Close invoice preview"
          >
            <X size={19} />
          </button>
        </div>

        <p className="customer-payments__eyebrow">INVOICE PREVIEW</p>
        <h2 id="invoice-modal-title">{invoice.id}</h2>
        <p className="customer-payments__modal-description">
          A preview of your studio billing record.
        </p>

        <div className="customer-payments__invoice-brand">
          <div>
            <span className="customer-payments__brand-mark">LC</span>
            <strong>Little Click Studio</strong>
          </div>
          <span>South Bopal · Ahmedabad</span>
        </div>

        <div className="customer-payments__invoice-lines">
          <div>
            <span>Service</span>
            <strong>{invoice.service}</strong>
          </div>
          <div>
            <span>Booking reference</span>
            <strong>{invoice.bookingId}</strong>
          </div>
          <div>
            <span>Session date</span>
            <strong>{invoice.date}</strong>
          </div>
          <div>
            <span>Invoice total</span>
            <strong>{formatCurrency(invoice.amount)}</strong>
          </div>
          <div>
            <span>Amount paid</span>
            <strong>{formatCurrency(invoice.paid)}</strong>
          </div>
          <div className="customer-payments__invoice-balance">
            <span>Outstanding balance</span>
            <strong>{formatCurrency(balance)}</strong>
          </div>
        </div>

        <div className="customer-payments__demo-notice">
          <ShieldCheck size={17} />
          <p>
            Demonstration record only. This preview is not a tax invoice or
            proof of payment.
          </p>
        </div>

        <button
          type="button"
          className="customer-payments__button customer-payments__button--dark"
          onClick={() => window.print()}
        >
          <FileText size={17} />
          Print preview
        </button>
      </section>
    </div>
  );
}

export default function Payments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sortNewest, setSortNewest] = useState(true);

  const summary = useMemo(() => {
    return paymentRecords.reduce(
      (totals, record) => {
        totals.total += record.amount;
        totals.paid += record.paid;
        totals.balance += record.amount - record.paid;
        return totals;
      },
      { total: 0, paid: 0, balance: 0 }
    );
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return paymentRecords
      .filter((record) => {
        const matchesSearch = [
          record.id,
          record.bookingId,
          record.service,
          record.status,
          record.method,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

        const matchesFilter =
          filter === "All" ||
          (filter === "Paid" && record.status === "Paid") ||
          (filter === "Outstanding" && record.amount > record.paid);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const aIndex = paymentRecords.indexOf(a);
        const bIndex = paymentRecords.indexOf(b);
        return sortNewest ? aIndex - bIndex : bIndex - aIndex;
      });
  }, [search, filter, sortNewest]);

  return (
    <main className="customer-payments">
      <div className="customer-payments__ambient" aria-hidden="true" />

      <header className="customer-payments__header">
        <div>
          <Link
            to="/dashboard"
            className="customer-payments__back-link"
          >
            <ArrowLeft size={15} />
            Back to overview
          </Link>

          <p className="customer-payments__eyebrow">
            YOUR ACCOUNT · BILLING
          </p>

          <h1>
            Every moment,
            <br />
            <em>accounted for.</em>
          </h1>

          <p className="customer-payments__intro">
            A clear view of your session invoices, payments and remaining
            balances — all in one place.
          </p>
        </div>

        <div className="customer-payments__header-art" aria-hidden="true">
          <div className="customer-payments__art-ring customer-payments__art-ring--one" />
          <div className="customer-payments__art-ring customer-payments__art-ring--two" />
          <div className="customer-payments__art-center">
            <ReceiptText size={34} strokeWidth={1.1} />
          </div>
          <Sparkles
            className="customer-payments__art-sparkle"
            size={20}
          />
          <span className="customer-payments__art-caption">
            LITTLE MOMENTS
          </span>
        </div>
      </header>

      <div className="customer-payments__demo-banner">
        <span className="customer-payments__demo-banner-icon">
          <LockKeyhole size={17} />
        </span>
        <div>
          <strong>Preview billing data</strong>
          <p>
            These are sample records for development. They do not represent
            verified payments or live account balances.
          </p>
        </div>
      </div>

      <section
        className="customer-payments__summary"
        aria-label="Payment summary"
      >
        <article className="customer-payments__summary-card customer-payments__summary-card--featured">
          <div className="customer-payments__summary-top">
            <span>Total billed</span>
            <span className="customer-payments__summary-icon">
              <ReceiptText size={18} />
            </span>
          </div>
          <strong>{formatCurrency(summary.total)}</strong>
          <p>Across all sample invoices</p>
          <div className="customer-payments__summary-foot">
            <span>INR</span>
            <span>All sessions</span>
          </div>
        </article>

        <article className="customer-payments__summary-card">
          <div className="customer-payments__summary-top">
            <span>Total paid</span>
            <span className="customer-payments__summary-icon">
              <ArrowDownLeft size={18} />
            </span>
          </div>
          <strong>{formatCurrency(summary.paid)}</strong>
          <p>Sample recorded payments</p>
          <div className="customer-payments__progress">
            <span
              style={{
                width: `${summary.total ? (summary.paid / summary.total) * 100 : 0}%`,
              }}
            />
          </div>
        </article>

        <article className="customer-payments__summary-card">
          <div className="customer-payments__summary-top">
            <span>Balance due</span>
            <span className="customer-payments__summary-icon">
              <Clock3 size={18} />
            </span>
          </div>
          <strong>{formatCurrency(summary.balance)}</strong>
          <p>Unpaid or partially paid samples</p>
          <div className="customer-payments__summary-foot">
            <span className="customer-payments__balance-dot" />
            <span>Review individual invoices</span>
          </div>
        </article>
      </section>

      <section className="customer-payments__content">
        <div className="customer-payments__section-heading">
          <div>
            <p className="customer-payments__eyebrow">BILLING HISTORY</p>
            <h2>Your invoices</h2>
            <p>Find a session, check its status or preview the invoice.</p>
          </div>

          <span className="customer-payments__record-count">
            {filteredRecords.length}{" "}
            {filteredRecords.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="customer-payments__toolbar">
          <label className="customer-payments__search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices or sessions..."
              aria-label="Search invoices"
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

          <label className="customer-payments__filter">
            <Filter size={16} />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter payments"
            >
              <option value="All">All invoices</option>
              <option value="Paid">Paid</option>
              <option value="Outstanding">Outstanding</option>
            </select>
            <ChevronDown size={15} />
          </label>

          <button
            type="button"
            className="customer-payments__sort"
            onClick={() => setSortNewest((current) => !current)}
          >
            {sortNewest ? (
              <ArrowDownToLine size={16} />
            ) : (
              <ArrowUpRight size={16} />
            )}
            {sortNewest ? "Default order" : "Reverse order"}
          </button>
        </div>

        <div className="customer-payments__table-wrap">
          <table className="customer-payments__table">
            <thead>
              <tr>
                <th scope="col">Invoice / Service</th>
                <th scope="col">Session date</th>
                <th scope="col">Amount</th>
                <th scope="col">Status</th>
                <th scope="col">Balance</th>
                <th scope="col">
                  <span className="customer-payments__sr-only">
                    Invoice actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="customer-payments__invoice-cell">
                      <span className="customer-payments__invoice-icon">
                        <FileText size={18} />
                      </span>
                      <div>
                        <strong>{record.id}</strong>
                        <span>{record.service}</span>
                        <small>{record.bookingId}</small>
                      </div>
                    </div>
                  </td>
                  <td className="customer-payments__date-cell">
                    {record.date}
                  </td>
                  <td className="customer-payments__amount-cell">
                    {formatCurrency(record.amount)}
                    <span>INR</span>
                  </td>
                  <td>
                    <PaymentStatus status={record.status} />
                  </td>
                  <td className="customer-payments__balance-cell">
                    {formatCurrency(record.amount - record.paid)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="customer-payments__view-button"
                      onClick={() => setSelectedInvoice(record)}
                    >
                      View
                      <ArrowUpRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <div className="customer-payments__empty">
              <Search size={27} />
              <h3>No matching invoices</h3>
              <p>Try a different search term or change the filter.</p>
              <button
                type="button"
                className="customer-payments__button"
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="customer-payments__help">
        <div className="customer-payments__help-icon">
          <CreditCard size={22} />
        </div>
        <div className="customer-payments__help-copy">
          <p className="customer-payments__eyebrow">NEED A HAND?</p>
          <h2>Questions about a payment?</h2>
          <p>
            If something doesn’t look right, contact the studio before making
            another payment.
          </p>
        </div>
        <Link
          to="/contact"
          className="customer-payments__button customer-payments__button--dark"
        >
          Contact the studio
          <ArrowUpRight size={16} />
        </Link>
      </section>

      <footer className="customer-payments__footer">
        <span>
          <ShieldCheck size={15} />
          Your account, treated with care.
        </span>
        <span>Little Click Studio · South Bopal</span>
      </footer>

      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </main>
  );
}
