"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "../../components/Modal";
import "./register.css";

export default function RegisterChild() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; isAuthError?: boolean } | null>(null);
  const [childImageFile, setChildImageFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [parents, setParents] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("PARENT");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    classCategoryId: "",
    allergies: "",
    emergencyContact: "",
    parentId: "",
    // Mother's Information
    motherName: "",
    motherPhone: "",
    motherWhatsapp: "",
    motherSameAsPhone: true,
    // Father's Information
    fatherName: "",
    fatherPhone: "",
    fatherWhatsapp: "",
    fatherSameAsPhone: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/register";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] as string));
      // Check token expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        window.location.href = "/login?redirect=/register&reason=expired";
        return;
      }

      setCurrentUser(payload);
      setCurrentUserRole(payload.role);

      // Auto-populate logged in parent details
      if (payload.role === "PARENT") {
        if (payload.parentType === "Mother") {
          setFormData(prev => ({
            ...prev,
            motherName: payload.name || "",
            motherPhone: payload.phoneNumber || "",
            motherWhatsapp: payload.whatsappNumber || payload.phoneNumber || "",
            motherSameAsPhone: !payload.whatsappNumber || payload.whatsappNumber === payload.phoneNumber,
          }));
        } else if (payload.parentType === "Father") {
          setFormData(prev => ({
            ...prev,
            fatherName: payload.name || "",
            fatherPhone: payload.phoneNumber || "",
            fatherWhatsapp: payload.whatsappNumber || payload.phoneNumber || "",
            fatherSameAsPhone: !payload.whatsappNumber || payload.whatsappNumber === payload.phoneNumber,
          }));
        } else {
          // If parentType wasn't explicitly set, default to Mother or user's name
          setFormData(prev => ({
            ...prev,
            motherName: payload.name || "",
            motherPhone: payload.phoneNumber || "",
            motherWhatsapp: payload.whatsappNumber || payload.phoneNumber || "",
          }));
        }
      } else {
        // Staff/Admin - fetch parents for dropdown
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users?role=PARENT`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => {
            if (res.status === 401) {
              localStorage.removeItem("token");
              window.location.href = "/login?redirect=/register";
              return null;
            }
            return res.json();
          })
          .then(data => {
            if (Array.isArray(data)) setParents(data);
            else if (data?.data && Array.isArray(data.data)) setParents(data.data);
          })
          .catch(console.error);
      }
    } catch (e) {
      console.error("Token parsing error:", e);
      localStorage.removeItem("token");
      window.location.href = "/login?redirect=/register";
      return;
    }

    // Fetch classes
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login?redirect=/register";
          return null;
        }
        return res.json();
      })
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
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === "motherPhone" && prev.motherSameAsPhone) {
        next.motherWhatsapp = value;
      }
      if (name === "fatherPhone" && prev.fatherSameAsPhone) {
        next.fatherWhatsapp = value;
      }
      return next;
    });
  };

  const handleMotherSameAsPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      motherSameAsPhone: checked,
      motherWhatsapp: checked ? prev.motherPhone : prev.motherWhatsapp,
    }));
  };

  const handleFatherSameAsPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      fatherSameAsPhone: checked,
      fatherWhatsapp: checked ? prev.fatherPhone : prev.fatherWhatsapp,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("AUTH_REQUIRED: You must be logged in to register a child.");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("dob", formData.dob);
      if (formData.gender) formDataToSend.append("gender", formData.gender);
      if (formData.classCategoryId) formDataToSend.append("classCategoryId", formData.classCategoryId);
      formDataToSend.append("medicalInfo[allergies]", formData.allergies);
      formDataToSend.append("medicalInfo[emergencyContacts][0][name]", formData.emergencyContact || formData.motherName || formData.fatherName);
      formDataToSend.append("medicalInfo[emergencyContacts][0][phone]", formData.motherPhone || formData.fatherPhone || "");

      // Mother Information
      if (formData.motherName) formDataToSend.append("parentsInfo[mother][name]", formData.motherName);
      if (formData.motherPhone) formDataToSend.append("parentsInfo[mother][phone]", formData.motherPhone);
      if (formData.motherWhatsapp) formDataToSend.append("parentsInfo[mother][whatsapp]", formData.motherWhatsapp);

      // Father Information
      if (formData.fatherName) formDataToSend.append("parentsInfo[father][name]", formData.fatherName);
      if (formData.fatherPhone) formDataToSend.append("parentsInfo[father][phone]", formData.fatherPhone);
      if (formData.fatherWhatsapp) formDataToSend.append("parentsInfo[father][whatsapp]", formData.fatherWhatsapp);

      // Parent Link (for Staff/Admin selecting a registered parent)
      if (formData.parentId) {
        formDataToSend.append("parentId", formData.parentId);
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
        if (response.status === 401) {
          localStorage.removeItem("token");
          setError({
            title: "Session Expired",
            message: "Your login session has expired. Please log in again to register your child.",
            isAuthError: true,
          });
          return;
        }
        throw new Error(data.message || "Failed to register child");
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: "",
        dob: "",
        gender: "",
        classCategoryId: "",
        allergies: "",
        emergencyContact: "",
        parentId: "",
        motherName: "",
        motherPhone: "",
        motherWhatsapp: "",
        motherSameAsPhone: true,
        fatherName: "",
        fatherPhone: "",
        fatherWhatsapp: "",
        fatherSameAsPhone: true,
      });
      setChildImageFile(null);
      setFiles([]);

    } catch (err: any) {
      if (err.message?.includes("AUTH_REQUIRED")) {
        setError({
          title: "Authentication Required",
          message: "You must be logged in to register a child.",
          isAuthError: true,
        });
      } else {
        setError({
          title: "Registration Failed",
          message: err.message || "Failed to register child. Please check all fields and try again.",
          isAuthError: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setSuccess(false);
    window.location.href = "/";
  };

  const handleAuthErrorConfirm = () => {
    setError(null);
    window.location.href = "/login?redirect=/register";
  };

  return (
    <div className="register-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="register-card glass-panel animate-fade-in">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div className="register-header">
          <h2>Enroll a Child</h2>
          <p>Fill out the information below to register a new child and generate their security handoff code.</p>
        </div>

        {error && (
          <Modal
            isOpen={!!error}
            type="error"
            title={error.title}
            onClose={() => setError(null)}
            onConfirm={error.isAuthError ? handleAuthErrorConfirm : () => setError(null)}
            confirmText={error.isAuthError ? "Sign In" : "OK"}
          >
            <p>{error.message}</p>
          </Modal>
        )}

        <Modal
          isOpen={success}
          type="success"
          title="Successfully Registered!"
          onConfirm={handleSuccessConfirm}
          confirmText="Return to Dashboard"
        >
          <p>The child has been registered and their 6-digit security code has been generated securely!</p>
        </Modal>

        <form className="register-form" onSubmit={handleSubmit}>
          {/* Child Basic Details */}
          <div className="form-section">
            <h3>Child's Basic Details</h3>
            <div className="input-group">
              <label>Child's Full Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Liam Smith"
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Date of Birth <span className="required">*</span></label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Gender <span className="required">*</span></label>
                <select
                  className="select-input"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Class Category (Optional)</label>
              <select
                className="select-input"
                name="classCategoryId"
                value={formData.classCategoryId}
                onChange={handleChange}
              >
                <option value="">Auto-assign based on age</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <small className="text-secondary">If left unselected, class will automatically match child's age.</small>
            </div>

            {currentUserRole !== "PARENT" && (
              <div className="input-group" style={{ marginTop: '0.5rem' }}>
                <label>Link Existing Parent Account (Optional)</label>
                <select name="parentId" value={formData.parentId} onChange={handleChange}>
                  <option value="">Enter parent details manually below</option>
                  {parents.map(p => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                  ))}
                </select>
                <small className="text-secondary">Link an existing account or fill in Mother & Father details below.</small>
              </div>
            )}
          </div>

          {/* Mother's Details */}
          <div className="form-section">
            <h3>Mother's Information</h3>
            <div className="input-group">
              <label>Mother's Full Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                placeholder="e.g. Sarah Smith"
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Mother's Call Line (Phone)</label>
                <input
                  type="tel"
                  name="motherPhone"
                  value={formData.motherPhone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>

              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="motherWhatsapp">Mother's WhatsApp Line</label>
                </div>
                <input
                  type="tel"
                  name="motherWhatsapp"
                  id="motherWhatsapp"
                  value={formData.motherWhatsapp}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.motherSameAsPhone}
                    onChange={handleMotherSameAsPhoneChange}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>WhatsApp is same as Call Line</span>
                </label>
              </div>
            </div>
          </div>

          {/* Father's Details */}
          <div className="form-section">
            <h3>Father's Information</h3>
            <div className="input-group">
              <label>Father's Full Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Father's Call Line (Phone)</label>
                <input
                  type="tel"
                  name="fatherPhone"
                  value={formData.fatherPhone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>

              <div className="input-group">
                <label htmlFor="fatherWhatsapp">Father's WhatsApp Line</label>
                <input
                  type="tel"
                  name="fatherWhatsapp"
                  id="fatherWhatsapp"
                  value={formData.fatherWhatsapp}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.fatherSameAsPhone}
                    onChange={handleFatherSameAsPhoneChange}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>WhatsApp is same as Call Line</span>
                </label>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="form-section">
            <h3>Medical Information & Emergency Contact</h3>
            <div className="input-group">
              <label>Allergies / Special Needs</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Peanuts, Penicillin (or leave blank if none)"
              />
            </div>
            <div className="input-group">
              <label>Additional Emergency Contact (Name & Phone)</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder="e.g. Grandma Rose - 08012345678"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="form-section">
            <h3>Photos (For Handoff Verification)</h3>
            <div className="upload-grid">
              <div className="file-upload-zone">
                <span className="upload-icon">📷</span>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Child's Photo</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setChildImageFile(e.target.files?.[0] || null)}
                  className="file-input"
                />
                <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {childImageFile ? childImageFile.name : "Optional profile photo"}
                </p>
              </div>

              <div className="file-upload-zone">
                <span className="upload-icon">👥</span>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Parent / Caregiver Photos</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                  {files.length > 0 ? `${files.length} photo(s) selected` : "For pickup visual verification"}
                </p>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary submit-btn hover-lift" disabled={loading}>
            {loading ? "Registering Child..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
