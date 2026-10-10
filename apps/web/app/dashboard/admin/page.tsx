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
  const [serviceLinks, setServiceLinks] = useState<any[]>([]);
  const [newServiceLink, setNewServiceLink] = useState({ title: "", url: "" });
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClassMap, setSelectedClassMap] = useState<Record<string, string>>({});
  const [teacherNoteMap, setTeacherNoteMap] = useState<Record<string, string>>({});

  const fetchCategories = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(console.error);
  };

  const fetchServiceLinks = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/service-links`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setServiceLinks(data); })
      .catch(console.error);
  };

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
    fetchCategories();
    fetchServiceLinks();
  }, []);

  const handleMarkMentorAttendance = (userId: string, isAbsent: boolean) => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance/mark`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: isAbsent ? 'ABSENT' : 'PRESENT' })
    }).then(() => fetchStats()).catch(e => alert(e.message));
  };

  const handlePromote = async (childId: string) => {
    const newClassCategoryId = selectedClassMap[childId];
    if (!newClassCategoryId) {
      alert("Please select a target class first.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/${childId}/promote`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newClassCategoryId, note: teacherNoteMap[childId] || "" }), 
      });
      if (response.ok) {
        alert("Child promoted successfully!");
        fetchStats();
      } else {
        alert("Failed to promote child.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
  };

  const handleCreateServiceLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/service-links`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newServiceLink), 
      });
      if (response.ok) {
        alert("Service link created successfully!");
        setNewServiceLink({ title: "", url: "" });
        fetchServiceLinks();
      } else {
        alert("Failed to create service link.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    }
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
          <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: '40px', width: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}></div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>)}
            </div>
            <div style={{ height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}></div>
          </div>
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
              <button className={`btn ${activeTab === 'promotions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('promotions')}>Due for Promotion</button>
              <button className={`btn ${activeTab === 'service_links' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('service_links')}>Service Links</button>
            </div>

            {activeTab === 'overview' && (
              <>
                <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <Link href="/dashboard/admin/children" className="stat-card glass-panel hover-lift" style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div className="stat-info">
                      <h3>Total Children</h3>
                      <p className="stat-value">{stats?.totalChildren || 0}</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/directory" className="stat-card glass-panel hover-lift" style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div className="stat-info">
                      <h3>Total Parents</h3>
                      <p className="stat-value text-secondary">{stats?.totalParents || 0}</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/directory" className="stat-card glass-panel hover-lift" style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div className="stat-info">
                      <h3>Total Mentors</h3>
                      <p className="stat-value text-accent">{stats?.totalMentors || 0}</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/admin/attendance" className="stat-card glass-panel hover-lift" style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'transform 0.2s' }}>
                    <div className="stat-info">
                      <h3>Present Today</h3>
                      <p className="stat-value text-success" style={{ color: 'var(--secondary)' }}>{stats?.presentToday || 0}</p>
                    </div>
                  </Link>
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
                
                {stats?.pastWeekAbsents && stats.pastWeekAbsents.length > 0 && (
                  <div style={{ marginTop: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Past 7 Days Absences</h3>
                    <div style={{ overflowX: 'auto', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem' }}>Date</th>
                            <th style={{ padding: '1rem' }}>Child Name</th>
                            <th style={{ padding: '1rem' }}>Class</th>
                            <th style={{ padding: '1rem' }}>Parent Contact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.pastWeekAbsents.map((record: any) => (
                            <tr key={record._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </td>
                              <td style={{ padding: '1rem', fontWeight: 'bold' }}>{record.childId?.name}</td>
                              <td style={{ padding: '1rem' }}>
                                <span className="badge" style={{ background: 'var(--accent)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                  {record.childId?.classCategoryId?.name || 'Class'}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                {record.childId?.parentIds?.map((p: any, idx: number) => (
                                  <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    {p.name}: {p.phoneNumber ? <a href={`tel:${p.phoneNumber}`} style={{ color: 'var(--secondary)', marginRight: '0.5rem' }}>{p.phoneNumber}</a> : null}
                                    {p.whatsappNumber ? <a href={`https://wa.me/${p.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>WhatsApp</a> : null}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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

            {activeTab === 'promotions' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Due for Promotion</h3>
                <p className="text-secondary mb-4">Children who have crossed the age threshold for their current class.</p>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {stats?.today?.promotableKids?.length === 0 ? <p>No children require promotion at this time.</p> : stats?.today?.promotableKids?.map((child: any) => (
                    <div key={child._id} style={{ padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                      <div className="child-info" style={{ flex: '1 1 100%' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{child.name}</h4>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Current: {child.classCategoryId?.name} • DOB: {new Date(child.dob).toLocaleDateString()}</p>
                      </div>
                      
                      <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <select 
                          value={selectedClassMap[child._id] || ""} 
                          onChange={(e) => setSelectedClassMap({ ...selectedClassMap, [child._id]: e.target.value })}
                          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-light)', color: 'var(--text-main)' }}
                        >
                          <option value="">Select Next Class...</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Teacher/Admin Note (Optional)" 
                          value={teacherNoteMap[child._id] || ""} 
                          onChange={(e) => setTeacherNoteMap({ ...teacherNoteMap, [child._id]: e.target.value })}
                          style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-light)', color: 'var(--text-main)' }}
                        />
                      </div>
                      
                      <button className="btn btn-primary" onClick={() => handlePromote(child._id)}>
                        Approve Promotion
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'service_links' && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Private Service Links</h3>
                <p className="text-secondary mb-4">Create links for private broadcasts or internal team meetings. Mentors can view these from their dashboard.</p>
                
                <form onSubmit={handleCreateServiceLink} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="Link Title (e.g. Sunday Service Broadcast)" 
                    value={newServiceLink.title}
                    onChange={(e) => setNewServiceLink({...newServiceLink, title: e.target.value})}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-light)' }}
                    required
                  />
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={newServiceLink.url}
                    onChange={(e) => setNewServiceLink({...newServiceLink, url: e.target.value})}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-light)' }}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Create Link</button>
                </form>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  {serviceLinks.length === 0 ? <p>No service links created yet.</p> : serviceLinks.map((link: any) => (
                    <div key={link._id} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>{link.title}</h4>
                          <a href={link.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>{link.url}</a>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Created: {new Date(link.createdAt).toLocaleString()}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', minWidth: '200px' }}>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--secondary)' }}>Viewed By ({link.viewedBy?.length || 0})</h5>
                          {link.viewedBy?.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                              {link.viewedBy.map((u: any) => <li key={u._id}>{u.name} ({u.role})</li>)}
                            </ul>
                          ) : <span style={{ fontSize: '0.85rem' }}>No views yet</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </section>
        )}
      </div>
    </div>
  );
}
