import API from "../../../api/axios.js";

export const fetchCategoryProductCounts = async () => {
    const { data } = await API.get("v1/user/products/categories-summary");
    return data;
};

export const fetchCategoryProducts = async ({ pageParam = null, category, sort, limit = 4 }) => {
    const params = { category, limit };
    if (pageParam) {
        params.cursor = pageParam;
    }
    if (sort) {
        params.sort = sort;
    }
    const { data } = await API.get('v1/user/products/category', { params });
    return data;
};

export const fetchProducts = async ({ pageParam = null, sort, timeFilter, limit = 12 }) => {
    const params = { limit };
    if (pageParam) params.cursor = pageParam;
    if (sort) params.sort = sort;
    if (timeFilter) params.timeFilter = timeFilter;
    const { data } = await API.get('v1/user/products', { params });
    return data;
};

export const fetchProductDetails = async (productId) => {
    const { data } = await API.get(`v1/user/products/${productId}`);
    return data;
};

const optionalQueryNumber = (val) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
};

export const fetchSearchProducts = async ({ pageParam = null, q, categories, minPrice, maxPrice, minRating, sort, limit = 12 }) => {
    const params = { limit };
    if (pageParam) params.cursor = pageParam;
    if (q) params.q = q;
    if (categories) params.categories = categories;
    const minP = optionalQueryNumber(minPrice);
    const maxP = optionalQueryNumber(maxPrice);
    if (minP !== undefined) params.minPrice = minP;
    if (maxP !== undefined) params.maxPrice = maxP;
    const minR = optionalQueryNumber(minRating);
    if (minR !== undefined) params.minRating = minR;
    if (sort) params.sort = sort;

    const { data } = await API.get('v1/user/search', { params });
    return data;
};

export const fetchFeaturedProducts = async () => {
    const { data } = await API.get('v1/user/products/featured');
    return data;
};

export const fetchProductsOnSale = async (limit = 24) => {
    const { data } = await API.get('v1/user/products/on-sale', { params: { limit } });
    return data;
};

export const addReview = async ({ productId, rating, comment }) => {
    const { data } = await API.post(`v1/user/reviews/${productId}`, { rating, comment });
    return data;
};
