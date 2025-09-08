import { jwtDecode } from "jwt-decode";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Convert to seconds

    if (decoded.exp && decoded.exp < currentTime) {
      console.warn("Token expired");
      localStorage.removeItem("token"); // Remove expired token
      return <Navigate to="/signin" replace />;
    }

    if (!allowedRoles.includes(decoded.role)) {
      return <Navigate to="/" replace />; // Unauthorized users redirected
    }

    return element;
  } catch (error) {
    console.error("Invalid token:", error);
    localStorage.removeItem("token"); // Remove corrupted token
    return <Navigate to="/signin" replace />;
  }
};

export default ProtectedRoute;
