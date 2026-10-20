import { useEffect, useMemo, useState } from "react";
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

const initialReviews = [
  {
    id: "REV-001",
    customer: "Priya Mehta",
    service: "Maternity Portraits",
    rating: 5,
    date: "2026-10-15",
    title: "An unforgettable experience",
    message:
      "The entire experience was beautiful. The team made us feel comfortable, and the photographs captured moments we will treasure forever.",
    published: true,
  },
  {
    id: "REV-002",
    customer: "Aarav Sharma",
    service: "Newborn Photography",
    rating: 5,
    date: "2026-10-12",
    title: "So gentle and professional",
    message:
      "We loved the patience and care during our newborn session. The photographs turned out lovely, and the studio felt warm and welcoming.",
    published: true,
  },
  {
    id: "REV-003",
    customer: "Riya Patel",
    service: "Baby Milestone Session",
    rating: 4,
    date: "2026-10-10",
    title: "Lovely memories",
    message:
      "A lovely session with beautiful photographs. We appreciated the attention to detail and the friendly team.",
    published: false,
  },
  {
    id: "REV-004",
    customer: "Neha Desai",
    service: "Family Portrait Session",
    rating: 3,
    date: "2026-10-08",
    title: "A good experience",
    message:
      "The photographs were nice, and the team was helpful throughout the session.",
    published: true,
  },
];

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

const escapeCSV = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

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

export default function AdminReviews() {
  const [reviews, setReviews] = useState(initialReviews);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notice, setNotice] = useState("");

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = reviews.filter((review) => {
      const matchesSearch = [
        review.id,
        review.customer,
        review.service,
        review.title,
        review.message,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesRating =
        ratingFilter === "all" ||
        review.rating === Number(ratingFilter);

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "published" && review.published) ||
        (visibilityFilter === "hidden" && !review.published);

      return matchesSearch && matchesRating && matchesVisibility;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.date.localeCompare(b.date);
        case "highest":
          return b.rating - a.rating || b.date.localeCompare(a.date);
        case "lowest":
          return a.rating - b.rating || b.date.localeCompare(a.date);
        case "customer":
          return a.customer.localeCompare(b.customer);
        case "newest":
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [reviews, search, ratingFilter, visibilityFilter, sortBy]);

  const publishedCount = reviews.filter(
    (review) => review.published,
  ).length;

  const hiddenCount = reviews.length - publishedCount;

  const averageRating = reviews.length
    ? (
        reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      ).toFixed(1)
    : "0.0";

  const visibleIds = filteredReviews.map((review) => review.id);

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedReview(null);
        setDeleteTarget(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const togglePublished = (review) => {
    const nextPublished = !review.published;

    setReviews((current) =>
      current.map((item) =>
        item.id === review.id
          ? { ...item, published: nextPublished }
          : item,
      ),
    );

    setSelectedReview((current) =>
      current?.id === review.id
        ? { ...current, published: nextPublished }
        : current,
    );

    setNotice(
      `"${review.title}" ${
        nextPublished ? "published" : "hidden"
      } in this demo.`,
    );
  };

  const toggleSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  };

  const updateSelectedReviews = (published) => {
    if (selectedIds.length === 0) return;

    const selectedIdSet = new Set(selectedIds);

    setReviews((current) =>
      current.map((review) =>
        selectedIdSet.has(review.id)
          ? { ...review, published }
          : review,
      ),
    );

    setSelectedReview((current) =>
      current && selectedIdSet.has(current.id)
        ? { ...current, published }
        : current,
    );

    setNotice(
      `${selectedIds.length} selected review(s) ${
        published ? "published" : "hidden"
      } in this demo.`,
    );

    setSelectedIds([]);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const idsToDelete = Array.isArray(deleteTarget)
      ? deleteTarget
      : [deleteTarget.id];

    const idsSet = new Set(idsToDelete);

    setReviews((current) =>
      current.filter((review) => !idsSet.has(review.id)),
    );

    setSelectedIds((current) =>
      current.filter((id) => !idsSet.has(id)),
    );

    setSelectedReview((current) =>
      current && idsSet.has(current.id) ? null : current,
    );

    setNotice(
      `${idsToDelete.length} review(s) deleted from this demo.`,
    );

    setDeleteTarget(null);
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
          <span className="admin-reviews__eyebrow">
            CUSTOMER FEEDBACK
          </span>
          <h1>Reviews Management</h1>
          <p>
            Review customer feedback and manage published testimonials.
          </p>
        </div>

        <div className="admin-reviews__header-actions">
          <button
            type="button"
            className="admin-reviews__export"
            onClick={exportCSV}
            disabled={filteredReviews.length === 0}
          >
            <Download size={17} />
            <span>Export CSV</span>
          </button>

          <div
            className="admin-reviews__header-icon"
            aria-hidden="true"
          >
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
            onChange={(event) =>
              setVisibilityFilter(event.target.value)
            }
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
              onClick={() => updateSelectedReviews(true)}
            >
              <Eye size={16} />
              Publish
            </button>

            <button
              type="button"
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
                  disabled={filteredReviews.length === 0}
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
                    <small>{review.id}</small>
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
                      onClick={() => togglePublished(review)}
                      aria-label={`${
                        review.published ? "Hide" : "Publish"
                      } review by ${review.customer}`}
                      title={
                        review.published
                          ? "Hide review"
                          : "Publish review"
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

            {filteredReviews.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-reviews__empty">
                    <MessageSquareQuote size={26} />
                    <strong>No reviews found</strong>
                    <span>
                      Try another search or filter combination.
                    </span>
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
                <h2 id="review-modal-title">
                  {selectedReview.title}
                </h2>
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
              This action cannot be undone in this demo.
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
                onClick={confirmDelete}
              >
                <Trash2 size={16} />
                Confirm delete
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}