"use client";

import { useState } from "react";
import Link from "next/link";
import AuthBranding from "../components/AuthBranding";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(show2FA ? { email, password, token } : { email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === '2FA_REQUIRED') {
          setShow2FA(true);
          setError("Please enter your 2FA authenticator code.");
          return;
        }
        throw new Error(data.message || "Failed to login");
      }

      // Store JWT (in a real app, use HttpOnly cookies or secure storage)
      localStorage.setItem("token", data.access_token);
      
      // Redirect based on role
      if (data.role === 'ADMIN' || data.role === 'PARENT') {
        window.location.href = "/";
      } else if (data.role === 'MENTOR') {
        if (data.require2faSetup) {
          window.location.href = "/setup-2fa";
        } else {
          window.location.href = "/";
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-layout">
        
        {/* Left Column - Form */}
        <div className="login-form-column">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <div className="login-card animate-fade-in">
            <div className="login-header">
              <div className="logo-icon">L</div>
              <h2>Welcome to Light Kids</h2>
              <p>Please log in to your account</p>
            </div>

        {error && (
          <div className="error-alert" style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input 
                type="email" 
                id="email" 
                placeholder="sarah@lightkids.edu" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {show2FA && (
            <div className="input-group">
              <label htmlFor="token">2FA Authenticator Code</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input 
                  type="text" 
                  id="token" 
                  placeholder="123456" 
                  required={show2FA}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>

          <button type="submit" className="btn btn-primary login-btn hover-lift" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link href="/signup" className="signup-link">Create Account</Link></p>
        </div>
      </div>
    </div>

    {/* Right Column - Beautiful Branding */}
    <AuthBranding />
  </div>
</div>
  );
}
