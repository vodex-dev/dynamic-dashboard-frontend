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

// جلب الفورمات المسموحة لمستخدم معين
export const getUserForms = async (userId) => {
  try {
    console.log('Fetching user forms for userId:', userId);
    const res = await axiosInstance.get(`/auth/users/${userId}/forms`);
    console.log('User forms response:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error in getUserForms:', {
      userId,
      url: `/auth/users/${userId}/forms`,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// تحديث الفورمات المسموحة لمستخدم معين
export const updateUserForms = async (userId, formIds) => {
  try {
    console.log('Updating user forms for userId:', userId);
    console.log('FormIds to send:', formIds);
    console.log('FormIds type:', typeof formIds);
    console.log('FormIds is array:', Array.isArray(formIds));
    
    // Ensure formIds is an array
    const formIdsArray = Array.isArray(formIds) ? formIds : [];
    
    // Prepare request data
    const requestData = {
      formIds: formIdsArray
    };
    
    console.log('Request data:', requestData);
    console.log('Request URL:', `/auth/users/${userId}/forms`);
    
    const res = await axiosInstance.put(`/auth/users/${userId}/forms`, requestData);
    console.log('Update user forms response:', res.data);
    console.log('Response status:', res.status);
    return res.data;
  } catch (error) {
    console.error('Error in updateUserForms:', {
      userId,
      formIds,
      formIdsType: typeof formIds,
      formIdsIsArray: Array.isArray(formIds),
      url: `/auth/users/${userId}/forms`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data,
      requestData: error.config?.data,
      requestHeaders: error.config?.headers,
    });
    throw error;
  }
};

