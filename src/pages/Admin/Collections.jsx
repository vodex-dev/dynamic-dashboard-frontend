import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCollections, createCollection, updateCollection, deleteCollection } from '../../api/collections';
import { getFieldsBySectionId, createField, updateField, deleteField } from '../../api/fields';
import { getUserCollections } from '../../api/auth';
import { uploadImage } from '../../api/upload';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';

const Collections = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [allowedCollectionIds, setAllowedCollectionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionFormData, setCollectionFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [selectedCollectionName, setSelectedCollectionName] = useState(null);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldsCount, setFieldsCount] = useState({}); // Store fields count for each collection
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldFormData, setFieldFormData] = useState({
    name: '',
    type: 'text',
    content: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (!isAdmin() && user) {
      fetchUserCollections();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (collections.length > 0) {
      // Fetch fields count for all collections
      const fetchCounts = async () => {
        const counts = {};
        for (const collection of collections) {
          const collectionId = collection._id || collection.id;
          try {
            const response = await getFieldsBySectionId(collectionId);
            const fetchedFields = response.data || [];
            const collectionFields = fetchedFields.filter(f => {
              const fSectionId = f.sectionId || f.collectionId;
              return fSectionId === collectionId;
            });
            counts[collectionId] = collectionFields.length;
          } catch (error) {
            // If error, set count to 0
            counts[collectionId] = 0;
          }
        }
        setFieldsCount(counts);
      };
      fetchCounts();
    }
  }, [collections.length]);

  useEffect(() => {
    if (selectedCollectionId) {
      fetchFields();
    } else {
      setFields([]);
    }
  }, [selectedCollectionId]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await getCollections();
      console.log('Collections fetched successfully:', response.data);
      setCollections(response.data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      const status = error.response?.status;
      
      // Don't show error toast for 403/404 - just show empty list
      if (status === 403) {
        console.warn('Access denied (403) - user may not have permission to view collections');
        setCollections([]);
      } else if (status === 404) {
        console.warn('Collections endpoint not found (404)');
        setCollections([]);
      } else {
        // Only show error for other errors
        toast.error('Failed to load collections');
        setCollections([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCollections = async () => {
    try {
      const userId = user?._id || user?.id || user?.userId;
      if (!userId) {
        console.warn('No user ID found, cannot fetch user collections');
        setAllowedCollectionIds([]);
        return;
      }

      console.log('Fetching user collections for userId:', userId);
      const response = await getUserCollections(userId);
      console.log('User collections response:', response);

      let collectionIds = [];
      if (response?.data) {
        collectionIds = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        collectionIds = response;
      }

      const collectionIdStrings = collectionIds.map((id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id.toString();
        if (typeof id === 'object' && id.id) return id.id.toString();
        return id.toString();
      });

      console.log('Allowed collection IDs:', collectionIdStrings);
      setAllowedCollectionIds(collectionIdStrings);
    } catch (error) {
      console.error('Error fetching user collections:', error);
      const status = error.response?.status;
      
      // Handle errors gracefully
      if (status === 404) {
        console.log('User collections endpoint not found (404) - user may not have any collections assigned');
        setAllowedCollectionIds([]);
      } else if (status === 403) {
        console.warn('Access denied (403) - user may not have permission to view collections');
        setAllowedCollectionIds([]);
      } else {
        console.warn('Error fetching user collections, showing empty list');
        setAllowedCollectionIds([]);
      }
    }
  };

  // Filter collections based on permissions
  const getFilteredCollections = () => {
    if (isAdmin()) {
      return collections; // Admin sees all collections
    }
    // Regular users see only allowed collections
    const filtered = collections.filter((collection) => {
      const collectionId = (collection._id || collection.id).toString();
      const isAllowed = allowedCollectionIds.includes(collectionId);
      return isAllowed;
    });
    return filtered;
  };

  const fetchFields = async () => {
    try {
      setLoadingFields(true);
      // Use collectionId as sectionId for fields API
      // The backend should treat collectionId as sectionId for fields
      const response = await getFieldsBySectionId(selectedCollectionId);
      const fetchedFields = response.data || [];
      // Filter fields that belong to this collection
      const collectionFields = fetchedFields.filter(f => {
        const fSectionId = f.sectionId || f.collectionId;
        return fSectionId === selectedCollectionId;
      });
      setFields(collectionFields);
      // Update fields count
      setFieldsCount(prev => ({
        ...prev,
        [selectedCollectionId]: collectionFields.length
      }));
    } catch (error) {
      console.error('Error fetching fields:', error);
      // If 404, it means no fields yet, which is fine
      if (error.response?.status !== 404) {
        toast.error('Failed to load fields');
      }
      setFields([]);
      setFieldsCount(prev => ({
        ...prev,
        [selectedCollectionId]: 0
      }));
    } finally {
      setLoadingFields(false);
    }
  };


  const handleOpenCollectionModal = (collection = null) => {
    if (collection) {
      setEditingCollection(collection);
      setCollectionFormData({
        name: collection.name || '',
        description: collection.description || '',
      });
    } else {
      setEditingCollection(null);
      setCollectionFormData({ name: '', description: '' });
    }
    setShowCollectionModal(true);
  };

  const handleCloseCollectionModal = () => {
    setShowCollectionModal(false);
    setEditingCollection(null);
    setCollectionFormData({ name: '', description: '' });
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!collectionFormData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    try {
      if (editingCollection) {
        const editingCollectionId = editingCollection._id || editingCollection.id;
        await updateCollection(editingCollectionId, collectionFormData);
        setCollections(collections.map(c => {
          const cId = c._id || c.id;
          return cId === editingCollectionId
            ? { ...c, name: collectionFormData.name, description: collectionFormData.description }
            : c;
        }));
        toast.success('Collection updated successfully');
      } else {
        const response = await createCollection(collectionFormData);
        const newCollection = response.data || response;
        setCollections([...collections, newCollection]);
        toast.success('Collection created successfully');
      }
      handleCloseCollectionModal();
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error(error.response?.data?.message || 'Failed to save collection');
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this collection? This will also delete all fields in this collection.')) {
      return;
    }

    try {
      await deleteCollection(id);
      setCollections(collections.filter(c => {
        const cId = c._id || c.id;
        return cId !== id;
      }));
      if (selectedCollectionId === id) {
        setSelectedCollectionId(null);
        setSelectedCollectionName(null);
        setFields([]);
      }
      toast.success('Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error(error.response?.data?.message || 'Failed to delete collection');
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      setUploadingImage(true);
      const response = await uploadImage(file, selectedCollectionId);
      console.log('Upload response:', response);
      
      const imageUrl = response?.image?.url || 
                       response?.data?.image?.url ||
                       response?.url || 
                       response?.data?.url || 
                       response?.imageUrl || 
                       response?.data?.imageUrl ||
                       response?.path ||
                       response?.data?.path;
      
      if (imageUrl) {
        toast.success('Image uploaded successfully');
        return imageUrl;
      } else {
        console.error('Failed to get image URL from response:', response);
        toast.error('Failed to get image URL from response');
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImageFile(file);
    
    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      setFieldFormData({ ...fieldFormData, content: imageUrl });
    } else {
      setSelectedImageFile(null);
    }
  };

  const copyImageUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied ✅');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenFieldModal = (field = null) => {
    if (field) {
      setEditingField(field);
      setFieldFormData({
        name: field.name || '',
        type: field.type || 'text',
        content: field.content || '',
      });
    } else {
      setEditingField(null);
      setFieldFormData({ name: '', type: 'text', content: '' });
    }
    setSelectedImageFile(null);
    setShowFieldModal(true);
  };

  const handleCloseFieldModal = () => {
    setShowFieldModal(false);
    setEditingField(null);
    setFieldFormData({ name: '', type: 'text', content: '' });
    setSelectedImageFile(null);
    setUploadingImage(false);
  };

  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    if (!fieldFormData.name.trim()) {
      toast.error('Field name is required');
      return;
    }

    if (fieldFormData.type === 'image' && !fieldFormData.content) {
      toast.error('Please upload an image first');
      return;
    }

    try {
      if (editingField) {
        const editingFieldId = editingField._id || editingField.id;
        await updateField(editingFieldId, {
          sectionId: selectedCollectionId,
          name: fieldFormData.name,
          type: fieldFormData.type,
          content: fieldFormData.content,
        });
        setFields(fields.map(f => {
          const fId = f._id || f.id;
          return fId === editingFieldId
            ? { ...f, name: fieldFormData.name, type: fieldFormData.type, content: fieldFormData.content }
            : f;
        }));
        toast.success('Field updated successfully');
      } else {
        const response = await createField({
          sectionId: selectedCollectionId,
          name: fieldFormData.name,
          type: fieldFormData.type,
          content: fieldFormData.content,
        });
        const newField = response.data || response;
        setFields([...fields, newField]);
        // Update fields count
        setFieldsCount(prev => ({
          ...prev,
          [selectedCollectionId]: (prev[selectedCollectionId] || 0) + 1
        }));
        toast.success('Field created successfully');
      }
      handleCloseFieldModal();
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error(error.response?.data?.message || 'Failed to save field');
    }
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      await deleteField(id);
      setFields(fields.filter(f => {
        const fId = f._id || f.id;
        return fId !== id;
      }));
      // Update fields count
      setFieldsCount(prev => ({
        ...prev,
        [selectedCollectionId]: Math.max((prev[selectedCollectionId] || 1) - 1, 0)
      }));
      toast.success('Field deleted successfully');
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error(error.response?.data?.message || 'Failed to delete field');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Collections</h1>
        <button
          onClick={() => handleOpenCollectionModal()}
          className="px-3 py-1.5 bg-[#4CAF50] text-white text-xs rounded-lg hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-colors shadow-sm"
        >
          + Add Collection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Collections List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              All Collections ({collections.length})
            </h2>
          </div>

          {getFilteredCollections().length === 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
              {collections.length === 0
                ? 'No collections yet. Create one to get started.'
                : 'No collections available. Contact admin for access.'}
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fields
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredCollections().map((collection) => {
                    const collectionId = collection._id || collection.id;
                    const isSelected = selectedCollectionId === collectionId;
                    return (
                      <tr
                        key={collectionId}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          isSelected ? 'bg-[#4CAF50]/10 dark:bg-[#4CAF50]/20' : ''
                        }`}
                        onClick={() => {
                          setSelectedCollectionId(collectionId);
                          setSelectedCollectionName(collection.name);
                        }}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                            {collection.name}
                          </div>
                          {collection.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {collection.description}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {fieldsCount[collectionId] || 0} fields
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`${isAdmin() ? '/admin' : '/user'}/collection-items?collectionId=${collectionId}&collectionName=${encodeURIComponent(collection.name)}`)}
                              className="text-[#4CAF50] dark:text-[#81C784] hover:text-[#45a049] dark:hover:text-[#66BB6A] font-medium"
                              title="View Items"
                            >
                              📝 View Items
                            </button>
                            <button
                              onClick={() => handleOpenCollectionModal(collection)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(collectionId)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fields Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {selectedCollectionId ? `Fields - ${selectedCollectionName}` : 'Select a Collection'}
              </h2>
              {selectedCollectionId && (
                <button
                  onClick={() => handleOpenFieldModal()}
                  className="px-2 py-1 bg-[#4CAF50] text-white text-xs rounded hover:bg-[#45a049] transition-colors shadow-sm"
                >
                  + Add Field
                </button>
              )}
            </div>
          </div>

          {!selectedCollectionId ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
              Select a collection to view and manage its fields
            </div>
          ) : loadingFields ? (
            <div className="p-3 text-center">
              <Loader />
            </div>
          ) : fields.length === 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
              No fields yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-2 space-y-2">
              {fields.map((field) => (
                <div
                  key={field._id || field.id}
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 shadow-sm text-sm"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{field.name}</h3>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        {field.type}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleOpenFieldModal(field)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteField(field._id || field.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    {field.type === 'image' && field.content ? (
                      <div className="space-y-2">
                        <img
                          src={field.content}
                          alt={field.name}
                          style={{ width: '200px', height: 'auto', maxHeight: '200px' }}
                          className="object-contain rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                          }}
                        />
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Image URL (Cloudflare R2):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={field.content}
                              readOnly
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                            />
                            <button
                              onClick={() => copyImageUrl(field.content)}
                              className="px-3 py-1.5 bg-[#007BFF] text-white text-xs rounded-md hover:bg-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-colors whitespace-nowrap shadow-sm"
                              title="Copy image URL"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={field.content || ''}
                        readOnly
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        rows="3"
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.content || ''}
                        readOnly
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-80 shadow-xl">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {editingCollection ? 'Edit Collection' : 'Create New Collection'}
            </h3>
            <form onSubmit={handleCollectionSubmit}>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionFormData.name}
                  onChange={(e) => setCollectionFormData({ ...collectionFormData, name: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Enter collection name"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={collectionFormData.description}
                  onChange={(e) => setCollectionFormData({ ...collectionFormData, description: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  rows="3"
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseCollectionModal}
                  className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors shadow-sm"
                >
                  {editingCollection ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && selectedCollectionId && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-80 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {editingField ? 'Edit Field' : 'Create New Field'}
            </h3>
            <form onSubmit={handleFieldSubmit}>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={fieldFormData.name}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  placeholder="Enter field name"
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Type
                </label>
                <select
                  value={fieldFormData.type}
                  onChange={(e) => {
                    setFieldFormData({ ...fieldFormData, type: e.target.value });
                    setSelectedImageFile(null);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldFormData.type === 'image' ? 'Image Upload' : 'Content'}
                </label>
                {fieldFormData.type === 'image' ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      ref={(input) => {
                        if (input) {
                          input.style.display = 'none';
                        }
                      }}
                      id="collection-image-upload-input"
                    />
                    
                    {!fieldFormData.content && (
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('collection-image-upload-input');
                          if (input) input.click();
                        }}
                        disabled={uploadingImage}
                        className="w-full px-4 py-2 bg-[#4CAF50] text-white text-xs rounded-md hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {uploadingImage ? 'Uploading...' : '📤 Upload Image'}
                      </button>
                    )}

                    {uploadingImage && (
                      <div className="mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Uploading image to Cloudflare R2...</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                    )}

                    {selectedImageFile && !fieldFormData.content && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Selected: {selectedImageFile.name}
                        </p>
                        <img
                          src={URL.createObjectURL(selectedImageFile)}
                          alt="Preview"
                          className="max-w-[200px] max-h-[200px] object-contain rounded-md border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}

                    {fieldFormData.content && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">✅ Image uploaded successfully</p>
                        <img
                          src={fieldFormData.content}
                          alt="Uploaded"
                          className="max-w-[200px] max-h-[200px] w-auto h-auto object-contain rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                          }}
                        />
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Image URL (from Cloudflare R2):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={fieldFormData.content}
                              readOnly
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => copyImageUrl(fieldFormData.content)}
                              className="px-3 py-1.5 bg-[#007BFF] text-white text-xs rounded-md hover:bg-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-colors whitespace-nowrap shadow-sm"
                              title="Copy image URL"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('collection-image-upload-input');
                            if (input) {
                              input.value = '';
                              input.click();
                            }
                          }}
                          disabled={uploadingImage}
                          className="mt-2 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          🔄 Change Image
                        </button>
                      </div>
                    )}
                  </div>
                ) : fieldFormData.type === 'textarea' ? (
                  <textarea
                    value={fieldFormData.content}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, content: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    rows="4"
                  />
                ) : (
                  <input
                    type={fieldFormData.type === 'number' ? 'number' : 'text'}
                    value={fieldFormData.content}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, content: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseFieldModal}
                  className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors shadow-sm"
                >
                  {editingField ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collections;

