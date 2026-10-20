
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    number: "01",
    title: "Newborn",
    subtitle: "THE FIRST LITTLE DAYS",
    description:
      "Preserve those delicate first days with gentle, baby-led photography and timeless portraits.",
    image:
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1000&q=85",
    alt: "Soft, delicate detail for a newborn photography session",
  },
  {
    number: "02",
    title: "Maternity",
    subtitle: "BEFORE YOUR WORLD CHANGES",
    description:
      "Celebrate the anticipation, connection and quiet beauty of the journey into parenthood.",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=85",
    alt: "Family connection captured in a natural, warm setting",
  },
  {
    number: "03",
    title: "Baby & Milestones",
    subtitle: "EVERY LITTLE FIRST",
    description:
      "From curious expressions to first birthdays, remember the personality in every new chapter.",
    image:
      "https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=1000&q=85",
    alt: "A tender family moment worth remembering",
  },
];

export default function ServicesSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
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
  }, []);

  return (
    <section
      className="experiences-section"
      ref={sectionRef}
      aria-labelledby="experiences-title"
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

        <div className="experiences-section__grid">
          {experiences.map((experience) => (
            <article
              className="experience-card"
              key={experience.number}
            >
              <Link
                className="experience-card__image-link"
                to="/booking"
                aria-label={`Enquire about ${experience.title} photography`}
              >
                <div className="experience-card__image">
                  <img
                    src={experience.image}
                    alt={experience.alt}
                    loading="lazy"
                    decoding="async"
                  />

                  <span className="experience-card__number">
                    {experience.number}
                  </span>

                  <span className="experience-card__arrow">
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </span>
                </div>
              </Link>

              <div className="experience-card__body">
                <p className="experience-card__subtitle">
                  {experience.subtitle}
                </p>

                <h3>{experience.title}</h3>

                <p className="experience-card__description">
                  {experience.description}
                </p>

                <Link
                  className="experience-card__link"
                  to="/booking"
                >
                  Plan your session
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
