import axiosInstance from '@/api/axios'

export const login = async ({email, password}) => {
    const response = await axiosInstance.post('/auth/login', { email, password })
    return response.data;
}

export const refresh = async (token) => {
    const response = await axiosInstance.post('/auth/refresh', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data;
}