import axiosInstance from '@/api/axios';

export const getBusinesses = async (token, options) => {
  const response = await axiosInstance.get('/business', {
    headers: {
      Authorization: `Bearer ${token}`
    },
    params: options
  })
  return response.data;
}

export const getBusinessProfile = async (token, business_id) => {
  const response = await axiosInstance.get(`/business/${business_id}`, {
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