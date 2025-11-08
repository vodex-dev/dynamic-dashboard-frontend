import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCollectionItems, createCollectionItem, updateCollectionItem, deleteCollectionItem } from '../../api/collectionItems';
import { getFieldsBySectionId } from '../../api/fields';
import { uploadImage } from '../../api/upload';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';

const CollectionItems = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const collectionName = searchParams.get('collectionName') || 'Collection';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [selectedImageFiles, setSelectedImageFiles] = useState({});

  useEffect(() => {
    if (collectionId) {
      fetchFields();
      fetchItems();
    } else {
      toast.error('Collection ID is missing');
      navigate('/admin/collections');
    }
  }, [collectionId]);

  const fetchFields = async () => {
    try {
      setLoadingFields(true);
      // Use collectionId as sectionId for fields API
      const response = await getFieldsBySectionId(collectionId);
      const fetchedFields = response.data || [];
      // Filter fields that belong to this collection
      const collectionFields = fetchedFields.filter(f => {
        const fSectionId = f.sectionId || f.collectionId;
        return fSectionId === collectionId;
      });
      setFields(collectionFields);
      
      // Initialize form data with empty values for each field
      const initialFormData = {};
      collectionFields.forEach(field => {
        const fieldId = field._id || field.id;
        initialFormData[fieldId] = '';
      });
      setItemFormData(initialFormData);
    } catch (error) {
      console.error('Error fetching fields:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load fields');
      }
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getCollectionItems(collectionId);
      const itemsData = response.data || [];
      console.log('Fetched items:', itemsData);
      console.log('First item structure:', itemsData[0]);
      if (itemsData[0]) {
        console.log('First item fields:', itemsData[0].fields);
        console.log('First item data:', itemsData[0].data);
      }
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load items');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, fieldId) => {
    if (!file) return null;
    
    try {
      setUploadingImages(prev => ({ ...prev, [fieldId]: true }));
      const response = await uploadImage(file, collectionId);
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
      setUploadingImages(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  const handleImageFileSelect = async (e, fieldId) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImageFiles(prev => ({ ...prev, [fieldId]: file }));
    
    const imageUrl = await handleImageUpload(file, fieldId);
    if (imageUrl) {
      setItemFormData(prev => ({
        ...prev,
        [fieldId]: imageUrl
      }));
    } else {
      setSelectedImageFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[fieldId];
        return newFiles;
      });
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

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      console.log('Opening modal for editing item:', item);
      console.log('Item fields:', item.fields);
      console.log('Item data:', item.data);
      
      // Convert item.fields or item.data object to form data format
      const formData = {};
      fields.forEach(field => {
        const fieldId = field._id || field.id;
        const fieldName = field.name;
        // Try multiple possible data structures
        const value = 
          item.fields?.[fieldName] || 
          item.data?.[fieldName] ||
          item.fields?.[fieldId] || 
          item.data?.[fieldId] ||
          '';
        
        console.log(`Field ${fieldName} (${fieldId}):`, {
          value: value,
          fromFields: item.fields?.[fieldName],
          fromData: item.data?.[fieldName],
        });
        
        formData[fieldId] = value;
      });
      
      console.log('Form data prepared:', formData);
      setItemFormData(formData);
    } else {
      setEditingItem(null);
      // Initialize with empty values
      const initialFormData = {};
      fields.forEach(field => {
        const fieldId = field._id || field.id;
        initialFormData[fieldId] = '';
      });
      setItemFormData(initialFormData);
    }
    setSelectedImageFiles({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setSelectedImageFiles({});
    // Reset form data
    const initialFormData = {};
    fields.forEach(field => {
      const fieldId = field._id || field.id;
      initialFormData[fieldId] = '';
    });
    setItemFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert form data to fields object format
    // Only include fields with non-empty values
    const fieldsObject = {};
    fields.forEach(field => {
      const fieldId = field._id || field.id;
      const fieldName = field.name;
      const fieldValue = itemFormData[fieldId];
      
      // Only include fields with values (skip empty strings, null, undefined)
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '' && fieldValue.toString().trim() !== '') {
        fieldsObject[fieldName] = fieldValue;
      }
    });

    // Check if at least one field has a value
    if (Object.keys(fieldsObject).length === 0) {
      toast.error('Please fill at least one field');
      return;
    }

    // Validate collectionId
    if (!collectionId || collectionId.trim() === '') {
      toast.error('Collection ID is missing');
      return;
    }

    try {
      const requestData = {
        collectionId: collectionId,
        fields: fieldsObject,
      };

      console.log('Saving item with data:', {
        collectionId: collectionId,
        collectionIdType: typeof collectionId,
        fields: fieldsObject,
        fieldsKeys: Object.keys(fieldsObject),
        fieldsCount: Object.keys(fieldsObject).length,
        fieldsValues: Object.values(fieldsObject),
      });

      if (editingItem) {
        const editingItemId = editingItem._id || editingItem.id;
        console.log('Updating item:', editingItemId);
        const response = await updateCollectionItem(editingItemId, requestData);
        console.log('Update response:', response);
        setItems(items.map(item => {
          const itemId = item._id || item.id;
          return itemId === editingItemId
            ? { ...item, fields: fieldsObject }
            : item;
        }));
        toast.success('Item updated successfully');
      } else {
        console.log('Creating new item');
        const response = await createCollectionItem(requestData);
        console.log('Create response:', response);
        const newItem = response.data || response;
        setItems([...items, newItem]);
        toast.success('Item created successfully');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving item:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: {
          collectionId: collectionId,
          fields: fieldsObject,
        },
      });

      // Show more detailed error message
      let errorMessage = 'Failed to save item';
      
      // Try to get detailed error message from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors) {
          // Handle validation errors
          const errorMessages = Object.values(errorData.errors).flat();
          errorMessage = errorMessages.join(', ') || 'Validation error';
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Log full error for debugging
      console.error('Full error response:', error.response?.data);
      
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteCollectionItem(id);
      setItems(items.filter(item => {
        const itemId = item._id || item.id;
        return itemId !== id;
      }));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const getFieldValue = (item, field) => {
    const fieldName = field.name;
    const fieldId = field._id || field.id;
    
    // Try multiple possible data structures from backend
    // 1. item.fields[fieldName] - direct field name
    // 2. item.data[fieldName] - if backend uses 'data' instead of 'fields'
    // 3. item.fields[fieldId] - using field ID
    // 4. item.data[fieldId] - using field ID with 'data'
    
    const value = 
      item.fields?.[fieldName] || 
      item.data?.[fieldName] ||
      item.fields?.[fieldId] || 
      item.data?.[fieldId] ||
      '';
    
    return value;
  };

  const getTitleField = () => {
    // Try to find a field named "title" or the first field
    return fields.find(f => f.name.toLowerCase() === 'title') || fields[0];
  };

  if (loadingFields) {
    return <Loader />;
  }

  if (!collectionId) {
    return (
      <div className="p-3">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Collection ID is missing. Redirecting...
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isAdmin() ? '/admin/collections' : '/user/collections')}
            className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors shadow-sm"
          >
            ← Back to Collections
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Collection Items: {collectionName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Manage items for this collection
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-3 py-1.5 bg-[#4CAF50] text-white text-xs rounded-lg hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-colors shadow-sm"
        >
          + New Item
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No items yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {fields.map((field) => {
                    const fieldId = field._id || field.id;
                    const fieldName = field.name;
                    const fieldType = field.type || 'text';
                    return (
                      <th
                        key={fieldId}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        <div className="flex items-center gap-1">
                          <span>{fieldName}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            ({fieldType})
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => {
                  const itemId = item._id || item.id;
                  return (
                    <tr key={itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {fields.map((field) => {
                        const fieldId = field._id || field.id;
                        const fieldValue = getFieldValue(item, field);
                        const fieldType = field.type || 'text';

                        // Debug log for first item
                        if (item === items[0] && field === fields[0]) {
                          console.log('Displaying field value:', {
                            fieldName: field.name,
                            fieldId: fieldId,
                            fieldValue: fieldValue,
                            itemFields: item.fields,
                            itemData: item.data,
                          });
                        }

                        return (
                          <td key={fieldId} className="px-3 py-2">
                            {fieldType === 'image' ? (
                              fieldValue ? (
                                <img
                                  src={fieldValue}
                                  alt={field.name}
                                  className="w-16 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/64x64?text=Image';
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-400">
                                  No Image
                                </div>
                              )
                            ) : fieldType === 'textarea' ? (
                              <div 
                                className="text-xs text-gray-900 dark:text-gray-200 max-w-xs truncate" 
                                title={fieldValue || '-'}
                              >
                                {fieldValue || '-'}
                              </div>
                            ) : (
                              <div 
                                className="text-xs text-gray-900 dark:text-gray-200 max-w-xs truncate" 
                                title={fieldValue || '-'}
                              >
                                {fieldValue || '-'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium sticky right-0 bg-white dark:bg-gray-800">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(itemId)}
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
        </div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200">
              {editingItem ? 'Edit Item' : 'Create New Item'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                {fields.map((field) => {
                  const fieldId = field._id || field.id;
                  const fieldName = field.name;
                  const fieldType = field.type || 'text';
                  const fieldValue = itemFormData[fieldId] || '';
                  
                  // Debug log for first field when editing
                  if (editingItem && field === fields[0]) {
                    console.log('Rendering field in modal:', {
                      fieldName: fieldName,
                      fieldId: fieldId,
                      fieldValue: fieldValue,
                      itemFormData: itemFormData,
                    });
                  }

                  return (
                    <div key={fieldId} className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {fieldName}
                        {fieldType === 'image' && ' (Image)'}
                      </label>
                      {fieldType === 'image' ? (
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileSelect(e, fieldId)}
                            ref={(input) => {
                              if (input) {
                                input.style.display = 'none';
                              }
                            }}
                            id={`item-image-upload-${fieldId}`}
                          />
                          
                          {!fieldValue && (
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById(`item-image-upload-${fieldId}`);
                                if (input) input.click();
                              }}
                              disabled={uploadingImages[fieldId]}
                              className="w-full px-4 py-2 bg-[#4CAF50] text-white text-xs rounded-md hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                              {uploadingImages[fieldId] ? 'Uploading...' : '📤 Upload Image'}
                            </button>
                          )}

                          {uploadingImages[fieldId] && (
                            <div className="mt-2">
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Uploading image to Cloudflare R2...</p>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                              </div>
                            </div>
                          )}

                          {selectedImageFiles[fieldId] && !fieldValue && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Selected: {selectedImageFiles[fieldId].name}
                              </p>
                              <img
                                src={URL.createObjectURL(selectedImageFiles[fieldId])}
                                alt="Preview"
                                className="max-w-[200px] max-h-[200px] object-contain rounded-md border border-gray-300 dark:border-gray-600"
                              />
                            </div>
                          )}

                          {fieldValue && (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs text-green-600 dark:text-green-400 mb-1">✅ Image uploaded successfully</p>
                              <img
                                src={fieldValue}
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
                                    value={fieldValue}
                                    readOnly
                                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => copyImageUrl(fieldValue)}
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
                                  const input = document.getElementById(`item-image-upload-${fieldId}`);
                                  if (input) {
                                    input.value = '';
                                    input.click();
                                  }
                                }}
                                disabled={uploadingImages[fieldId]}
                                className="mt-2 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                🔄 Change Image
                              </button>
                            </div>
                          )}
                        </div>
                      ) : fieldType === 'textarea' ? (
                        <textarea
                          value={fieldValue}
                          onChange={(e) => setItemFormData(prev => ({
                            ...prev,
                            [fieldId]: e.target.value
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          rows="4"
                          placeholder={`Enter ${fieldName}`}
                        />
                      ) : fieldType === 'number' ? (
                        <input
                          type="number"
                          value={fieldValue}
                          onChange={(e) => setItemFormData(prev => ({
                            ...prev,
                            [fieldId]: e.target.value
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          placeholder={`Enter ${fieldName}`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={fieldValue}
                          onChange={(e) => setItemFormData(prev => ({
                            ...prev,
                            [fieldId]: e.target.value
                          }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          placeholder={`Enter ${fieldName}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
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
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionItems;

