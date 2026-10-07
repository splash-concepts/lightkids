"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./promotions.css";

export default function PromotionsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClassMap, setSelectedClassMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPromotable();
    fetchCategories();
  }, []);

  const fetchPromotable = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/promotable`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setChildren(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromote = async (childId: string) => {
    const newClassCategoryId = selectedClassMap[childId];
    if (!newClassCategoryId) {
      setMessage("Please select a target class first.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/${childId}/promote`, {
        method: `PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newClassCategoryId }), 
      });
      if (response.ok) {
        setMessage("Child promoted successfully!");
        fetchPromotable();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="promo-container">
      <div className="bg-shape shape-2"></div>
      
      <div className="promo-card glass-panel animate-fade-in">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div className="promo-header">
          <h2>Pending Promotions</h2>
          <p>Children who have crossed the age threshold for their current class.</p>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <div className="promo-list">
          {loading ? <p>Loading...</p> : children.length === 0 ? (
            <p className="empty-state">No children require promotion at this time.</p>
          ) : (
            children.map((child: any) => (
              <div key={child._id} className="promo-item glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div className="child-info" style={{ flex: '1 1 100%' }}>
                  <h3>{child.name}</h3>
                  <p>Current: {child.classCategoryId?.name} • DOB: {new Date(child.dob).toLocaleDateString()}</p>
                </div>
                <select 
                  value={selectedClassMap[child._id] || ""} 
                  onChange={(e) => setSelectedClassMap({ ...selectedClassMap, [child._id]: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', flex: '1' }}
                >
                  <option value="">Select Next Class...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={() => handlePromote(child._id)}>
                  Approve Promotion
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
