import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

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

import SiteHeader from "./pages/public/Header/SiteHeader";
import HomePage from "./pages/public/Home/HomePage";
import AboutSection from "./pages/public/About/AboutSection";
import ServicesSection from "./pages/public/Services/ServicesSection";
import PortfolioSection from "./pages/public/Portfolio/PortfolioSection";
import ContactPage from "./pages/public/Contact/ContactPage";
import BookingPage from "./pages/public/Booking/BookingPage";

import LoginPageComponent from "./pages/auth/Login/LoginPage";
import RegisterPageComponent from "./pages/auth/Register/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPasswordPage";

<<<<<<< HEAD
=======


>>>>>>> origin/main
const customerLinks = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/bookings", label: "My bookings" },
  { to: "/dashboard/gallery", label: "Private gallery" },
  { to: "/dashboard/payments", label: "Payments" },
  { to: "/dashboard/profile", label: "My profile" },
];

const SESSION_API = "/api/auth/me/";

function normalizeRole(user) {
  if (!user) return "";

  if (user.is_superuser === true) return "superuser";
  if (user.is_staff === true) return "admin";

  return "customer";
}

function getRoleHome(role) {
  if (["admin", "staff", "superuser"].includes(role)) {
    return "/admin";
  }

  if (role === "customer") {
    return "/dashboard";
  }

  return "/login";
}

/* Protects routes using the shared JWT authentication state. */
function RequireRole({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <main className="container page-intro" aria-live="polite">
        <p className="eyebrow">LITTLE CLICK STUDIO</p>
        <h1 className="display-heading">Checking your access…</h1>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user);

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Outlet />;
}

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

/* Shared layout for public website pages */
function PublicLayout() {
  return (
    <div className="app-shell public-site">
      <SiteHeader />

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

/* Login and Register pages have their own visual layouts */
function AuthLayout() {
  return <Outlet />;
}

/* Customer and admin dashboard shell */
function DashboardLayout({ type = "customer", links = customerLinks }) {
  const { user, logout } = useAuth();
  const isAdmin = type === "admin";

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const displayName = fullName || user?.email || "Your account";

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <Link className="brand" to={isAdmin ? "/admin" : "/dashboard"}>
          <span className="brand__name">Little Click Studio</span>
          <span className="brand__location">
            {isAdmin ? "STUDIO MANAGEMENT" : "YOUR LITTLE MOMENTS"}
          </span>
        </Link>

        <div className="dashboard-account">
          <span className="dashboard-account__name">{displayName}</span>
          <Link className="text-link" to="/">
            Visit public website ↗
          </Link>
        </div>
      </header>

      <div className="dashboard-body">
        <aside
          className="dashboard-sidebar"
          aria-label={isAdmin ? "Admin navigation" : "Customer navigation"}
        >
          <div className="dashboard-account dashboard-account--sidebar">
            <strong className="dashboard-account__name">{displayName}</strong>
            <span className="dashboard-account__email">{user?.email}</span>
          </div>

          {links.map((item) => (
            <NavigationLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavigationLink>
          ))}

          <button type="button" className="dashboard-logout" onClick={logout}>
            Log out
          </button>
        </aside>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}



/* Register page component */
function RegisterPage() {
  return <RegisterPageComponent />;
}

/* PUBLIC WEBSITE ROUTES */
function PublicRoutes() {
  return (
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<AboutSection />} />
      <Route path="services" element={<ServicesSection />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="booking" element={<BookingPage />} />
      <Route path="portfolio" element={<PortfolioSection />} />
    </Route>
  );
}

/* CUSTOMER ROUTES — customer role only */
function CustomerRoutes() {
  return (
    <Route element={<RequireRole allowedRoles={["customer"]} />}>
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
    </Route>
  );
}

/* ADMIN ROUTES — authorized staff roles only */
function AdminRoutes() {
<<<<<<< HEAD
  const adminRoles = ["admin", "staff", "superuser"];
=======
   const adminRoles = ["admin", "staff", "superuser"];
>>>>>>> origin/main

  return (
    <Route element={<RequireRole allowedRoles={adminRoles} />}>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="gallery" element={<AdminGallery />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Route>
  );
}

/* APPLICATION ROUTER */
export default function App() {
  return (
    <Routes>
      {PublicRoutes()}

      {/* Shared authentication routes */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPageComponent />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      {CustomerRoutes()}
      {AdminRoutes()}

      {/* 404 — unmatched routes */}
      <Route
        path="*"
        element={
          <main className="container page-intro">
            <p className="eyebrow">404 · PAGE NOT FOUND</p>

            <h1 className="display-heading">A little detour.</h1>

            <p className="page-intro__description">
              We couldn't find the page you were looking for.
            </p>

            <Link className="text-link" to="/">
              Return to the studio ↗
            </Link>
          </main>
        }
      />
    </Routes>
  );
}
