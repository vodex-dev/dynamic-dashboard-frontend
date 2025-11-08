import { useState, useEffect } from 'react';

const FormModal = ({ form, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (form) {
      setFormData({
        name: form.name || '',
        description: form.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-80 shadow-xl">
        <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
          {form ? 'Edit Form' : 'Create New Form'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Form Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="Enter form name"
              autoFocus
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="Enter description"
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] transition-colors shadow-sm"
            >
              {form ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;

