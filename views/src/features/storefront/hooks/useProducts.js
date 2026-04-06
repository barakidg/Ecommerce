import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchProducts } from "../api/productApi.js";

export const useProducts = ({ sort, timeFilter } = {}) => {
    return useInfiniteQuery({
        queryKey: ['products', sort, timeFilter],
        queryFn: ({ pageParam }) => fetchProducts({ pageParam, sort, timeFilter }),
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.nextCursor === null || lastPage.nextCursor === undefined) return undefined
            return lastPage.nextCursor
        },
        initialPageParam: null,
        retry: 1,
    });
};
