import axiosInstance from '@/api/axios'

export const refresh = async (token) => {
    const response = await axiosInstance.post('/auth/refresh', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data;
}