import axiosInstance from '../utils/axiosInstance';

// GET /api/collection-items/:collectionId - returns all items for a collection
export const getCollectionItems = (collectionId) => {
  return axiosInstance.get(`/collection-items/${collectionId}`);
};

// GET /api/collection-items/:id - returns a single item
export const getCollectionItem = (id) => {
  return axiosInstance.get(`/collection-items/item/${id}`);
};

// POST /api/collection-items - creates a new item
export const createCollectionItem = (data) => {
  console.log('Creating collection item with data:', data);
  // Backend expects 'data' field instead of 'fields'
  const requestData = {
    collectionId: data.collectionId,
    data: data.fields, // Backend expects 'data' field
  };
  console.log('Request payload:', requestData);
  return axiosInstance.post('/collection-items', requestData);
};

// PUT /api/collection-items/:id - updates an item
export const updateCollectionItem = (id, data) => {
  console.log('Updating collection item:', id, 'with data:', data);
  // Backend expects 'data' field instead of 'fields'
  const requestData = {
    collectionId: data.collectionId,
    data: data.fields, // Backend expects 'data' field
  };
  console.log('Request payload:', requestData);
  return axiosInstance.put(`/collection-items/${id}`, requestData);
};

// DELETE /api/collection-items/:id - deletes an item
export const deleteCollectionItem = (id) => {
  return axiosInstance.delete(`/collection-items/${id}`);
};

