import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const FormsList = ({ forms, selectedForm, onFormSelect, onEdit, onDelete }) => {
  const { isAdmin } = useAuth();

  const copyApiUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied ✅');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  if (forms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No forms yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Description
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Fields Count
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {forms.map((form) => {
              const formId = form._id || form.id;
              const isSelected = selectedForm && (selectedForm._id || selectedForm.id) === formId;
              const fieldsCount = form.fields?.length || 0;
              const apiUrl = `https://dynamic-dashboard-backend.onrender.com/api/forms/${formId}/submit`;

              return (
                <tr
                  key={formId}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    isSelected ? 'bg-[#4CAF50]/10 dark:bg-[#4CAF50]/20' : ''
                  }`}
                  onClick={() => onFormSelect(form)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                      {form.name}
                    </div>
                    {/* API Link */}
                    {isAdmin() && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-600">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          API Link:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={apiUrl}
                            readOnly
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-mono"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyApiUrl(apiUrl);
                            }}
                            className="px-2 py-1 bg-[#007BFF] text-white text-xs rounded-md hover:bg-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-colors whitespace-nowrap shadow-sm"
                            title="Copy API link"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {form.description || '-'}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {fieldsCount} fields
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onFormSelect(form)}
                        className="text-[#4CAF50] dark:text-[#81C784] hover:text-[#45a049] dark:hover:text-[#66BB6A] font-medium"
                        title="View Details"
                      >
                        👁️ View Details
                      </button>
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => onEdit(form)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => onDelete(formId)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FormsList;

