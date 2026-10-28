import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { getPublicServices } from "../../../services/publicServicesService";

gsap.registerPlugin(ScrollTrigger);

export default function ServicesSection() {
  const sectionRef = useRef(null);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

 useEffect(() => {
  const controller = new AbortController();

  async function loadServices() {
    try {
      const data = await getPublicServices({
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setServices(data);
        setLoading(false);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load services. Please try again.",
        );
        setLoading(false);
      }
    }
  }

  loadServices();

  return () => controller.abort();
}, [retry]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || loading || error || services.length === 0) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(".experiences-section__heading > *", {
        y: 24,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".experiences-section__heading",
          start: "top 82%",
          once: true,
        },
      });

      gsap.from(".experience-card", {
        y: 42,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.16,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".experiences-section__grid",
          start: "top 82%",
          once: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [loading, error, services]);
function handleRetry() {
  setLoading(true);
  setError("");
  setRetry((value) => value + 1);
}
  return (
    <section
      className="experiences-section"
      ref={sectionRef}
      aria-labelledby="experiences-title"
      aria-busy={loading}
    >
      <div className="experiences-section__inner">
        <header className="experiences-section__heading">
          <p className="eyebrow">THOUGHTFULLY CAPTURED</p>

          <div className="experiences-section__title-row">
            <h2 className="display-heading" id="experiences-title">
              Moments worth
              <br />
              <em>holding onto.</em>
            </h2>

            <p className="experiences-section__intro">
              Every family has a story unfolding. We create a relaxed,
              thoughtful space to preserve the moments that matter to yours.
            </p>
          </div>
        </header>

        {loading && <p role="status">Loading services…</p>}

        {!loading && error && (
          <div role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="experience-card__link"
              onClick={handleRetry}
            >
              Try again
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <p>No photography services are currently available.</p>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="experiences-section__grid">
            {services.map((service, index) => (
              <article className="experience-card" key={service.id}>
                <Link
                  className="experience-card__image-link"
                  to="/booking"
                  aria-label={`Enquire about ${service.name}`}
                >
                  <div className="experience-card__image">
                    {service.image && (
                      <img
                        src={service.image}
                        alt={service.name}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => ScrollTrigger.refresh()}
                      />
                    )}

                    <span className="experience-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="experience-card__arrow">
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </span>
                  </div>
                </Link>

                <div className="experience-card__body">
                  {service.category && (
                    <p className="experience-card__subtitle">
                      {service.category}
                    </p>
                  )}

                  <h3>{service.name}</h3>

                  <p className="experience-card__description">
                    {service.description}
                  </p>

                  <Link className="experience-card__link" to="/booking">
                    Plan your session
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}