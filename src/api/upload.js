import axiosInstance from '../utils/axiosInstance';

// POST /api/upload - upload an image file to Cloudflare R2
export const uploadImage = async (file, sectionId) => {
  const formData = new FormData();
  formData.append('file', file); // Use 'file' as per API requirements
  formData.append('sectionId', sectionId);

  console.log('Uploading image to Cloudflare R2:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    sectionId: sectionId,
  });

  // Don't set Content-Type manually - let axios set it automatically with boundary
  // Axios will automatically set the Content-Type header with the correct boundary
  const response = await axiosInstance.post('/upload', formData);

  console.log('Upload response:', response.data);
  return response.data;
};

