"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useSessionStore } from "@/store/session-store";
import { apiRequest } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useSessionStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        const result = await signUpWithEmail(email, password);
        
        // Create user in backend database
        try {
          await apiRequest("/api/users", {
            method: "POST",
            body: {
              full_name: fullName || null,
              preferred_language: "en",
              is_commuter: false,
              is_business_owner: false,
            },
            token: result.token,
          });
        } catch (apiError: any) {
          // If user already exists in backend, that's okay - they might have registered via mobile
          if (apiError.status !== 409 && apiError.status !== 400) {
            throw apiError;
          }
          // Continue anyway - user exists in backend
        }

        setSession({ ownerId: result.uid, accessToken: result.token });
        router.push("/registration");
      } else {
        // Sign in flow
        const result = await signInWithEmail(email, password);
        setSession({ ownerId: result.uid, accessToken: result.token });
        router.push("/registration");
      }
    } catch (err: any) {
      // Handle Firebase errors with user-friendly messages
      let errorMessage = "Authentication failed";
      
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {isSignUp ? "Sign Up" : "Sign In"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSignUp ? "Create an account to register your business" : "Sign in to continue"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isSignUp && (
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
                Full Name (Optional)
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                placeholder="Your full name"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-amber-600">⚠️</span>
                <p className="text-sm text-amber-800">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleToggleMode}
          className="mt-4 w-full text-center text-sm text-slate-600 hover:text-indigo-600"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
