import axiosInstance from './axios'

export const getShifts = async (token, business_id, data) => {
    const response = await axiosInstance.get(`/shifts/${business_id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: data
    })
    return response.data
}