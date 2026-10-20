
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";


gsap.registerPlugin(ScrollTrigger);

const STORY_IMAGES = {
  portrait:
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1100&q=85",
  detail:
    "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=85",
};

export default function AboutSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(".about-story__eyebrow, .about-story__title, .about-story__copy, .about-story__action", {
        y: 28,
        autoAlpha: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".about-story__content",
          start: "top 78%",
          once: true,
        },
      });

      gsap.from(".about-story__image--main", {
        clipPath: "inset(12% 12% 12% 12%)",
        scale: 1.08,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".about-story__visual",
          start: "top 78%",
          once: true,
        },
      });

      gsap.to(".about-story__image--main img", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: ".about-story__visual",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="about-story"
      id="our-story"
      ref={sectionRef}
      aria-labelledby="about-story-title"
    >
      <div className="about-story__inner">
        <div className="about-story__visual">
          <figure className="about-story__image about-story__image--main">
            <img
              src={STORY_IMAGES.portrait}
              alt="A family sharing a quiet, affectionate moment"
              loading="lazy"
              decoding="async"
            />
          </figure>

          <figure className="about-story__image about-story__image--detail">
            <img
              src={STORY_IMAGES.detail}
              alt="A delicate detail captured in soft natural light"
              loading="lazy"
              decoding="async"
            />
          </figure>

          <div className="about-story__stamp" aria-hidden="true">
            <span>MADE WITH</span>
            <span className="about-story__stamp-heart">♥</span>
            <span>LOVE & CARE</span>
          </div>

          <span className="about-story__image-caption">
            THE BEAUTY OF BEING HERE
          </span>
        </div>

        <div className="about-story__content">
          <p className="about-story__eyebrow">
            THE ART OF REMEMBERING
          </p>

          <h2
            className="about-story__title display-heading"
            id="about-story-title"
          >
            Every little chapter
            <br />
            <em>deserves to be remembered.</em>
          </h2>

          <p className="about-story__copy">
            Some moments arrive quietly. Tiny fingers wrapped around yours.
            The anticipation of a new beginning. The first days that seem to
            pass in a heartbeat.
          </p>

          <p className="about-story__copy about-story__copy--secondary">
            At Little Click Studio, we turn these fleeting chapters into
            photographs your family can return to for years to come.
            Thoughtfully created, naturally beautiful and always personal.
          </p>

          <Link
            className="about-story__action"
            to="/about"
          >
            <span>Get to know our studio</span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
