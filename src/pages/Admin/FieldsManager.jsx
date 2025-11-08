import { useState, useEffect } from 'react';
import { getFieldsBySectionId, createField, updateFieldContent } from '../../api/fields';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';

const FieldsManager = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      // Fields require a sectionId, so we can't fetch all fields here
      // This page is kept for compatibility but should use Dynamic Dashboard instead
      setFields([]);
      toast.info('Please use Dynamic Dashboard to manage fields. Fields require a section ID.');
    } catch (error) {
      toast.error('Failed to load fields');
      console.error('Error fetching fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleOpenModal = (field = null) => {
    if (field) {
      setEditingField(field);
      setFormData({
        name: field.name || '',
        label: field.label || '',
        type: field.type || 'text',
        required: field.required || false,
      });
    } else {
      setEditingField(null);
      setFormData({
        name: '',
        label: '',
        type: 'text',
        required: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingField(null);
    setFormData({
      name: '',
      label: '',
      type: 'text',
      required: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingField) {
        toast.info('Please use Dynamic Dashboard to edit fields.');
        handleCloseModal();
        return;
      } else {
        await createField(formData);
        toast.success('Field created successfully');
      }
      handleCloseModal();
      fetchFields();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save field');
    }
  };

  const handleDelete = async (id) => {
    toast.info('Please use Dynamic Dashboard to manage fields.');
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Fields Management</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add New Field
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                <p>Please use <strong>Dynamic Dashboard</strong> to manage fields.</p>
                <p className="text-sm mt-2">Fields require a section ID to be created.</p>
              </td>
            </tr>
            {false && (
              fields.map((field) => (
                <tr key={field._id || field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{field.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{field.label || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {field.required ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(field)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(field._id || field.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingField ? 'Edit Field' : 'Create New Field'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="required"
                      checked={formData.required}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Required</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingField ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldsManager;

