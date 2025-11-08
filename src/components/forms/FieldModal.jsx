import { useState, useEffect } from 'react';

const FieldModal = ({ field, onClose, onSubmit }) => {
  const [fieldData, setFieldData] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: '',
  });

  const fieldTypes = [
    'text',
    'number',
    'email',
    'textarea',
    'select',
    'checkbox',
    'radio',
    'date',
    'file',
  ];

  useEffect(() => {
    if (field) {
      setFieldData({
        name: field.name || '',
        label: field.label || '',
        type: field.type || 'text',
        required: field.required || false,
        options: field.options ? (Array.isArray(field.options) ? field.options.join(', ') : field.options) : '',
      });
    } else {
      setFieldData({
        name: '',
        label: '',
        type: 'text',
        required: false,
        options: '',
      });
    }
  }, [field]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fieldData.name.trim()) {
      return;
    }

    // Process options for select and radio types
    const processedData = { ...fieldData };
    if ((fieldData.type === 'select' || fieldData.type === 'radio') && fieldData.options) {
      // Split options by comma and trim each option
      processedData.options = fieldData.options
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
    } else {
      delete processedData.options;
    }

    // Remove the options string from the data
    const { options: optionsString, ...submitData } = processedData;
    if (processedData.options) {
      submitData.options = processedData.options;
    }

    onSubmit(submitData);
  };

  const showOptionsField = fieldData.type === 'select' || fieldData.type === 'radio';

  return (
    <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 w-80 max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">
          {field ? 'Edit Field' : 'Create New Field'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Name *
            </label>
            <input
              type="text"
              value={fieldData.name}
              onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="Enter field name (e.g., email, username)"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Label (Display Name)
            </label>
            <input
              type="text"
              value={fieldData.label}
              onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              placeholder="Enter label (e.g., Email Address)"
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Type *
            </label>
            <select
              value={fieldData.type}
              onChange={(e) => {
                setFieldData({ ...fieldData, type: e.target.value, options: '' });
              }}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {showOptionsField && (
            <div className="mb-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options (comma-separated) *
              </label>
              <input
                type="text"
                value={fieldData.options}
                onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] dark:focus:ring-[#81C784] focus:border-[#4CAF50] dark:focus:border-[#81C784] bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="Option 1, Option 2, Option 3"
                required={showOptionsField}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Separate options with commas
              </p>
            </div>
          )}
          <div className="mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fieldData.required}
                onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                className="h-3.5 w-3.5 text-[#4CAF50] dark:text-[#81C784] focus:ring-[#4CAF50] dark:focus:ring-[#81C784] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <span className="ml-1.5 text-xs text-gray-700 dark:text-gray-300">
                Required field
              </span>
            </label>
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
              {field ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldModal;

