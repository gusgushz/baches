import type { ReactNode } from "react";
import "./App.css";
import { SideBar } from "./components/SideBar";
import { Outlet } from "react-router";
import { useSidebar } from "./contexts/SidebarContext";

function App({ children }: { children?: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <main style={{ display: "flex", flex: 1 }}>
      <SideBar />
      {/* The Outlet content must leave space for the fixed sidebar. We add
          a wrapper with the helper class declared in SideBar.css */}
      <div 
        className="app-content-placeholder" 
        style={{ 
          flex: 1,
          marginLeft: isOpen ? '220px' : '72px',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <Outlet />
      </div>
    </main>
  );
}

export default App;
