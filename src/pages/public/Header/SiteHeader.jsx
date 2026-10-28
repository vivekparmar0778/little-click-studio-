import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, UserRound, X } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const { user, loading, isAuthenticated } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(
    () => window.scrollY > 32,
  );

  const signedIn = isAuthenticated && Boolean(user);
  const isAdmin =
    user?.is_staff === true || user?.is_superuser === true;

  const dashboardPath = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin dashboard" : "My dashboard";

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName =
    fullName || user?.name || user?.email || "Your account";

  const initials = (fullName || user?.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 32);
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function renderAccountLink() {
    return (
      <Link
        className="studio-account"
        to={dashboardPath}
        onClick={closeMenu}
        aria-label={`${dashboardLabel} — ${displayName}`}
        title={`${displayName} · ${dashboardLabel}`}
      >
        {initials || <UserRound size={20} aria-hidden="true" />}
      </Link>
    );
  }

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

          <nav className="studio-nav" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `studio-nav__link ${isActive ? "active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="studio-header-actions">
            {!loading && !signedIn && (
              <>
                <Link className="studio-auth-login" to="/login">
                  Login
                </Link>

                <Link className="studio-auth-register" to="/register">
                  Register
                </Link>
              </>
            )}

            <Link className="studio-header-cta" to="/booking">
              <span>Book a session</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>

            {!loading && signedIn && renderAccountLink()}
          </div>

          <div className="studio-mobile-account">
            {!loading && signedIn && renderAccountLink()}
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
              <X size={23} aria-hidden="true" />
            ) : (
              <Menu size={23} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <div
        className={`studio-mobile-menu ${menuOpen ? "is-open" : ""}`}
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
                `studio-mobile-menu__link ${isActive ? "active" : ""}`
              }
            >
              <span>{link.label}</span>
              <ArrowUpRight size={19} aria-hidden="true" />
            </NavLink>
          ))}

          {!loading && (
            <div className="studio-mobile-auth">
              {signedIn ? (
                <Link
                  className="studio-mobile-auth__register"
                  to={dashboardPath}
                  onClick={closeMenu}
                >
                  {dashboardLabel}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

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