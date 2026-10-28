import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const requestKeyName = (userId, environment, billingId) =>
  `lcs_payment_request:${userId}:${environment}:${billingId}`;

let checkoutLoader = null;

function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();

  if (!checkoutLoader) {
    checkoutLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      let timer;

      function fail() {
        clearTimeout(timer);
        script.remove();
        reject(new Error("Unable to load payment checkout. Please try again."));
      }

      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onerror = fail;
      script.onload = () => {
        clearTimeout(timer);

        if (window.Razorpay) {
          resolve();
        } else {
          fail();
        }
      };

      timer = window.setTimeout(fail, 20000);
      document.head.appendChild(script);
    }).catch((error) => {
      checkoutLoader = null;
      throw error;
    });
  }

  return checkoutLoader;
}

function Status({ value }) {
  const label = {
    unpaid: "Unpaid",
    partial: "Part paid",
    paid: "Paid",
    void: "Void",
    created: "Created",
    pending: "Pending",
    succeeded: "Succeeded",
    failed: "Failed",
  }[value] || value;

  return (
    <span
      className={`customer-payments__status customer-payments__status--${value}`}
    >
      {["paid", "succeeded"].includes(value) ? (
        <CheckCircle2 size={14} />
      ) : (
        <Clock3 size={14} />
      )}
      {label}
    </span>
  );
}

function PaymentDialog({ children, close }) {
  const ref = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (!opener.current) opener.current = document.activeElement;

    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;

    if (!dialog.open) dialog.showModal();

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener.current?.isConnected) opener.current.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="customer-payments__dialog"
      aria-label="Billing details"
      onCancel={close}
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="customer-payments__dialog-content">
        <div className="customer-payments__modal-top">
          <ReceiptText size={24} aria-hidden="true" />

          <button
            type="button"
            className="customer-payments__icon-button"
            onClick={close}
            aria-label="Close billing details"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </dialog>
  );
}

