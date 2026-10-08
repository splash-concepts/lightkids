"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../mentor/mentor.css";

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("PARENT");

  useEffect(() => {
    fetchUsers(filterRole);
  }, [filterRole]);

  const fetchUsers = (role: string) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users?role=${role}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setUsers([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setUsers([]);
        setLoading(false);
      });
  };

  return (
    <div className="mentor-container" style={{ minHeight: '100vh' }}>
      <div className="orb orb-1"></div>
      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <Link href="/dashboard/admin" className="btn btn-outline btn-sm">← Back</Link>
          <h1 className="logo-text" style={{ marginLeft: '1rem' }}>User <span className="gradient-text">Directory</span></h1>
        </div>
      </header>

      <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button className={`btn ${filterRole === 'PARENT' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('PARENT')}>Parents</button>
            <button className={`btn ${filterRole === 'MENTOR' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('MENTOR')}>Teachers / Mentors</button>
            <button className={`btn ${filterRole === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('ADMIN')}>Administrators</button>
          </div>

          {loading ? <p>Loading users...</p> : (
            <div className="users-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {users.length === 0 ? <p>No users found for this role.</p> : users.map(user => (
                <div key={user._id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{user.name}</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.email}</p>
                    <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
                  </div>
                  <div>
                    <span className="badge" style={{ background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '20px' }}>{user.role}</span>
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
