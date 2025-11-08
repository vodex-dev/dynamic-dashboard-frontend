// Token management helpers
export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

// User management helpers
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

// Role checking helpers
export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

export const isUser = () => {
  const user = getUser();
  return user?.role === 'user';
};

export const hasRole = (role) => {
  const user = getUser();
  return user?.role === role;
};

export const isAuthenticated = () => {
  return !!getToken() && !!getUser();
};

