"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../page.css";
import "./mentor.css";

export default function MentorDashboard() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [user, setUser] = useState<any>(null);
  const [serviceLinks, setServiceLinks] = useState<any[]>([]);
  
  const [materialForm, setMaterialForm] = useState({ title: "", type: "Sermon Note", content: "" });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] as string));
      setUser(payload);
    } catch (e) {}

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/categories`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
          if (data.length > 0) setSelectedClass(data[0]);
        }
      })
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/service-links`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setServiceLinks(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const token = localStorage.getItem('token');
    
    // Fetch children for selected class
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/class/${selectedClass._id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChildren(data);
      })
      .catch(console.error);
      
    // Fetch today's attendance
    const today = new Date().toISOString().split('T')[0];
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance/class/${selectedClass._id}/${today}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const attMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
          data.forEach(a => {
            attMap[a.childId._id || a.childId] = a.status;
          });
          setAttendance(attMap);
        }
      })
      .catch(console.error);
  }, [selectedClass]);

  const handleMarkAttendance = async (childId: string, status: 'PRESENT' | 'ABSENT') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/attendance/mark`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ childId, status })
      });
      if (res.ok) {
        setAttendance(prev => ({ ...prev, [childId]: status }));
      }
    } catch (e) {
      console.error("Failed to mark attendance", e);
    }
  };

  const handlePublishMaterial = async () => {
    if (!selectedClass) return alert("Select a class first");
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/materials`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...materialForm, classCategoryId: selectedClass._id })
      });
      if (res.ok) {
        alert("Material published!");
        setMaterialForm({ title: "", type: "Sermon Note", content: "" });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewServiceLink = async (link: any) => {
    // Open in new tab
    window.open(link.url, '_blank');
    // Log view
    const token = localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/service-links/${link._id}/view`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    }).catch(console.error);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;
  return (
    <div className="mentor-container">
      {/* Background Orbs reused for consistent aesthetic */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <div className="logo-mark">L</div>
          <h1 className="logo-text">Light <span className="gradient-text">Kids</span></h1>
        </div>
        <div className="user-profile">
          <div className="avatar">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Mentor'}`} alt="Mentor Profile" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Mentor'}</span>
            <span className="user-role">Teacher / Mentor</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/" className="back-link">← Back to Dashboard</Link>
        </div>
        <section className="welcome-section animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="welcome-title">Your Class Overview 📚</h2>
            <p className="welcome-subtitle">Manage attendance and academic materials for your assigned class.</p>
          </div>
          <div>
            <select 
              className="select-input" 
              value={selectedClass?._id || ""}
              onChange={e => setSelectedClass(classes.find(c => c._id === e.target.value))}
            >
              {classes.length === 0 && <option>No classes assigned</option>}
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </section>

        <section className="mentor-actions animate-fade-in">
          <div className="stats-row">
            <div className="stat-card glass-panel">
              <div className="stat-info">
                <h3>Total Students</h3>
                <p className="stat-value">{children.length}</p>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-info">
                <h3>Present Today</h3>
                <p className="stat-value text-secondary">{presentCount}</p>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-info">
                <h3>Absent Today</h3>
                <p className="stat-value" style={{ color: 'var(--danger)' }}>{absentCount}</p>
              </div>
            </div>
          </div>

          <div className="grid-2-col">
            {/* Mark Attendance Section */}
            <div className="action-card glass-panel hover-lift">
              <h3 className="card-title">Mark Daily Attendance</h3>
              <p className="text-secondary mb-4">Easily mark who is present and absent today.</p>
              <div className="attendance-list">
                {children.length === 0 ? <p>No children in this class.</p> : children.map((child) => (
                  <div key={child._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <div className="student-row" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                      <div className="student-info">
                        <div className="student-avatar">{child.firstName[0]}</div>
                        <span>{child.firstName} {child.lastName}</span>
                      </div>
                      <div className="attendance-toggles">
                        <button 
                          className={`btn-toggle present ${attendance[child._id] === 'PRESENT' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(child._id, 'PRESENT')}
                        >Present</button>
                        <button 
                          className={`btn-toggle absent ${attendance[child._id] === 'ABSENT' ? 'active' : ''}`}
                          onClick={() => handleMarkAttendance(child._id, 'ABSENT')}
                        >Absent</button>
                      </div>
                    </div>
                    
                    {attendance[child._id] === 'ABSENT' && child.parentIds && child.parentIds.length > 0 && (
                      <div style={{ marginLeft: '3rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,50,50,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}><strong>Parent:</strong> {child.parentIds[0].name}</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {child.parentIds[0].phoneNumber && (
                            <a href={`tel:${child.parentIds[0].phoneNumber}`} className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem' }}>📞 Call Parent</a>
                          )}
                          {child.parentIds[0].whatsappNumber && (
                            <a href={`https://wa.me/${child.parentIds[0].whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ padding: '0.2rem 0.5rem' }}>💬 WhatsApp</a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Service Links Section */}
            <div className="action-card glass-panel hover-lift" style={{ marginTop: '2rem' }}>
              <h3 className="card-title">Private Service Links</h3>
              <p className="text-secondary mb-4">Internal broadcasts and team meetings.</p>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {serviceLinks.length === 0 ? <p>No service links available.</p> : serviceLinks.map(link => (
                  <div key={link._id} style={{ padding: '1rem', background: 'var(--bg-light)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>{link.title}</h4>
                      <small className="text-secondary">{new Date(link.createdAt).toLocaleString()}</small>
                    </div>
                    <button onClick={() => handleViewServiceLink(link)} className="btn btn-outline btn-sm">View Link</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Material Section */}
            <div className="action-card glass-panel hover-lift" style={{ marginTop: '2rem' }}>
              <h3 className="card-title">Upload Academic Material</h3>
              <p className="text-secondary mb-4">Share assignments, projects, or sermon notes with parents.</p>
              
              <form className="upload-form">
                <div className="input-group">
                  <label>Material Type</label>
                  <select className="select-input">
                    <option>Sermon Note</option>
                    <option>Assignment</option>
                    <option>Project</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Title</label>
                  <input type="text" placeholder="e.g. Weekly Memory Verse" className="text-input" value={materialForm.title} onChange={e => setMaterialForm({...materialForm, title: e.target.value})} />
                </div>

                <div className="input-group">
                  <label>Upload File / Notes</label>
                  <textarea placeholder="Write notes here or upload a file..." className="textarea-input" rows={4} value={materialForm.content} onChange={e => setMaterialForm({...materialForm, content: e.target.value})}></textarea>
                </div>

                <button type="button" onClick={handlePublishMaterial} className="btn btn-primary mt-2">Publish Material</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
