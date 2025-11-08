import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/helpers';
import { loginUser, registerUser } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    const userData = getUser();
    if (token && userData) {
      // Ensure user has both _id and id
      if (!userData._id && !userData.id && token) {
        try {
          // Try to decode JWT token to get user ID
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.userId || payload._id) {
              userData._id = payload.id || payload.userId || payload._id;
              userData.id = userData._id;
              setUser(userData); // Update localStorage
            }
          }
        } catch (e) {
          console.warn('Could not decode token for user ID:', e);
        }
      } else if (userData._id && !userData.id) {
        userData.id = userData._id;
        setUser(userData);
      } else if (userData.id && !userData._id) {
        userData._id = userData.id;
        setUser(userData);
      }
      setUserState(userData);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      console.log('Login response:', data);
      
      // Handle different response formats
      const token = data.token || data.data?.token;
      const role = data.role || data.data?.role;
      
      if (!token) {
        console.error('Missing token in response:', data);
        return {
          success: false,
          error: 'Invalid response from server - missing token',
        };
      }
      
      // Create user object from available data
      // Try to get user ID from multiple sources
      const userId = data.user?._id || data.user?.id || data.userId || data.id || data._id;
      
      const userData = data.user || {
        username: credentials.username,
        email: data.email || data.user?.email,
        role: role || 'user',
        id: userId,
        _id: userId,
      };
      
      // If user object exists but doesn't have _id or id, add them
      if (data.user && !data.user._id && !data.user.id) {
        userData._id = userId;
        userData.id = userId;
      }
      
      // Ensure we have both id and _id for compatibility
      if (userData._id && !userData.id) {
        userData.id = userData._id;
      }
      if (userData.id && !userData._id) {
        userData._id = userData.id;
      }
      
      // If still no ID, try to decode from token (last resort)
      if (!userData._id && !userData.id && token) {
        try {
          // Try to decode JWT token to get user ID
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id || payload.userId || payload._id) {
              userData._id = payload.id || payload.userId || payload._id;
              userData.id = userData._id;
            }
          }
        } catch (e) {
          console.warn('Could not decode token for user ID:', e);
        }
      }
      
      console.log('User data to save:', userData);
      
      setToken(token);
      setUser(userData);
      setUserState(userData);
      
      console.log('Login successful - Token and user saved:', {
        tokenSaved: !!localStorage.getItem('token'),
        userSaved: !!localStorage.getItem('user'),
        userRole: userData.role,
      });
      
      return { success: true, user: userData, token };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await registerUser(userData);
      // Don't save user/token after registration, just redirect to login
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
    // Navigate will be handled in the component that calls logout
  };

  const isAuthenticated = () => {
    const token = getToken();
    const userData = getUser();
    const isAuth = !!user && !!token;
    
    // Only log if there's a mismatch (for debugging)
    if (token && !user) {
      console.warn('Token exists but user state is missing, restoring from storage');
      if (userData) {
        setUserState(userData);
        return true;
      }
    }
    
    return isAuth;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isUser = () => {
    return user?.role === 'user';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

