import axios from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useProfileContext } from "../contexts/ProfileContext";
import api from "../lib/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
}

export const useAuth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { fetchProfile, clearProfile } = useProfileContext();
  const { t } = useTranslation();

  const isAuthenticated = async () => {
    try {
      if (
        window.location.pathname === "/" ||
        window.location.pathname === "/login"
      ) {
        return false;
      }
      await api.get("/api/auth/profile");
      return true;
    } catch {
      return false;
    }
  };

  const initAuth = async () => {
    try {
      if (
        window.location.pathname === "/" ||
        window.location.pathname === "/login"
      ) {
        return false;
      }
      await api.get("/api/auth/profile");
      await fetchProfile();
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Attempting login...");

      const response = await api.post<AuthResponse>(
        "/api/auth/login",
        credentials
      );

      console.log("Login response:", {
        status: response.status,
        headers: response.headers,
        cookies: document.cookie,
      });

      if (response.status === 201) {
        console.log("Login successful, fetching profile...");
        await fetchProfile();
        navigate("/dashboard", { replace: true });
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data;
        if (errorData && typeof errorData === "object") {
          setError(errorData.message);
        } else {
          setError("Une erreur est survenue lors de la connexion");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post<AuthResponse>(
        "/api/auth/register",
        credentials
      );

      if (response.data.message !== "Registration successful") {
        throw new Error("Échec de l'inscription");
      }

      await fetchProfile();
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        switch (err.response.status) {
          case 409:
            throw new Error("Cet email est déjà utilisé");
          case 400:
            throw new Error("Données invalides");
          default:
            throw new Error("Erreur lors de l'inscription");
        }
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
      clearProfile();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      await api.post("/api/auth/forgot-password", { email });
    } catch (err) {
      throw new Error(t("errors.resetPassword"));
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await api.post("/api/auth/reset-password", {
        token,
        password: newPassword,
      });
    } catch (err) {
      throw new Error(t("errors.resetPassword"));
    }
  };

  return {
    login,
    register,
    logout,
    error,
    loading,
    isAuthenticated,
    initAuth,
    requestPasswordReset,
    resetPassword,
  };
};
