import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPages } from '../../api/pages';
import Loader from '../../components/Loader';
import { toast } from 'react-toastify';

const Overview = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const pagesRes = await getPages();
      setPages(pagesRes.data || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Content Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Pages</p>
              <p className="text-3xl font-bold text-gray-800">{pages.length}</p>
            </div>
            <div className="text-4xl">📄</div>
          </div>
        </div>

        <Link to="/user/dynamic" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Dynamic Dashboard</p>
              <p className="text-sm text-gray-500 mt-1">View all content</p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </Link>

        <Link to="/user/dynamic" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Quick Access</p>
              <p className="text-sm text-gray-500 mt-1">Use Dynamic Dashboard</p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Pages</h2>
          </div>
          <div className="p-6">
            {pages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pages available</p>
            ) : (
              <div className="space-y-3">
                {pages.map((page) => (
                  <div key={page._id || page.id} className="p-3 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800">{page.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">ID: {page._id || page.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

