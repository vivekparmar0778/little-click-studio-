import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Camera,
  Images,
  MessageSquare,
  Star,
  Settings,
} from "lucide-react";

const adminNavigation = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/services", label: "Services", icon: Camera },
  { to: "/admin/gallery", label: "Gallery", icon: Images },
  { to: "/admin/inquiries", label: "Inquiries", icon: MessageSquare },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default adminNavigation;