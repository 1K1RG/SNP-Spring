import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState("GUEST"); 

  useEffect(() => {
    const loadRole = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setRole("GUEST"); // No token means they are a guest
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Get current time in seconds

        if (decoded.exp && decoded.exp < currentTime) {
          localStorage.removeItem("token");
          setRole("GUEST");
          return;
        }
        
        setRole(decoded.role); // Set role from token
      } catch (error) {
        localStorage.removeItem("token");
        setRole("GUEST");
      }
    };

    loadRole();
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode(token);
    setRole(decoded.role); // Update role immediately on login
    console.log(decoded.role)
  };


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("userDetails");
    setRole("GUEST"); 
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
