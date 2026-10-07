import "./mentor.css";

export default function MentorDashboard() {
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
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=MentorAlex" alt="Mentor Profile" />
          </div>
          <div className="user-info">
            <span className="user-name">Alex Johnson</span>
            <span className="user-role">Mentor (7-9 Yrs)</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="welcome-section animate-fade-in">
          <h2 className="welcome-title">Your Class Overview 📚</h2>
          <p className="welcome-subtitle">Manage attendance and academic materials for your assigned class.</p>
        </section>

        <section className="mentor-actions animate-fade-in">
          {/* Quick Stats */}
          <div className="stats-row">
            <div className="stat-card glass-panel">
              <div className="stat-info">
                <h3>Total Students</h3>
                <p className="stat-value">24</p>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-info">
                <h3>Present Today</h3>
                <p className="stat-value text-secondary">22</p>
              </div>
            </div>
          </div>

          <div className="grid-2-col">
            {/* Mark Attendance Section */}
            <div className="action-card glass-panel hover-lift">
              <h3 className="card-title">Mark Daily Attendance</h3>
              <p className="text-secondary mb-4">Easily mark who is present and absent today.</p>
              <div className="attendance-list">
                {['Emma', 'Liam', 'Olivia', 'Noah'].map((child) => (
                  <div key={child} className="student-row">
                    <div className="student-info">
                      <div className="student-avatar">{child[0]}</div>
                      <span>{child}</span>
                    </div>
                    <div className="attendance-toggles">
                      <button className="btn-toggle present active">Present</button>
                      <button className="btn-toggle absent">Absent</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary w-full mt-4">Save Attendance</button>
            </div>

            {/* Upload Material Section */}
            <div className="action-card glass-panel hover-lift">
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
                  <input type="text" placeholder="e.g. Weekly Memory Verse" className="text-input" />
                </div>

                <div className="input-group">
                  <label>Upload File / Notes</label>
                  <textarea placeholder="Write notes here or upload a file..." className="textarea-input" rows={4}></textarea>
                </div>

                <button type="button" className="btn btn-primary mt-2">Publish Material</button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
