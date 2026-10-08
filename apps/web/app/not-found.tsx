import Link from "next/link";
import "./page.css"; // Reuse dashboard styles or add custom

export default function NotFound() {
  return (
    <div className="home-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto', zIndex: 10 }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--primary)' }}>404</h1>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'white' }}>Oops! Are you lost?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          We couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Link href="/" className="btn btn-primary hover-lift">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
