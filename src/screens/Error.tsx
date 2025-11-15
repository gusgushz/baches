import { NavLink } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export const ErrorScreen = () => {
  const { user } = useAuth();

  return (
    <div>
      <p>Ups, no se encuentra esta url</p>
      <button>
        <NavLink to={user ? "/" : "/login"}>Regresar</NavLink>
      </button>
    </div>
  );
};
