import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, theme, setThemeMode } = useDarkMode();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getThemeIcon = () => {
    if (theme === 'light') return '☀️';
    if (theme === 'dark') return '🌙';
    return '💻';
  };

  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    setIsDropdownOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-12">
          <div className="flex items-center">
            <h1 className="text-base font-bold text-[#007BFF] dark:text-[#60A5FA]">Dynamic Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs text-gray-600 dark:text-gray-300">Welcome,</span>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{user?.username || user?.email}</span>
              <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-[#4CAF50]/20 dark:bg-[#4CAF50]/30 text-[#4CAF50] dark:text-[#81C784] border border-[#4CAF50]/30 dark:border-[#4CAF50]/50">
                {user?.role?.toUpperCase()}
              </span>
            </div>
            
            {/* Theme Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-1"
                title="Theme Settings"
              >
                <span className="text-lg">{getThemeIcon()}</span>
                <span className="text-xs">▼</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleThemeChange('light')}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'light' ? 'bg-gray-100 dark:bg-gray-700 text-[#007BFF] dark:text-[#60A5FA]' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>☀️</span>
                      <span>Light</span>
                      {theme === 'light' && <span className="ml-auto">✓</span>}
                    </button>
                    <button
                      onClick={() => handleThemeChange('dark')}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'bg-gray-100 dark:bg-gray-700 text-[#007BFF] dark:text-[#60A5FA]' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>🌙</span>
                      <span>Dark</span>
                      {theme === 'dark' && <span className="ml-auto">✓</span>}
                    </button>
                    <button
                      onClick={() => handleThemeChange('system')}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'system' ? 'bg-gray-100 dark:bg-gray-700 text-[#007BFF] dark:text-[#60A5FA]' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>💻</span>
                      <span>System</span>
                      {theme === 'system' && <span className="ml-auto">✓</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

