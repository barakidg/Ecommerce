import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchSearchProducts } from "../api/productApi.js";

export const useSearchProducts = ({ q, categories, minPrice, maxPrice, minRating, sort, limit, enabled = true } = {}) => {
    return useInfiniteQuery({
        queryKey: ['searchProducts', q, categories, minPrice, maxPrice, minRating, sort, limit],
        queryFn: ({ pageParam }) =>
            fetchSearchProducts({ pageParam, q, categories, minPrice, maxPrice, minRating, sort, limit }),
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.nextCursor === null || lastPage.nextCursor === undefined) return undefined;
            return lastPage.nextCursor;
        },
        initialPageParam: null,
        retry: 1,
        enabled,
    });
};
