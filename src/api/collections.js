import axiosInstance from '../utils/axiosInstance';

// GET /api/collections - returns all collections
export const getCollections = () => {
  return axiosInstance.get('/collections');
};

// GET /api/collections/:id - returns a single collection
export const getCollection = (id) => {
  return axiosInstance.get(`/collections/${id}`);
};

// POST /api/collections - creates a new collection
export const createCollection = (data) => {
  return axiosInstance.post('/collections', {
    name: data.name,
    description: data.description || '',
  });
};

// PUT /api/collections/:id - updates a collection
export const updateCollection = (id, data) => {
  return axiosInstance.put(`/collections/${id}`, {
    name: data.name,
    description: data.description || '',
  });
};

// DELETE /api/collections/:id - deletes a collection
export const deleteCollection = (id) => {
  return axiosInstance.delete(`/collections/${id}`);
};

