
import { Routes, Route } from "react-router-dom";
import Home from "./reusables/pages/Home";
import Register from "./reusables/pages/Register";
import Signin from "./reusables/pages/Signin";
import GuestDashboard from "./reusables/pages/GuestDashboard";
import UserDashboard from "./reusables/pages/UserDashboard";
import ProtectedRoute from "./services/ProtectedRoute";
import { AuthProvider } from "./services/AuthContext";


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/signin" element={<Signin/>} />
        <Route path="/dashboard" element={<GuestDashboard/>} />
        <Route
          path="/user/dashboard"
          element={<ProtectedRoute element={<UserDashboard/>} allowedRoles={["USER", "ADMIN"]} />}
        />

      </Routes>
    </AuthProvider>

  );
}

export default App;
