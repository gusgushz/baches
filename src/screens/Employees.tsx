import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function EmployeesScreen() {
  const { user } = useAuth();
  if (!user) return; // Asegúrate de que el usuario esté autenticado
  const navigate = useNavigate();
  return (
    <div>
      <h1>Employees</h1>
    </div>
  );
}
