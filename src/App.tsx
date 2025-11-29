import type { ReactNode } from "react";
import "./App.css";
import { SideBar } from "./components/SideBar";
import { Outlet } from "react-router";

function App({ children }: { children?: ReactNode }) {
  return (
    <main className="app-root">
      <SideBar />
      <div className="app-content">
        <Outlet />
      </div>
    </main>
  );
}

export default App;
