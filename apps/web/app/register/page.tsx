"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./register.css";

export default function RegisterChild() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [childImageFile, setChildImageFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [parents, setParents] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("PARENT");

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    classCategoryId: "",
    allergies: "",
    emergencyContact: "",
    parentId: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] as string));
        setCurrentUserRole(payload.role);
        if (payload.role !== "PARENT") {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users?role=PARENT`, {
             headers: { "Authorization": `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setParents(data); })
          .catch(console.error);
        }
      } catch(e) {}
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
        setLoadingCategories(false);
      })
      .catch(err => {
        console.error("Failed to fetch categories", err);
        setCategories([]);
        setLoadingCategories(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("You must be logged in to register a child.");
      
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("dob", formData.dob);
      // classCategoryId is intentionally omitted to allow backend auto-assignment based on dob
      formDataToSend.append("medicalInfo[allergies]", formData.allergies);
      formDataToSend.append("medicalInfo[emergencyContacts][0][name]", formData.emergencyContact);
      
      if (formData.parentId) {
        formDataToSend.append("parentIds[]", formData.parentId);
      }
      
      if (childImageFile) {
        formDataToSend.append("childImage", childImageFile);
      }

      files.forEach(file => {
        formDataToSend.append("caregiverImages", file);
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to register child");
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: "", dob: "", classCategoryId: categories[0]?._id || "", allergies: "", emergencyContact: "", parentId: ""
      });
      setChildImageFile(null);
      setFiles([]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      
      <div className="register-card glass-panel animate-fade-in">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div className="register-header">
          <h2>Enroll a Child</h2>
          <p>Fill out the information below to register a new child.</p>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ color: 'var(--secondary)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
            Successfully registered! The 6-digit code has been generated securely.
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Details</h3>
            <div className="input-group">
              <label>Child's Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Liam Smith" required />
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Assigned Class</label>
                <input 
                  type="text" 
                  value="Auto-assigned based on age" 
                  disabled 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>
            {currentUserRole !== "PARENT" && (
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Link Parent / Guardian</label>
                <select name="parentId" value={formData.parentId} onChange={handleChange} required>
                  <option value="" disabled>Select a Parent...</option>
                  {parents.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
                <small className="text-secondary">Since you are registering this child, you must link them to a parent account.</small>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3>Medical Information <span className="text-accent">*Important</span></h3>
            <div className="input-group">
              <label>Allergies</label>
              <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g. Peanuts, Penicillin (comma separated)" />
            </div>
            <div className="input-group">
              <label>Emergency Contact (Name & Phone)</label>
              <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="e.g. John Doe - 555-0198" required />
            </div>
          </div>

          <div className="form-section">
            <h3>Photos (For Handoff Verification)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="file-upload-zone" style={{ padding: '1rem', minHeight: 'auto' }}>
                <span className="upload-icon"></span>
                <p>Upload Child's Photo</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setChildImageFile(e.target.files?.[0] || null)} 
                  className="file-input"
                />
                <p className="text-secondary">{childImageFile ? "1 file selected" : "No file chosen"}</p>
              </div>

              <div className="file-upload-zone" style={{ padding: '1rem', minHeight: 'auto' }}>
                <span className="upload-icon"></span>
                <p>Upload Parent / Caregiver Photos</p>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="file-input"
                />
                <p className="text-secondary">{files.length} file(s) selected</p>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-btn hover-lift" disabled={loading}>
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
