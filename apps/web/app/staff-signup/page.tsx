"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthBranding from "../components/AuthBranding";
import "../signup/signup.css";

export default function StaffSignup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MENTOR",
    branchId: "",
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/branches`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBranches(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, branchId: data[0]._id }));
          }
        } else {
          setBranches([]);
        }
        setLoadingBranches(false);
      })
      .catch(err => {
        console.error("Failed to fetch branches", err);
        setBranches([]);
        setLoadingBranches(false);
      });
  }, []);


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/register`, {
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
              <div className="logo-icon" style={{ background: 'var(--accent)' }}>L</div>
              <h2>Staff Registration</h2>
              <p>Join the Light Kids administrative team</p>
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
                <label htmlFor="role">Staff Role</label>
                <select name="role" id="role" value={formData.role} onChange={handleChange} required>
                  <option value="MENTOR">Mentor / Teacher</option>
                  <option value="MINISTER">Minister</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="branchId">Select Branch</label>
                <select name="branchId" id="branchId" value={formData.branchId} onChange={handleChange} required>
                  {loadingBranches && <option value="">Loading branches...</option>}
                  {!loadingBranches && branches.length === 0 && <option value="">No branches available</option>}
                  {branches.map(b => (
                    <option key={b._id} value={b._id}>{b.name} {b.location ? `(${b.location})` : ''}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary signup-btn hover-lift" disabled={loading} style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>
                {loading ? "Creating Account..." : "Complete Registration"}
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
