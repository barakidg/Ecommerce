import API from "../../../api/axios.js"

export const createOrder = async (orderData) => {
    const { data } = await API.post("/v1/user/orders", orderData);
    return data;
};

export const getMyOrders = async () => {
    const { data } = await API.get("/v1/user/orders");
    return data;
};

export const openOrderDispute = async ({ orderId, reason, orderItemId }) => {
    const { data } = await API.post(`/v1/user/disputes/${orderId}`, {
        reason,
        ...(orderItemId ? { orderItemId } : {})
    });
    return data;
};
