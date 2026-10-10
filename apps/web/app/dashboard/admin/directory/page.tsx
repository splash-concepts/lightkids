"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Modal from "../../../../components/Modal";
import "../../../page.css";
import "../../mentor/mentor.css";

export default function UserDirectory() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("MENTOR");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", role: "MENTOR" });
  const [creating, setCreating] = useState(false);
  const [classCategories, setClassCategories] = useState<any[]>([]);
  const [assigningMentor, setAssigningMentor] = useState<any>(null);
  const [mentorClasses, setMentorClasses] = useState<string[]>([]);
  const [updatingClasses, setUpdatingClasses] = useState(false);
  const [actionResult, setActionResult] = useState<{isOpen: boolean; type: 'success' | 'error'; title: string; message: string} | null>(null);
  const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);

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
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories`, {
          headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
          if (Array.isArray(data)) setClassCategories(data);
        }).catch(console.error);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    fetchUsers(filterRole, page);
  }, [filterRole, page]);

  const fetchUsers = (role: string, pageNum: number = 1) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users?role=${role}&page=${pageNum}&limit=50`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.data)) {
          setUsers(data.data);
          setTotalPages(data.totalPages || 1);
        }
        else setUsers([]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setUsers([]);
        setLoading(false);
      });
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStaff,
          branchId: currentUser?.role === 'SUPER_ADMIN' ? branches[0]?._id : currentUser?.branchId
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create staff member");
      
      setNewStaff({ name: "", email: "", password: "", role: "MENTOR" });
      setShowAddForm(false);
      fetchUsers(filterRole, page);
      setActionResult({ isOpen: true, type: 'success', title: "Staff Created", message: "Staff member created successfully!" });
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: "Failed to Create Staff", message: err.message });
    } finally {
      setCreating(false);
    }
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
      setActionResult({ isOpen: true, type: 'success', title: "Role Changed", message: "Successfully updated user role." });
      fetchUsers(filterRole); // Refresh list
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: "Role Change Failed", message: err.message });
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
      setActionResult({ isOpen: true, type: 'success', title: "Transferred", message: "Successfully transferred user to new branch." });
      fetchUsers(filterRole);
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: "Transfer Failed", message: err.message });
    }
  };

  const handleStartAssigning = (user: any) => {
    // Find all classes this user is currently a mentor of
    const assigned = classCategories.filter(c => c.mentorIds?.some((m: any) => m._id === user._id || m === user._id)).map(c => c._id);
    setMentorClasses(assigned);
    setAssigningMentor(user);
  };

  const handleSaveAssignedClasses = async () => {
    setUpdatingClasses(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${assigningMentor._id}/classes`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ classIds: mentorClasses })
      });
      if (!res.ok) throw new Error("Failed to assign classes");
      
      setActionResult({ isOpen: true, type: 'success', title: "Classes Assigned", message: "Classes assigned successfully!" });
      setAssigningMentor(null);
      // Re-fetch classes to update local state so next click is fresh
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/class-categories`, {
        headers: { "Authorization": `Bearer ${token}` }
      }).then(r => r.json()).then(data => { if (Array.isArray(data)) setClassCategories(data); });
      
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: "Failed to Assign", message: err.message });
    } finally {
      setUpdatingClasses(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to approve user");
      
      setActionResult({ isOpen: true, type: 'success', title: "User Approved", message: "User approved successfully!" });
      fetchUsers(filterRole, page);
    } catch (err: any) {
      setActionResult({ isOpen: true, type: 'error', title: "Approval Failed", message: err.message });
    }
  };

  return (
    <div className="mentor-container" style={{ minHeight: '100vh' }}>
      <div className="orb orb-1"></div>
      
      {/* Action Modals */}
      {actionResult && (
        <Modal 
          isOpen={actionResult.isOpen} 
          type={actionResult.type} 
          title={actionResult.title} 
          onConfirm={() => setActionResult(null)}
          onClose={() => setActionResult(null)}
        >
          <p>{actionResult.message}</p>
        </Modal>
      )}

      {confirmAction && (
        <Modal 
          isOpen={confirmAction.isOpen} 
          type="confirm" 
          title={confirmAction.title} 
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onClose={() => setConfirmAction(null)}
          confirmText="Yes, Proceed"
        >
          <p>{confirmAction.message}</p>
        </Modal>
      )}

      <header className="header glass-panel animate-fade-in">
        <div className="logo-section">
          <Link href="/dashboard/admin" className="btn btn-outline btn-sm">← Back</Link>
          <h1 className="logo-text" style={{ marginLeft: '1rem' }}>User <span className="gradient-text">Directory</span></h1>
        </div>
      </header>

      <div className="dashboard-content" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className={`btn ${filterRole === 'PARENT' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setFilterRole('PARENT'); setPage(1); }}>Parents</button>
              <button className={`btn ${filterRole === 'MENTOR' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setFilterRole('MENTOR'); setPage(1); }}>Teachers / Mentors</button>
              <button className={`btn ${filterRole === 'MINISTER' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setFilterRole('MINISTER'); setPage(1); }}>Ministers</button>
              <button className={`btn ${filterRole === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setFilterRole('ADMIN'); setPage(1); }}>Administrators</button>
            </div>
            
            <button className="btn btn-secondary" onClick={() => setShowAddForm(true)}>
              + Add Staff Member
            </button>
          </div>

          <Modal 
            isOpen={showAddForm} 
            title="Create New Staff Member" 
            onClose={() => setShowAddForm(false)}
          >
            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div className="input-group">
                <label>Temporary Password</label>
                <input type="text" required value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} placeholder="SecretPassword123" />
              </div>
              <div className="input-group">
                <label>Assign Role</label>
                <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                  <option value="MENTOR">Mentor / Teacher</option>
                  <option value="MINISTER">Minister</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={creating} style={{ marginTop: '1rem' }}>
                {creating ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </Modal>

          {loading ? <p>Loading users...</p> : (
            <div className="users-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {users.length === 0 ? <p>No users found for this role.</p> : users.map(user => (
                <div key={user._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                    <Link href={`/users/${user._id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'block', cursor: 'pointer' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{user.name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.email}</p>
                      <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!user.isApproved && (
                      <button onClick={(e) => { e.preventDefault(); handleApproveUser(user._id); }} className="btn btn-outline btn-sm" style={{ padding: '0.4rem 1rem', borderColor: 'var(--success)', color: 'var(--success)' }}>
                        Approve Account
                      </button>
                    )}
                    <span className="badge" style={{ background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '20px' }}>{user.role}</span>
                    
                    {user.role === 'MENTOR' && currentUser?.role !== 'PARENT' && (
                      <button onClick={(e) => { e.preventDefault(); handleStartAssigning(user); }} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 1rem' }}>
                        Assign Classes
                      </button>
                    )}

                    {currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' ? (
                      <>
                        {user.role === 'PARENT' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="checkbox" 
                              id={`mentor-${user._id}`} 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  e.target.checked = false; // Reset visually until confirmed
                                  setConfirmAction({
                                    isOpen: true,
                                    title: "Promote to Mentor?",
                                    message: "Are you sure you want to promote this parent to a Mentor? They will be managed from the Mentors section.",
                                    onConfirm: () => handleRoleChange(user._id, 'MENTOR')
                                  });
                                }
                              }} 
                            />
                            <label htmlFor={`mentor-${user._id}`} style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Now a Children Mentor</label>
                          </div>
                        ) : (
                          <>
                            <select 
                              value={user.role} 
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setConfirmAction({
                                  isOpen: true,
                                  title: "Change Role?",
                                  message: `Are you sure you want to change this user's role to ${newRole}?`,
                                  onConfirm: () => handleRoleChange(user._id, newRole)
                                });
                              }}
                              style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border-color)' }}
                            >
                              <option value="PARENT">PARENT</option>
                              <option value="MENTOR">MENTOR</option>
                              <option value="MINISTER">MINISTER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>

                            <input 
                              type="text" 
                              placeholder="Office (e.g. HOD)" 
                              defaultValue={user.office || ""}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val !== user.office) {
                                  fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/admin/users/${user._id}/role`, {
                                    method: 'PATCH',
                                    headers: { "Authorization": `Bearer ${localStorage.getItem('token')}`, "Content-Type": "application/json" },
                                    body: JSON.stringify({ office: val })
                                  }).then(() => fetchUsers(filterRole)).catch(console.error);
                                }
                              }}
                              style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-main)', color: 'white', border: '1px solid var(--border-color)', width: '120px' }}
                            />
                          </>
                        )}
                        
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
                    ) : null}
                  </div>
                </div>
                
                {assigningMentor?._id === user._id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Assign Classes to {user.name}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
                      {classCategories.map(cls => (
                        <label key={cls._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={mentorClasses.includes(cls._id)}
                            onChange={(e) => {
                              if (e.target.checked) setMentorClasses([...mentorClasses, cls._id]);
                              else setMentorClasses(mentorClasses.filter(id => id !== cls._id));
                            }}
                          />
                          {cls.name}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={handleSaveAssignedClasses} className="btn btn-primary btn-sm" disabled={updatingClasses}>
                        {updatingClasses ? "Saving..." : "Save Assignments"}
                      </button>
                      <button onClick={() => setAssigningMentor(null)} className="btn btn-outline btn-sm">Cancel</button>
                    </div>
                    </div>
                  )}
                </div>
              ))}
              
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                  <button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                  <button className="btn btn-outline" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
