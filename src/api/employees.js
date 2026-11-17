import axiosInstance from './axios';

export const getEmployeeListByBusiness = async (token, business_id, data) => {
    const response = await axiosInstance.get(`/employees/${business_id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        params: data
    });
    return response.data;
};