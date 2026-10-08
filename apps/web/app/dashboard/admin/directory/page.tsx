"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../mentor/mentor.css";

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("PARENT");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] as string));
        setCurrentUser(payload);
        if (payload.role === 'SUPER_ADMIN') {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/branches`, {
            headers: { "Authorization": `Bearer ${token}` }
          }).then(r => r.json()).then(data => {
            if (Array.isArray(data)) setBranches(data);
          }).catch(console.error);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error("Failed to change role");
      fetchUsers(filterRole); // Refresh list
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBranchTransfer = async (userId: string, newBranchId: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${userId}/transfer`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ branchId: newBranchId })
      });
      if (!res.ok) throw new Error("Failed to transfer user");
      alert("Successfully transferred user (and children if parent) to new branch.");
      fetchUsers(filterRole); // Refresh list
    } catch (err: any) {
      alert(err.message);
    }
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
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button className={`btn ${filterRole === 'PARENT' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('PARENT')}>Parents</button>
            <button className={`btn ${filterRole === 'MENTOR' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('MENTOR')}>Teachers / Mentors</button>
            <button className={`btn ${filterRole === 'MINISTER' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('MINISTER')}>Ministers</button>
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
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '20px' }}>{user.role}</span>
                    
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border-color)' }}
                        >
                          <option value="PARENT">PARENT</option>
                          <option value="MENTOR">MENTOR</option>
                          <option value="MINISTER">MINISTER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        
                        <select 
                          value={user.branchId || ""} 
                          onChange={(e) => handleBranchTransfer(user._id, e.target.value)}
                          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border-color)' }}
                        >
                          <option value="" disabled>Transfer Branch...</option>
                          {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                          ))}
                        </select>
                      </>
                    )}
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
