import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPages } from '../api/pages';
import { getCollections } from '../api/collections';
import { getUserPages, getAllUsers, getUserCollections } from '../api/auth';

const Sidebar = () => {
  const { isAdmin, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isDynamicDropdownOpen, setIsDynamicDropdownOpen] = useState(false);
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const [allowedPageIds, setAllowedPageIds] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserPages, setSelectedUserPages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUserPages, setLoadingUserPages] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionUsers, setCollectionUsers] = useState({}); // { collectionId: [users] }
  const [loadingCollectionUsers, setLoadingCollectionUsers] = useState({});
  const dropdownRef = useRef(null);
  const collectionsDropdownRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isDynamicDashboardActive = () => {
    return location.pathname === '/admin/dynamic' || location.pathname === '/user/dynamic';
  };

  const isCollectionsActive = () => {
    return location.pathname === '/admin/collections' || location.pathname === '/user/collections' || 
           location.pathname === '/admin/collection-items' || location.pathname === '/user/collection-items';
  };

  useEffect(() => {
    if (isDynamicDashboardActive()) {
      if (isAdmin()) {
        fetchUsers();
        // Check if userId is in URL params
        const userIdFromUrl = searchParams.get('user');
        if (userIdFromUrl) {
          setSelectedUserId(userIdFromUrl);
        }
      } else {
        fetchPagesForDropdown();
      }
    }
  }, [isDynamicDashboardActive(), user, isAdmin, searchParams]);

  useEffect(() => {
    if (isCollectionsActive()) {
      fetchCollections();
    }
  }, [isCollectionsActive()]);

  useEffect(() => {
    if (isCollectionsActive() && collections.length > 0 && isAdmin()) {
      // Fetch users for each collection (only if not already fetched)
      collections.forEach((collection) => {
        const collectionId = (collection._id || collection.id).toString();
        if (!collectionUsers[collectionId] && !loadingCollectionUsers[collectionId]) {
          fetchUsersForCollection(collectionId);
        }
      });
    }
  }, [collections, isCollectionsActive(), isAdmin]);

  // Fetch user pages when a user is selected (Admin only)
  useEffect(() => {
    if (isAdmin() && selectedUserId) {
      fetchUserPagesForSelectedUser(selectedUserId);
    }
  }, [selectedUserId, isAdmin]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDynamicDropdownOpen(false);
      }
      if (collectionsDropdownRef.current && !collectionsDropdownRef.current.contains(event.target)) {
        setIsCollectionsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await getAllUsers();
      const allUsers = response.data || response || [];
      // Filter out admin users, only show regular users
      const regularUsers = allUsers.filter((u) => u.role !== 'admin');
      
      // Filter users to show only those who have pages assigned
      const usersWithPages = [];
      for (const userItem of regularUsers) {
        const userId = userItem._id || userItem.id;
        if (userId) {
          try {
            const userPagesResponse = await getUserPages(userId);
            let pageIds = [];
            if (userPagesResponse?.data) {
              pageIds = Array.isArray(userPagesResponse.data) ? userPagesResponse.data : [];
            } else if (Array.isArray(userPagesResponse)) {
              pageIds = userPagesResponse;
            }
            
            // Only add user if they have at least one page
            if (pageIds.length > 0) {
              usersWithPages.push(userItem);
            }
          } catch (error) {
            // If error fetching pages, skip this user
            console.log(`Skipping user ${userId} - no pages or error:`, error);
          }
        }
      }
      
      setUsers(usersWithPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchUserPagesForSelectedUser = async (userId) => {
    try {
      setLoadingUserPages(true);
      const userPagesResponse = await getUserPages(userId);
      let pageIds = [];
      if (userPagesResponse?.data) {
        pageIds = Array.isArray(userPagesResponse.data) ? userPagesResponse.data : [];
      } else if (Array.isArray(userPagesResponse)) {
        pageIds = userPagesResponse;
      }

      // Convert to strings and handle both string and object IDs
      const pageIdStrings = pageIds.map((id) => {
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id._id) return id._id.toString();
        if (typeof id === 'object' && id.id) return id.id.toString();
        return id.toString();
      });

      // Get full page objects
      const response = await getPages();
      const allPages = response.data || [];
      const userPages = allPages.filter((page) => {
        const pageId = (page._id || page.id).toString();
        return pageIdStrings.includes(pageId);
      });

      setSelectedUserPages(userPages);
    } catch (error) {
      console.error('Error fetching user pages:', error);
      setSelectedUserPages([]);
    } finally {
      setLoadingUserPages(false);
    }
  };

  const fetchPagesForDropdown = async () => {
    try {
      setLoadingPages(true);
      const response = await getPages();
      const allPages = response.data || [];
      setPages(allPages);

      // If user is not admin, fetch allowed pages
      if (!isAdmin() && user) {
        const userId = user?._id || user?.id || user?.userId;
        if (userId) {
          try {
            const userPagesResponse = await getUserPages(userId);
            let pageIds = [];
            if (userPagesResponse?.data) {
              pageIds = Array.isArray(userPagesResponse.data) ? userPagesResponse.data : [];
            } else if (Array.isArray(userPagesResponse)) {
              pageIds = userPagesResponse;
            }
            const pageIdStrings = pageIds.map((id) => {
              if (typeof id === 'string') return id;
              if (typeof id === 'object' && id._id) return id._id.toString();
              if (typeof id === 'object' && id.id) return id.id.toString();
              return id.toString();
            });
            setAllowedPageIds(pageIdStrings);
          } catch (error) {
            console.error('Error fetching user pages:', error);
            setAllowedPageIds([]);
          }
        }
      } else {
        setAllowedPageIds([]); // Admin sees all pages
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const getFilteredPages = () => {
    if (isAdmin()) {
      return pages; // Admin sees all pages
    }
    // Regular users see only allowed pages
    return pages.filter((page) => {
      const pageId = (page._id || page.id).toString();
      return allowedPageIds.includes(pageId);
    });
  };

  const handleUserSelect = (userId = null) => {
    const basePath = isAdmin() ? '/admin/dynamic' : '/user/dynamic';
    if (userId) {
      setSelectedUserId(userId);
      // Navigate with userId in URL
      navigate(`${basePath}?user=${userId}`);
    } else {
      setSelectedUserId(null);
      setSelectedUserPages([]);
      // Navigate without userId
      navigate(basePath);
    }
  };

  const handlePageSelect = (pageId = null) => {
    const basePath = isAdmin() ? '/admin/dynamic' : '/user/dynamic';
    const userId = searchParams.get('user');
    if (pageId) {
      if (userId) {
        navigate(`${basePath}?user=${userId}&page=${pageId}`);
      } else {
        navigate(`${basePath}?page=${pageId}`);
      }
    } else {
      if (userId) {
        navigate(`${basePath}?user=${userId}`);
      } else {
        navigate(basePath);
      }
    }
    setIsDynamicDropdownOpen(false);
  };

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      const response = await getCollections();
      const allCollections = response.data || [];
      setCollections(allCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchUsersForCollection = async (collectionId) => {
    try {
      setLoadingCollectionUsers(prev => ({ ...prev, [collectionId]: true }));
      
      // Get all users
      const response = await getAllUsers();
      const allUsers = response.data || response || [];
      const regularUsers = allUsers.filter((u) => u.role !== 'admin');
      
      // For each user, check if they have access to this collection
      const usersWithAccess = [];
      for (const userItem of regularUsers) {
        const userId = userItem._id || userItem.id;
        if (userId) {
          try {
            const userCollectionsResponse = await getUserCollections(userId);
            let collectionIds = [];
            if (userCollectionsResponse?.data) {
              collectionIds = Array.isArray(userCollectionsResponse.data) ? userCollectionsResponse.data : [];
            } else if (Array.isArray(userCollectionsResponse)) {
              collectionIds = userCollectionsResponse;
            }
            
            const collectionIdStrings = collectionIds.map((id) => {
              if (typeof id === 'string') return id;
              if (typeof id === 'object' && id._id) return id._id.toString();
              if (typeof id === 'object' && id.id) return id.id.toString();
              return id.toString();
            });
            
            const collectionIdStr = collectionId.toString();
            if (collectionIdStrings.includes(collectionIdStr)) {
              usersWithAccess.push(userItem);
            }
          } catch (error) {
            // If error, skip this user
            console.log(`Skipping user ${userId} - error checking collections:`, error);
          }
        }
      }
      
      setCollectionUsers(prev => ({ ...prev, [collectionId]: usersWithAccess }));
    } catch (error) {
      console.error('Error fetching users for collection:', error);
      setCollectionUsers(prev => ({ ...prev, [collectionId]: [] }));
    } finally {
      setLoadingCollectionUsers(prev => ({ ...prev, [collectionId]: false }));
    }
  };

  const handleCollectionSelect = (collectionId = null) => {
    const basePath = isAdmin() ? '/admin/collections' : '/user/collections';
    if (collectionId) {
      navigate(basePath);
      // You can add collectionId to URL if needed
    } else {
      navigate(basePath);
    }
    setIsCollectionsDropdownOpen(false);
  };

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  ];

  const userLinks = [
    { path: '/user/overview', label: 'Overview', icon: '👁️' },
  ];

  const links = isAdmin() ? adminLinks : userLinks;
  const dynamicPath = isAdmin() ? '/admin/dynamic' : '/user/dynamic';

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-800 min-h-screen border-r border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-2">
        <h2 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">Navigation</h2>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors text-sm ${
                isActive(link.path)
                  ? 'bg-[#4CAF50] dark:bg-[#4CAF50] text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Dynamic Dashboard with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDynamicDropdownOpen(!isDynamicDropdownOpen)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors text-sm ${
                isDynamicDashboardActive()
                  ? 'bg-[#4CAF50] dark:bg-[#4CAF50] text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">🎯</span>
                <span>Dynamic Dashboard</span>
              </div>
              <span className={`text-xs transition-transform ${isDynamicDropdownOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isDynamicDropdownOpen && (
              <div className="mt-1 ml-2 space-y-0.5 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                {isAdmin() ? (
                  <>
                    {/* All Pages Option - Admin only */}
                    <button
                      onClick={() => {
                        handleUserSelect(null);
                        handlePageSelect(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                        isDynamicDashboardActive() && !selectedUserId && !new URLSearchParams(location.search).get('page')
                          ? 'bg-[#007BFF] dark:bg-[#60A5FA] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      📄 All Pages
                    </button>

                    {/* Users List - Admin only */}
                    {loadingUsers ? (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">Loading users...</div>
                    ) : (
                      users.map((userItem) => {
                        const userId = (userItem._id || userItem.id).toString();
                        const isUserSelected = selectedUserId === userId;
                        return (
                          <button
                            key={userId}
                            onClick={() => handleUserSelect(userId)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                              isUserSelected
                                ? 'bg-[#4CAF50] dark:bg-[#81C784] text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            👤 {userItem.username || userItem.name || userItem.email}
                          </button>
                        );
                      })
                    )}

                    {!loadingUsers && users.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">No users available</div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Regular User View - Show Pages */}
                    <button
                      onClick={() => handlePageSelect(null)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                        isDynamicDashboardActive() && !new URLSearchParams(location.search).get('page')
                          ? 'bg-[#007BFF] dark:bg-[#60A5FA] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      📄 All Pages
                    </button>

                    {/* Individual Pages */}
                    {loadingPages ? (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : (
                      getFilteredPages().map((page) => {
                        const pageId = (page._id || page.id).toString();
                        const isSelected = new URLSearchParams(location.search).get('page') === pageId;
                        return (
                          <button
                            key={pageId}
                            onClick={() => handlePageSelect(pageId)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                              isSelected
                                ? 'bg-[#007BFF] dark:bg-[#60A5FA] text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            📄 {page.name}
                          </button>
                        );
                      })
                    )}

                    {!loadingPages && getFilteredPages().length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">No pages available</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Collections with Dropdown */}
          <div className="relative" ref={collectionsDropdownRef}>
            <button
              onClick={() => setIsCollectionsDropdownOpen(!isCollectionsDropdownOpen)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors text-sm ${
                isCollectionsActive()
                  ? 'bg-[#4CAF50] dark:bg-[#4CAF50] text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">📦</span>
                <span>Collections</span>
              </div>
              <span className={`text-xs transition-transform ${isCollectionsDropdownOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isCollectionsDropdownOpen && (
              <div className="mt-1 ml-2 space-y-0.5 border-l-2 border-gray-300 dark:border-gray-600 pl-2">
                {isAdmin() ? (
                  <>
                    {/* All Collections Option - Admin only */}
                    <button
                      onClick={() => {
                        handleCollectionSelect(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                        isCollectionsActive() && !new URLSearchParams(location.search).get('collectionId')
                          ? 'bg-[#007BFF] dark:bg-[#60A5FA] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      📦 All Collections
                    </button>

                    {/* Collections List - Admin only */}
                    {loadingCollections ? (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">Loading collections...</div>
                    ) : (
                      collections.map((collection) => {
                        const collectionId = (collection._id || collection.id).toString();
                        const usersForCollection = collectionUsers[collectionId] || [];
                        const isLoadingUsers = loadingCollectionUsers[collectionId] || false;

                        // Only show users, not collection name
                        if (isLoadingUsers) {
                          return (
                            <div key={collectionId} className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400">
                              Loading users...
                            </div>
                          );
                        }

                        if (usersForCollection.length > 0) {
                          return usersForCollection.map((userItem) => {
                            const userId = (userItem._id || userItem.id).toString();
                            const isUserSelected = searchParams.get('user') === userId;
                            return (
                              <button
                                key={`${collectionId}-${userId}`}
                                onClick={() => {
                                  const basePath = isAdmin() ? '/admin/collections' : '/user/collections';
                                  navigate(`${basePath}?user=${userId}`);
                                  setIsCollectionsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1 rounded-lg transition-colors text-xs ${
                                  isUserSelected
                                    ? 'bg-[#4CAF50] dark:bg-[#81C784] text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                👤 {userItem.username || userItem.name || userItem.email}
                              </button>
                            );
                          });
                        }

                        return null; // Don't show "No users assigned" for empty collections
                      })
                    )}

                    {!loadingCollections && collections.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">No collections available</div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Regular User View - Show Collections */}
                    <button
                      onClick={() => handleCollectionSelect(null)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                        isCollectionsActive() && !new URLSearchParams(location.search).get('collectionId')
                          ? 'bg-[#007BFF] dark:bg-[#60A5FA] text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      📦 All Collections
                    </button>

                    {/* Individual Collections */}
                    {loadingCollections ? (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : (
                      collections.map((collection) => {
                        const collectionId = (collection._id || collection.id).toString();
                        const isSelected = new URLSearchParams(location.search).get('collectionId') === collectionId;
                        return (
                          <button
                            key={collectionId}
                            onClick={() => handleCollectionSelect(collectionId)}
                            className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors text-xs ${
                              isSelected
                                ? 'bg-[#007BFF] dark:bg-[#60A5FA] text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            📦 {collection.name}
                          </button>
                        );
                      })
                    )}

                    {!loadingCollections && collections.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">No collections available</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Users Link - Only for Admin, at the bottom */}
          {isAdmin() && (
            <Link
              to="/admin/users"
              className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg transition-colors text-sm ${
                isActive('/admin/users')
                  ? 'bg-[#4CAF50] dark:bg-[#4CAF50] text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Users</span>
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

