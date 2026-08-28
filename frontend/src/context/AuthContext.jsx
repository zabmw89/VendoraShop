import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { api } from "../services/api";

const AuthContext = createContext(void 0);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("vendora_auth_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem("vendora_auth_token");
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          localStorage.removeItem("vendora_auth_token");
          localStorage.removeItem("vendora_refresh_token");
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token) {
      localStorage.setItem("vendora_auth_token", res.token);
      if (res.refresh) {
        localStorage.setItem("vendora_refresh_token", res.refresh);
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password, phone) => {
    const res = await api.register({ name, email, password, phone });
    return res;
  };

  const verifyEmail = async (email, code) => {
    const res = await api.verifyEmail({ email, code });
    if (res.token) {
      localStorage.setItem("vendora_auth_token", res.token);
      if (res.refresh) {
        localStorage.setItem("vendora_refresh_token", res.refresh);
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const resendVerification = async (email) => {
    return await api.resendVerification({ email });
  };

  const socialLogin = async (provider, { accessToken, idToken } = {}) => {
    const res = await api.socialLogin({
      provider,
      access_token: accessToken || "",
      id_token: idToken || "",
    });
    if (res.token) {
      localStorage.setItem("vendora_auth_token", res.token);
      if (res.refresh) {
        localStorage.setItem("vendora_refresh_token", res.refresh);
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const changePassword = async (current_password, new_password, confirm_password) => {
    const res = await api.changePassword({
      current_password,
      new_password,
      confirm_password,
    });
    if (res.token) {
      localStorage.setItem("vendora_auth_token", res.token);
      if (res.refresh) {
        localStorage.setItem("vendora_refresh_token", res.refresh);
      }
      setToken(res.token);
    }
    return res;
  };

  const forgotPassword = async (email) => {
    return await api.forgotPassword({ email });
  };

  const resetPassword = async (email, code, new_password, confirm_password) => {
    const res = await api.resetPassword({ email, code, new_password, confirm_password });
    if (res.token) {
      localStorage.setItem("vendora_auth_token", res.token);
      if (res.refresh) {
        localStorage.setItem("vendora_refresh_token", res.refresh);
      }
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem("vendora_auth_token");
    localStorage.removeItem("vendora_refresh_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    return res;
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      verifyEmail,
      resendVerification,
      socialLogin,
      changePassword,
      forgotPassword,
      resetPassword,
      logout,
      updateProfile,
    }),
    [user, token, isLoading]
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
