"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../page.css";
import "../mentor/mentor.css"; // Reuse some styles

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/stats`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load stats. Ensure you have Admin privileges.");
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mentor-container">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <div className="logo-mark">L</div>
          <h1 className="logo-text">Light <span className="gradient-text">Kids</span></h1>
        </div>
        <div className="user-profile">
          <Link href="/" className="btn btn-outline btn-sm" style={{ marginRight: '1rem' }}>Back to Home</Link>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="welcome-section animate-fade-in">
          <h2 className="welcome-title">Administrator Dashboard ⚙️</h2>
          <p className="welcome-subtitle">Overview of system data and management controls.</p>
        </section>

        {error && (
          <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p>Loading statistics...</p>
        ) : (
          <section className="mentor-actions animate-fade-in">
            {/* Quick Stats */}
            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h3>Total Children</h3>
                  <p className="stat-value">{stats?.totalChildren || 0}</p>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h3>Total Parents</h3>
                  <p className="stat-value text-secondary">{stats?.totalParents || 0}</p>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h3>Total Mentors</h3>
                  <p className="stat-value text-accent">{stats?.totalMentors || 0}</p>
                </div>
              </div>
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <h3>Present Today</h3>
                  <p className="stat-value text-success" style={{ color: 'var(--secondary)' }}>{stats?.presentToday || 0}</p>
                </div>
              </div>
            </div>

            <div className="grid-2-col">
              {/* Management Links */}
              <div className="action-card glass-panel hover-lift">
                <h3 className="card-title">User Directory</h3>
                <p className="text-secondary mb-4">Manage Parent and Mentor profiles, and view their historic data.</p>
                <Link href="/dashboard/admin/directory" className="btn btn-primary w-full">View Directory</Link>
              </div>

              <div className="action-card glass-panel hover-lift">
                <h3 className="card-title">Children & Profiles</h3>
                <p className="text-secondary mb-4">View all registered children, their profiles, and medical info.</p>
                <Link href="/dashboard/admin/children" className="btn btn-primary w-full">Manage Children</Link>
              </div>

              <div className="action-card glass-panel hover-lift">
                <h3 className="card-title">Historic Attendance</h3>
                <p className="text-secondary mb-4">Review all past attendance records and logs.</p>
                <Link href="/dashboard/admin/attendance" className="btn btn-secondary w-full">View Attendance Logs</Link>
              </div>

              <div className="action-card glass-panel hover-lift">
                <h3 className="card-title">Class Categories</h3>
                <p className="text-secondary mb-4">Manage age groups and class assignments for your branch.</p>
                <Link href="/dashboard/admin/classes" className="btn btn-primary w-full" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>Manage Classes</Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
