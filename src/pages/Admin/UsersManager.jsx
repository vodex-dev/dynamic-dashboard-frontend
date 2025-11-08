import { useState, useEffect } from 'react';
import { getAllUsers, getUserPages, updateUserPages } from '../../api/auth';
import { getPages } from '../../api/pages';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPages, setUserPages] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPages();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response.data || response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await getPages();
      setPages(response.data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const handleOpenPermissionsModal = async (user) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
    setLoadingPermissions(true);
    
    try {
      const response = await getUserPages(user._id || user.id);
      const allowedPageIds = response.data || response || [];
      setUserPages(allowedPageIds);
    } catch (error) {
      console.error('Error fetching user pages:', error);
      toast.error('Failed to load user permissions');
      setUserPages([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedUser(null);
    setUserPages([]);
  };

  const handleTogglePage = (pageId) => {
    const pageIdStr = pageId.toString();
    if (userPages.includes(pageIdStr)) {
      setUserPages(userPages.filter((id) => id !== pageIdStr));
    } else {
      setUserPages([...userPages, pageIdStr]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      setSavingPermissions(true);
      await updateUserPages(selectedUser._id || selectedUser.id, userPages);
      toast.success('User permissions updated successfully');
      handleClosePermissionsModal();
    } catch (error) {
      console.error('Error updating user permissions:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update permissions';
      toast.error(errorMessage);
    } finally {
      setSavingPermissions(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    return role === 'admin' 
      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700' 
      : 'bg-[#4CAF50]/20 dark:bg-[#4CAF50]/30 text-[#4CAF50] dark:text-[#81C784] border-[#4CAF50]/30 dark:border-[#4CAF50]/50';
  };

  const getRoleIcon = (role) => {
    return role === 'admin' ? '👑' : '👤';
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-3">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Users Management</h1>
        <button
          onClick={fetchUsers}
          className="px-3 py-1.5 bg-[#007BFF] text-white text-xs rounded-lg hover:bg-[#0066cc] focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-colors shadow-sm"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            All Users ({users.length})
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-1.5">{getRoleIcon(user.role)}</span>
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                          {user.username || user.name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {user._id || user.id || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleOpenPermissionsModal(user)}
                          className="text-[#007BFF] dark:text-[#60A5FA] hover:text-[#0066cc] dark:hover:text-[#4A9EFF]"
                          title="Manage Pages Permissions"
                        >
                          🔐 Permissions
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{users.length}</p>
            </div>
            <div className="text-3xl opacity-20">👥</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">Admins</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {users.filter((u) => u.role === 'admin').length}
              </p>
            </div>
            <div className="text-3xl opacity-20">👑</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">Regular Users</p>
              <p className="text-2xl font-bold text-[#4CAF50] dark:text-[#81C784] mt-1">
                {users.filter((u) => u.role === 'user').length}
              </p>
            </div>
            <div className="text-3xl opacity-20">👤</div>
          </div>
        </div>
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-3 border dark:border-gray-700 w-80 shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[80vh] overflow-y-auto">
            <div className="mt-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                Manage Pages for: {selectedUser.username || selectedUser.name}
              </h3>
              
              {loadingPermissions ? (
                <div className="text-center py-2">
                  <Loader />
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      Select pages that this user can access:
                    </p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {pages.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">No pages available</p>
                      ) : (
                        pages.map((page) => {
                          const pageId = (page._id || page.id).toString();
                          const isChecked = userPages.includes(pageId);
                          return (
                            <label
                              key={pageId}
                              className="flex items-center p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePage(pageId)}
                                className="h-3.5 w-3.5 text-[#4CAF50] dark:text-[#81C784] focus:ring-[#4CAF50] dark:focus:ring-[#81C784] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                              />
                              <span className="ml-1.5 text-xs text-gray-700 dark:text-gray-300">
                                {page.name}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={handleClosePermissionsModal}
                      className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      disabled={savingPermissions}
                      className="px-3 py-1.5 text-xs bg-[#4CAF50] text-white rounded-md hover:bg-[#45a049] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      {savingPermissions ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;

