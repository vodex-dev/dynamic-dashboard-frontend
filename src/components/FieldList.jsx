import { useState, useEffect } from 'react';
import { getFieldsBySectionId, createField, updateFieldContent, updateField, deleteField } from '../api/fields';
import { uploadImage } from '../api/upload';
import { toast } from 'react-toastify';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';

const FieldList = ({ sectionId, sectionName }) => {
  const { isAdmin } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [modifiedFields, setModifiedFields] = useState({}); // Track modified fields
  const [savingFields, setSavingFields] = useState({}); // Track fields being saved
  const [originalContents, setOriginalContents] = useState({}); // Store original content
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    content: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  useEffect(() => {
    if (sectionId) {
      fetchFields();
    } else {
      setFields([]);
      setLoading(false);
    }
  }, [sectionId]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await getFieldsBySectionId(sectionId);
      const fetchedFields = response.data || [];
      setFields(fetchedFields);
      
      // Store original contents
      const originalContentsMap = {};
      fetchedFields.forEach((field) => {
        const fieldId = field._id || field.id;
        originalContentsMap[fieldId] = field.content || '';
      });
      setOriginalContents(originalContentsMap);
      setModifiedFields({}); // Reset modified fields
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast.error('Failed to load fields');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingField(null);
    setFormData({ name: '', type: 'text', content: '' });
    setSelectedImageFile(null);
    setUploadingImage(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      setUploadingImage(true);
      const response = await uploadImage(file, sectionId);
      console.log('Upload response:', response);
      
      // Extract URL from response.data.image.url (as per API response format)
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
        console.log('Image URL:', imageUrl);
        return imageUrl;
      } else {
        console.error('Failed to get image URL from response:', response);
        toast.error('Failed to get image URL from response. Response: ' + JSON.stringify(response));
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to upload image';
      toast.error(errorMessage);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImageFile(file);
    
    // Upload image immediately when file is selected
    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      // Ensure we're storing the URL, not base64
      console.log('Setting formData.content to image URL:', imageUrl);
      setFormData({ ...formData, content: imageUrl });
    } else {
      // Reset if upload failed
      setSelectedImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Field name is required');
      return;
    }

    // If type is image, ensure we have an image URL
    if (formData.type === 'image' && !formData.content) {
      toast.error('Please upload an image first');
      return;
    }

    // Prepare data to send
    const fieldData = {
      sectionId: sectionId,
      name: formData.name,
      type: formData.type,
      content: formData.content || '',
    };

    console.log('Saving field with data:', {
      ...fieldData,
      contentLength: fieldData.content?.length,
      contentPreview: fieldData.content?.substring(0, 100),
    });

    try {
      if (editingField) {
        const editingFieldId = editingField._id || editingField.id;
        console.log('Updating field:', editingFieldId);
        const response = await updateField(editingFieldId, fieldData);
        console.log('Update field response:', response);
        setFields(fields.map(f => {
          const fId = f._id || f.id;
          return fId === editingFieldId
            ? { ...f, name: formData.name, type: formData.type, content: formData.content }
            : f;
        }));
        toast.success('Field updated successfully');
      } else {
        console.log('Creating new field');
        const response = await createField(fieldData);
        console.log('Create field response:', response);
        
        // Handle different response formats
        const newField = response.data || response;
        if (newField) {
          setFields([...fields, newField]);
          toast.success('Field created successfully');
        } else {
          throw new Error('Invalid response from server');
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving field:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestData: fieldData,
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save field';
      toast.error(errorMessage);
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
      toast.success('Field deleted successfully');
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error(error.response?.data?.message || 'Failed to delete field');
    }
  };

  const handleUpdateContent = async (fieldId, newContent) => {
    try {
      setSavingFields({ ...savingFields, [fieldId]: true });
      await updateFieldContent(fieldId, newContent);
      setFields(
        fields.map((field) => {
          const fId = field._id || field.id;
          return fId === fieldId
            ? { ...field, content: newContent }
            : field;
        })
      );
      
      // Update original content and remove from modified fields
      setOriginalContents({ ...originalContents, [fieldId]: newContent });
      const newModifiedFields = { ...modifiedFields };
      delete newModifiedFields[fieldId];
      setModifiedFields(newModifiedFields);
      
      toast.success('Field content updated successfully');
    } catch (error) {
      console.error('Error updating field:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to update field content';
      if (error.response?.status === 403) {
        errorMessage = 'Permission denied. You may not have permission to update this field.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSavingFields({ ...savingFields, [fieldId]: false });
    }
  };

  const handleSaveField = async (fieldId) => {
    const field = fields.find((f) => (f._id || f.id) === fieldId);
    if (field) {
      await handleUpdateContent(fieldId, field.content || '');
    }
  };

  const handleEditClick = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      type: field.type || 'text',
      content: field.content || '',
    });
    setSelectedImageFile(null);
    setShowModal(true);
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

  if (!sectionId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        Select a section to view fields
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
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">Fields</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">Section: {sectionName}</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => {
              setEditingField(null);
              setFormData({ name: '', type: 'text', content: '' });
              setShowModal(true);
            }}
            className="px-2 py-1 bg-[#4CAF50] text-white text-xs rounded hover:bg-[#45a049] transition-colors shadow-sm"
          >
            + Add Field
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {fields.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-xs">No fields yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field._id || field.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm text-sm"
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{field.name}</h3>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      {field.type}
                    </span>
                  </div>
                  {isAdmin() && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(field)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteField(field._id || field.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                    <div className="mt-1.5">
                  {(() => {
                    const currentFieldId = field._id || field.id;
                    const originalContent = originalContents[currentFieldId] || '';
                    const currentContent = field.content || '';
                    const isModified = currentContent !== originalContent;
                    const isSaving = savingFields[currentFieldId] || false;
                    
                    return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {field.type === 'textarea' ? (
                            <textarea
                              value={currentContent}
                              onChange={(e) => {
                                const newContent = e.target.value;
                                const originalContentValue = originalContents[currentFieldId] || '';
                                setFields(
                                  fields.map((f) => {
                                    const fId = f._id || f.id;
                                    return fId === currentFieldId
                                      ? { ...f, content: newContent }
                                      : f;
                                  })
                                );
                                // Track if field is modified
                                if (newContent !== originalContentValue) {
                                  setModifiedFields((prev) => ({ ...prev, [currentFieldId]: true }));
                                } else {
                                  setModifiedFields((prev) => {
                                    const newModifiedFields = { ...prev };
                                    delete newModifiedFields[currentFieldId];
                                    return newModifiedFields;
                                  });
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              rows="3"
                            />
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={currentContent}
                              onChange={(e) => {
                                const newContent = e.target.value;
                                const originalContentValue = originalContents[currentFieldId] || '';
                                setFields(
                                  fields.map((f) => {
                                    const fId = f._id || f.id;
                                    return fId === currentFieldId
                                      ? { ...f, content: newContent }
                                      : f;
                                  })
                                );
                                // Track if field is modified
                                if (newContent !== originalContentValue) {
                                  setModifiedFields((prev) => ({ ...prev, [currentFieldId]: true }));
                                } else {
                                  setModifiedFields((prev) => {
                                    const newModifiedFields = { ...prev };
                                    delete newModifiedFields[currentFieldId];
                                    return newModifiedFields;
                                  });
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            />
                          ) : field.type === 'image' ? (
                            <div className="space-y-2">
                              {currentContent ? (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <img
                                      src={currentContent}
                                      alt={field.name}
                                      style={{ width: '200px', height: 'auto', maxHeight: '200px' }}
                                      className="object-contain rounded-md border border-gray-300 dark:border-gray-600 shadow-sm"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Image URL (Cloudflare R2):
                                    </label>
                                    <div className="flex items-center gap-2">
                                      {isAdmin() ? (
                                        <input
                                          type="text"
                                          value={currentContent}
                                          onChange={(e) => {
                                            const newContent = e.target.value;
                                            const originalContentValue = originalContents[currentFieldId] || '';
                                            setFields(
                                              fields.map((f) => {
                                                const fId = f._id || f.id;
                                                return fId === currentFieldId
                                                  ? { ...f, content: newContent }
                                                  : f;
                                              })
                                            );
                                            // Track if field is modified
                                            if (newContent !== originalContentValue) {
                                              setModifiedFields((prev) => ({ ...prev, [currentFieldId]: true }));
                                            } else {
                                              setModifiedFields((prev) => {
                                                const newModifiedFields = { ...prev };
                                                delete newModifiedFields[currentFieldId];
                                                return newModifiedFields;
                                              });
                                            }
                                          }}
                                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono"
                                          placeholder="Image URL"
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          value={currentContent}
                                          readOnly
                                          className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                                        />
                                      )}
                                      <button
                                        onClick={() => copyImageUrl(currentContent)}
                                        className="px-3 py-1.5 bg-[#007BFF] text-white text-xs rounded-md hover:bg-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-colors whitespace-nowrap shadow-sm"
                                        title="Copy image URL"
                                      >
                                        📋 Copy
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No image uploaded</p>
                                  {isAdmin() && (
                                    <>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const imageUrl = await handleImageUpload(file);
                                            if (imageUrl) {
                                              await handleUpdateContent(currentFieldId, imageUrl);
                                            }
                                          }
                                        }}
                                        ref={(input) => {
                                          if (input) {
                                            input.style.display = 'none';
                                          }
                                        }}
                                        id={`image-upload-field-${currentFieldId}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const input = document.getElementById(`image-upload-field-${currentFieldId}`);
                                          if (input) input.click();
                                        }}
                                        disabled={uploadingImage}
                                        className="px-4 py-2 bg-[#4CAF50] text-white text-xs rounded-md hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                      >
                                        {uploadingImage ? 'Uploading...' : '📤 Upload Image'}
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : field.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={currentContent === 'true'}
                              onChange={(e) => {
                                const newContent = e.target.checked ? 'true' : 'false';
                                handleUpdateContent(currentFieldId, newContent);
                              }}
                              className="form-checkbox h-4 w-4 text-purple-600"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentContent}
                              onChange={(e) => {
                                const newContent = e.target.value;
                                const originalContentValue = originalContents[currentFieldId] || '';
                                setFields(
                                  fields.map((f) => {
                                    const fId = f._id || f.id;
                                    return fId === currentFieldId
                                      ? { ...f, content: newContent }
                                      : f;
                                  })
                                );
                                // Track if field is modified
                                if (newContent !== originalContentValue) {
                                  setModifiedFields((prev) => ({ ...prev, [currentFieldId]: true }));
                                } else {
                                  setModifiedFields((prev) => {
                                    const newModifiedFields = { ...prev };
                                    delete newModifiedFields[currentFieldId];
                                    return newModifiedFields;
                                  });
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            />
                          )}
                        </div>
                        {isModified && field.type !== 'boolean' && field.type !== 'image' && (
                          <button
                            onClick={() => handleSaveField(currentFieldId)}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-[#4CAF50] text-white text-xs rounded-md hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shadow-sm"
                            title="Save changes"
                          >
                            {isSaving ? 'Saving...' : '💾 Save'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-80 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {editingField ? 'Edit Field' : 'Create New Field'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value });
                    setSelectedImageFile(null); // Reset image file when type changes
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {formData.type === 'image' ? 'Image Upload' : 'Content'}
                </label>
                {formData.type === 'image' ? (
                  <div className="space-y-2">
                    {/* Hidden file input */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      ref={(input) => {
                        if (input) {
                          input.style.display = 'none';
                        }
                      }}
                      id="image-upload-input"
                    />
                    
                    {/* Upload Button */}
                    {!formData.content && (
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('image-upload-input');
                          if (input) input.click();
                        }}
                        disabled={uploadingImage}
                        className="w-full px-4 py-2 bg-[#4CAF50] text-white text-xs rounded-md hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {uploadingImage ? 'Uploading...' : '📤 Upload Image'}
                      </button>
                    )}

                    {/* Uploading indicator */}
                    {uploadingImage && (
                      <div className="mt-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Uploading image to Cloudflare R2...</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                    )}

                    {/* Preview selected file before upload */}
                    {selectedImageFile && !formData.content && (
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

                    {/* Display uploaded image */}
                    {formData.content && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">✅ Image uploaded successfully</p>
                        <img
                          src={formData.content}
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
                              value={formData.content}
                              readOnly
                              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => copyImageUrl(formData.content)}
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
                            const input = document.getElementById('image-upload-input');
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
                ) : formData.type === 'textarea' ? (
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    rows="4"
                  />
                ) : (
                  <input
                    type={formData.type}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                )}
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

export default FieldList;

