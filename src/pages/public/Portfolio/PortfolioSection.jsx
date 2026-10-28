import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  X,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { getPublicPortfolio } from "../../../services/publicPortfolioService";

gsap.registerPlugin(ScrollTrigger);

export default function PortfolioSection() {
  const sectionRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const loadMoreBusyRef = useRef(false);
  const loadMoreControllerRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");

  const activeItem =
    activeIndex === null ? null : items[activeIndex];

  const isOpen = Boolean(activeItem);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPortfolio() {
      try {
        const data = await getPublicPortfolio({
          page: 1,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setItems(data.results);
          setNextPage(data.next ? 2 : null);
          setLoading(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load portfolio. Please try again.",
          );
          setLoading(false);
        }
      }
    }

    loadPortfolio();

    return () => {
      controller.abort();
      loadMoreControllerRef.current?.abort();
    };
  }, [retry]);

  // Animate the heading once the initial request succeeds.
  useEffect(() => {
    const section = sectionRef.current;

    if (!section || loading || error) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(".portfolio-heading > *", {
        y: 28,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".portfolio-heading",
          start: "top 85%",
          once: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [loading, error]);

  // Animate each card separately, including newly loaded cards.
  useEffect(() => {
    const section = sectionRef.current;

    if (!section || loading || error || items.length === 0) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".portfolio-card").forEach((card) => {
        gsap.from(card, {
          y: 38,
          autoAlpha: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 92%",
            once: true,
          },
        });
      });

      ScrollTrigger.refresh();
    }, section);

    return () => ctx.revert();
  }, [loading, error, items]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null ? null : (current + 1) % items.length,
        );
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null
            ? null
            : (current - 1 + items.length) % items.length,
        );
        return;
      }

      if (event.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll(
          "button:not([disabled])",
        );

        if (!buttons?.length) {
          event.preventDefault();
          return;
        }

        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        const focused = document.activeElement;

        if (
          event.shiftKey &&
          (focused === first || focused === dialogRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (focused === last || focused === dialogRef.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen, items.length]);

  function handleRetry() {
    setLoading(true);
    setError("");
    setLoadMoreError("");
    setRetry((value) => value + 1);
  }

  async function handleLoadMore() {
    if (!nextPage || loadMoreBusyRef.current) return;

    loadMoreBusyRef.current = true;
    setLoadingMore(true);
    setLoadMoreError("");

    const controller = new AbortController();
    loadMoreControllerRef.current = controller;

    try {
      const data = await getPublicPortfolio({
        page: nextPage,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setItems((current) => {
        const ids = new Set(current.map((item) => item.id));

        const additions = data.results.filter((item) => {
          if (ids.has(item.id)) return false;
          ids.add(item.id);
          return true;
        });

        return [...current, ...additions];
      });

      setNextPage(data.next ? nextPage + 1 : null);
    } catch (error) {
      if (!controller.signal.aborted) {
        setLoadMoreError(
          error instanceof Error
            ? error.message
            : "Unable to load more photos.",
        );
      }
    } finally {
      loadMoreBusyRef.current = false;

      if (!controller.signal.aborted) {
        setLoadingMore(false);
      }
    }
  }

  function openPhoto(index, event) {
    triggerRef.current = event.currentTarget;
    setActiveIndex(index);
  }

  function showPrevious() {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current - 1 + items.length) % items.length,
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % items.length,
    );
  }

  return (
    <section
      className="portfolio-section"
      id="portfolio-preview"
      ref={sectionRef}
      aria-labelledby="portfolio-title"
      aria-busy={loading || loadingMore}
    >
      <div className="portfolio-section__inner">
        <header className="portfolio-heading">
          <p className="portfolio-heading__eyebrow">
            A COLLECTION OF LITTLE MOMENTS
          </p>

          <div className="portfolio-heading__main">
            <h2 id="portfolio-title">
              The art of
              <br />
              <em>remembering.</em>
            </h2>

            <div className="portfolio-heading__aside">
              <span className="portfolio-heading__line" />
              <p>
                Honest emotions. Gentle light.
                <br />
                Memories that feel like yesterday.
              </p>
            </div>
          </div>

          <p className="portfolio-heading__intro">
            Every chapter has its own magic. Explore a collection
            inspired by the fleeting moments we wish could last forever.
          </p>
        </header>

        {loading && <p role="status">Loading portfolio…</p>}

        {!loading && error && (
          <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p>Our portfolio collection will be available soon.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="portfolio-grid">
            {items.map((item, index) => {
              const layout =
                item.width > item.height ? "landscape" : "portrait";

              return (
                <button
                  className={`portfolio-card portfolio-card--${layout}`}
                  key={item.id}
                  type="button"
                  onClick={(event) => openPhoto(index, event)}
                  aria-label={`View ${item.title}`}
                >
                  <span className="portfolio-card__image-wrap">
                    <img
                      src={item.image}
                      alt={item.alt_text || item.title}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => ScrollTrigger.refresh()}
                    />

                    <span
                      className="portfolio-card__open"
                      aria-hidden="true"
                    >
                      <ArrowUpRight size={20} />
                    </span>
                  </span>

                  <span className="portfolio-card__meta">
                    <span>
                      <span className="portfolio-card__title">
                        {item.title}
                      </span>
                    </span>

                    <span className="portfolio-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="portfolio-footer">
          <p>YOUR STORY DESERVES TO BE REMEMBERED.</p>

          {!loading && !error && nextPage && (
            <div className="portfolio-load-more">
              {loadMoreError && (
                <p role="alert">{loadMoreError}</p>
              )}

              <button
                type="button"
                className="portfolio-cta__button"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore
                  ? "Loading…"
                  : loadMoreError
                    ? "Try again"
                    : "Load more photographs"}
              </button>
            </div>
          )}
        </div>

        <div className="portfolio-cta">
          <div>
            <span className="portfolio-cta__eyebrow">
              LET’S CREATE SOMETHING TIMELESS
            </span>
            <h3>Your memories, beautifully told.</h3>
          </div>

          <Link to="/booking" className="portfolio-cta__button">
            Plan your session
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {activeItem && (
        <div
          className="portfolio-lightbox"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio image viewer"
          tabIndex={-1}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveIndex(null);
            }
          }}
        >
          <div className="portfolio-lightbox__top">
            <span>LITTLE CLICK STUDIO</span>

            <button
              className="portfolio-lightbox__close"
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close image viewer"
            >
              <X size={23} aria-hidden="true" />
            </button>
          </div>

          {items.length > 1 && (
            <button
              className="portfolio-lightbox__nav portfolio-lightbox__nav--prev"
              type="button"
              onClick={showPrevious}
              aria-label="Previous image"
            >
              <ArrowLeft size={22} aria-hidden="true" />
            </button>
          )}

          <figure className="portfolio-lightbox__figure">
            <img
              src={activeItem.image}
              alt={activeItem.alt_text || activeItem.title}
            />

            <figcaption aria-live="polite">
              <span>{activeItem.title}</span>
              <span>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(items.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>

          {items.length > 1 && (
            <button
              className="portfolio-lightbox__nav portfolio-lightbox__nav--next"
              type="button"
              onClick={showNext}
              aria-label="Next image"
            >
              <ArrowRight size={22} aria-hidden="true" />
            </button>
          )}

          <p className="portfolio-lightbox__hint">
            {items.length > 1
              ? "USE ← → TO EXPLORE · ESC TO CLOSE"
              : "ESC TO CLOSE"}
          </p>
        </div>
      )}
    </section>
  );
}