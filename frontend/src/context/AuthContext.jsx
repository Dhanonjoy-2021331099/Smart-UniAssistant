/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { loginUser, googleLoginUser, getProfile } from "../services/api";

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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      if (!token) {
        return false;
      }

      const data = await getProfile();
      setUser(data.user);
      setProfile(data);
      return true;
    };

    resolveSession()
      .then((hasToken) => {
        if (!cancelled && !hasToken) {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error("Profile fetch error:", error);
        localStorage.removeItem("token");
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshProfile();
    return data;
  };

  const googleLogin = async (idToken) => {
    const data = await googleLoginUser(idToken);
    localStorage.setItem("token", data.token);
    setToken(data.token);
    setUser(data.user);
    await refreshProfile();
    return data;
  };

  const refreshProfile = async () => {
    const data = await getProfile();
    setUser(data.user);
    setProfile(data);
    return data;
  };

  const logout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("Firebase signout error:", error);
    }
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    googleLogin,
    logout,
    refreshProfile,
    isAuthenticated: !!token,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
