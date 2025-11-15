import type { ReactNode } from "react";
import "./App.css";
import { SideBar } from "./components/SideBar";
import { Outlet } from "react-router";

function App({ children }: { children?: ReactNode }) {
  return (
    <main style={{ display: "flex", flex: 1 }}>
      <SideBar></SideBar>
      <Outlet></Outlet>
    </main>
  );
}

export default App;
