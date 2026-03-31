import axiosInstance from '../api/axios';

export const uploadFile = async (file, category = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await axiosInstance.post('/uploads/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
