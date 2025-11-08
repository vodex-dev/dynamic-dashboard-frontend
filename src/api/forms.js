import axiosInstance from '../utils/axiosInstance';

// GET /api/forms - جلب جميع الفورمات
export const getForms = () => {
  return axiosInstance.get('/forms');
};

// GET /api/forms/:formId - جلب فورم واحد
export const getForm = (formId) => {
  return axiosInstance.get(`/forms/${formId}`);
};

// POST /api/forms - إنشاء فورم جديد
export const createForm = (data) => {
  return axiosInstance.post('/forms', data);
};

// PUT /api/forms/:formId - تحديث فورم
export const updateForm = (formId, data) => {
  return axiosInstance.put(`/forms/${formId}`, data);
};

// DELETE /api/forms/:formId - حذف فورم
export const deleteForm = (formId) => {
  return axiosInstance.delete(`/forms/${formId}`);
};

// GET /api/forms/:formId/fields - جلب الحقول الخاصة بفورم
export const getFormFields = (formId) => {
  return axiosInstance.get(`/forms/${formId}/fields`);
};

// POST /api/forms/:formId/fields - إضافة حقل جديد للفورم
export const createFormField = (formId, data) => {
  return axiosInstance.post(`/forms/${formId}/fields`, data);
};

// PUT /api/forms/:formId/fields/:fieldId - تحديث حقل
export const updateFormField = (formId, fieldId, data) => {
  return axiosInstance.put(`/forms/${formId}/fields/${fieldId}`, data);
};

// DELETE /api/forms/:formId/fields/:fieldId - حذف حقل
export const deleteFormField = (formId, fieldId) => {
  return axiosInstance.delete(`/forms/${formId}/fields/${fieldId}`);
};

// GET /api/forms/:formId/responses - جلب الردود الخاصة بفورم
export const getFormResponses = (formId) => {
  return axiosInstance.get(`/forms/${formId}/responses`);
};

// POST /api/forms/:formId/submit - إرسال رد من المستخدم
export const submitFormResponse = (formId, data) => {
  return axiosInstance.post(`/forms/${formId}/submit`, data);
};

