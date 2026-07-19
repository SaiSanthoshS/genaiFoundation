import { Link, useLocation } from 'react-router-dom';
import { Search, BookOpen, LayoutDashboard, Library } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const links = [
    { path: '/', name: 'Search', icon: <Search size={20} /> },
    { path: '/dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/recommendations', name: 'Shelf', icon: <Library size={20} /> },
  ];

  return (
    <nav className="sidebar">
      <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
        <h2 style={{ background: 'linear-gradient(to right, #e2e8f0, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>Smart Library</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI Powered</span>
      </div>
      
      {links.map((link) => (
        <Link 
          key={link.path} 
          to={link.path} 
          className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
        >
          {link.icon}
          {link.name}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
