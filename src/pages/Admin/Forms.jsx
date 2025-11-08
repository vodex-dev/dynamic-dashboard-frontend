import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getForms, createForm, updateForm, deleteForm } from '../../api/forms';
import { getUserForms } from '../../api/auth';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import FormsList from '../../components/forms/FormsList';
import FormFields from '../../components/forms/FormFields';
import FormResponses from '../../components/forms/FormResponses';
import FormModal from '../../components/forms/FormModal';

const Forms = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedUserId = searchParams.get('user'); // Get userId from URL
  const [activeTab, setActiveTab] = useState('forms'); // 'forms', 'fields', 'responses'
  const [forms, setForms] = useState([]);
  const [allowedFormIds, setAllowedFormIds] = useState([]); // For regular users
  const [userFormIds, setUserFormIds] = useState([]); // Forms for selected user (Admin only)
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    if (!isAdmin() && user) {
      fetchUserForms();
    } else if (isAdmin()) {
      // Admin doesn't need to fetch user forms
      setAllowedFormIds([]);
    }
  }, [user, isAdmin]);

  // Fetch forms for selected user (Admin only)
  useEffect(() => {
    if (isAdmin() && selectedUserId) {
      fetchUserFormsForSelectedUser(selectedUserId);
    } else {
      setUserFormIds([]);
    }
  }, [selectedUserId, isAdmin]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await getForms();
      const formsData = response.data || response || [];
      console.log('Fetched forms:', formsData);
      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load forms');
      }
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserForms = async () => {
    try {
      const userId = user?._id || user?.id || user?.userId;
      if (!userId) {
        console.warn('No user ID found, cannot fetch user forms');
        setAllowedFormIds([]);
        return;
      }

      console.log('Fetching user forms for userId:', userId);
      const response = await getUserForms(userId);
      console.log('User forms response:', response);

      let formIds = [];
      if (response?.data) {
        formIds = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        formIds = response;
      }

      const formIdStrings = formIds.map((id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id.toString();
        if (typeof id === 'object' && id.id) return id.id.toString();
        return id.toString();
      });

      console.log('Allowed form IDs:', formIdStrings);
      console.log('Total forms available:', forms.length);
      console.log('Forms that will be shown:', forms.filter(f => {
        const fId = (f._id || f.id).toString();
        return formIdStrings.includes(fId);
      }).map(f => ({ name: f.name, id: f._id || f.id })));
      
      setAllowedFormIds(formIdStrings);
    } catch (error) {
      console.error('Error fetching user forms:', error);
      const status = error.response?.status;

      if (status === 404) {
        console.log('User forms endpoint not found (404) - user may not have any forms assigned');
        setAllowedFormIds([]);
      } else if (status === 403) {
        console.warn('Access denied (403) - user may not have permission to view forms');
        setAllowedFormIds([]);
      } else {
        console.warn('Error fetching user forms, showing empty list');
        setAllowedFormIds([]);
      }
    }
  };

  const fetchUserFormsForSelectedUser = async (userId) => {
    try {
      const userFormsResponse = await getUserForms(userId);
      let formIds = [];
      if (userFormsResponse?.data) {
        formIds = Array.isArray(userFormsResponse.data) ? userFormsResponse.data : [];
      } else if (Array.isArray(userFormsResponse)) {
        formIds = userFormsResponse;
      }

      const formIdStrings = formIds.map((id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id.toString();
        if (typeof id === 'object' && id.id) return id.id.toString();
        return id.toString();
      });

      setUserFormIds(formIdStrings);
    } catch (error) {
      console.error('Error fetching user forms:', error);
      setUserFormIds([]);
    }
  };

  // Filter forms based on permissions
  const getFilteredForms = () => {
    // If admin selected a user, show only that user's forms
    if (isAdmin() && selectedUserId && userFormIds.length > 0) {
      return forms.filter((form) => {
        const formId = (form._id || form.id).toString();
        return userFormIds.includes(formId);
      });
    }

    if (isAdmin()) {
      return forms; // Admin sees all forms
    }
    // Regular users see only allowed forms
    const filtered = forms.filter((form) => {
      const formId = (form._id || form.id).toString();
      const isAllowed = allowedFormIds.includes(formId);
      
      // Debug log
      if (!isAllowed) {
        console.log(`Form ${form.name} (${formId}) is not in allowed list:`, allowedFormIds);
      }
      
      return isAllowed;
    });
    
    console.log('Filtered forms for regular user:', {
      totalForms: forms.length,
      allowedFormIds: allowedFormIds,
      filteredCount: filtered.length,
      filteredForms: filtered.map(f => ({ name: f.name, id: f._id || f.id }))
    });
    
    return filtered;
  };

  const handleOpenFormModal = (form = null) => {
    if (form) {
      setEditingForm(form);
    } else {
      setEditingForm(null);
    }
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setEditingForm(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (editingForm) {
        const formId = editingForm._id || editingForm.id;
        if (!formId) {
          toast.error('Form ID is missing');
          return;
        }
        await updateForm(formId, formData);
        setForms(forms.map(f => {
          const fId = f._id || f.id;
          return fId === formId
            ? { ...f, name: formData.name, description: formData.description }
            : f;
        }));
        toast.success('Form updated successfully');
      } else {
        const response = await createForm(formData);
        const newForm = response.data || response;
        setForms([...forms, newForm]);
        toast.success('Form created successfully');
      }
      handleCloseFormModal();
    } catch (error) {
      console.error('Error saving form:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save form';
      toast.error(errorMessage);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form? This will also delete all fields and responses.')) {
      return;
    }

    try {
      await deleteForm(formId);
      setForms(forms.filter(f => {
        const fId = f._id || f.id;
        return fId !== formId;
      }));
      if (selectedForm && (selectedForm._id || selectedForm.id) === formId) {
        setSelectedForm(null);
      }
      toast.success('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(error.response?.data?.message || 'Failed to delete form');
    }
  };

  const handleFormSelect = (form) => {
    setSelectedForm(form);
    // Auto-switch to responses tab for regular users (they mainly want to see responses)
    // Admin can manually switch between tabs
    if (!isAdmin() && activeTab === 'forms') {
      setActiveTab('responses');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Forms Management</h1>
          {isAdmin() && selectedUserId && (
            <button
              onClick={() => {
                navigate(isAdmin() ? '/admin/forms' : '/user/forms');
              }}
              className="mt-1 px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              ← Show All Forms
            </button>
          )}
        </div>
        {isAdmin() && !selectedUserId && activeTab === 'forms' && (
          <button
            onClick={() => handleOpenFormModal()}
            className="px-3 py-1.5 bg-[#4CAF50] text-white text-xs rounded-lg hover:bg-[#45a049] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-colors shadow-sm"
          >
            + Create New Form
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
        <button
          onClick={() => setActiveTab('forms')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'forms'
              ? 'text-[#4CAF50] dark:text-[#81C784] border-b-2 border-[#4CAF50] dark:border-[#81C784]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📋 Forms
        </button>
        <button
          onClick={() => {
            if (selectedForm) {
              setActiveTab('fields');
            } else {
              toast.info('Please select a form first');
            }
          }}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'fields'
              ? 'text-[#4CAF50] dark:text-[#81C784] border-b-2 border-[#4CAF50] dark:border-[#81C784]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📝 Fields
        </button>
        <button
          onClick={() => {
            if (selectedForm) {
              setActiveTab('responses');
            } else {
              toast.info('Please select a form first');
            }
          }}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'responses'
              ? 'text-[#4CAF50] dark:text-[#81C784] border-b-2 border-[#4CAF50] dark:border-[#81C784]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          title="View form responses"
        >
          📨 Responses
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'forms' && (
        <FormsList
          forms={getFilteredForms()}
          selectedForm={selectedForm}
          onFormSelect={handleFormSelect}
          onEdit={handleOpenFormModal}
          onDelete={handleDeleteForm}
        />
      )}

      {activeTab === 'fields' && selectedForm && (
        <FormFields
          form={selectedForm}
          onFormUpdate={fetchForms}
        />
      )}

      {activeTab === 'responses' && selectedForm && (
        <FormResponses form={selectedForm} />
      )}

      {activeTab === 'fields' && !selectedForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Please select a form from the Forms tab to manage its fields.
          </p>
        </div>
      )}

      {activeTab === 'responses' && !selectedForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Please select a form from the Forms tab to view its responses.
          </p>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <FormModal
          form={editingForm}
          onClose={handleCloseFormModal}
          onSubmit={handleSubmitForm}
        />
      )}
    </div>
  );
};

export default Forms;

