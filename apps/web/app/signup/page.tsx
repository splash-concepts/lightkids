"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthBranding from "../components/AuthBranding";
import "./signup.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PARENT",
    parentType: "Mother",
    branchId: "",
    phoneNumber: "",
    whatsappNumber: "",
  });
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'phoneNumber' && sameAsPhone) {
        newData.whatsappNumber = value;
      }
      return newData;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsPhone(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, whatsappNumber: prev.phoneNumber }));
    }
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
                <label htmlFor="parentType">Parent Type <span className="required">*</span></label>
                <select 
                  name="parentType" 
                  id="parentType" 
                  value={formData.parentType} 
                  onChange={handleChange}
                  required
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                </select>
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
                <label htmlFor="phoneNumber">Phone Number (Call Line)</label>
                <input 
                  type="tel" 
                  name="phoneNumber" 
                  id="phoneNumber" 
                  placeholder="+1234567890" 
                  required 
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="sameAsPhone" 
                  checked={sameAsPhone} 
                  onChange={handleCheckboxChange} 
                  style={{ width: 'auto', marginBottom: 0 }}
                />
                <label htmlFor="sameAsPhone" style={{ marginBottom: 0, fontSize: '0.9rem' }}>WhatsApp is same as Call Line</label>
              </div>

              {!sameAsPhone && (
                <div className="input-group">
                  <label htmlFor="whatsappNumber">WhatsApp Number</label>
                  <input 
                    type="tel" 
                    name="whatsappNumber" 
                    id="whatsappNumber" 
                    placeholder="+1234567890" 
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                  />
                </div>
              )}

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
