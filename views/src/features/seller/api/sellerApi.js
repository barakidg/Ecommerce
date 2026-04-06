import API from "../../../api/axios.js";

export const postProduct = async (productData) => {
    const { data } = await API.post("/v1/seller/product", productData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
    return data;
};

export const getDashboardSummary = async () => {
    const { data } = await API.get("/v1/seller/dashboard/summary");
    return data;
};

export const getSellerSales = async (params = {}) => {
    const { data } = await API.get("/v1/seller/sales", { params });
    return data;
};

export const updateSaleItemStatus = async (itemId, status) => {
    const { data } = await API.patch(`/v1/seller/sales/${itemId}/status`, { status });
    return data;
};

export const getSellerProducts = async () => {
    const { data } = await API.get("/v1/seller/products");
    return data.products;
};

export const deleteSellerProduct = async (id) => {
    const { data } = await API.delete(`/v1/seller/product/${id}`);
    return data;
};

export const requestProductFeature = async (productId, durationDays) => {
    const { data } = await API.post(`/v1/seller/product/${productId}/feature-request`, {
        durationDays
    });
    return data;
};

export const updateSellerProduct = async (id, body) => {
    const { data } = await API.put(`/v1/seller/product/${id}`, body);
    return data;
};

export const getSellerProfileRequest = async () => {
    const { data } = await API.get("/v1/seller/profile");
    return data;
};

export const getSellerFinancesRequest = async () => {
    const { data } = await API.get("/v1/seller/finances");
    return data;
};

export const updateSellerProfileRequest = async (body) => {
    const { data } = await API.put("/v1/seller/profile", body);
    return data;
};

export const requestSellerPayout = async (payload) => {
    const { data } = await API.post("/v1/seller/payouts", payload);
    return data;
};
