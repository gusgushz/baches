import { NavLink } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import "./SideBar.css";
import EbyLogo from "../assets/Eby.png";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const IconHome = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M3 11.5L12 4l9 7.5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 21V12h14v9" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconReports = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#111" strokeWidth="1.5" />
    <path d="M7 8h10M7 12h6" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const IconWorkers = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="#111" strokeWidth="1.5" />
    <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconVehicle = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="7" width="18" height="8" rx="2" stroke="#111" strokeWidth="1.5" />
    <path d="M7 17v1" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 17v1" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const SideBar: React.FC = () => {
  const { logout } = useAuth();

  const items: NavItem[] = [
    { to: "/dashboard", label: "Home", icon: IconHome },
    { to: "/reports", label: "Reportes", icon: IconReports },
    { to: "/employees", label: "Trabajadores", icon: IconWorkers },
    { to: "/vehicles", label: "Vehículo", icon: IconVehicle },
  ];

  return (
    <aside className="nav-bar" aria-label="Main navigation">
      <div className="brand">
        <div className="brand-logo">
          <img src={EbyLogo} alt="EBY logo" className="brand-img" />
        </div>
      </div>

      <nav className="nav-list">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} className="nav-link">
            <span className="icon" aria-hidden>{it.icon}</span>
            <span className="label">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="nav-footer">
        <button className="nav-link logout-button" onClick={logout}>
          <span className="icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 17l5-5-5-5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span className="label">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};
