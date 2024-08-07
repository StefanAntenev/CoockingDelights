import { Outlet } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext"
import { Navigate } from "react-router-dom";

export default function Guard() {
    const { isAuthenticated } = useAuthContext();
    
    return isAuthenticated
        ? < Outlet />
        : <Navigate to="/login" />
}