export default function Payments() {
  const { user, apiRequest } = useAuth();

  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const [bookingData, setBookingData] = useState(null);
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [bill, setBill] = useState(null);
  const [billLoading, setBillLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const alive = useRef(false);
  const operation = useRef(false);
  const checkout = useRef(null);

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      checkout.current?.close();
    };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      apiRequest("payments/configuration/"),
      apiRequest("payments/summary/"),
      apiRequest(`payments/billing/?page=${page}`),
    ])
      .then(([configuration, summary, records]) => {
        if (!Array.isArray(records.results)) {
          throw new Error("Invalid billing response.");
        }

        if (active) setData({ configuration, summary, records });
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [apiRequest, page, reload]);

  function refreshPage(nextPage = page) {
    setData(null);
    setError("");
    setPage(nextPage);
    setReload((value) => value + 1);
  }

  function showNotice(text, isError = false) {
    setNotice({ text, isError });
  }

  async function loadBookings(nextPage = 1) {
    if (operation.current) return;

    operation.current = true;
    setBookingLoading(true);
    setNotice(null);

    try {
      const result = await apiRequest(`bookings/?page=${nextPage}`);

      if (!Array.isArray(result.results)) {
        throw new Error("Invalid booking response.");
      }

      if (!alive.current) return;

      setBookingData(result);
      setBookingPage(nextPage);
    } catch (err) {
      if (alive.current) showNotice(err.message, true);
    } finally {
      operation.current = false;
      if (alive.current) setBookingLoading(false);
    }
  }

  async function openBill(id) {
    if (operation.current) return;

    operation.current = true;
    setBillLoading(true);
    setNotice(null);

    try {
      const result = await apiRequest(`payments/billing/${id}/`);

      if (!alive.current) return;

      setBill(result);
      setAmount(result.summary.balance_due);
    } catch (err) {
      if (alive.current) showNotice(err.message, true);
    } finally {
      operation.current = false;
      if (alive.current) setBillLoading(false);
    }
  }

  async function prepareBilling(bookingId) {
    if (operation.current) return;

    operation.current = true;
    setBusy(true);
    setNotice(null);

    try {
      const result = await apiRequest(
        `payments/billing/booking/${bookingId}/`,
        { method: "POST" },
      );

      if (!alive.current) return;

      setBill(result.billing_record);
      setAmount(result.billing_record.summary.balance_due);
      refreshPage(1);
    } catch (err) {
      if (alive.current) showNotice(err.message, true);
    } finally {
      operation.current = false;
      if (alive.current) setBusy(false);
    }
  }

  async function reloadBill(id) {
    const result = await apiRequest(`payments/billing/${id}/`);

    if (alive.current) {
      setBill((current) => (current?.id === id ? result : current));
      refreshPage();
    }

    return result;
  }

  async function checkPayment(paymentId) {
    if (operation.current || !bill) return;

    operation.current = true;
    setBusy(true);
    setNotice(null);

    const billingId = bill.id;

    try {
      const result = await apiRequest(
        `payments/${paymentId}/reconcile/`,
        { method: "POST" },
      );

      if (!alive.current) return;

      await reloadBill(billingId);

      if (alive.current) showNotice(result.message);
    } catch (err) {
      if (alive.current) showNotice(err.message, true);
    } finally {
      operation.current = false;
      if (alive.current) setBusy(false);
    }
  }

  async function startPayment(event) {
    event.preventDefault();

    if (operation.current || !bill || !data) return;

    if (
      !/^\d+(\.\d{1,2})?$/.test(amount) ||
      Number(amount) <= 0 ||
      Number(amount) > Number(bill.summary.balance_due)
    ) {
      showNotice("Enter a valid amount within your outstanding balance.", true);
      return;
    }

    operation.current = true;
    setBusy(true);
    setNotice(null);

    const billingId = bill.id;
    const environment = bill.environment;
    const storageKey = requestKeyName(user.id, environment, billingId);

    function finish() {
      operation.current = false;
      checkout.current = null;
      if (alive.current) setBusy(false);
    }

    try {
      await loadCheckout();

      if (!alive.current) {
        finish();
        return;
      }

      const unresolved = bill.payments.find(
        (payment) =>
          payment.source === "razorpay" &&
          ["created", "pending"].includes(payment.status),
      );

      let saved = null;

      try {
        saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      } catch {
        sessionStorage.removeItem(storageKey);
      }

      if (unresolved && saved?.paymentId !== unresolved.id) {
        throw new Error(
          "An earlier payment is unresolved. Use Check status or contact the studio before paying again.",
        );
      }

      const requestedAmount = unresolved ? unresolved.amount : amount;

      if (!saved || saved.amount !== requestedAmount) {
        saved = {
          key: crypto.randomUUID(),
          amount: requestedAmount,
          paymentId: null,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(saved));
      }

      const order = await apiRequest(
        `payments/billing/${billingId}/orders/`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: requestedAmount,
            idempotency_key: saved.key,
          }),
        },
      );

      saved.paymentId = order.payment_id;
      sessionStorage.setItem(storageKey, JSON.stringify(saved));

      if (!alive.current) {
        finish();
        return;
      }

      let verifying = false;

      const instance = new window.Razorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "Little Click Studio",
        description: order.service_name,
        prefill: {
          name: [user.first_name, user.last_name].filter(Boolean).join(" "),
          email: user.email,
          contact: user.phone_number || "",
        },
        theme: { color: "#7d5f33" },

        handler: async (response) => {
          verifying = true;

          try {
            const result = await apiRequest(
              `payments/${order.payment_id}/verify/`,
              {
                method: "POST",
                body: JSON.stringify(response),
              },
            );

            if (result.verification_status === "succeeded") {
              sessionStorage.removeItem(storageKey);
            }

            if (alive.current) {
              await reloadBill(billingId);
              showNotice(result.message);
            }
          } catch (err) {
            if (alive.current) {
              showNotice(
                `${err.message} Use Check status before making another payment.`,
                true,
              );
              await reloadBill(billingId).catch(() => {});
            }
          } finally {
            finish();
          }
        },

        modal: {
          ondismiss: () => {
            if (verifying) return;

            if (alive.current) {
              showNotice(
                "Checkout closed. Check the payment status before starting another payment.",
              );
              void reloadBill(billingId).catch(() => {});
            }

            finish();
          },
        },
      });

      instance.on("payment.failed", () => {
        if (alive.current) {
          showNotice(
            "The payment attempt was unsuccessful. Close checkout and check its status before paying again.",
            true,
          );
        }
      });

      // Close the native bill dialog before opening gateway checkout.
      setBill(null);
      checkout.current = instance;
      instance.open();
    } catch (err) {
      if (alive.current) {
        showNotice(err.message, true);
        refreshPage();
      }

      finish();
    }
  }

  const eligibleBookings = bookingData?.results.filter((booking) =>
    ["confirmed", "completed"].includes(booking.status),
  ) || [];

  return (
    <div className="customer-payments">
      <header className="customer-payments__header">
        <div>
          <Link to="/dashboard" className="customer-payments__back-link">
            <ArrowLeft size={15} /> Back to overview
          </Link>

          <p className="customer-payments__eyebrow">YOUR ACCOUNT · BILLING</p>
          <h1>Every moment,<br /><em>accounted for.</em></h1>

          <p className="customer-payments__intro">
            View your billing records, verified payments and remaining balance.
          </p>
        </div>

        <ReceiptText
          className="customer-payments__header-symbol"
          size={76}
          strokeWidth={1}
          aria-hidden="true"
        />
      </header>

      {notice && (
        <p
          className={`customer-payments__notice ${
            notice.isError ? "customer-payments__notice--error" : ""
          }`}
          role={notice.isError ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}

      {error ? (
        <section className="customer-payments__empty">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="customer-payments__button"
            onClick={() => refreshPage()}
          >
            Retry
          </button>
        </section>
      ) : !data ? (
        <p role="status">Loading your billing records…</p>
      ) : (
        <>
          {data.configuration.environment === "test" && (
            <div className="customer-payments__mode-banner" role="note">
              <ShieldCheck size={20} />
              <div>
                <strong>Test environment</strong>
                <p>
                  Online payments here are simulated. These records do not
                  represent real customer payments.
                </p>
              </div>
            </div>
          )}

          <section
            className="customer-payments__summary"
            aria-label="Billing summary"
          >
            {[
              ["Total billed", data.summary.total_billed],
              ["Net paid", data.summary.net_paid],
              ["Balance due", data.summary.balance_due],
            ].map(([label, value]) => (
              <article
                className="customer-payments__summary-card"
                key={label}
              >
                <span>{label}</span>
                <strong>{money(value)}</strong>
                <p>
                  {data.configuration.environment === "test"
                    ? "Test records only"
                    : "Your billing records"}
                </p>
              </article>
            ))}
          </section>

          <section className="customer-payments__content">
            <div className="customer-payments__section-heading">
              <div>
                <p className="customer-payments__eyebrow">BILLING HISTORY</p>
                <h2>Your billing records</h2>
                <p>
                  Refunded: {money(data.summary.total_refunded)}
                  {" · "}Credit: {money(data.summary.credit_balance)}
                </p>
              </div>

              <button
                type="button"
                className="customer-payments__button"
                disabled={busy}
                onClick={() => refreshPage()}
              >
                <RefreshCw size={15} /> Refresh
              </button>
            </div>

            {data.records.results.length === 0 ? (
              <div className="customer-payments__empty">
                <ReceiptText size={28} />
                <h3>No billing records yet.</h3>
                <p>
                  Billing can be prepared after the studio confirms your booking.
                </p>
              </div>
            ) : (
              <div className="customer-payments__table-wrap">
                <table className="customer-payments__table">
                  <thead>
                    <tr>
                      <th scope="col">Service</th>
                      <th scope="col">Total</th>
                      <th scope="col">Net paid</th>
                      <th scope="col">Balance</th>
                      <th scope="col">Status</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.records.results.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <strong>{record.service_name}</strong>
                          <small className="customer-payments__reference">
                            {record.id}
                          </small>
                        </td>
                        <td>{money(record.summary.total_amount)}</td>
                        <td>{money(record.summary.net_paid)}</td>
                        <td>{money(record.summary.balance_due)}</td>
                        <td>
                          <Status value={record.summary.payment_status} />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="customer-payments__button"
                            disabled={busy || billLoading}
                            onClick={() => openBill(record.id)}
                          >
                            View <ArrowRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <nav
              className="customer-payments__pagination"
              aria-label="Billing pages"
            >
              <button
                type="button"
                className="customer-payments__button"
                disabled={!data.records.previous || busy}
                onClick={() => refreshPage(page - 1)}
              >
                Previous
              </button>

              <span>Page {page}</span>

              <button
                type="button"
                className="customer-payments__button"
                disabled={!data.records.next || busy}
                onClick={() => refreshPage(page + 1)}
              >
                Next
              </button>
            </nav>
          </section>

          <section className="customer-payments__booking-panel">
            <h2>Billing for a confirmed booking</h2>
            <p>
              Select your confirmed/completed booking to prepare or open its
              existing billing record.
            </p>

            <button
              type="button"
              className="customer-payments__button"
              disabled={bookingLoading || busy}
              onClick={() => loadBookings(1)}
            >
              {bookingLoading ? "Loading…" : "Choose my booking"}
            </button>

            {bookingData && (
              <>
                {eligibleBookings.length === 0 ? (
                  <p>No confirmed/completed bookings on this booking page.</p>
                ) : (
                  <div className="customer-payments__booking-list">
                    {eligibleBookings.map((booking) => (
                      <article key={booking.id}>
                        <div>
                          <strong>{booking.service_name}</strong>
                          <small className="customer-payments__reference">
                            {booking.id}
                          </small>
                          <span>{money(booking.quoted_price)}</span>
                        </div>

                        <button
                          type="button"
                          className="customer-payments__button"
                          disabled={busy || bookingLoading}
                          onClick={() => prepareBilling(booking.id)}
                        >
                          Open billing
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                <nav
                  className="customer-payments__pagination"
                  aria-label="Booking selection pages"
                >
                  <button
                    type="button"
                    className="customer-payments__button"
                    disabled={!bookingData.previous || busy || bookingLoading}
                    onClick={() => loadBookings(bookingPage - 1)}
                  >
                    Previous
                  </button>

                  <span>Booking page {bookingPage}</span>

                  <button
                    type="button"
                    className="customer-payments__button"
                    disabled={!bookingData.next || busy || bookingLoading}
                    onClick={() => loadBookings(bookingPage + 1)}
                  >
                    Next
                  </button>
                </nav>
              </>
            )}
          </section>

          <section className="customer-payments__help">
            <CreditCard size={25} aria-hidden="true" />

            <div>
              <h2>Paying directly to the studio?</h2>
              <p>
                Contact the studio for payment instructions. Direct payments
                appear after staff verifies and records them.
              </p>
            </div>

            <Link
              to="/contact"
              className="customer-payments__button"
            >
              Contact the studio
            </Link>
          </section>
        </>
      )}

      {billLoading && <p role="status">Opening billing details…</p>}

      {bill && (
        <PaymentDialog close={() => setBill(null)}>
          <p className="customer-payments__eyebrow">
            {bill.environment === "test" ? "TEST BILLING RECORD" : "BILLING RECORD"}
          </p>

          <h2>{bill.service_name}</h2>
          <p className="customer-payments__reference">{bill.id}</p>
          <Status value={bill.summary.payment_status} />

          <dl className="customer-payments__invoice-lines">
            {[
              ["Total amount", bill.summary.total_amount],
              ["Payments received", bill.summary.total_paid],
              ["Refunded", bill.summary.total_refunded],
              ["Net paid", bill.summary.net_paid],
              ["Balance due", bill.summary.balance_due],
              ["Credit balance", bill.summary.credit_balance],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{money(value)}</dd>
              </div>
            ))}
          </dl>

          <p className="customer-payments__record-note">
            Account billing statement — not a tax invoice.
          </p>

          {data?.configuration.online_enabled &&
            bill.status === "open" &&
            Number(bill.summary.balance_due) > 0 && (
              <form
                className="customer-payments__pay-form"
                onSubmit={startPayment}
              >
                <label htmlFor="payment-amount">
                  Payment amount in INR
                </label>

                <input
                  id="payment-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  disabled={busy}
                />

                <p>
                  Pay the full balance or enter an advance amount.
                  An unresolved payment resumes at its original amount.
                </p>

                <button
                  type="submit"
                  className="customer-payments__button customer-payments__button--dark"
                  disabled={busy}
                >
                  {busy
                    ? "Please wait…"
                    : bill.environment === "test"
                      ? "Open test checkout"
                      : "Pay online"}
                </button>
              </form>
            )}

          {!data?.configuration.online_enabled && (
            <p className="customer-payments__record-note">
              Online checkout is not configured yet. Contact the studio for
              direct payment arrangements.
            </p>
          )}

          <h3>Payment history</h3>

          {bill.payments.length === 0 ? (
            <p>No payment attempts recorded.</p>
          ) : (
            <div className="customer-payments__history">
              {bill.payments.map((payment) => (
                <article key={payment.id}>
                  <div className="customer-payments__history-heading">
                    <strong>{money(payment.amount)}</strong>
                    <Status value={payment.status} />
                  </div>

                  <p>
                    {payment.source === "razorpay" ? "Online" : "Studio verified"}
                    {" · "}{payment.method || "Method not available"}
                  </p>

                  <small>{dateLabel(payment.paid_at || payment.created_at)}</small>

                  <p className="customer-payments__reference">
                    {payment.gateway_payment_id ||
                      payment.offline_reference ||
                      payment.id}
                  </p>

                  {payment.source === "razorpay" && (
                    <button
                      type="button"
                      className="customer-payments__button"
                      disabled={busy}
                      onClick={() => checkPayment(payment.id)}
                    >
                      Check payment/refund status
                    </button>
                  )}

                  {payment.refunds.map((refund) => (
                    <p key={refund.id}>
                      Refund: {money(refund.amount)}
                      {" · "}{refund.status}
                      {" · "}{dateLabel(refund.refunded_at || refund.created_at)}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          )}
        </PaymentDialog>
      )}
    </div>
  );
}