
import { Link, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";

import AdminSidebar from "../../components/admin/AdminSidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <header className="admin-layout__header">
        <button
          type="button"
          className="admin-layout__menu"
          aria-label="Open admin navigation"
          aria-controls="admin-sidebar"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          <Menu size={20} />
        </button>

        <Link to="/admin" className="admin-layout__home">
          Little Click Studio
          <span>STUDIO MANAGEMENT</span>
        </Link>

        <Link to="/" className="admin-layout__website">
          Visit website ↗
        </Link>
      </header>

      <div className="admin-layout__body">
        <AdminSidebar
          open={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />

        <main className="admin-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
