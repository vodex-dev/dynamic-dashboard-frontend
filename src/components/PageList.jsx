import { useState, useEffect } from 'react';
import { getPages, createPage, updatePage, deletePage } from '../api/pages';
import { getUserPages } from '../api/auth';
import { toast } from 'react-toastify';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';

const PageList = ({ onPageSelect, selectedPageId }) => {
  const { isAdmin, user } = useAuth();
  const [pages, setPages] = useState([]);
  const [allowedPageIds, setAllowedPageIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pageName, setPageName] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (!isAdmin() && user) {
      fetchUserPages();
    }
  }, [user, isAdmin]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await getPages();
      const allPages = response.data || [];
      setPages(allPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPages = async () => {
    try {
      // Try multiple ways to get user ID
      const userId = user?._id || user?.id || user?.userId;
      
      console.log('User object:', user);
      console.log('Attempting to get userId:', userId);
      
      if (!userId) {
        console.warn('No user ID found, cannot fetch user pages');
        console.warn('User object keys:', user ? Object.keys(user) : 'user is null');
        return;
      }
      
      console.log('Fetching user pages for userId:', userId);
      const response = await getUserPages(userId);
      console.log('User pages response:', response);
      
      // Handle different response formats
      let pageIds = [];
      if (response?.data) {
        pageIds = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        pageIds = response;
      } else if (response?.allowedPages) {
        pageIds = Array.isArray(response.allowedPages) ? response.allowedPages : [];
      }
      
      // Convert to strings and handle both string and object IDs
      const pageIdStrings = pageIds.map((id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id.toString();
        if (typeof id === 'object' && id.id) return id.id.toString();
        return id.toString();
      });
      
      console.log('Allowed page IDs:', pageIdStrings);
      setAllowedPageIds(pageIdStrings);
    } catch (error) {
      console.error('Error fetching user pages:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        responseData: error.response?.data,
      });
      
      // Handle different error statuses
      if (error.response?.status === 404) {
        console.log('No pages assigned to user (404), showing empty list');
        setAllowedPageIds([]);
      } else if (error.response?.status === 403) {
        console.warn('Access denied (403) - user may not have permission to view pages');
        // If 403, it might mean the endpoint doesn't exist or user doesn't have access
        // Show empty list for security
        setAllowedPageIds([]);
      } else {
        // For other errors, show empty list for security
        console.warn('Error fetching user pages, showing empty list');
        setAllowedPageIds([]);
      }
    }
  };

  // Filter pages based on permissions
  const getFilteredPages = () => {
    if (isAdmin()) {
      return pages; // Admin sees all pages
    }
    // Regular users see only allowed pages
    const filtered = pages.filter((page) => {
      const pageId = (page._id || page.id).toString();
      const isAllowed = allowedPageIds.includes(pageId);
      console.log('Checking page:', page.name, 'ID:', pageId, 'Allowed:', isAllowed, 'Allowed IDs:', allowedPageIds);
      return isAllowed;
    });
    console.log('Filtered pages:', filtered.length, 'out of', pages.length);
    return filtered;
  };

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setPageName(page.name);
    } else {
      setEditingPage(null);
      setPageName('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPage(null);
    setPageName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pageName.trim()) {
      toast.error('Page name is required');
      return;
    }

    try {
      if (editingPage) {
        const editingPageId = editingPage._id || editingPage.id;
        await updatePage(editingPageId, { name: pageName });
        setPages(pages.map(p => {
          const pId = p._id || p.id;
          return pId === editingPageId
            ? { ...p, name: pageName }
            : p;
        }));
        toast.success('Page updated successfully');
      } else {
        const response = await createPage({ name: pageName });
        const newPage = response.data;
        setPages([...pages, newPage]);
        toast.success('Page created successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(error.response?.data?.message || 'Failed to save page');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this page? This will also delete all sections and fields in this page.')) {
      return;
    }

    try {
      console.log('Deleting page with ID:', id);
      console.log('Page ID type:', typeof id);
      const response = await deletePage(id);
      console.log('Delete response:', response);
      setPages(pages.filter(p => {
        const pId = p._id || p.id;
        return pId !== id;
      }));
      toast.success('Page deleted successfully');
      // If deleted page was selected, clear selection
      const pId = selectedPageId;
      if (pId === id) {
        onPageSelect(null, null);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete page';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Pages</h2>
        {isAdmin() && (
          <button
            onClick={() => handleOpenModal()}
            className="px-2 py-1 bg-[#4CAF50] text-white text-xs rounded hover:bg-[#45a049] transition-colors shadow-sm"
          >
            + Add Page
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {getFilteredPages().length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-xs">
            {pages.length === 0 
              ? 'No pages yet. Create one to get started.'
              : 'No pages available. Contact admin for access.'}
          </p>
        ) : (
          <div className="space-y-1">
            {getFilteredPages().map((page) => {
              const pageId = page._id || page.id;
              const isSelected = selectedPageId === pageId;
              
              return (
                <div
                  key={pageId}
                  className={`group relative w-full px-2 py-1.5 rounded-lg transition-colors text-sm ${
                    isSelected
                      ? 'bg-[#007BFF] text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#007BFF] dark:hover:border-[#60A5FA] hover:bg-[#007BFF]/5 dark:hover:bg-[#60A5FA]/10 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <button
                    onClick={() => onPageSelect(pageId, page.name)}
                    className="w-full text-left pr-20"
                  >
                    {page.name}
                  </button>
                  {isAdmin() && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenModal(page);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          isSelected
                            ? 'bg-[#4CAF50] text-white hover:bg-[#45a049]'
                            : 'bg-[#4CAF50] text-white hover:bg-[#45a049]'
                        }`}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDelete(pageId, e)}
                        className={`px-2 py-1 text-xs rounded ${
                          isSelected
                            ? 'bg-red-500 text-white hover:bg-red-400'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-80 shadow-xl">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {editingPage ? 'Edit Page' : 'Create New Page'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Page Name
                </label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF] dark:focus:ring-[#60A5FA] focus:border-[#007BFF] dark:focus:border-[#60A5FA] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Enter page name"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors shadow-sm"
                >
                  {editingPage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageList;

