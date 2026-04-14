import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI } from "../utils/api";
import { initSocket, disconnectSocket } from "../utils/socket";
import { generateKeyPair } from "../utils/crypto";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Initialize socket connection
          initSocket(storedToken);
          // Verify token is still valid
          const response = await authAPI.getMe();
          const userData = response.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));

          // E2EE Check: Ensure keys exist for the user
          const privateKey = localStorage.getItem(`privateKey_${userData._id}`);
          if (!userData.publicKey || !privateKey) {
            console.log("Generating missing E2EE keys...");
            const { publicKey, privateKey: newPrivateKey } = await generateKeyPair();
            await userAPI.updateProfile({ publicKey });
            localStorage.setItem(`privateKey_${userData._id}`, newPrivateKey);
            // Refresh user data with public key
            setUser({ ...userData, publicKey });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Global listener for auth errors from axios interceptor
    const handleAuthError = () => {
      logout();
    };
    window.addEventListener('auth-error', handleAuthError);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, ...userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // E2EE Check: Ensure keys exist for the user
      const privateKey = localStorage.getItem(`privateKey_${userData._id}`);
      if (!userData.publicKey || !privateKey) {
        console.log("Generating missing E2EE keys...");
        const { publicKey, privateKey: newPrivateKey } = await generateKeyPair();
        await userAPI.updateProfile({ publicKey });
        localStorage.setItem(`privateKey_${userData._id}`, newPrivateKey);
        // Refresh user data with public key
        setUser({ ...userData, publicKey });
      }

      // Initialize socket connection and setup
      const socket = initSocket(newToken);
      if (socket) {
        socket.on("connect", () => {
          socket.emit("setup", userData._id);
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);

      // Handle network errors (environment-agnostic message)
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        return {
          success: false,
          error: "Cannot connect to server. Please try again later.",
        };
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      // 1. Generate E2EE keys before registration
      const { publicKey, privateKey } = await generateKeyPair();

      // 2. Register user with public key
      const response = await authAPI.register({
        username,
        email,
        password,
        publicKey,
      });
      const { token: newToken, ...userData } = response.data;

      // 3. Store private key locally
      localStorage.setItem(`privateKey_${userData._id}`, privateKey);

      setToken(newToken);
      setUser(userData);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));

      // Initialize socket connection and setup
      const socket = initSocket(newToken);
      if (socket) {
        socket.on("connect", () => {
          socket.emit("setup", userData._id);
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      disconnectSocket();
    }
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
