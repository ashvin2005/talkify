import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function Authentication() {
  const { handleRegister, handleLogin, handleGoogleLogin, authError } =
    useContext(AuthContext);

  const [formState, setFormState] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const handleAuth = async () => {
    try {
      setLocalError("");
      setMessage("");
      setLoading(true);

      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        await handleRegister(name, username, password);
        setMessage("Registration successful! Please log in.");
        setFormState(0);
        setUsername("");
        setPassword("");
        setName("");
      }
    } catch (err) {
      setLocalError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLocalError("");
      setLoading(true);
      await handleGoogleLogin();
    } catch (err) {
      console.error("Google sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDummyLogin = async () => {
    try {
      setLocalError("");
      setMessage("");
      setLoading(true);

      const baseUsername = "talkify_guest";
      const basePassword = "GuestUser123!";
      const baseName = "Guest User";

      try {
        await handleRegister(baseName, baseUsername, basePassword);
        return;
      } catch (regError) {
        if (regError && (regError.toString().includes("exist") || regError.toString().includes("taken"))) {
          try {
            await handleLogin(baseUsername, basePassword);
            return;
          } catch (loginError) {
            console.warn("Guest login failed (password mismatch?), creating new user");
          }
        }
      }

      const randomStart = Math.floor(Math.random() * 10000);
      const randomUser = `guest_${randomStart}`;
      const randomPass = `Guest${randomStart}!`;
      await handleRegister(baseName, randomUser, randomPass);

    } catch (err) {
      setLocalError("Could not start demo session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">

      <div className="absolute inset-0 z-0">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            background: { color: { value: "#000000" } },
            fpsLimit: 120,
            interactivity: {
              events: {
                onHover: { enable: true, mode: "repulse" },
                resize: true,
              },
              modes: { repulse: { distance: 100, duration: 0.4 } },
            },
            particles: {
              color: { value: "#8b5cf6" },
              links: {
                color: "#8b5cf6",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 2,
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 80,
              },
              opacity: { value: 0.5 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
        />
      </div>


      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 text-white z-10">
        <div className="max-w-lg space-y-8">
          <h1 className="text-5xl font-bold leading-tight">
            Welcome to <span className="text-purple-500">Talkify</span>
          </h1>
          <p className="text-xl text-gray-300">
            Connect with your loved ones through seamless video calls.
            Experience crystal clear quality with our revolutionary platform.
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15l8-8m0 0l-8-8m8 8H4"
                  />
                </svg>
              </div>
              <span>Instant connection with one click</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span>End-to-end encrypted for your privacy</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <span>Cloud-based for maximum reliability</span>
            </div>
          </div>
        </div>
      </div>


      <div className="flex flex-col justify-center items-center flex-1 px-6 py-12 bg-black/70 backdrop-blur-sm z-10">
        <div className="max-w-md w-full space-y-8 p-10 bg-gray-900/80 rounded-2xl border border-purple-900/30 shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              {formState === 0 ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-gray-300">
              {formState === 0
                ? "Sign in to continue to Talkify"
                : "Join us to start connecting"}
            </p>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <button
              className={`px-6 py-3 rounded-full transition-all ${formState === 0
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              onClick={() => setFormState(0)}
            >
              Sign In
            </button>
            <button
              className={`px-6 py-3 rounded-full transition-all ${formState === 1
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              onClick={() => setFormState(1)}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-5">
            {formState === 1 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>

            {(localError || authError) && (
              <div className="p-3 bg-purple-900/30 text-purple-300 rounded-lg text-sm border border-purple-900/50">
                {localError || authError}
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-900/30 text-green-300 rounded-lg text-sm border border-green-900/50">
                {message}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-800 text-white rounded-lg px-4 py-3 font-medium hover:from-purple-700 hover:to-blue-900 transition-all shadow-lg transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : formState === 0 ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-gray-900/80 text-sm text-gray-400">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-700 transition-all border border-gray-700 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-gray-900/80 text-sm text-gray-400">
                  QUICK ACCESS
                </span>
              </div>
            </div>

            <button
              onClick={handleDummyLogin}
              disabled={loading}
              className="w-full bg-gray-900/50 hover:bg-gray-800/80 border border-purple-500/50 text-white rounded-lg px-4 py-3 font-medium transition-all shadow-lg hover:shadow-purple-500/20 flex items-center justify-center space-x-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Quick Demo Login</span>
            </button>
            <p className="text-center text-xs text-gray-500">
              Instantly sign in with a demo account — no registration needed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
