import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const loadUser = async () => {
    try {
      setIsLoadingAuth(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError({ type: "auth_required" });
        setAuthChecked(true);
        return;
      }

      setUser(session.user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
        .maybeSingle();

      console.log("AuthContext session user:", session.user);
      console.log("AuthContext profile lookup result:", profileData, profileError);

      if (profileError) {
        console.error("Profile load error:", profileError);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError({ type: "pending_approval" });
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return;
      }

      if (!profileData) {
        setUser(session.user);
        setProfile(null);
        setIsAuthenticated(false);
        setAuthError({ type: "pending_approval" });
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return;
      }

      setProfile(profileData);

      if (profileData.status === "pending") {
        setAuthError({ type: "pending_approval" });
        setIsAuthenticated(false);
      } else if (profileData.status === "rejected") {
        setAuthError({ type: "rejected" });
        setIsAuthenticated(false);
      } else if (profileData.status === "approved") {
        setAuthError(null);
        setIsAuthenticated(true);
      } else {
        setAuthError({ type: "pending_approval" });
        setIsAuthenticated(false);
      }

      setAuthChecked(true);
    } catch (err) {
      console.error(err);

      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);

      setAuthError({ type: "auth_required" });
      setAuthChecked(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth: loadUser,
        checkAppState: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};