import axiosInstance from '../utils/axiosInstance';

// GET /api/pages - returns all pages
export const getPages = () => {
  return axiosInstance.get('/pages');
};

// POST /api/pages - creates a new page (body: { name })
export const createPage = (data) => {
  return axiosInstance.post('/pages', { name: data.name });
};

// PUT /api/pages/:id - updates a page
export const updatePage = (id, data) => {
  return axiosInstance.put(`/pages/${id}`, { name: data.name });
};

// DELETE /api/pages/:id - deletes a page
export const deletePage = (id) => {
  return axiosInstance.delete(`/pages/${id}`);
};

