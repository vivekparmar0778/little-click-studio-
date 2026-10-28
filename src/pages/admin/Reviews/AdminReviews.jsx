import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { createAdminReviewsService } from "../../../services/adminReviewsService";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function RatingStars({ rating }) {
  return (
    <span
      className="admin-reviews__stars"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={15}
          fill={index < rating ? "currentColor" : "none"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

const emptyForm = {
  booking: "",
  rating: "5",
  title: "",
  message: "",
  published: false,
};

async function collectPages(fetchPage) {
  const records = [];
  let page = 1;
  while (true) {
    const response = await fetchPage(page);
    if (Array.isArray(response)) return response;
    if (!Array.isArray(response?.results))
      throw new Error("Invalid server response.");
    records.push(...response.results);
    if (!response.next || !response.results.length) return records;
    page += 1;
  }
}

function normalizeReview(review) {
  return {
    ...review,
    date: review.created_at.slice(0, 10),
    published: review.is_published,
  };
}

export default function AdminReviews() {
  const { apiRequest } = useAuth();
  const reviewsApi = useMemo(
    () => createAdminReviewsService(apiRequest),
    [apiRequest],
  );
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const mounted = useRef(false);
  const version = useRef(0);

  const fetchReviews = useCallback(async () => {
    const records = await collectPages((page) =>
      reviewsApi.list({ page, page_size: 100 }),
    );
    return records.map(normalizeReview);
  }, [reviewsApi]);

  const refreshReviews = useCallback(async () => {
    const currentVersion = ++version.current;
    const records = await fetchReviews();
    if (mounted.current && currentVersion === version.current)
      setReviews(records);
  }, [fetchReviews]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    const currentVersion = ++version.current;
    fetchReviews()
      .then((records) => {
        if (active && currentVersion === version.current) setReviews(records);
      })
      .catch((error) => {
        if (active) setNotice(error.message || "Unable to load reviews.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    collectPages((page) =>
      reviewsApi.listBookings({ page, page_size: 100, status: "completed" }),
    )
      .then((records) => {
        if (active)
          setBookings(
            records.filter((booking) => booking.status === "completed"),
          );
      })
      .catch((error) => {
        if (active)
          setNotice(`Review form bookings could not load: ${error.message}`);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [fetchReviews, reviewsApi]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busyRef.current) {
        setSelectedReview(null);
        setDeleteTarget(null);
        setFormOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reviews
      .filter((review) => {
        const matchesSearch = [
          review.id,
          review.customer,
          review.service,
          review.title,
          review.message,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query),
        );
        return (
          matchesSearch &&
          (ratingFilter === "all" || review.rating === Number(ratingFilter)) &&
          (visibilityFilter === "all" ||
            (visibilityFilter === "published"
              ? review.published
              : !review.published))
        );
      })
      .sort((a, b) => {
        if (sortBy === "oldest")
          return a.created_at.localeCompare(b.created_at);
        if (sortBy === "highest")
          return (
            b.rating - a.rating || b.created_at.localeCompare(a.created_at)
          );
        if (sortBy === "lowest")
          return (
            a.rating - b.rating || b.created_at.localeCompare(a.created_at)
          );
        if (sortBy === "customer") return a.customer.localeCompare(b.customer);
        return b.created_at.localeCompare(a.created_at);
      });
  }, [reviews, search, ratingFilter, visibilityFilter, sortBy]);
  const publishedCount = reviews.filter((review) => review.published).length;
  const hiddenCount = reviews.length - publishedCount;
  const averageRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1)
    : "0.0";
  const visibleIds = filteredReviews.map((review) => review.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const eligibleBookings = bookings.filter(
    (booking) =>
      !reviews.some((review) => String(review.booking) === String(booking.id)),
  );

  const toggleSelection = (id) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  const toggleSelectAllVisible = () =>
    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    );

  const togglePublished = async (review) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const updated = normalizeReview(
        await reviewsApi.setPublished(review.id, !review.published),
      );
      setReviews((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedReview((current) =>
        current?.id === updated.id ? updated : current,
      );
      setNotice(`Review ${updated.published ? "published" : "hidden"}.`);
    } catch (error) {
      setNotice(error.message || "Unable to update review.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const updateSelectedReviews = async (published) => {
    if (busyRef.current || !selectedIds.length) return;
    busyRef.current = true;
    setBusy(true);
    const successful = [];
    const failures = [];
    for (const id of selectedIds) {
      try {
        const updated = normalizeReview(
          await reviewsApi.setPublished(id, published),
        );
        successful.push(id);
        setReviews((current) =>
          current.map((item) => (item.id === id ? updated : item)),
        );
        setSelectedReview((current) =>
          current?.id === id ? updated : current,
        );
      } catch (error) {
        failures.push(error.message);
      }
    }
    setSelectedIds((current) =>
      current.filter((id) => !successful.includes(id)),
    );
    setNotice(
      `${successful.length} review(s) ${published ? "published" : "hidden"}.${failures.length ? ` ${failures.length} failed: ${failures[0]}` : ""}`,
    );
    busyRef.current = false;
    setBusy(false);
  };

  const confirmDelete = async () => {
    if (busyRef.current || !deleteTarget) return;
    busyRef.current = true;
    setBusy(true);
    const ids = Array.isArray(deleteTarget)
      ? [...deleteTarget]
      : [deleteTarget.id];
    const successful = [];
    const failures = [];
    for (const id of ids) {
      try {
        await reviewsApi.remove(id);
        successful.push(id);
        setReviews((current) => current.filter((review) => review.id !== id));
        setSelectedReview((current) => (current?.id === id ? null : current));
      } catch (error) {
        failures.push(error.message);
      }
    }
    setSelectedIds((current) =>
      current.filter((id) => !successful.includes(id)),
    );
    setDeleteTarget(null);
    setNotice(
      `${successful.length} review(s) deleted.${failures.length ? ` ${failures.length} failed: ${failures[0]}` : ""}`,
    );
    busyRef.current = false;
    setBusy(false);
  };

  const openForm = () => {
    setForm({ ...emptyForm });
    setFormError("");
    setFormOpen(true);
  };
  const saveOfflineReview = async (event) => {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFormError("");
    try {
      const created = normalizeReview(
        await reviewsApi.create({
          booking: form.booking,
          rating: Number(form.rating),
          title: form.title.trim(),
          message: form.message.trim(),
          is_published: form.published,
        }),
      );
      setReviews((current) => [created, ...current]);
      setFormOpen(false);
      setNotice("Customer feedback recorded successfully.");
      try {
        await refreshReviews();
      } catch (error) {
        setNotice(`Review saved. List refresh failed: ${error.message}`);
      }
    } catch (error) {
      setFormError(error.message || "Unable to record review.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const exportCSV = () => {
    const headers = [
      "Review ID",
      "Customer",
      "Service",
      "Rating",
      "Date",
      "Title",
      "Message",
      "Visibility",
      "Source",
    ];

    const rows = filteredReviews.map((review) => [
      review.id,
      review.customer,
      review.service,
      review.rating,
      review.date,
      review.title,
      review.message,
      review.published ? "Published" : "Hidden",
      review.source === "offline" ? "Recorded by admin" : "Website",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "little-click-reviews.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setNotice(`${filteredReviews.length} review(s) exported to CSV.`);
  };

  const resetFilters = () => {
    setSearch("");
    setRatingFilter("all");
    setVisibilityFilter("all");
    setSortBy("newest");
  };

  return (
    <section className="admin-reviews">
      <header className="admin-reviews__header">
        <div>
          <span className="admin-reviews__eyebrow">CUSTOMER FEEDBACK</span>
          <h1>Reviews Management</h1>
          <p>Review customer feedback and manage published testimonials.</p>
        </div>

        <div className="admin-reviews__header-actions">
          <button
            type="button"
            className="admin-reviews__export"
            onClick={openForm}
            disabled={busy || loading}
          >
            Record customer feedback
          </button>
          <button
            type="button"
            className="admin-reviews__export"
            onClick={exportCSV}
            disabled={busy || filteredReviews.length === 0}
          >
            <Download size={17} />
            <span>Export CSV</span>
          </button>

          <div className="admin-reviews__header-icon" aria-hidden="true">
            <MessageSquareQuote size={24} />
          </div>
        </div>
      </header>

      {notice && (
        <div className="admin-reviews__notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {loading && <p role="status">Loading reviews...</p>}

      <div className="admin-reviews__stats">
        <article className="admin-reviews__stat">
          <span>Total reviews</span>
          <strong>{reviews.length}</strong>
          <small>All feedback records</small>
        </article>

        <article className="admin-reviews__stat">
          <span>Average rating</span>
          <strong className="admin-reviews__average">
            <Star size={22} fill="currentColor" />
            {averageRating}
            <small>/ 5</small>
          </strong>
          <small>Across all reviews</small>
        </article>

        <article className="admin-reviews__stat">
          <span>Published</span>
          <strong>{publishedCount}</strong>
          <small>Visible testimonials</small>
        </article>

        <article className="admin-reviews__stat">
          <span>Hidden</span>
          <strong>{hiddenCount}</strong>
          <small>Not publicly displayed</small>
        </article>
      </div>

      <div className="admin-reviews__toolbar">
        <label className="admin-reviews__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, service or review..."
            aria-label="Search reviews"
          />
        </label>

        <label className="admin-reviews__filter">
          <span>Rating</span>
          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </label>

        <label className="admin-reviews__filter">
          <span>Visibility</span>
          <select
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value)}
          >
            <option value="all">All reviews</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>

        <label className="admin-reviews__filter admin-reviews__sort">
          <span>Sort</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rating</option>
            <option value="lowest">Lowest rating</option>
            <option value="customer">Customer A–Z</option>
          </select>
        </label>
      </div>

      <div className="admin-reviews__list-heading">
        <div>
          <h2>Customer reviews</h2>
          <p>
            Showing {filteredReviews.length} of {reviews.length} reviews
          </p>
        </div>

        {(search ||
          ratingFilter !== "all" ||
          visibilityFilter !== "all" ||
          sortBy !== "newest") && (
          <button
            type="button"
            className="admin-reviews__text-button"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="admin-reviews__bulk-bar">
          <div className="admin-reviews__bulk-count">
            <Check size={17} />
            <strong>{selectedIds.length} selected</strong>
          </div>

          <div className="admin-reviews__bulk-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => updateSelectedReviews(true)}
            >
              <Eye size={16} />
              Publish
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => updateSelectedReviews(false)}
            >
              <EyeOff size={16} />
              Hide
            </button>

            <button
              type="button"
              className="admin-reviews__bulk-delete"
              onClick={() => setDeleteTarget(selectedIds)}
            >
              <Trash2 size={16} />
              Delete
            </button>

            <button
              type="button"
              className="admin-reviews__bulk-clear"
              onClick={() => setSelectedIds([])}
              aria-label="Clear selection"
              title="Clear selection"
            >
              <X size={17} />
            </button>
          </div>
        </div>
      )}

      <div className="admin-reviews__table-wrap">
        <table className="admin-reviews__table">
          <thead>
            <tr>
              <th className="admin-reviews__checkbox-cell">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  disabled={busy || filteredReviews.length === 0}
                  aria-label="Select all visible reviews"
                />
              </th>
              <th>Customer / Review</th>
              <th>Service</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredReviews.map((review) => (
              <tr key={review.id}>
                <td className="admin-reviews__checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(review.id)}
                    onChange={() => toggleSelection(review.id)}
                    aria-label={`Select review ${review.id}`}
                  />
                </td>

                <td>
                  <div className="admin-reviews__review-info">
                    <strong>{review.customer}</strong>
                    <span>{review.title}</span>
                    <small>
                      {review.source === "offline"
                        ? "Recorded by admin"
                        : "Website review"}{" "}
                      · {review.id}
                    </small>
                  </div>
                </td>

                <td>{review.service}</td>

                <td>
                  <RatingStars rating={review.rating} />
                </td>

                <td>{formatDate(review.date)}</td>

                <td>
                  <span
                    className={`admin-reviews__badge ${
                      review.published
                        ? "admin-reviews__badge--published"
                        : "admin-reviews__badge--hidden"
                    }`}
                  >
                    {review.published ? "Published" : "Hidden"}
                  </span>
                </td>

                <td>
                  <div className="admin-reviews__actions">
                    <button
                      type="button"
                      className="admin-reviews__action"
                      onClick={() => setSelectedReview(review)}
                      aria-label={`View review by ${review.customer}`}
                      title="View review"
                    >
                      <Eye size={17} />
                    </button>

                    <button
                      type="button"
                      className="admin-reviews__action"
                      disabled={busy}
                      onClick={() => togglePublished(review)}
                      aria-label={`${
                        review.published ? "Hide" : "Publish"
                      } review by ${review.customer}`}
                      title={
                        review.published ? "Hide review" : "Publish review"
                      }
                    >
                      {review.published ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>

                    <button
                      type="button"
                      className="admin-reviews__action admin-reviews__action--danger"
                      onClick={() => setDeleteTarget(review)}
                      aria-label={`Delete review by ${review.customer}`}
                      title="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && filteredReviews.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-reviews__empty">
                    <MessageSquareQuote size={26} />
                    <strong>No reviews found</strong>
                    <span>Try another search or filter combination.</span>
                    <button
                      type="button"
                      className="admin-reviews__text-button"
                      onClick={resetFilters}
                    >
                      Clear filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedReview && (
        <div
          className="admin-reviews__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReview(null);
            }
          }}
        >
          <section
            className="admin-reviews__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <header className="admin-reviews__modal-header">
              <div>
                <span>REVIEW DETAILS · {selectedReview.id}</span>
                <h2 id="review-modal-title">{selectedReview.title}</h2>
              </div>

              <button
                type="button"
                className="admin-reviews__action"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review details"
              >
                <X size={19} />
              </button>
            </header>

            <div className="admin-reviews__modal-rating">
              <RatingStars rating={selectedReview.rating} />
              <strong>{selectedReview.rating}.0 / 5</strong>
            </div>

            <dl className="admin-reviews__details">
              <div>
                <dt>Customer</dt>
                <dd>{selectedReview.customer}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{selectedReview.service}</dd>
              </div>
              <div>
                <dt>Review date</dt>
                <dd>{formatDate(selectedReview.date)}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>
                  <span
                    className={`admin-reviews__badge ${
                      selectedReview.published
                        ? "admin-reviews__badge--published"
                        : "admin-reviews__badge--hidden"
                    }`}
                  >
                    {selectedReview.published ? "Published" : "Hidden"}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="admin-reviews__message">
              <span>Customer feedback</span>
              <p>{selectedReview.message}</p>
            </div>

            <button
              type="button"
              className="admin-reviews__publish"
              disabled={busy}
              onClick={() => togglePublished(selectedReview)}
            >
              {selectedReview.published
                ? "Hide this review"
                : "Publish this review"}
            </button>

            <button
              type="button"
              className="admin-reviews__close"
              onClick={() => setSelectedReview(null)}
            >
              Close details
            </button>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="admin-reviews__backdrop admin-reviews__backdrop--confirm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            className="admin-reviews__confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-review-title"
            aria-describedby="delete-review-description"
          >
            <div className="admin-reviews__confirm-icon">
              <Trash2 size={22} />
            </div>

            <h2 id="delete-review-title">Delete review?</h2>

            <p id="delete-review-description">
              {Array.isArray(deleteTarget)
                ? `You are about to delete ${deleteTarget.length} selected review(s).`
                : `You are about to delete "${deleteTarget.title}" by ${deleteTarget.customer}.`}{" "}
              This permanently deletes the selected feedback.
            </p>

            <div className="admin-reviews__confirm-actions">
              <button
                type="button"
                className="admin-reviews__close"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-reviews__delete-confirm"
                disabled={busy}
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Confirm delete
              </button>
            </div>
          </section>
        </div>
      )}

      {formOpen && (
        <div
          className="admin-reviews__backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyRef.current)
              setFormOpen(false);
          }}
        >
          <section
            className="admin-reviews__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offline-review-title"
          >
            <header className="admin-reviews__modal-header">
              <div>
                <span>OFFLINE CUSTOMER FEEDBACK</span>
                <h2 id="offline-review-title">Record customer feedback</h2>
              </div>
              <button
                type="button"
                className="admin-reviews__action"
                disabled={busy}
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </header>
            <p>
              Record the customer's actual feedback with their permission. This
              will be labelled as recorded by admin.
            </p>
            <form onSubmit={saveOfflineReview}>
              <fieldset
                disabled={busy}
                style={{
                  border: 0,
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: "16px",
                  minWidth: 0,
                }}
              >
                <label>
                  Completed booking
                  <select
                    required
                    value={form.booking}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        booking: event.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%" }}
                  >
                    <option value="">Select a completed booking</option>
                    {eligibleBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.contact_name ||
                          booking.customer_name ||
                          booking.customer_email ||
                          "Customer"}{" "}
                        · {booking.service_name || "Session"} · {booking.id}
                      </option>
                    ))}
                  </select>
                </label>
                {!eligibleBookings.length && (
                  <p>No completed bookings without a review are available.</p>
                )}
                <label>
                  Rating
                  <select
                    value={form.rating}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        rating: event.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%" }}
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} / 5
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Review title
                  <input
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%" }}
                  />
                </label>
                <label>
                  Customer feedback
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    style={{ display: "block", width: "100%" }}
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        published: event.target.checked,
                      }))
                    }
                  />{" "}
                  Publish on the website
                </label>
                {formError && <p role="alert">{formError}</p>}
                <button
                  type="submit"
                  className="admin-reviews__publish"
                  disabled={busy || !eligibleBookings.length}
                >
                  {busy ? "Saving..." : "Save customer feedback"}
                </button>
                <button
                  type="button"
                  className="admin-reviews__close"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
              </fieldset>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
