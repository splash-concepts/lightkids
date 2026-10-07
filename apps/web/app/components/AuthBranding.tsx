import "./auth-branding.css";

export default function AuthBranding() {
  return (
    <div className="auth-branding-column">
      <div className="branding-content">
        <h1>Empowering the Next Generation.</h1>
        <p>A unified platform for Admins, Mentors, and Parents.</p>
        
        <ul className="feature-list">
          <li>
            <div className="feature-icon"></div>
            <div className="feature-text">
              <strong>Secure Handoffs</strong>
              <span>Unique 6-digit verification codes for drop-offs and pick-ups.</span>
            </div>
          </li>
          <li>
            <div className="feature-icon"></div>
            <div className="feature-text">
              <strong>Academic Materials</strong>
              <span>Sermon notes, projects, and assignments shared effortlessly.</span>
            </div>
          </li>
          <li>
            <div className="feature-icon"></div>
            <div className="feature-text">
              <strong>Live Notice Board</strong>
              <span>Real-time event scheduling, dress codes, and parent updates.</span>
            </div>
          </li>
          <li>
            <div className="feature-icon"></div>
            <div className="feature-text">
              <strong>Dual Roles</strong>
              <span>Mentors can easily manage their own children as parents seamlessly.</span>
            </div>
          </li>
        </ul>
      </div>
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
    </div>
  );
}
