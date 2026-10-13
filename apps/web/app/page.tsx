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
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        window.location.href = '/login?reason=expired';
        return;
      }
      setUser(payload);
    } catch (e) {
      console.error("Invalid token format:", e);
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/my-kids`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login?reason=expired';
          return null;
        }
        return r.json();
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notices`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => {
        if (r.status === 401) return null;
        return r.json();
      })
    ]).then(([kidsData, noticesData]) => {
      if (Array.isArray(kidsData)) setMyKids(kidsData);
      if (Array.isArray(noticesData)) setNotices(noticesData);
      setLoading(false);
    }).catch(err => {
      console.error("Fetch dashboard error:", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' }}></div>
            ))}
          </div>
          
          <div style={{ height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px' }}></div>
        </div>
      </div>
    );
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
            <span className="user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
            <span className="user-role">{user?.role} {user?.parentType ? `(${user.parentType})` : ''}</span>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }} className="btn btn-outline btn-sm logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="welcome-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="welcome-title">Welcome back{user?.name ? `, ${user.name}` : ''}!</h2>
          <p className="welcome-subtitle">Here is what's happening at Light Kids today.</p>
        </section>

        {/* Dynamic Section for Parents / Mentors with Kids */}
        {(user?.role === 'PARENT' || user?.role === 'MENTOR') && (
          <section className="my-kids-section animate-fade-in" style={{ animationDelay: '0.3s', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="section-title" style={{ margin: 0 }}>My Children & Security Handoff Codes</h3>
              <Link href="/register" className="btn btn-outline btn-sm">
                + Enroll Another Child
              </Link>
            </div>

            {myKids.length > 0 ? (
              <div className="kids-grid">
                {myKids.map(kid => (
                  <Link href={`/children/${kid._id}`} key={kid._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="kid-card glass-panel" style={{ cursor: 'pointer', transition: 'transform 0.2s ease', position: 'relative', overflow: 'hidden', border: kid.todayAttendanceStatus === 'PRESENT' ? '2px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)' } as any}>
                      {kid.todayAttendanceStatus === 'PRESENT' && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--danger)', color: 'white', fontSize: '0.8rem', textAlign: 'center', padding: '0.2rem', fontWeight: 'bold' }}>
                          Action Required: Pick up your child
                        </div>
                      )}
                      {kid.todayAttendanceStatus === 'PICKED_UP' && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--accent)', color: 'white', fontSize: '0.8rem', textAlign: 'center', padding: '0.2rem', fontWeight: 'bold' }}>
                          Picked Up
                        </div>
                      )}
                      <div className="kid-info" style={{ marginTop: kid.todayAttendanceStatus ? '1.5rem' : '0' }}>
                        <h4>{kid.name}</h4>
                        <p>{kid.classCategoryId?.name || 'Assigned Class'}</p>
                      </div>
                      <div className="kid-code" style={{ marginTop: kid.todayAttendanceStatus ? '1.5rem' : '0' }}>
                        <span>{kid.uniqueCode}</span>
                        <small>Handoff Code</small>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', borderRadius: '16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👨‍👩‍👧‍👦</div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No Children Enrolled Yet</h4>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5, fontSize: '0.95rem' }}>
                  You don't have any children linked to your account yet. Register your child now to receive their secure 6-digit security code for drop-offs and pick-ups.
                </p>
                <Link href="/register" className="btn btn-primary hover-lift" style={{ padding: '0.85rem 2rem' }}>
                  Enroll Your Child Now
                </Link>
              </div>
            )}
          </section>
        )}

        <section className="actions-grid animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="action-card glass-panel">
            <h3 className="card-title">Quick Actions</h3>
            <div className="action-buttons">
              {/* Highlighted Sermon Notes & Quiz for everyone */}
              <Link href="/quizzes" className="btn btn-primary hover-lift text-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', color: 'white', borderColor: 'transparent', fontWeight: 700 }}>
                📖 Weekly Sermon Notes & Quiz
              </Link>

              {(user?.role === 'SUPER_ADMIN') && (
                <Link href="/dashboard/super-admin" className="btn btn-primary hover-lift text-center" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>Super Admin Control</Link>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Link href="/dashboard/admin" className="btn btn-primary hover-lift text-center" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>Admin Dashboard</Link>
              )}
              {(user?.role === 'MENTOR') && (
                <Link href="/dashboard/mentor" className="btn btn-primary hover-lift text-center" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>Mentor Dashboard</Link>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'PARENT' || user?.role === 'MENTOR') && (
                <Link href="/register" className="btn btn-primary hover-lift text-center">Enroll a Child</Link>
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
            <h3 className="card-title">Latest Announcements</h3>
            {notices.length === 0 ? (
              <p className="no-notices">No new announcements at this time.</p>
            ) : (
              <div className="notices-list">
                {notices.slice(0, 5).map(notice => (
                  <div key={notice._id} className="notice-item">
                    <h4>{notice.title}</h4>
                    <p>{notice.content}</p>
                    <span className="notice-date">{new Date(notice.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
