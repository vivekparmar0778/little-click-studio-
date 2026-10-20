import { Link, NavLink, Outlet, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard/AdminDashboard";
import AdminBookings from "./pages/admin/Bookings/AdminBookings";
import AdminCustomers from "./pages/admin/Customers/AdminCustomers";
import AdminServices from "./pages/admin/Services/AdminServices";
import AdminGallery from "./pages/admin/Gallery/AdminGallery";
import AdminInquiries from "./pages/admin/Inquiries/AdminInquiries";
import AdminReviews from "./pages/admin/Reviews/AdminReviews";
import AdminSettings from "./pages/admin/Settings/AdminSettings";

import Overview from "./pages/user/Dashboard/Overview";
import Bookings from "./pages/user/Bookings/Bookings";
import Gallery from "./pages/user/Gallery/Gallery";
import Payments from "./pages/user/Payments/Payments";
import Profile from "./pages/user/Profile/Profile";

const publicLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "Our Story" },
  { to: "/services", label: "Experiences" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/contact", label: "Contact" },
];

const customerLinks = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/bookings", label: "My bookings" },
  { to: "/dashboard/gallery", label: "Private gallery" },
  { to: "/dashboard/payments", label: "Payments" },
  { to: "/dashboard/profile", label: "My profile" },
];

function NavigationLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? "active" : undefined)}
    >
      {children}
    </NavLink>
  );
}

function PublicLayout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" to="/" aria-label="Little Click Studio home">
            <span className="brand__name">Little Click Studio</span>
            <span className="brand__location">SOUTH BOPAL · AHMEDABAD</span>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            {publicLinks.map((item) => (
              <NavigationLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavigationLink>
            ))}
            <Link className="button" to="/booking">
              Enquire now <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="page-footer">
        <div className="container page-footer__inner">
          <Link className="brand" to="/">
            <span className="brand__name">Little Click Studio</span>
            <span className="brand__location">SOUTH BOPAL · AHMEDABAD</span>
          </Link>
          <p>One click, one moment, a lifetime of love.</p>
          <span>© {new Date().getFullYear()} Little Click Studio</span>
        </div>
      </footer>
    </div>
  );
}

