import { useState, useEffect } from 'react';
import { getSectionsByPageId, createSection, updateSection, deleteSection } from '../api/sections';
import { toast } from 'react-toastify';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';

const SectionList = ({ pageId, pageName, onSectionSelect, selectedSectionId }) => {
  const { isAdmin } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionName, setSectionName] = useState('');

  useEffect(() => {
    if (pageId) {
      fetchSections();
    } else {
      setSections([]);
      setLoading(false);
    }
  }, [pageId]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await getSectionsByPageId(pageId);
      setSections(response.data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionName(section.name);
    } else {
      setEditingSection(null);
      setSectionName('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSection(null);
    setSectionName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sectionName.trim()) {
      toast.error('Section name is required');
      return;
    }

    try {
      if (editingSection) {
        const editingSectionId = editingSection._id || editingSection.id;
        await updateSection(editingSectionId, {
          name: sectionName,
          pageId: pageId,
        });
        setSections(sections.map(s => {
          const sId = s._id || s.id;
          return sId === editingSectionId
            ? { ...s, name: sectionName }
            : s;
        }));
        toast.success('Section updated successfully');
      } else {
        const response = await createSection({
          name: sectionName,
          pageId: pageId,
        });
        const newSection = response.data;
        setSections([...sections, newSection]);
        toast.success('Section created successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error(error.response?.data?.message || 'Failed to save section');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this section? This will also delete all fields in this section.')) {
      return;
    }

    try {
      console.log('Deleting section with ID:', id);
      console.log('Section ID type:', typeof id);
      const response = await deleteSection(id);
      console.log('Delete response:', response);
      setSections(sections.filter(s => {
        const sId = s._id || s.id;
        return sId !== id;
      }));
      toast.success('Section deleted successfully');
      // If deleted section was selected, clear selection
      const sId = selectedSectionId;
      if (sId === id) {
        onSectionSelect(null, null);
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete section';
      toast.error(errorMessage);
    }
  };

  const copyApiLink = async (sectionId) => {
    const apiUrl = `https://dynamic-dashboard-backend.onrender.com/api/fields/${sectionId}`;
    try {
      await navigator.clipboard.writeText(apiUrl);
      toast.success('Link copied ✅');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  if (!pageId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a page to view sections
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Sections</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">Page: {pageName}</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => handleOpenModal()}
            className="px-2 py-1 bg-[#4CAF50] text-white text-xs rounded hover:bg-[#45a049] transition-colors shadow-sm"
          >
            + Add Section
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-xs">No sections yet. Create one to get started.</p>
        ) : (
          <div className="space-y-1.5">
            {sections.map((section) => {
              const sectionId = section._id || section.id;
              const apiUrl = `https://dynamic-dashboard-backend.onrender.com/api/fields/${sectionId}`;
              const isSelected = selectedSectionId === sectionId;
              
              return (
                <div
                  key={sectionId}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden text-sm"
                >
                  <div
                    className={`group relative w-full px-2 py-1.5 transition-colors ${
                      isSelected
                        ? 'bg-[#4CAF50] text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#4CAF50] dark:hover:border-[#81C784] hover:bg-[#4CAF50]/5 dark:hover:bg-[#4CAF50]/10 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => onSectionSelect(sectionId, section.name)}
                      className="w-full text-left pr-20"
                    >
                      <div className="font-semibold">{section.name}</div>
                    </button>
                    {isAdmin() && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(section);
                          }}
                          className={`px-2 py-1 text-xs rounded ${
                            isSelected
                              ? 'bg-[#007BFF] text-white hover:bg-[#0066cc]'
                              : 'bg-[#007BFF] text-white hover:bg-[#0066cc]'
                          }`}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDelete(sectionId, e)}
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
                  
                  {/* API Link Section - Only for Admin */}
                  {isAdmin() && (
                    <div className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">API Link:</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={apiUrl}
                          readOnly
                          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF] dark:focus:ring-[#60A5FA] text-gray-700 dark:text-gray-200 font-mono"
                        />
                        <button
                          onClick={() => copyApiLink(sectionId)}
                          className="px-3 py-2 bg-[#007BFF] text-white text-xs rounded-md hover:bg-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-colors whitespace-nowrap shadow-sm"
                          title="Copy API link"
                        >
                          Copy
                        </button>
                      </div>
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
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Enter section name"
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
                  {editingSection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionList;

