
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(
    () => window.scrollY > 32
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 32);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`site-header site-header--luxury ${
          isScrolled
            ? "site-header--scrolled"
            : "site-header--hidden"
        }`}
      >
        <div className="site-header__inner">
          <Link
            className="studio-brand"
            to="/"
            aria-label="Little Click Studio home"
            onClick={closeMenu}
          >
            <span className="studio-brand__name">Little Click</span>
            <span className="studio-brand__subtitle">
              STUDIO · SOUTH BOPAL
            </span>
          </Link>

          <nav
            className="studio-nav"
            aria-label="Main navigation"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `studio-nav__link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="studio-header-actions">
            <Link
              className="studio-auth-login"
              to="/login"
            >
              Login
            </Link>

            <Link
              className="studio-auth-register"
              to="/register"
            >
              Register
            </Link>

            <Link
              className="studio-header-cta"
              to="/booking"
            >
              <span>Book a session</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            className="studio-menu-toggle"
            aria-label={
              menuOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-studio-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>
      </header>

      <div
        className={`studio-mobile-menu ${
          menuOpen ? "is-open" : ""
        }`}
        id="mobile-studio-navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav aria-label="Mobile navigation">
          {links.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={{ "--menu-index": index }}
              onClick={closeMenu}
              className={({ isActive }) =>
                `studio-mobile-menu__link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span>{link.label}</span>
              <ArrowUpRight size={19} aria-hidden="true" />
            </NavLink>
          ))}

          <div className="studio-mobile-auth">
            <Link
              className="studio-mobile-auth__login"
              to="/login"
              onClick={closeMenu}
            >
              Login to your account
            </Link>

            <Link
              className="studio-mobile-auth__register"
              to="/register"
              onClick={closeMenu}
            >
              Create an account
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <Link
            className="studio-mobile-menu__cta"
            to="/booking"
            onClick={closeMenu}
          >
            Plan your session
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </nav>

        <p className="studio-mobile-menu__caption">
          One click, one moment, a lifetime of love.
        </p>
      </div>
    </>
  );
}
