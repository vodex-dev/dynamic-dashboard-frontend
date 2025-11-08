import { useState, useEffect } from 'react';
import { getFormFields, createFormField, updateFormField, deleteFormField } from '../../api/forms';
import { toast } from 'react-toastify';
import Loader from '../Loader';
import { useAuth } from '../../context/AuthContext';
import FieldModal from './FieldModal';

const FormFields = ({ form, onFormUpdate }) => {
  const { isAdmin } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);

  const formId = form?._id || form?.id;

  useEffect(() => {
    if (formId) {
      fetchFields();
    } else {
      setFields([]);
      setLoading(false);
    }
  }, [formId]);

  const fetchFields = async () => {
    if (!formId) {
      setFields([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getFormFields(formId);
      setFields(response.data || []);
    } catch (error) {
      console.error('Error fetching form fields:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load fields');
      }
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFieldModal = (field = null) => {
    if (field) {
      setEditingField(field);
    } else {
      setEditingField(null);
    }
    setShowFieldModal(true);
  };

  const handleCloseFieldModal = () => {
    setShowFieldModal(false);
    setEditingField(null);
  };

  const handleSubmitField = async (fieldData) => {
    if (!formId) {
      toast.error('Form ID is missing');
      return;
    }

    try {
      if (editingField) {
        const fieldId = editingField._id || editingField.id;
        if (!fieldId) {
          toast.error('Field ID is missing');
          return;
        }
        await updateFormField(formId, fieldId, fieldData);
        setFields(fields.map(f => {
          const fId = f._id || f.id;
          return fId === fieldId ? { ...f, ...fieldData } : f;
        }));
        toast.success('Field updated successfully');
      } else {
        const response = await createFormField(formId, fieldData);
        const newField = response.data;
        setFields([...fields, newField]);
        toast.success('Field created successfully');
      }
      handleCloseFieldModal();
      if (onFormUpdate) {
        onFormUpdate();
      }
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error(error.response?.data?.message || 'Failed to save field');
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!formId) {
      toast.error('Form ID is missing');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }

    try {
      await deleteFormField(formId, fieldId);
      setFields(fields.filter(f => {
        const fId = f._id || f.id;
        return fId !== fieldId;
      }));
      toast.success('Field deleted successfully');
      if (onFormUpdate) {
        onFormUpdate();
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error(error.response?.data?.message || 'Failed to delete field');
    }
  };

  if (!formId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Please select a form from the Forms tab to manage its fields.
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Fields for: {form?.name || 'Unknown Form'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage form fields
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => handleOpenFieldModal()}
            className="px-3 py-1.5 bg-[#4CAF50] text-white text-xs rounded-lg hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-colors shadow-sm"
          >
            + Add Field
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          No fields defined for this form. Add one to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Required
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Options
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {fields.map((field) => {
                const fieldId = field._id || field.id;
                return (
                  <tr key={fieldId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                        {field.name}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {field.label || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                        {field.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {field.required ? '✅ Yes' : '❌ No'}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {field.options ? field.options.join(', ') : '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      {isAdmin() && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenFieldModal(field)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteField(fieldId)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Field Modal */}
      {showFieldModal && (
        <FieldModal
          field={editingField}
          onClose={handleCloseFieldModal}
          onSubmit={handleSubmitField}
        />
      )}
    </div>
  );
};

export default FormFields;

