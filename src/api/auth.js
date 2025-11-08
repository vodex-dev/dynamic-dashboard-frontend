import axiosInstance from '../utils/axiosInstance';

// تسجيل الدخول
export const loginUser = async (credentials) => {
  const res = await axiosInstance.post('/auth/login', credentials);
  return res.data;
};

// إنشاء حساب
export const registerUser = async (userData) => {
  const res = await axiosInstance.post('/auth/register', userData);
  return res.data;
};

// جلب جميع المستخدمين (Admin only)
export const getAllUsers = async () => {
  const res = await axiosInstance.get('/auth/users');
  return res.data;
};

// جلب الصفحات المسموحة لمستخدم معين
export const getUserPages = async (userId) => {
  try {
    console.log('Fetching user pages for userId:', userId);
    const res = await axiosInstance.get(`/auth/users/${userId}/pages`);
    console.log('User pages response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error in getUserPages:', {
      userId,
      url: `/auth/users/${userId}/pages`,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// تحديث الصفحات المسموحة لمستخدم معين
export const updateUserPages = async (userId, pageIds) => {
  try {
    console.log('Updating user pages for userId:', userId, 'pageIds:', pageIds);
    const res = await axiosInstance.put(`/auth/users/${userId}/pages`, { pageIds });
    console.log('Update user pages response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error in updateUserPages:', {
      userId,
      pageIds,
      url: `/auth/users/${userId}/pages`,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// جلب الكولكشنز المسموحة لمستخدم معين
export const getUserCollections = async (userId) => {
  try {
    console.log('Fetching user collections for userId:', userId);
    const res = await axiosInstance.get(`/auth/users/${userId}/collections`);
    console.log('User collections response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error in getUserCollections:', {
      userId,
      url: `/auth/users/${userId}/collections`,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// تحديث الكولكشنز المسموحة لمستخدم معين
export const updateUserCollections = async (userId, collectionIds) => {
  try {
    console.log('Updating user collections for userId:', userId, 'collectionIds:', collectionIds);
    const res = await axiosInstance.put(`/auth/users/${userId}/collections`, { collectionIds });
    console.log('Update user collections response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error in updateUserCollections:', {
      userId,
      collectionIds,
      url: `/auth/users/${userId}/collections`,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error;
  }
};

