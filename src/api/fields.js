import axiosInstance from '../utils/axiosInstance';

// GET /api/fields/:sectionId - returns all fields in a section
export const getFields = (sectionId = "") => {
  return axiosInstance.get(`/fields/${sectionId}`);
};

// Alias for getFields - for consistency with other API files
export const getFieldsBySectionId = (sectionId) => {
  return axiosInstance.get(`/fields/${sectionId}`);
};

// POST /api/fields - creates a new field (body: { sectionId, name, type, content })
export const createField = (data) => {
  return axiosInstance.post('/fields', {
    sectionId: data.sectionId,
    name: data.name,
    type: data.type,
    content: data.content || '',
  });
};

// PATCH /api/fields/:id/content - update the content of a field
export const updateFieldContent = (id, content) => {
  return axiosInstance.patch(`/fields/${id}/content`, { content });
};

// PUT /api/fields/:id - updates a field (name, type, etc.)
export const updateField = (id, data) => {
  return axiosInstance.put(`/fields/${id}`, {
    name: data.name,
    type: data.type,
    content: data.content,
    sectionId: data.sectionId,
  });
};

// DELETE /api/fields/:id - deletes a field
export const deleteField = (id) => {
  return axiosInstance.delete(`/fields/${id}`);
};

