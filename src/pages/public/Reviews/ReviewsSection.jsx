import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { getPublicReviews } from "../../../services/publicReviewsService";
import "./ReviewsSection.scss";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReviews() {
      try {
        const data = await getPublicReviews({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setReviews(data.results);
          setLoading(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load reviews.",
          );
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => controller.abort();
  }, [retry]);

  function handleRetry() {
    setLoading(true);
    setError("");
    setRetry((value) => value + 1);
  }

  return (
    <section
      className="reviews-section"
      aria-labelledby="public-reviews-title"
      aria-busy={loading}
    >
      <div className="reviews-section__inner">
        <header className="reviews-section__heading">
          <p className="eyebrow">WORDS FROM OUR FAMILIES</p>

          <h2 className="display-heading" id="public-reviews-title">
            Little moments.
            <br />
            <em>Lovely memories.</em>
          </h2>

          <p>Experiences shared by the families we photograph.</p>
        </header>

        {loading && <p role="status">Loading reviews…</p>}

        {!loading && error && (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <p>Customer reviews will appear here soon.</p>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="reviews-section__grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div
                  className="review-card__rating"
                  role="img"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={18}
                      fill={
                        index < review.rating
                          ? "currentColor"
                          : "none"
                      }
                      aria-hidden="true"
                    />
                  ))}
                </div>

                <h3 className="review-card__title">
                  {review.title}
                </h3>

                <blockquote className="review-card__message">
                  {review.message}
                </blockquote>

                <footer className="review-card__footer">
                  <p className="review-card__customer">
                    {review.customer}
                  </p>

                  <p className="review-card__service">
                    {review.service}
                  </p>

                  {review.source === "offline" && (
                    <p className="review-card__source">
                      Customer feedback recorded by the studio
                    </p>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}