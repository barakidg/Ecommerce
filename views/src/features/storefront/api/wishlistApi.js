import API from "../../../api/axios.js";

export const getWishlist = async () => {
    const { data } = await API.get("/v1/user/wishlist");
    return data.items || [];
};

export const addToWishlist = async (productId) => {
    const { data } = await API.post(`/v1/user/wishlist/${productId}`);
    return data;
};

export const removeFromWishlist = async (productId) => {
    const { data } = await API.delete(`/v1/user/wishlist/${productId}`);
    return data;
};
