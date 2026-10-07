"use client";

import { useState, useEffect } from "react";
import "./page.css";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [myKids, setMyKids] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1] as string));
      setUser(payload);
    } catch (e) {
      console.error(e);
    }

    Promise.all([
      fetch("http://localhost:3001/children/my-kids", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
      fetch("http://localhost:3001/notices", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json())
    ]).then(([kidsData, noticesData]) => {
      if (Array.isArray(kidsData)) setMyKids(kidsData);
      if (Array.isArray(noticesData)) setNotices(noticesData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Loading Dashboard...</div></div>;
  }

  return (
    <div className="home-container">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <header className="header glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="logo-section">
          <div className="logo-mark">L</div>
          <h1 className="logo-text">Light <span className="gradient-text">Kids</span></h1>
        </div>
        <div className="user-profile">
          <div className="avatar">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Profile" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.email?.split('@')[0] || 'User'}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="btn btn-outline btn-sm" style={{marginLeft: '1rem'}}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="welcome-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="welcome-title">Welcome back!</h2>
          <p className="welcome-subtitle">Here is what's happening at Light Kids today.</p>
        </section>

        {/* Dynamic Section for Parents / Mentors with Kids */}
        {(user?.role === 'PARENT' || user?.role === 'MENTOR') && myKids.length > 0 && (
          <section className="my-kids-section animate-fade-in" style={{ animationDelay: '0.3s', marginBottom: '2rem' }}>
            <h3 className="section-title">My Children & Handoff Codes</h3>
            <div className="kids-grid">
              {myKids.map(kid => (
                <div key={kid._id} className="kid-card glass-panel">
                  <div className="kid-info">
                    <h4>{kid.name}</h4>
                    <p>{kid.classCategoryId?.name || 'Assigned Class'}</p>
                  </div>
                  <div className="kid-code">
                    <span>{kid.uniqueCode}</span>
                    <small>Handoff Code</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="actions-grid animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="action-card glass-panel">
            <h3 className="card-title">Quick Actions</h3>
            <div className="action-buttons">
              {(user?.role === 'ADMIN' || user?.role === 'PARENT' || user?.role === 'MENTOR') && (
                <Link href="/register" className="btn btn-primary hover-lift text-center">Register New Child</Link>
              )}
              {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link href="/handoff" className="btn btn-secondary hover-lift text-center">Log Drop-off / Pick-up</Link>
              )}
              {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
                <Link href="/attendance" className="btn btn-secondary hover-lift text-center">Class Attendance</Link>
              )}
              <Link href="/materials" className="btn btn-secondary hover-lift text-center">Academic Materials</Link>
              {user?.role === 'ADMIN' && (
                <Link href="/promotions" className="btn btn-outline hover-lift text-center">Review Pending Promotions</Link>
              )}
              <Link href="/notices/new" className="btn btn-outline hover-lift text-center">Post Notice / Update</Link>
            </div>
          </div>

          <div className="action-card glass-panel notice-board">
            <h3 className="card-title">Live Notice Board</h3>
            <ul className="activity-list">
              {notices.length === 0 ? (
                <p style={{color: 'var(--text-secondary)'}}>No notices to display.</p>
              ) : notices.slice(0, 5).map((notice: any) => (
                <li key={notice._id} className="activity-item">
                  <div className={`activity-dot ${notice.type === 'EVENT' ? 'dot-success' : 'dot-info'}`}></div>
                  <div className="activity-details" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{notice.title}</strong>
                      <span className="badge" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--bg-main)', borderRadius: '4px' }}>
                        {notice.type}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{notice.content}</p>
                    {notice.dressCode && <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>Dresscode: {notice.dressCode}</p>}
                    <span className="activity-time" style={{ marginTop: '0.5rem', display: 'block' }}>
                      By {notice.authorId?.name} • {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
