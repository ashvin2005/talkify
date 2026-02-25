import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useEffect } from "react";

export const AuthContext = createContext();

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(() => {
    const storedData = localStorage.getItem("authData");
    return storedData ? JSON.parse(storedData) : null;
  });
  const [authError, setAuthError] = useState("");

  const isGuestUser = () => {
    return userData?.username === "talkify_guest" || localStorage.getItem("isGuest") === "true";
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError("");


      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const { user } = result;
          const idToken = await user.getIdToken(true);

          const res = await client.post("/google-auth", { idToken });

          if (res.status === httpStatus.OK) {
            const authData = {
              token: res.data.token,
              user: res.data.user,
            };

            localStorage.setItem("authData", JSON.stringify(authData));
            localStorage.setItem("token", res.data.token);

            setUserData(res.data.user);
            navigate("/home", { replace: true });
            return;
          }
        }
      } catch (redirectError) {
        console.log("No redirect result, trying popup...");
      }


      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const idToken = await user.getIdToken(true);

      const res = await client.post("/google-auth", { idToken });

      if (res.status === httpStatus.OK) {
        const authData = {
          token: res.data.token,
          user: res.data.user,
        };

        localStorage.setItem("authData", JSON.stringify(authData));
        localStorage.setItem("token", res.data.token);

        setUserData(res.data.user);
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Google sign-in error:", err);


      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        console.log("Popup blocked, trying redirect...");
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error("Redirect also failed:", redirectErr);
          setAuthError("Google Sign-In failed. Please allow popups or try again.");
          throw redirectErr;
        }
      } else {
        const errorMsg = err.response?.data?.message || err.message || "Google Sign-In failed";
        setAuthError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };


  const verifyToken = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      const res = await client.get("/verify-token", {
        params: { token },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.valid && res.data.user) {
        setUserData(res.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Token verification failed:", err);
      return false;
    }
  };


  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await verifyToken();
      if (!isValid) {
        logout();
      }
    };

    checkAuth();
  }, []);

  // Clear guest session history when browser/tab is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isGuestUser()) {
        sessionStorage.removeItem("guestMeetingHistory");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [userData]);

  const logout = () => {
    // Clear guest session history on logout
    if (isGuestUser()) {
      sessionStorage.removeItem("guestMeetingHistory");
    }
    localStorage.removeItem("token");
    localStorage.removeItem("authData");
    localStorage.removeItem("isGuest");
    setUserData(null);
    navigate("/");
  };


  const handleRegister = async (name, username, password) => {
    try {
      const res = await client.post("/register", {
        name,
        username,
        password,
      });

      if (res.status === httpStatus.CREATED) {
        await handleLogin(username, password);
        return res.data.message;
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || "Registration failed");
    }
  };


  const handleLogin = async (username, password) => {
    try {
      const res = await client.post("/login", { username, password });

      if (res.status === httpStatus.OK) {
        localStorage.setItem("token", res.data.token);
        setUserData(res.data.user || null);
        navigate("/home", { replace: true });
        return true;
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
  };


  const handleGuestLogin = async () => {
    try {
      const res = await client.post("/guest-login");
      if (res.status === httpStatus.OK) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("isGuest", "true");
        setUserData(res.data.user || null);
        navigate("/home", { replace: true });
        return true;
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || "Guest login failed");
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      if (!meetingCode) throw new Error("Missing meeting code");

      if (isGuestUser()) {
        // Store in sessionStorage for guest users
        const existing = JSON.parse(sessionStorage.getItem("guestMeetingHistory") || "[]");
        existing.unshift({
          meetingCode,
          date: new Date().toISOString(),
        });
        sessionStorage.setItem("guestMeetingHistory", JSON.stringify(existing));
        return { message: "Added to guest session history" };
      }

      // For authenticated users, store in backend
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing token");

      const res = await client.post("/add_to_activity", {
        token,
        meeting_code: meetingCode,
      });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || err.message || "Failed to add meeting to history";
    }
  };

  const getHistoryOfUser = async () => {
    try {
      if (isGuestUser()) {
        // Return from sessionStorage for guest users
        return JSON.parse(sessionStorage.getItem("guestMeetingHistory") || "[]");
      }

      // For authenticated users, fetch from backend
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Missing token");

      const res = await client.get("/get_all_activity", {
        params: { token },
      });
      return res.data;
    } catch (err) {
      throw err.response?.data?.message || err.message || "Failed to fetch history";
    }
  };

  const value = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    handleGoogleLogin,
    handleGuestLogin,
    logout,
    addToUserHistory,
    getHistoryOfUser,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
