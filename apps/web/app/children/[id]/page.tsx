"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "../../page.css";

export default function ChildProfile() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/${id}/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load child profile");
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // Process attendance for graph
  const attendanceStats = useMemo(() => {
    if (!data?.attendance) return [];
    
    // Group by month
    const grouped = data.attendance.reduce((acc: any, record: any) => {
      if (record.status !== 'PRESENT') return acc;
      const date = new Date(record.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(grouped).map(key => ({
      name: key,
      Presents: grouped[key]
    })).reverse(); // Assuming descending from API, reverse for chronological chart
  }, [data?.attendance]);

  if (loading) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Loading Profile...</div></div>;
  if (error) return <div className="home-container"><div style={{padding: '3rem', color: 'var(--danger)'}}>{error}</div></div>;
  if (!data || !data.child) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Child not found.</div></div>;

  if (!data || !data.child) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Child not found.</div></div>;

  const { child, attendance, materials } = data;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/${id}`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          dob: editData.dob,
          medicalInfo: {
            allergies: editData.medicalInfo?.allergies || '',
            emergencyContacts: [{
               name: editData.emergencyContactName || editData.medicalInfo?.emergencyContacts?.[0]?.name || '',
               phone: editData.emergencyContactPhone || editData.medicalInfo?.emergencyContacts?.[0]?.phone || '',
               relationship: 'Emergency'
            }]
          }
        })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      
      const updated = await res.json();
      setData({ ...data, child: updated });
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="dashboard-content">
        <button onClick={() => window.history.back()} className="btn btn-outline btn-sm" style={{ marginBottom: '2rem' }}>← Back</button>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <button onClick={() => setActiveTab("overview")} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}>Overview & Images</button>
          <button onClick={() => setActiveTab("attendance")} className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}>Attendance Stats</button>
          <button onClick={() => setActiveTab("materials")} className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-outline'}`}>Assignments & Notes</button>
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Child Details */}
            <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
              {!isEditing ? (
                <>
                  <button onClick={() => {
                    setEditData({
                      name: child.name,
                      dob: new Date(child.dob).toISOString().split('T')[0],
                      medicalInfo: child.medicalInfo || {},
                      emergencyContactName: child.medicalInfo?.emergencyContacts?.[0]?.name || '',
                      emergencyContactPhone: child.medicalInfo?.emergencyContacts?.[0]?.phone || ''
                    });
                    setIsEditing(true);
                  }} className="btn btn-outline btn-sm" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>Edit Profile</button>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    {child.profileImage ? (
                      <img src={child.profileImage.startsWith('http') ? child.profileImage : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${child.profileImage}`} alt={child.name} style={{ width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                        {child.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{child.name}</h1>
                      <span className="badge" style={{ background: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-block' }}>
                        {child.classCategoryId?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>DOB: {new Date(child.dob).toLocaleDateString()}</p>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>Handoff Code: <strong>{child.uniqueCode}</strong></p>
                    
                    {child.medicalInfo && (
                      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <h3 style={{ color: 'var(--danger)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Medical Alerts</h3>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Allergies:</strong> {child.medicalInfo.allergies || 'None recorded'}</p>
                        {child.medicalInfo.emergencyContacts?.map((ec: any, i: number) => (
                          <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Emergency Contact:</strong> {ec.name} ({ec.phone}) - {ec.relationship}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)', marginBottom: '1rem' }}>Edit Child Profile</h3>
                  
                  <div className="input-group">
                    <label>Full Name</label>
                    <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }} />
                  </div>
                  
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <input type="date" required value={editData.dob} onChange={e => setEditData({...editData, dob: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }} />
                    <small className="text-secondary">Updating this will automatically re-evaluate their assigned class.</small>
                  </div>

                  <div className="input-group">
                    <label>Allergies</label>
                    <input type="text" value={editData.medicalInfo?.allergies || ''} onChange={e => setEditData({...editData, medicalInfo: { ...editData.medicalInfo, allergies: e.target.value }})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }} />
                  </div>

                  <div className="input-group">
                    <label>Emergency Contact Name</label>
                    <input type="text" value={editData.emergencyContactName} onChange={e => setEditData({...editData, emergencyContactName: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }} />
                  </div>

                  <div className="input-group">
                    <label>Emergency Contact Phone</label>
                    <input type="text" value={editData.emergencyContactPhone} onChange={e => setEditData({...editData, emergencyContactPhone: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={updating}>
                      {updating ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Parent Details */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Parent / Guardian</h2>
              {child.parentIds?.length === 0 ? (
                <p className="text-secondary">No parent linked to this child.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {child.parentIds?.map((parent: any) => (
                    <div key={parent._id} style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{parent.name}</h3>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email: {parent.email}</p>
                    </div>
                  ))}
                </div>
              )}

              {child.caregiverImages && child.caregiverImages.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Authorized Pickup (Visuals)</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {child.caregiverImages.map((img: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${img}`} 
                        alt="Authorized Caregiver" 
                        style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--border-light)' }} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-main)' }}>Attendance Statistics (By Month)</h2>
            {attendanceStats.length === 0 ? (
              <p className="text-secondary">No attendance data to generate a chart.</p>
            ) : (
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-main)', border: 'none', borderRadius: '8px', color: 'white' }} />
                    <Bar dataKey="Presents" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <h3 style={{ fontSize: '1.2rem', margin: '3rem 0 1rem 0', color: 'var(--text-main)' }}>Recent History</h3>
            {attendance?.length === 0 ? (
              <p className="text-secondary">No attendance records found.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '1rem' }}>
                {attendance.slice(0,20).map((record: any) => (
                  <div key={record._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ color: record.status === 'PRESENT' ? 'var(--secondary)' : 'var(--danger)' }}>{record.status}</strong>
                      <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    {record.reason && <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>{record.reason}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Assignments & Sermon Notes</h2>
            <p className="text-secondary" style={{ marginBottom: '2rem' }}>Materials assigned to {child.name}'s class ({child.classCategoryId?.name})</p>
            
            {materials?.length === 0 ? (
              <p className="text-secondary">No materials found for this class.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {materials.map((mat: any) => (
                  <div key={mat._id} style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>{mat.title}</h3>
                      <span className="badge" style={{ background: 'var(--bg-main)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {mat.type}
                      </span>
                    </div>
                    {mat.description && <p style={{ margin: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{mat.description}</p>}
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Posted: {new Date(mat.createdAt).toLocaleDateString()}</span>
                      {mat.fileUrl && (
                        <a 
                          href={mat.fileUrl.startsWith('http') ? mat.fileUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${mat.fileUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-primary btn-sm"
                        >
                          View Attachment
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
