"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import "../../page.css";
import "../mentor/mentor.css"; // Reuse some styles

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchStats = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
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
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchStats();
  }, []);

  const handleMarkMentorAttendance = (userId: string, isAbsent: boolean) => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance/mark`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: isAbsent ? 'ABSENT' : 'PRESENT' })
    }).then(() => fetchStats()).catch(e => alert(e.message));
  };

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
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard data...</div>
        ) : (
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={`btn ${activeTab === 'mentors' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('mentors')}>
                Absent Mentors {stats?.today?.absentMentors?.length > 0 && <span style={{background:'var(--danger)', color:'white', borderRadius:'10px', padding:'0.1rem 0.5rem', marginLeft:'0.5rem', fontSize:'0.8rem'}}>{stats.today.absentMentors.length}</span>}
              </button>
              <button className={`btn ${activeTab === 'kids_absent' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('kids_absent')}>
                Absent Kids {stats?.today?.absentKids?.length > 0 && <span style={{background:'var(--danger)', color:'white', borderRadius:'10px', padding:'0.1rem 0.5rem', marginLeft:'0.5rem', fontSize:'0.8rem'}}>{stats.today.absentKids.length}</span>}
              </button>
              <button className={`btn ${activeTab === 'kids_present' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('kids_present')}>Today's Kids ({stats?.presentToday || 0})</button>
            </div>

            {activeTab === 'overview' && (
              <>
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

                {stats?.chartData && (
                  <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Attendance Trend (Last 6 Months)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" />
                          <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                          <Tooltip contentStyle={{ background: 'var(--bg-main)', border: 'none', borderRadius: '8px', color: 'white' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                          <Bar dataKey="Presents" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

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
              </>
            )}

            {activeTab === 'mentors' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>Absent / Unlogged Mentors Today</h3>
                <p className="text-secondary mb-4">The following mentors have not signed in today. You can contact them or log their attendance on their behalf.</p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {stats?.today?.absentMentors?.length === 0 ? <p>All mentors are accounted for!</p> : stats?.today?.absentMentors?.map((mentor: any) => (
                    <div key={mentor._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{mentor.name}</h4>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                          <span className="text-secondary">{mentor.email}</span>
                          {mentor.phoneNumber && <a href={`tel:${mentor.phoneNumber}`} style={{ color: 'var(--primary)' }}>📞 {mentor.phoneNumber}</a>}
                          {mentor.whatsappNumber && <a href={`https://wa.me/${mentor.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>WhatsApp</a>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleMarkMentorAttendance(mentor._id, false)} className="btn btn-primary btn-sm">Mark Present</button>
                        <button onClick={() => handleMarkMentorAttendance(mentor._id, true)} className="btn btn-outline btn-sm">Mark Absent</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'kids_absent' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>Absent Kids Today</h3>
                <p className="text-secondary mb-4">Children who have not been dropped off. Use the parent contacts below to follow up.</p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {stats?.today?.absentKids?.length === 0 ? <p>No absent kids!</p> : stats?.today?.absentKids?.map((kid: any) => (
                    <div key={kid._id} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{kid.name}</h4>
                        <span className="badge" style={{ background: 'var(--accent)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{kid.classCategoryId?.name || 'Class'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {kid.parentIds?.map((p: any) => (
                          <div key={p._id} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}>Parent: {p.name}</p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                              {p.phoneNumber && <a href={`tel:${p.phoneNumber}`} style={{ color: 'var(--secondary)' }}>📞 {p.phoneNumber}</a>}
                              {p.whatsappNumber && <a href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>WhatsApp</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'kids_present' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Today's Kids ({stats?.presentToday || 0})</h3>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  
                  <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Dropped Off (In Service) - {stats?.today?.presentKids?.length || 0}</h4>
                    {stats?.today?.presentKids?.length === 0 ? <p className="text-secondary">No kids currently in service.</p> : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {stats?.today?.presentKids?.map((kid: any) => (
                          <div key={kid._id} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--primary-light)' }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{kid.name}</p>
                            <span className="badge" style={{ background: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{kid.classCategoryId?.name || 'Class'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />

                  <div>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Picked Up (Completed) - {stats?.today?.pickedUpKids?.length || 0}</h4>
                    {stats?.today?.pickedUpKids?.length === 0 ? <p className="text-secondary">No kids picked up yet.</p> : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {stats?.today?.pickedUpKids?.map((kid: any) => (
                          <div key={kid._id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)', opacity: 0.8 }}>
                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{kid.name}</p>
                            <span className="badge" style={{ background: 'var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{kid.classCategoryId?.name || 'Class'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            )}

          </section>
        )}
      </div>
    </div>
  );
}