function AuthLayout() {
  return (
    <main className="auth-layout">
      <div className="auth-layout__content">
        <Link className="auth-layout__back" to="/">
          ← Back to the studio
        </Link>
        <div className="auth-layout__panel">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

function DashboardLayout({ type = "customer", links = customerLinks }) {
  const isAdmin = type === "admin";

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <Link className="brand" to={isAdmin ? "/admin" : "/dashboard"}>
          <span className="brand__name">Little Click Studio</span>
          <span className="brand__location">
            {isAdmin ? "STUDIO MANAGEMENT" : "YOUR LITTLE MOMENTS"}
          </span>
        </Link>

        <Link className="text-link" to="/">
          Visit public website ↗
        </Link>
      </header>

      <div className="dashboard-body">
        <aside
          className="dashboard-sidebar"
          aria-label={isAdmin ? "Admin navigation" : "Customer navigation"}
        >
          {links.map((item) => (
            <NavigationLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavigationLink>
          ))}

          <NavigationLink to="/login">Sign in page</NavigationLink>
        </aside>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, description, children }) {
  return (
    <main className="container page-intro">
      <div className="page-intro__content">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-heading">{title}</h1>
        <p className="page-intro__description">{description}</p>
        {children && <div className="page-intro__actions">{children}</div>}
      </div>
    </main>
  );
}

function HomePage() {
  return (
    <PageIntro
      eyebrow="SOUTH BOPAL · AHMEDABAD"
      title={
        <>
          Little moments.
          <br />
          Forever yours.
        </>
      }
      description="A thoughtful photography experience for the moments that make your family, your family. Baby, maternity and newborn photography, captured with care."
    >
      <Link className="button" to="/portfolio">
        Explore our work ↗
      </Link>
      <Link className="button button--outline" to="/booking">
        Plan your session
      </Link>
    </PageIntro>
  );
}

function PublicPage({ eyebrow, title, description }) {
  return (
    <PageIntro eyebrow={eyebrow} title={title} description={description} />
  );
}

function LoginPage() {
  return (
    <>
      <p className="eyebrow">WELCOME BACK</p>
      <h1 className="display-heading">Your memories await.</h1>
      <p className="muted-copy">
        The customer sign-in form and secure authentication will be added in a
        later milestone.
      </p>
      <Link className="text-link" to="/register">
        New to our studio? Create an account ↗
      </Link>
    </>
  );
}

function RegisterPage() {
  return (
    <>
      <p className="eyebrow">JOIN OUR STUDIO</p>
      <h1 className="display-heading">Begin your story.</h1>
      <p className="muted-copy">
        Customer registration and form validation will be implemented in the
        authentication milestone.
      </p>
      <Link className="text-link" to="/login">
        Already have an account? Sign in ↗
      </Link>
    </>
  );
}

function DashboardPage({ title, description }) {
  return (
    <>
      <p className="eyebrow">LITTLE CLICK STUDIO</p>
      <h1>{title}</h1>
      <p className="muted-copy">{description}</p>
      <section className="placeholder-panel">
        <h2>Coming in the next milestone</h2>
        <p className="muted-copy">
          This area will be connected to real data when the page and API are
          implemented. No bookings or customer records are being loaded yet.
        </p>
      </section>
    </>
  );
}

function NotFoundPage() {
  return (
    <PageIntro
      eyebrow="404 · PAGE NOT FOUND"
      title="A little detour."
      description="We couldn't find the page you were looking for."
    >
      <Link className="button" to="/">
        Return home ↗
      </Link>
    </PageIntro>
  );
}

function PublicRoutes() {
  return (
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route
        path="about"
        element={
          <PublicPage
            eyebrow="OUR STORY"
            title="Made of little moments."
            description="Discover the people, care and craft behind our photography experience."
          />
        }
      />
      <Route
        path="services"
        element={
          <PublicPage
            eyebrow="PHOTOGRAPHY EXPERIENCES"
            title="For every chapter."
            description="Explore baby, maternity and newborn photography experiences designed around your family."
          />
        }
      />
      <Route
        path="portfolio"
        element={
          <PublicPage
            eyebrow="SELECTED MOMENTS"
            title="Stories in every frame."
            description="A curated portfolio of the moments we are honoured to preserve."
          />
        }
      />
      <Route
        path="contact"
        element={
          <PublicPage
            eyebrow="LET'S CONNECT"
            title="We'd love to hear your story."
            description="Get in touch to discuss your session, your ideas and the moments you want to remember."
          />
        }
      />
      <Route
        path="booking"
        element={
          <PublicPage
            eyebrow="YOUR SESSION"
            title="Let's plan something beautiful."
            description="The booking inquiry form will be implemented in the public website milestone."
          />
        }
      />
    </Route>
  );
}

function CustomerRoutes() {
  return (
    <Route
      path="dashboard"
      element={<DashboardLayout type="customer" links={customerLinks} />}
    >
      <Route index element={<Overview />} />
      <Route path="bookings" element={<Bookings />} />
      <Route path="gallery" element={<Gallery />} />
      <Route path="payments" element={<Payments />} />
      <Route path="profile" element={<Profile />} />
    </Route>
  );
}

function AdminRoutes() {
  return (
    <Route path="admin" element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="bookings" element={<AdminBookings />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="services" element={<AdminServices />} />
      <Route path="gallery" element={<AdminGallery />} />
      <Route path="inquiries" element={<AdminInquiries />} />
      <Route path="reviews" element={<AdminReviews />} />
      <Route path="settings" element={<AdminSettings />} />

      {[
        ["bookings", "Bookings", "Manage session requests and booking status."],
        ["customers", "Customers", "Customer records and account management."],
        ["services", "Services", "Manage photography packages and services."],
        ["gallery", "Gallery management", "Manage client photo galleries."],
        ["inquiries", "Inquiries", "Review and respond to client inquiries."],
        ["reviews", "Reviews", "Manage customer feedback."],
        ["settings", "Studio settings", "Manage studio configuration."],
      ].map(([path, title, description]) => (
        <Route
          key={path}
          path={path}
          element={<DashboardPage title={title} description={description} />}
        />
      ))}
    </Route>
  );
}

export default function App() {
  return (
    <Routes>
      {PublicRoutes()}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      {CustomerRoutes()}
      {AdminRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
