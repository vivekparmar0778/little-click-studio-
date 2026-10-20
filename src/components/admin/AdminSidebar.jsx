import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import adminNavigation from "./adminNavigation";


export default function AdminSidebar({
  open = false,
  onNavigate,
}) {
  const handleNavigate = () => {
    onNavigate?.();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          className="admin-sidebar__backdrop"
          aria-label="Close admin navigation"
          onClick={handleNavigate}
        />
      )}

      <aside
        id="admin-sidebar"
        className={[
          "admin-sidebar",
          open && "admin-sidebar--open",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Admin sidebar"
      >
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__brand-mark">
            LC
          </span>

          <div className="admin-sidebar__brand-copy">
            <span className="admin-sidebar__brand-name">
              Little Click
            </span>

            <span className="admin-sidebar__brand-subtitle">
              STUDIO · ADMIN
            </span>
          </div>
        </div>

        <div className="admin-sidebar__content">
          <p className="admin-sidebar__section-label">
            WORKSPACE
          </p>

          <nav
            className="admin-sidebar__nav"
            aria-label="Admin navigation"
          >
            {adminNavigation.map(
              ({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    [
                      "admin-sidebar__link",
                      isActive && "admin-sidebar__link--active",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <Icon
                    className="admin-sidebar__icon"
                    size={18}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <span>{label}</span>
                </NavLink>
              ),
            )}
          </nav>
        </div>

        <footer className="admin-sidebar__footer">
          <p className="admin-sidebar__footer-title">
            LITTLE MOMENTS, FOREVER
          </p>

          <p className="admin-sidebar__footer-copy">
            Every little moment deserves to be remembered.
          </p>

          <Link
            to="/"
            className="admin-sidebar__website-link"
            onClick={handleNavigate}
          >
            <span>Visit website</span>

            <ArrowUpRight
              size={16}
              aria-hidden="true"
            />
          </Link>
        </footer>
      </aside>
    </>
  );
}