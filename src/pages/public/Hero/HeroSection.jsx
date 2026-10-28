import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=2400&q=85";

export default function HeroSection() {
  const heroRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const image = imageRef.current;
    const content = contentRef.current;

    if (!hero || !image || !content) return undefined;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      gsap.set(content.children, { clearProps: "all" });
      return undefined;
    }

    const context = gsap.context(() => {
      const intro = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      intro
        .fromTo(
          ".hero-section__eyebrow",
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.8 },
        )
        .fromTo(
          ".hero-section__title-line",
          { yPercent: 110, rotate: 2, autoAlpha: 0 },
          {
            yPercent: 0,
            rotate: 0,
            autoAlpha: 1,
            duration: 1.1,
            stagger: 0.13,
          },
          "-=0.42",
        )
        .fromTo(
          ".hero-section__description, .hero-section__actions",
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12 },
          "-=0.5",
        )
        .fromTo(
          ".hero-section__note",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.7 },
          "-=0.25",
        );

      gsap.to(image, {
        yPercent: 13,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(".hero-section__visual-glow", {
        yPercent: -16,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });
    }, hero);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <section
      className="hero-section"
      ref={heroRef}
      aria-labelledby="hero-title"
    >
      <div className="hero-section__media" aria-hidden="true">
        <img
          ref={imageRef}
          className="hero-section__image"
          src={HERO_IMAGE}
          alt=""
          fetchPriority="high"
          decoding="async"
        />

        {/* UPDATED: Video ready hone par hi show hoga.
    Video missing/failed ho toh background image visible rahegi. */}
        <video
          className="hero-section__video"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={HERO_IMAGE}
          onCanPlay={(event) => {
            event.currentTarget.classList.add("is-ready");
          }}
        >
          <source src="/media/little-click-hero.mp4" type="video/mp4" />
        </video>

        <div className="hero-section__shade" />
        <div className="hero-section__visual-glow" />
        <div className="hero-section__grain" />
      </div>

      <div className="hero-section__inner">
        <div className="hero-section__content" ref={contentRef}>
          <p className="hero-section__eyebrow">
            BABY · MATERNITY · NEWBORN PHOTOGRAPHY
          </p>

          <h1 className="hero-section__title" id="hero-title">
            <span className="hero-section__title-line">Little moments.</span>
            <span className="hero-section__title-line hero-section__title-line--italic">
              Forever yours.
            </span>
          </h1>

          <p className="hero-section__description">
            The smallest details become the memories we hold closest. Let us
            preserve your family’s story with warmth, care and intention.
          </p>

          <div className="hero-section__actions">
            <Link className="hero-section__primary" to="/booking">
              <span>Plan your session</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>

            <Link className="hero-section__secondary" to="/portfolio">
              Explore our work
            </Link>
          </div>
        </div>

        <div className="hero-section__bottom">
          <p className="hero-section__note">
            A little piece of forever,
            <br />
            made just for you.
          </p>

          <Link className="hero-section__scroll" to="/about">
  <span>Discover our studio</span>
  <span className="hero-section__scroll-icon">
    <ArrowDown size={16} aria-hidden="true" />
  </span>
</Link>

          <p className="hero-section__location">
            SOUTH BOPAL
            <span>AHMEDABAD, INDIA</span>
          </p>
        </div>
      </div>
    </section>
  );
}
