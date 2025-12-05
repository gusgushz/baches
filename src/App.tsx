import type { ReactNode } from "react";
import "./App.css";
import { SideBar } from "./components/SideBar";
import { Outlet } from "react-router";

function App({ children }: { children?: ReactNode }) {
  return (
<<<<<<< HEAD
    <main className="app-root">
      <SideBar />
      <div className="app-content">
=======
    <main style={{ display: "flex", flex: 1 }}>
      <SideBar />
      {/* The Outlet content must leave space for the fixed sidebar. We add
          a wrapper with the helper class declared in SideBar.css */}
      <div className="app-content-placeholder" style={{ flex: 1 }}>
>>>>>>> 107fa45616f1412b7f53602e8dd0fd9ad9a9f790
        <Outlet />
      </div>
    </main>
  );
}

export default App;
