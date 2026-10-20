
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


gsap.registerPlugin(ScrollTrigger);

const portfolioItems = [
  {
    id: 1,
    title: "The First Days",
    category: "NEWBORN",
    image:
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1400&q=85",
    alt: "Soft, intimate newborn-inspired portrait",
    layout: "portrait",
  },
  {
    id: 2,
    title: "A Mother’s Glow",
    category: "MATERNITY",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85",
    alt: "Warm editorial portrait with soft natural light",
    layout: "landscape",
  },
  {
    id: 3,
    title: "Little Wonders",
    category: "BABY",
    image:
      "https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1400&q=85",
    alt: "Tender family moment in a natural setting",
    layout: "portrait",
  },
  {
    id: 4,
    title: "Together, Always",
    category: "FAMILY",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=85",
    alt: "Family sharing a quiet moment together",
    layout: "landscape",
  },
  {
    id: 5,
    title: "A Beautiful Beginning",
    category: "MATERNITY",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85",
    alt: "Elegant portrait in a warm neutral palette",
    layout: "portrait",
  },
  {
    id: 6,
    title: "Made of Memories",
    category: "MILESTONES",
    image:
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1400&q=85",
    alt: "A joyful outdoor moment captured naturally",
    layout: "landscape",
  },
];

export default function PortfolioSection() {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const activeItem =
    activeIndex === null ? null : portfolioItems[activeIndex];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".portfolio-heading > *",
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".portfolio-heading",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".portfolio-card",
        { y: 38, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".portfolio-grid",
            start: "top 82%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
      } else if (event.key === "ArrowRight") {
        setActiveIndex((current) =>
          current === null
            ? null
            : (current + 1) % portfolioItems.length
        );
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((current) =>
          current === null
            ? null
            : (current - 1 + portfolioItems.length) %
              portfolioItems.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex]);

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current - 1 + portfolioItems.length) %
          portfolioItems.length
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current + 1) % portfolioItems.length
    );
  };

  return (
    <section
      className="portfolio-section"
      id="portfolio-preview"
      ref={sectionRef}
      aria-labelledby="portfolio-title"
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

        <div className="portfolio-grid">
          {portfolioItems.map((item, index) => (
            <button
              className={`portfolio-card portfolio-card--${item.layout}`}
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${item.title}, ${item.category}`}
            >
              <span className="portfolio-card__image-wrap">
                <img
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                  decoding="async"
                />

                <span className="portfolio-card__open" aria-hidden="true">
                  <ArrowUpRight size={20} />
                </span>
              </span>

              <span className="portfolio-card__meta">
                <span>
                  <span className="portfolio-card__category">
                    {item.category}
                  </span>
                  <span className="portfolio-card__title">
                    {item.title}
                  </span>
                </span>
                <span className="portfolio-card__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="portfolio-footer">
          <p>YOUR STORY DESERVES TO BE REMEMBERED.</p>
          <Link to="/portfolio" className="portfolio-footer__link">
            Explore the collection
            <ArrowUpRight size={17} />
          </Link>
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
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>

      {activeItem && (
        <div
          className="portfolio-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Portfolio image viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveIndex(null);
            }
          }}
        >
          <div className="portfolio-lightbox__top">
            <span>
              LITTLE CLICK STUDIO
              <span className="portfolio-lightbox__separator"> / </span>
              {activeItem.category}
            </span>

            <button
              className="portfolio-lightbox__close"
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Close image viewer"
              autoFocus
            >
              <X size={23} />
            </button>
          </div>

          <button
            className="portfolio-lightbox__nav portfolio-lightbox__nav--prev"
            type="button"
            onClick={showPrevious}
            aria-label="Previous image"
          >
            <ArrowLeft size={22} />
          </button>

          <figure className="portfolio-lightbox__figure">
            <img src={activeItem.image} alt={activeItem.alt} />
            <figcaption>
              <span>{activeItem.title}</span>
              <span>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(portfolioItems.length).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>

          <button
            className="portfolio-lightbox__nav portfolio-lightbox__nav--next"
            type="button"
            onClick={showNext}
            aria-label="Next image"
          >
            <ArrowRight size={22} />
          </button>

          <p className="portfolio-lightbox__hint">
            USE ← → TO EXPLORE · ESC TO CLOSE
          </p>
        </div>
      )}
    </section>
  );
}
