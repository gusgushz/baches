import type { ReactNode } from "react";
import "./App.css";
import { SideBar } from "./components/SideBar";
import { Outlet } from "react-router";

function App({ children }: { children?: ReactNode }) {
  return (
    <main style={{ display: "flex", flex: 1 }}>
      <SideBar />
      {/* The Outlet content must leave space for the fixed sidebar. We add
          a wrapper with the helper class declared in SideBar.css */}
      <div className="app-content-placeholder" style={{ flex: 1 }}>
        <Outlet />
      </div>
    </main>
  );
}

export default App;
