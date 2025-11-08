import { useState, useEffect } from 'react';
import { getFormResponses } from '../../api/forms';
import { toast } from 'react-toastify';
import Loader from '../Loader';

const FormResponses = ({ form }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  const formId = form?._id || form?.id;

  useEffect(() => {
    if (formId) {
      fetchResponses();
    } else {
      setResponses([]);
      setLoading(false);
    }
  }, [formId]);

  const fetchResponses = async () => {
    if (!formId) {
      setResponses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching responses for formId:', formId);
      const response = await getFormResponses(formId);
      console.log('Form responses response:', response);
      const responsesData = response.data || response || [];
      console.log('Responses data:', responsesData);
      setResponses(responsesData);
    } catch (error) {
      console.error('Error fetching form responses:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      if (error.response?.status !== 404) {
        toast.error('Failed to load responses');
      }
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return dateString;
    }
  };

  if (!formId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Please select a form from the Forms tab to view its responses.
        </p>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Responses for: {form?.name || 'Unknown Form'}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          View all submitted responses
        </p>
      </div>

      {responses.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
          No responses yet. Responses will appear here when users submit the form.
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((response, index) => {
            const responseId = response._id || response.id || index;
            const responseData = response.data || response.fields || {};
            const createdAt = response.createdAt || response.created_at || response.date;

            return (
              <div
                key={responseId}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Response #{index + 1}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(createdAt)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-100 dark:bg-gray-600">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Field
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                      {Object.entries(responseData).map(([key, value]) => (
                        <tr key={key}>
                          <td className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {key}
                          </td>
                          <td className="px-2 py-1 text-xs text-gray-900 dark:text-gray-200">
                            {Array.isArray(value) ? value.join(', ') : String(value || '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormResponses;

