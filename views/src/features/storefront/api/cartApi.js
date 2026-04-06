import API from "../../../api/axios.js";

export const getCart = async () => {
    const { data } = await API.get("/v1/user/cart");
    return data.cartItems || [];
};

export const addToCart = async ({ productId, quantity }) => {
    const { data } = await API.post(`/v1/user/cart/${productId}`, { quantity });
    return data;
};

export const updateCartItem = async ({ productId, quantity }) => {
    const { data } = await API.patch(`/v1/user/cart/${productId}`, { quantity });
    return data;
};

export const removeFromCart = async (productId) => {
    const { data } = await API.delete(`/v1/user/cart/${productId}`);
    return data;
};

export const clearCart = async () => {
    const { data } = await API.delete("/v1/user/cart");
    return data;
};
