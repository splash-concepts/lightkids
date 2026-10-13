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
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'childImage' | 'caregiverImages') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i]) formData.append(fieldName, files[i] as Blob);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/${id}/images`, {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const updated = await res.json();
        setData({ ...data, child: updated });
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = `/login?redirect=/children/${id}`;
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/children/${id}/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = `/login?redirect=/children/${id}`;
          return null;
        }
        if (!res.ok) throw new Error("Failed to load child profile");
        return res.json();
      })
      .then(data => {
        if (data) {
          setData(data);
        }
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
    })).reverse();
  }, [data?.attendance]);

  if (loading) return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="animate-pulse" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}></div>
        <div style={{ height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}></div>
      </div>
    </div>
  );
  if (error) return <div className="home-container"><div style={{padding: '3rem', color: 'var(--danger)'}}>{error}</div></div>;
  if (!data || !data.child) return <div className="home-container"><div style={{padding: '3rem', color: 'white'}}>Child not found.</div></div>;

  const { child, attendance, materials, classes = [] } = data;

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
          classCategoryId: editData.classCategoryId || undefined,
          parentsInfo: {
            mother: {
              name: editData.motherName || '',
              phone: editData.motherPhone || '',
              whatsapp: editData.motherWhatsapp || '',
              ...(child.parentsInfo?.mother?.userId && { userId: child.parentsInfo.mother.userId })
            },
            father: {
              name: editData.fatherName || '',
              phone: editData.fatherPhone || '',
              whatsapp: editData.fatherWhatsapp || '',
              ...(child.parentsInfo?.father?.userId && { userId: child.parentsInfo.father.userId })
            }
          },
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

  const motherInfo = child.parentsInfo?.mother;
  const fatherInfo = child.parentsInfo?.father;

  return (
    <div className="home-container" style={{ minHeight: '100vh', padding: '1.5rem', boxSizing: 'border-box' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      
      <div className="dashboard-content" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <button onClick={() => window.history.back()} className="btn btn-outline btn-sm">← Back</button>
          <Link href={`/quizzes?classCategoryId=${child.classCategoryId?._id || ''}`} className="btn btn-primary btn-sm">
            📖 Study Sermon Notes & Quiz
          </Link>
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', overflowX: 'auto', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab("overview")} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}>Overview & Family</button>
          <button onClick={() => setActiveTab("attendance")} className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-outline'}`}>Attendance Stats</button>
          <button onClick={() => setActiveTab("materials")} className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-outline'}`}>Assignments & Notes</button>
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Child Details */}
            <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
              {!isEditing ? (
                <>
                  <button onClick={() => {
                    setEditData({
                      name: child.name,
                      dob: new Date(child.dob).toISOString().split('T')[0],
                      classCategoryId: child.classCategoryId?._id || '',
                      motherName: motherInfo?.name || '',
                      motherPhone: motherInfo?.phone || '',
                      motherWhatsapp: motherInfo?.whatsapp || '',
                      fatherName: fatherInfo?.name || '',
                      fatherPhone: fatherInfo?.phone || '',
                      fatherWhatsapp: fatherInfo?.whatsapp || '',
                      medicalInfo: child.medicalInfo || {},
                      emergencyContactName: child.medicalInfo?.emergencyContacts?.[0]?.name || '',
                      emergencyContactPhone: child.medicalInfo?.emergencyContacts?.[0]?.phone || ''
                    });
                    setIsEditing(true);
                  }} className="btn btn-outline btn-sm" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>Edit Profile</button>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      {child.profileImage ? (
                        <img src={child.profileImage.startsWith('http') ? child.profileImage : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${child.profileImage}`} alt={child.name} style={{ width: '100px', height: '100px', borderRadius: '16px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '2.5rem' }}>
                          {child.name.charAt(0)}
                        </div>
                      )}
                      
                      <label style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--secondary)', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }} title="Change photo">
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'childImage')} disabled={uploadingImage} />
                        ✏️
                      </label>
                    </div>
                    <div>
                      <h1 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{child.name}</h1>
                      <span className="badge" style={{ background: 'var(--primary)', padding: '0.3rem 0.75rem', borderRadius: '20px', display: 'inline-block', color: 'white', fontWeight: 600 }}>
                        {child.classCategoryId?.name || 'Unassigned'}
                      </span>
                      {child.gender && (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.75rem', borderRadius: '20px', display: 'inline-block', marginLeft: '0.5rem' }}>
                          {child.gender}
                        </span>
                      )}
                      {child.classCategoryId?.mentorIds?.length > 0 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <strong>Mentors:</strong>{' '}
                          {child.classCategoryId.mentorIds.map((m: any, i: number) => (
                            <span key={m._id || i}>{m.name}{i < child.classCategoryId.mentorIds.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>DOB: <strong>{new Date(child.dob).toLocaleDateString()}</strong></p>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>Handoff Security Code: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem', letterSpacing: '2px' }}>{child.uniqueCode}</strong></p>
                    
                    {child.medicalInfo && (
                      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <h3 style={{ color: 'var(--danger)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          ⚠️ Medical Notes & Allergies
                        </h3>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Allergies:</strong> {child.medicalInfo.allergies || 'None recorded'}</p>
                        {child.medicalInfo.emergencyContacts?.map((ec: any, i: number) => (
                          ec.name && <p key={i} style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Emergency:</strong> {ec.name} {ec.phone ? `(${ec.phone})` : ''}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)', marginBottom: '0.5rem' }}>Edit Child & Parent Details</h3>
                  
                  <div className="input-group">
                    <label>Child's Full Name</label>
                    <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  </div>
                  
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <input type="date" required value={editData.dob} onChange={e => setEditData({...editData, dob: e.target.value})} />
                  </div>

                  {classes.length > 0 && (
                    <div className="input-group">
                      <label>Assigned Class</label>
                      <select value={editData.classCategoryId || ""} onChange={e => setEditData({...editData, classCategoryId: e.target.value})}>
                        <option value="">Auto-assign based on age</option>
                        {classes.map((c: any) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                  <h4 style={{ margin: 0, color: 'var(--secondary)' }}>Mother's Details</h4>
                  
                  <div className="input-group">
                    <label>Mother's Name</label>
                    <input type="text" value={editData.motherName || ''} onChange={e => setEditData({...editData, motherName: e.target.value})} placeholder="Mother's full name" />
                  </div>
                  <div className="input-group">
                    <label>Mother's Call Line</label>
                    <input type="tel" value={editData.motherPhone || ''} onChange={e => setEditData({...editData, motherPhone: e.target.value})} placeholder="+1234567890" />
                  </div>
                  <div className="input-group">
                    <label>Mother's WhatsApp Line</label>
                    <input type="tel" value={editData.motherWhatsapp || ''} onChange={e => setEditData({...editData, motherWhatsapp: e.target.value})} placeholder="+1234567890" />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
                  <h4 style={{ margin: 0, color: 'var(--accent)' }}>Father's Details</h4>
                  
                  <div className="input-group">
                    <label>Father's Name</label>
                    <input type="text" value={editData.fatherName || ''} onChange={e => setEditData({...editData, fatherName: e.target.value})} placeholder="Father's full name" />
                  </div>
                  <div className="input-group">
                    <label>Father's Call Line</label>
                    <input type="tel" value={editData.fatherPhone || ''} onChange={e => setEditData({...editData, fatherPhone: e.target.value})} placeholder="+1234567890" />
                  </div>
                  <div className="input-group">
                    <label>Father's WhatsApp Line</label>
                    <input type="tel" value={editData.fatherWhatsapp || ''} onChange={e => setEditData({...editData, fatherWhatsapp: e.target.value})} placeholder="+1234567890" />
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

                  <div className="input-group">
                    <label>Allergies</label>
                    <input type="text" value={editData.medicalInfo?.allergies || ''} onChange={e => setEditData({...editData, medicalInfo: { ...editData.medicalInfo, allergies: e.target.value }})} />
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

            {/* Parent & Guardian Cards */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Parents & Guardians</h2>

              {/* Mother Card */}
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--secondary)' }}>Mother</h3>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>Mother Line</span>
                </div>
                <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{motherInfo?.name || 'Not recorded'}</p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {motherInfo?.phone && (
                    <a href={`tel:${motherInfo.phone}`} className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                      📞 Call: {motherInfo.phone}
                    </a>
                  )}
                  {motherInfo?.whatsapp && (
                    <a href={`https://wa.me/${motherInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}>
                      💬 WhatsApp: {motherInfo.whatsapp}
                    </a>
                  )}
                </div>
              </div>

              {/* Father Card */}
              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--accent)' }}>Father</h3>
                  <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>Father Line</span>
                </div>
                <p style={{ margin: '0.25rem 0', fontWeight: 600 }}>{fatherInfo?.name || 'Not recorded'}</p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {fatherInfo?.phone && (
                    <a href={`tel:${fatherInfo.phone}`} className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                      📞 Call: {fatherInfo.phone}
                    </a>
                  )}
                  {fatherInfo?.whatsapp && (
                    <a href={`https://wa.me/${fatherInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}>
                      💬 WhatsApp: {fatherInfo.whatsapp}
                    </a>
                  )}
                </div>
              </div>

              {/* Linked Accounts */}
              {child.parentIds && child.parentIds.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Registered User Accounts</h4>
                  {child.parentIds.map((parent: any) => (
                    <div key={parent._id} style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{parent.name}</strong> {parent.parentType ? `(${parent.parentType})` : ''}
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{parent.email}</p>
                      </div>
                      {parent.phoneNumber && <span style={{ fontSize: '0.85rem' }}>{parent.phoneNumber}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Visual Pickup Caregivers */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>Authorized Pickup (Visuals)</h3>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, 'caregiverImages')} disabled={uploadingImage} />
                    {uploadingImage ? 'Uploading...' : 'Add Caregiver Photo'}
                  </label>
                </div>
                {(!child.caregiverImages || child.caregiverImages.length === 0) ? (
                  <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No authorized caregiver images added.</p>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {child.caregiverImages.map((img: string, idx: number) => (
                      <img 
                        key={idx} 
                        src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${img}`} 
                        alt="Authorized Caregiver" 
                        style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border-light)' }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--text-main)' }}>Attendance Statistics (By Month)</h2>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceStats.length > 0 ? attendanceStats : [{ name: 'No Data', Presents: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-main)', border: 'none', borderRadius: '8px', color: 'white' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Bar dataKey="Presents" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <h3 style={{ fontSize: '1.2rem', margin: '2.5rem 0 1rem 0', color: 'var(--text-main)' }}>Recent Attendance</h3>
            {attendance?.length === 0 ? (
              <p className="text-secondary">No attendance records found.</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {attendance.slice(0, 20).map((record: any) => (
                  <div key={record._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>Assignments & Sermon Notes</h2>
                <p className="text-secondary" style={{ margin: 0 }}>Materials for {child.name}'s class ({child.classCategoryId?.name})</p>
              </div>
              <Link href={`/quizzes?classCategoryId=${child.classCategoryId?._id || ''}`} className="btn btn-primary btn-sm">
                Take Weekly Quiz
              </Link>
            </div>
            
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
