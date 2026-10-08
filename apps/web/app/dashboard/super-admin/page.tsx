"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../../page.css"; // Reuse dashboard styles

export default function SuperAdminDashboard() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [newBranch, setNewBranch] = useState({ name: "", location: "", contactEmail: "" });
  const [creating, setCreating] = useState(false);

  const fetchBranches = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/branches`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();
      setBranches(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchBranches(token);
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/branches`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newBranch)
      });
      if (!res.ok) throw new Error("Failed to create branch");
      
      // Refresh list
      await fetchBranches(token as string);
      setNewBranch({ name: "", location: "", contactEmail: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Loading Super Admin...</div></div>;
  }

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="dashboard-content">
        <Link href="/" className="btn btn-outline btn-sm" style={{ marginBottom: '2rem', display: 'inline-block' }}>← Back to Home</Link>
        
        <header className="header glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Global Branches</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage all tenant branches in the system.</p>
        </header>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Create Branch Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Add New Branch</h3>
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Branch Name</label>
                <input 
                  type="text" 
                  value={newBranch.name} 
                  onChange={e => setNewBranch({...newBranch, name: e.target.value})} 
                  placeholder="e.g. Downtown Campus" 
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Location</label>
                <input 
                  type="text" 
                  value={newBranch.location} 
                  onChange={e => setNewBranch({...newBranch, location: e.target.value})} 
                  placeholder="e.g. New York, NY" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Contact Email</label>
                <input 
                  type="email" 
                  value={newBranch.contactEmail} 
                  onChange={e => setNewBranch({...newBranch, contactEmail: e.target.value})} 
                  placeholder="hello@downtown.com" 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? "Creating..." : "Create Branch"}
              </button>
            </form>
          </div>

          {/* List of Branches */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Existing Branches</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {branches.length === 0 ? (
                <p>No branches found.</p>
              ) : (
                branches.map(branch => (
                  <div key={branch._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{branch.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{branch.location || 'No location set'}</p>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {branch._id}</span>
                    </div>
                    {branch.contactEmail && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)' }}>{branch.contactEmail}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
