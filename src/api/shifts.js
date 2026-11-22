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

export const storeShift = async (token, business_id, data) => {
    const response = await axiosInstance.post(`/shifts/${business_id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}

export const getShiftsForSelection = async (token, business_id) => {
    const response = await axiosInstance.get(`/shifts/${business_id}/code-only`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data
}