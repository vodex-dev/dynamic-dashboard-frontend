import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPages } from '../api/pages';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState({
    pages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const pagesRes = await getPages();
      const pages = pagesRes.data || [];

      setStats({
        pages: pages.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Don't show error for 404 (endpoints not implemented yet)
      if (error.response?.status !== 404) {
        toast.error('Failed to load statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-xl font-bold text-[#007BFF] dark:text-[#60A5FA] mb-3">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border-l-4 border-[#007BFF] dark:border-[#60A5FA] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">Total Pages</p>
              <p className="text-2xl font-bold text-[#007BFF] dark:text-[#60A5FA] mt-1">{stats.pages}</p>
            </div>
            <div className="text-3xl opacity-20 text-[#007BFF] dark:text-[#60A5FA]">📄</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border-l-4 border-[#4CAF50] dark:border-[#81C784] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">Dynamic Dashboard</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View pages, sections & fields</p>
            </div>
            <div className="text-3xl opacity-20 text-[#4CAF50] dark:text-[#81C784]">🎯</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border-l-4 border-[#4CAF50] dark:border-[#81C784] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">Quick Access</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use Dynamic Dashboard</p>
            </div>
            <div className="text-3xl opacity-20 text-[#4CAF50] dark:text-[#81C784]">⚡</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
        <h2 className="text-base font-semibold text-[#007BFF] dark:text-[#60A5FA] mb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link
            to="/admin/dynamic"
            className="p-2 bg-[#007BFF]/5 dark:bg-[#60A5FA]/10 rounded-lg hover:bg-[#007BFF]/10 dark:hover:bg-[#60A5FA]/20 transition-colors border border-[#007BFF]/20 dark:border-[#60A5FA]/30"
          >
            <h3 className="font-semibold text-sm text-[#007BFF] dark:text-[#60A5FA]">Dynamic Dashboard</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">View and manage pages, sections & fields</p>
          </Link>
          <Link
            to="/admin/dynamic"
            className="p-2 bg-[#4CAF50]/5 dark:bg-[#81C784]/10 rounded-lg hover:bg-[#4CAF50]/10 dark:hover:bg-[#81C784]/20 transition-colors border border-[#4CAF50]/20 dark:border-[#81C784]/30"
          >
            <h3 className="font-semibold text-sm text-[#4CAF50] dark:text-[#81C784]">Manage Content</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Create, edit, or delete pages</p>
          </Link>
          <Link
            to="/admin/users"
            className="p-2 bg-[#4CAF50]/5 dark:bg-[#81C784]/10 rounded-lg hover:bg-[#4CAF50]/10 dark:hover:bg-[#81C784]/20 transition-colors border border-[#4CAF50]/20 dark:border-[#81C784]/30"
          >
            <h3 className="font-semibold text-sm text-[#4CAF50] dark:text-[#81C784]">Users Management</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Manage users and permissions</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

