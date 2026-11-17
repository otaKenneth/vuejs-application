import axiosInstance from '@/api/axios';

export const getBusinessProfile = async (token) => {
  const response = await axiosInstance.get('/business', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}

export const storeBusinessProfile = async (token, profileData) => {
  const response = await axiosInstance.post('/business', profileData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}