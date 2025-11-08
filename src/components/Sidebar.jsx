import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/dynamic', label: 'Dynamic Dashboard', icon: '🎯' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
  ];

  const userLinks = [
    { path: '/user/overview', label: 'Overview', icon: '👁️' },
    { path: '/user/dynamic', label: 'Dynamic Dashboard', icon: '🎯' },
  ];

  const links = isAdmin() ? adminLinks : userLinks;

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-800 min-h-screen border-r border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-2">
        <h2 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Navigation</h2>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors text-sm ${
                isActive(link.path)
                  ? 'bg-[#4CAF50] dark:bg-[#4CAF50] text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

