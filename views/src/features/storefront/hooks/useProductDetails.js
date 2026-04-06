import { useQuery } from "@tanstack/react-query";
import { fetchProductDetails } from "../api/productApi.js";

export const useProductDetails = (productId) => {
    return useQuery({
        queryKey: ['product', productId],
        queryFn: () => fetchProductDetails(productId),
        enabled: !!productId
    });
};
