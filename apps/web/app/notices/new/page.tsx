"use client";

import { useState } from "react";
import Link from "next/link";
import "./notice.css";

export default function NewNotice() {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "PARENT_UPDATE", // Default
    dressCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Basic user role check from local storage (in real app, use context)
  let role = "PARENT";
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] || ''));
        role = payload.role;
      } catch (e) {}
    }
  }

  const isAdmin = role === "ADMIN";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const endpoint = formData.type === "EVENT" ? "event" : "update";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notices/${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to post notice");
      setMessage("Notice posted successfully!");
      setFormData({ title: "", content: "", type: formData.type, dressCode: "" });
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notice-container">
      <div className="bg-shape shape-1"></div>
      
      <div className="notice-card glass-panel animate-fade-in">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div className="notice-header">
          <h2>Post a Notice</h2>
          <p>{isAdmin ? "Create upcoming events or updates." : "Send an update directly to administration."}</p>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <form className="notice-form" onSubmit={handleSubmit}>
          {isAdmin && (
            <div className="input-group">
              <label>Notice Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="EVENT">Public Event</option>
                <option value="PARENT_UPDATE">Admin Private Update</option>
              </select>
            </div>
          )}

          <div className="input-group">
            <label>Title</label>
            <input 
              type="text" 
              name="title" 
              required 
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Coming Late Today"
            />
          </div>

          <div className="input-group">
            <label>Content</label>
            <textarea 
              name="content" 
              required 
              rows={4}
              value={formData.content}
              onChange={handleChange}
              placeholder="Provide details here..."
              style={{ padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit' }}
            />
          </div>

          {isAdmin && formData.type === "EVENT" && (
            <div className="input-group">
              <label>Proposed Dresscode (Optional)</label>
              <input 
                type="text" 
                name="dressCode" 
                value={formData.dressCode}
                onChange={handleChange}
                placeholder="e.g. Blue shirts and jeans"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Posting..." : "Post Notice"}
          </button>
        </form>
      </div>
    </div>
  );
}
