import { useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardScreen() {
  const { user, token } = useAuth();
  console.log(user);
  console.log(token);

  //Para obtener la ruta actual
  const location = useLocation();
  console.log(location.pathname); // "/dashboard"
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
