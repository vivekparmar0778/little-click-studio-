import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

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
import HeroSection from "./pages/public/Hero/HeroSection";
import AboutSection from "./pages/public/About/AboutSection";
import ServicesSection from "./pages/public/Services/ServicesSection";
import PortfolioSection from "./pages/public/Portfolio/PortfolioSection";
import ContactPage from "./pages/public/Contact/ContactPage";
import BookingPage from "./pages/public/Booking/BookingPage";

import LoginPageComponent from "./pages/auth/Login/LoginPage";
import RegisterPageComponent from "./pages/auth/Register/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPasswordPage";

const SESSION_API = "/api/auth/me/";

const customerLinks = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/bookings", label: "My bookings" },
  { to: "/dashboard/gallery", label: "Private gallery" },
  { to: "/dashboard/payments", label: "Payments" },
  { to: "/dashboard/profile", label: "My profile" },
];

function normalizeRole(user) {
  return String(user?.role || user?.user_type || "")
    .trim()
    .toLowerCase();
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

/* Verifies the current session with Django */
function RequireRole({ allowedRoles }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch(SESSION_API, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        const data = await response.json();
        const currentUser = data.user || data;

        if (!currentUser || !normalizeRole(currentUser)) {
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        setUser(currentUser);
        setStatus("authenticated");
      } catch (error) {
        if (error.name !== "AbortError") {
          setUser(null);
          setStatus("error");
        }
      }
    }

    checkSession();

    return () => controller.abort();
  }, []);

  if (status === "loading") {
    return (
      <main className="container page-intro" aria-live="polite">
        <p className="eyebrow">LITTLE CLICK STUDIO</p>
        <h1 className="display-heading">Checking your access…</h1>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="container page-intro" role="alert">
        <p className="eyebrow">CONNECTION UNAVAILABLE</p>
        <h1 className="display-heading">We couldn't verify your session.</h1>

        <p className="page-intro__description">
          Please check that the authentication service is running and try again.
        </p>

        <Link className="text-link" to="/login">
          Return to sign in ↗
        </Link>
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
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

          <Link to="/login" className="text-link">
            Sign in page
          </Link>
        </aside>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* Public home page */
function HomePage() {
  return <HeroSection />;
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
 // const adminRoles = ["admin", "staff", "superuser"];

  return (
   // <Route element={<RequireRole allowedRoles={adminRoles} />}>
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
   // </Route>
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
