import axiosInstance from '../utils/axiosInstance';

// GET /api/sections/:pageId - returns all sections of a specific page
export const getSectionsByPageId = (pageId) => {
  return axiosInstance.get(`/sections/${pageId}`);
};

// POST /api/sections - creates a new section (body: { name, pageId })
export const createSection = (data) => {
  return axiosInstance.post('/sections', {
    name: data.name,
    pageId: data.pageId,
  });
};

// PUT /api/sections/:id - updates a section
export const updateSection = (id, data) => {
  return axiosInstance.put(`/sections/${id}`, {
    name: data.name,
    pageId: data.pageId,
  });
};

// DELETE /api/sections/:id - deletes a section
export const deleteSection = (id) => {
  return axiosInstance.delete(`/sections/${id}`);
};

