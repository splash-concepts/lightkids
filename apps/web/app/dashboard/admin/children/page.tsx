"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../../page.css";
import "../../mentor/mentor.css";

export default function ChildrenDirectory() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/children`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChildren(data);
        else setChildren([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setChildren([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mentor-container" style={{ minHeight: '100vh' }}>
      <div className="orb orb-1"></div>
      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <Link href="/dashboard/admin" className="btn btn-outline btn-sm">← Back</Link>
          <h1 className="logo-text" style={{ marginLeft: '1rem' }}>Children <span className="gradient-text">Directory</span></h1>
        </div>
      </header>

      <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2>All Registered Children</h2>
          <p className="text-secondary" style={{ marginBottom: '2rem' }}>A complete list of children and their basic info.</p>

          {loading ? <p>Loading children...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {children.length === 0 ? <p>No children found.</p> : children.map(child => (
                <div key={child._id} className="action-card glass-panel hover-lift" style={{ cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>{child.name}</h3>
                    <span className="badge" style={{ background: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                      {child.classCategoryId?.name || 'Unassigned'}
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>Handoff Code: <strong>{child.uniqueCode}</strong></p>
                  <p style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>
                    Parents: {child.parentIds?.map((p: any) => p.name).join(', ') || 'N/A'}
                  </p>
                  <div style={{ marginTop: '1.5rem' }}>
                    {/* Add link to child profile details if needed */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
