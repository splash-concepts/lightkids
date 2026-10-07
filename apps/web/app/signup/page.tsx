"use client";

import { useState } from "react";
import Link from "next/link";
import AuthBranding from "../components/AuthBranding";
import "./signup.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PARENT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-layout">
        
        {/* Left Column - Form */}
        <div className="signup-form-column">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
          <div className="signup-card animate-fade-in">
            <div className="signup-header">
              <div className="logo-icon">L</div>
              <h2>Create an Account</h2>
              <p>Join the Light Kids community</p>
            </div>

            {error && (
              <div className="error-alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-alert">
                Account created successfully! Redirecting to login...
              </div>
            )}

            <form className="signup-form" onSubmit={handleSignup}>
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  placeholder="Sarah Smith" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  placeholder="sarah@example.com" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  placeholder="••••••••" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="role">I am a...</label>
                <select name="role" id="role" value={formData.role} onChange={handleChange} required>
                  <option value="PARENT">Parent</option>
                  <option value="MENTOR">Mentor / Teacher</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary signup-btn hover-lift" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <div className="signup-footer">
              <p>Already have an account? <Link href="/login" className="login-link">Sign In</Link></p>
            </div>
          </div>
        </div>

        {/* Right Column - Branding */}
        <AuthBranding />
      </div>
    </div>
  );
}
