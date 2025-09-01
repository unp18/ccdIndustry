import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, provider } from "../firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithRedirect,
} from "firebase/auth";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    try {
      const loginRes = await signInWithPopup(auth, provider);
      // const loginRes = await signInWithRedirect(auth, provider);

      if (loginRes) {
        setIsAuthenticated(true);
        setUser(loginRes.user);

        getUserRole(loginRes.user.email);

        return {
          success: true,
          message: "Login successful",
        };
      } else {
        return {
          success: false,
          message: "Login failed",
        };
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Error during login. Please try again.", error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error signing out. Please try again.");
    }
  };

  const getUserRole = async (email) => {
    try {
      const response = await fetch(
        import.meta.env.VITE_API_BASE_URI + "/api/get-user-role",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setUserRole(data.role);
      } else {
        console.error("Error fetching user role:", data.message);
      }
    } catch (error) {
      console.error("Error getting user role:", error);
      toast.error("Error getting user role. Please try again.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUser(user);

        getUserRole(user.email);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, login, logout, user, loading, userRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
